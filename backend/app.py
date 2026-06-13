from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import sqlite3, os, uuid, datetime
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'issues.db')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    'png','jpg','jpeg','gif','webp','bmp',
    'pdf','txt','log','md','csv','json',
    'zip','tar','gz','doc','docx','xls','xlsx'
}

STATIC_DIR = os.path.join(BASE_DIR, 'static')
app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32 MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS issues (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                severity    TEXT NOT NULL DEFAULT 'medium',
                status      TEXT NOT NULL DEFAULT 'open',
                project     TEXT,
                steps       TEXT,
                notes       TEXT,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS attachments (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_id    INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
                filename    TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                mime_type   TEXT,
                size        INTEGER,
                uploaded_at TEXT NOT NULL
            );
        ''')


init_db()


def now():
    return datetime.datetime.utcnow().isoformat() + 'Z'


def row_to_dict(row):
    return dict(row)


def issue_with_attachments(conn, issue_id):
    issue = conn.execute('SELECT * FROM issues WHERE id=?', (issue_id,)).fetchone()
    if not issue:
        return None
    d = row_to_dict(issue)
    atts = conn.execute(
        'SELECT id, filename, stored_name, mime_type, size, uploaded_at FROM attachments WHERE issue_id=? ORDER BY uploaded_at',
        (issue_id,)
    ).fetchall()
    d['attachments'] = [row_to_dict(a) for a in atts]
    return d


# ── Issues ────────────────────────────────────────────────────────────────────

@app.route('/api/issues', methods=['GET'])
def list_issues():
    status  = request.args.get('status')
    project = request.args.get('project')
    severity= request.args.get('severity')
    q       = request.args.get('q', '').strip()

    sql = 'SELECT * FROM issues WHERE 1=1'
    params = []
    if status:   sql += ' AND status=?';   params.append(status)
    if project:  sql += ' AND project=?';  params.append(project)
    if severity: sql += ' AND severity=?'; params.append(severity)
    if q:        sql += ' AND (title LIKE ? OR notes LIKE ? OR steps LIKE ?)'; params += [f'%{q}%']*3
    sql += ' ORDER BY id DESC'

    with get_db() as conn:
        rows = conn.execute(sql, params).fetchall()
        issues = []
        for row in rows:
            d = row_to_dict(row)
            count = conn.execute('SELECT COUNT(*) FROM attachments WHERE issue_id=?', (d['id'],)).fetchone()[0]
            d['attachment_count'] = count
            issues.append(d)
    return jsonify(issues)


@app.route('/api/issues', methods=['POST'])
def create_issue():
    data = request.get_json()
    t = now()
    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO issues (title,severity,status,project,steps,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
            (data['title'], data.get('severity','medium'), data.get('status','open'),
             data.get('project'), data.get('steps'), data.get('notes'), t, t)
        )
        conn.commit()
        issue = issue_with_attachments(conn, cur.lastrowid)
    return jsonify(issue), 201


@app.route('/api/issues/<int:issue_id>', methods=['GET'])
def get_issue(issue_id):
    with get_db() as conn:
        issue = issue_with_attachments(conn, issue_id)
    if not issue:
        abort(404)
    return jsonify(issue)


@app.route('/api/issues/<int:issue_id>', methods=['PUT'])
def update_issue(issue_id):
    data = request.get_json()
    t = now()
    with get_db() as conn:
        conn.execute(
            '''UPDATE issues SET title=?,severity=?,status=?,project=?,steps=?,notes=?,updated_at=?
               WHERE id=?''',
            (data['title'], data.get('severity','medium'), data.get('status','open'),
             data.get('project'), data.get('steps'), data.get('notes'), t, issue_id)
        )
        conn.commit()
        issue = issue_with_attachments(conn, issue_id)
    if not issue:
        abort(404)
    return jsonify(issue)


@app.route('/api/issues/<int:issue_id>', methods=['DELETE'])
def delete_issue(issue_id):
    with get_db() as conn:
        atts = conn.execute('SELECT stored_name FROM attachments WHERE issue_id=?', (issue_id,)).fetchall()
        for a in atts:
            path = os.path.join(UPLOAD_DIR, a['stored_name'])
            if os.path.exists(path):
                os.remove(path)
        conn.execute('DELETE FROM issues WHERE id=?', (issue_id,))
        conn.commit()
    return '', 204


# ── Attachments ───────────────────────────────────────────────────────────────

@app.route('/api/issues/<int:issue_id>/attachments', methods=['POST'])
def upload_attachment(issue_id):
    with get_db() as conn:
        if not conn.execute('SELECT 1 FROM issues WHERE id=?', (issue_id,)).fetchone():
            abort(404)

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'Empty filename'}), 400
    if not allowed_file(f.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    ext = f.filename.rsplit('.', 1)[1].lower()
    stored = f'{uuid.uuid4().hex}.{ext}'
    f.save(os.path.join(UPLOAD_DIR, stored))
    size = os.path.getsize(os.path.join(UPLOAD_DIR, stored))

    with get_db() as conn:
        cur = conn.execute(
            'INSERT INTO attachments (issue_id,filename,stored_name,mime_type,size,uploaded_at) VALUES (?,?,?,?,?,?)',
            (issue_id, secure_filename(f.filename), stored, f.content_type, size, now())
        )
        conn.commit()
        att = row_to_dict(conn.execute('SELECT * FROM attachments WHERE id=?', (cur.lastrowid,)).fetchone())
    return jsonify(att), 201


@app.route('/api/attachments/<int:att_id>', methods=['DELETE'])
def delete_attachment(att_id):
    with get_db() as conn:
        att = conn.execute('SELECT * FROM attachments WHERE id=?', (att_id,)).fetchone()
        if not att:
            abort(404)
        path = os.path.join(UPLOAD_DIR, att['stored_name'])
        if os.path.exists(path):
            os.remove(path)
        conn.execute('DELETE FROM attachments WHERE id=?', (att_id,))
        conn.commit()
    return '', 204


@app.route('/api/attachments/<int:att_id>/download')
def download_attachment(att_id):
    with get_db() as conn:
        att = conn.execute('SELECT * FROM attachments WHERE id=?', (att_id,)).fetchone()
    if not att:
        abort(404)
    return send_from_directory(UPLOAD_DIR, att['stored_name'], as_attachment=True,
                               download_name=att['filename'])


@app.route('/api/attachments/<int:att_id>/view')
def view_attachment(att_id):
    with get_db() as conn:
        att = conn.execute('SELECT * FROM attachments WHERE id=?', (att_id,)).fetchone()
    if not att:
        abort(404)
    return send_from_directory(UPLOAD_DIR, att['stored_name'],
                               mimetype=att['mime_type'], as_attachment=False)


# ── Meta ──────────────────────────────────────────────────────────────────────

@app.route('/api/projects', methods=['GET'])
def list_projects():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT DISTINCT project FROM issues WHERE project IS NOT NULL AND project != '' ORDER BY project"
        ).fetchall()
    return jsonify([r['project'] for r in rows])


@app.route('/api/stats', methods=['GET'])
def stats():
    with get_db() as conn:
        total  = conn.execute('SELECT COUNT(*) FROM issues').fetchone()[0]
        open_  = conn.execute("SELECT COUNT(*) FROM issues WHERE status='open'").fetchone()[0]
        inprog = conn.execute("SELECT COUNT(*) FROM issues WHERE status='in-progress'").fetchone()[0]
        closed = conn.execute("SELECT COUNT(*) FROM issues WHERE status='resolved'").fetchone()[0]
        crit   = conn.execute("SELECT COUNT(*) FROM issues WHERE severity='critical'").fetchone()[0]
    return jsonify({'total':total,'open':open_,'in_progress':inprog,'resolved':closed,'critical':crit})



@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(STATIC_DIR, path)):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=False)
