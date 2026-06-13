import React, { useState } from 'react'
import { deleteIssue } from './api'
import { SevBadge, StatusBadge, Btn } from './components'
import IssueForm from './IssueForm'
import AttachmentPanel from './AttachmentPanel'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function IssueDetail({ issue, onUpdate, onDelete, onClose }) {
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete issue #${issue.id}: "${issue.title}"?`)) return
    await deleteIssue(issue.id)
    onDelete(issue.id)
  }

  const handleSaved = (updated) => {
    setEditing(false)
    onUpdate(updated)
  }

  const refreshAttachments = () => onUpdate(null)  // trigger reload

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg1)', borderLeft: '1px solid var(--border)',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>#{issue.id}</span>
        <div style={{ flex: 1, fontWeight: 600, fontSize: 15, color: 'var(--text0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {issue.title}
        </div>
        <Btn variant="ghost" style={{ fontSize: 18, lineHeight: 1, padding: '2px 6px', color: 'var(--text3)' }} onClick={onClose}>×</Btn>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {editing ? (
          <IssueForm initial={issue} onSaved={handleSaved} onCancel={() => setEditing(false)} />
        ) : (
          <>
            {/* meta row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
              <SevBadge value={issue.severity} />
              <StatusBadge value={issue.status} />
              {issue.project && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: 3 }}>
                  {issue.project}
                </span>
              )}
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>
                {new Date(issue.created_at).toLocaleString()}
              </span>
            </div>

            {issue.steps && (
              <Section title="Steps to Reproduce">
                <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text1)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{issue.steps}</pre>
              </Section>
            )}

            {issue.notes && (
              <Section title="Notes">
                <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text1)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{issue.notes}</pre>
              </Section>
            )}

            {!issue.steps && !issue.notes && (
              <p style={{ color: 'var(--text3)', fontSize: 13, fontStyle: 'italic', marginBottom: 20 }}>No description yet.</p>
            )}

            <Section title={`Attachments (${issue.attachments?.length ?? 0})`}>
              <AttachmentPanel
                issueId={issue.id}
                attachments={issue.attachments || []}
                onUpdate={refreshAttachments}
              />
            </Section>
          </>
        )}
      </div>

      {/* footer actions */}
      {!editing && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <Btn variant="default" onClick={() => setEditing(true)}>✏ Edit</Btn>
          <Btn variant="danger" onClick={handleDelete} style={{ marginLeft: 'auto' }}>Delete</Btn>
        </div>
      )}
    </div>
  )
}
