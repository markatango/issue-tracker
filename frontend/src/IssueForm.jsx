import React, { useState, useEffect } from 'react'
import { createIssue, updateIssue, getProjects } from './api'
import { Field, Btn } from './components'

const EMPTY = { title: '', severity: 'medium', status: 'open', project: '', steps: '', notes: '' }

export default function IssueForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY })
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const editing = !!initial

  useEffect(() => {
    getProjects().then(r => setProjects(r.data)).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.title.trim()) { alert('Title is required'); return }
    setSaving(true)
    try {
      const res = editing
        ? await updateIssue(initial.id, form)
        : await createIssue(form)
      onSaved(res.data)
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Field label="Title *">
        <input value={form.title} onChange={set('title')} placeholder="Concise description of the issue" autoFocus />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Severity</label>
          <select value={form.severity} onChange={set('severity')}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Project / Component</label>
          <input
            value={form.project}
            onChange={set('project')}
            placeholder="e.g. firmware, backend"
            list="project-list"
          />
          <datalist id="project-list">
            {projects.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>
      </div>

      <Field label="Steps to Reproduce">
        <textarea
          rows={4}
          value={form.steps}
          onChange={set('steps')}
          placeholder={'1. Open the app\n2. Navigate to...\n3. Observe...'}
        />
      </Field>

      <Field label="Notes / Additional Context">
        <textarea rows={5} value={form.notes} onChange={set('notes')} placeholder="Error messages, environment details, expected vs actual behavior..." />
      </Field>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        {onCancel && <Btn variant="default" onClick={onCancel}>Cancel</Btn>}
        <Btn variant="primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Issue'}
        </Btn>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, color: 'var(--text2)',
  marginBottom: 5, fontFamily: 'var(--mono)', letterSpacing: '0.04em', textTransform: 'uppercase'
}
