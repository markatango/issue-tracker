# Issue Tracker

A self-hosted bug and issue tracking web application built with Flask, React, and Firebase Authentication. Designed for solo developers or small teams who want a lightweight, no-overhead alternative to Excel or heavy enterprise tools.

## Features

- Create and manage software issues with title, severity, status, project/component tag, steps to reproduce, and free-form notes
- Drag-and-drop file attachments per issue — screenshots, logs, text files, PDFs, ZIPs (up to 32 MB each)
- Inline image preview and file download
- Filter issues by status, severity, and project; full-text search across title, notes, and steps
- Live issue count badges (open / in progress / resolved)
- Firebase Authentication — sign in with email/password or Google SSO
- Dark terminal aesthetic UI
- Self-contained: SQLite database, no external database server required

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask / Gunicorn |
| Database | SQLite (via Python stdlib) |
| Frontend | React / Vite |
| Auth | Firebase Authentication |
| Web server | nginx (reverse proxy) |
| Process manager | systemd |

---

## Project Structure

```
issue-tracker/
├── backend/
│   ├── app.py              # Flask application and REST API
│   ├── requirements.txt    # Python dependencies
│   ├── issues.db           # SQLite database (created on first run)
│   └── uploads/            # Attached files (created on first run)
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env                # Firebase config (not committed to git)
│   ├── .env.example        # Template for Firebase config
│   └── src/
│       ├── main.jsx        # Entry point
│       ├── Root.jsx        # Auth gate — shows LoginScreen or App
│       ├── App.jsx         # Main application shell
│       ├── LoginScreen.jsx # Firebase auth UI
│       ├── AuthContext.jsx # Firebase auth state provider
│       ├── firebase.js     # Firebase initialization
│       ├── api.js          # Axios API client
│       ├── IssueForm.jsx   # Create / edit issue form
│       ├── IssueDetail.jsx # Issue detail panel
│       ├── AttachmentPanel.jsx # File upload and attachment list
│       ├── components.jsx  # Shared UI primitives
│       └── index.css       # Global styles and CSS variables
├── issue-tracker.service   # systemd unit file
├── nginx.conf.snippet      # nginx proxy configuration
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Python 3.10+
- Node.js 20.19.0 or 22+
- A Firebase project with Authentication enabled

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
# Flask runs on http://localhost:5050
```

### Frontend

Copy `.env.example` to `.env` and fill in your Firebase config values:

```bash
cd frontend
cp .env.example .env
# edit .env with your Firebase project credentials
npm install
npm run dev
# Vite dev server runs on http://localhost:5173
# API calls are proxied to http://localhost:5050
```

---

## Building for Production

```bash
cd frontend
npm run build
# Output goes to backend/static/
```

The build output in `backend/static/` is served directly by Flask, so no separate static file server is needed.

---

## Deployment (Ubuntu / EC2)

### 1. Provision the directory

```bash
sudo mkdir -p /opt/issue-tracker
sudo chown youruser:youruser /opt/issue-tracker
```

### 2. Upload files

```bash
scp -r backend/ user@your-server:/opt/issue-tracker/
```

### 3. Python environment

```bash
cd /opt/issue-tracker
python3 -m venv venv
venv/bin/pip install -r backend/requirements.txt
venv/bin/pip install gunicorn
```

### 4. Log files

```bash
sudo touch /var/log/issue-tracker-access.log /var/log/issue-tracker-error.log
sudo chown www-data:www-data /var/log/issue-tracker-access.log /var/log/issue-tracker-error.log
```

### 5. systemd service

```bash
sudo cp issue-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable issue-tracker
sudo systemctl start issue-tracker
sudo systemctl status issue-tracker
```

### 6. nginx

Add the contents of `nginx.conf.snippet` to your nginx server block, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

The app is served at `https://your-domain.com/issues/`.

---

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Go to **Authentication → Get started**
3. Enable **Email/Password** under Sign-in method
4. Enable **Google** under Sign-in method
5. Go to **Settings → Authorized domains** and add your domain (e.g. `your-domain.com`)
6. Go to **Project Settings → General → Your apps → Web app** and copy the `firebaseConfig` values into `frontend/.env`

### Environment Variables

```bash
# frontend/.env  (never commit this file)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

---

## REST API

All endpoints are prefixed `/api/`. When hosted at `/issues/`, the full path is `/issues/api/`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/issues` | List issues (supports `?status=`, `?severity=`, `?project=`, `?q=`) |
| POST | `/api/issues` | Create issue |
| GET | `/api/issues/:id` | Get issue with attachments |
| PUT | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue and its attachments |
| POST | `/api/issues/:id/attachments` | Upload attachment (multipart/form-data) |
| DELETE | `/api/attachments/:id` | Delete attachment |
| GET | `/api/attachments/:id/view` | View attachment inline |
| GET | `/api/attachments/:id/download` | Download attachment |
| GET | `/api/projects` | List distinct project names |
| GET | `/api/stats` | Issue counts by status and severity |

---

## Backup

All persistent state lives in two locations:

```bash
/opt/issue-tracker/backend/issues.db   # database
/opt/issue-tracker/backend/uploads/    # attached files
```

Example cron backup:

```bash
0 3 * * * tar -czf /backups/issue-tracker-$(date +\%Y\%m\%d).tar.gz \
    /opt/issue-tracker/backend/issues.db \
    /opt/issue-tracker/backend/uploads/
```

## Logs

```bash
journalctl -u issue-tracker -f           # systemd / gunicorn logs
tail -f /var/log/issue-tracker-access.log
tail -f /var/log/issue-tracker-error.log
```
