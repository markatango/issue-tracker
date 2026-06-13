import React, { useState, useEffect, useCallback } from 'react'
import { getIssues, getIssue, getStats } from './api'
import { SevBadge, StatusBadge, Btn, Spinner } from './components'
import IssueForm from './IssueForm'
import IssueDetail from './IssueDetail'

export default function App({ user, onLogout }) {
  const [issues, setIssues]     = useState([])
  const [stats, setStats]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ status: '', severity: '', q: '' })
  const [filterProject, setFP]  = useState('')
  const [projects, setProjects] = useState([])

  const loadIssues = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status)   params.status   = filters.status
      if (filters.severity) params.severity = filters.severity
      if (filters.q)        params.q        = filters.q
      if (filterProject)    params.project  = filterProject
      const [r, s] = await Promise.all([getIssues(params), getStats()])
      setIssues(r.data)
      setStats(s.data)
      const allProj = [...new Set(r.data.map(i => i.project).filter(Boolean))].sort()
      setProjects(allProj)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters, filterProject])

  useEffect(() => { loadIssues() }, [loadIssues])

  const selectIssue = async (id) => {
    const res = await getIssue(id)
    setSelected(res.data)
    setCreating(false)
  }

  const handleCreated = (issue) => {
    setCreating(false)
    loadIssues()
    selectIssue(issue.id)
  }

  const handleUpdated = async () => {
    loadIssues()
    if (selected) {
      const res = await getIssue(selected.id)
      setSelected(res.data)
    }
  }

  const handleDeleted = () => {
    setSelected(null)
    loadIssues()
  }

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', height: 50, flexShrink: 0, background: 'var(--bg1)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', letterSpacing: '-0.02em' }}>⬡ issue-tracker</span>
        {stats && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
            {[{ label: 'open', val: stats.open, color: 'var(--red)' }, { label: 'in progress', val: stats.in_progress, color: 'var(--yellow)' }, { label: 'resolved', val: stats.resolved, color: 'var(--green)' }].map(s => (
              <span key={s.label} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: s.color, background: s.color + '18', padding: '2px 8px', borderRadius: 3 }}>{s.val} {s.label}</span>
            ))}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <Btn variant="primary" onClick={() => { setCreating(true); setSelected(null) }} style={{ fontSize: 13, padding: '5px 14px' }}>+ New Issue</Btn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
          {user.photoURL && <img src={user.photoURL} style={{ width: 24, height: 24, borderRadius: '50%' }} />}
          <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName || user.email}</span>
          <Btn variant="ghost" onClick={onLogout} style={{ fontSize: 12, color: 'var(--text3)' }}>sign out</Btn>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: 180, flexShrink: 0, background: 'var(--bg1)', borderRight: '1px solid var(--border)', padding: '14px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={sideLabel}>Status</div>
            {['', 'open', 'in-progress', 'resolved'].map(v => (
              <SideItem key={v} active={filters.status === v} onClick={() => setFilters(f => ({ ...f, status: v }))}>{v || 'All statuses'}</SideItem>
            ))}
          </div>
          <div>
            <div style={sideLabel}>Severity</div>
            {['', 'critical', 'high', 'medium', 'low'].map(v => (
              <SideItem key={v} active={filters.severity === v} onClick={() => setFilters(f => ({ ...f, severity: v }))}>{v || 'All severities'}</SideItem>
            ))}
          </div>
          {projects.length > 0 && (
            <div>
              <div style={sideLabel}>Project</div>
              <SideItem active={!filterProject} onClick={() => setFP('')}>All projects</SideItem>
              {projects.map(p => <SideItem key={p} active={filterProject === p} onClick={() => setFP(p)}>{p}</SideItem>)}
            </div>
          )}
        </aside>

        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg0)' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <input value={filters.q} onChange={setFilter('q')} placeholder="🔍  Search issues…" style={{ fontSize: 13 }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>}
            {!loading && issues.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                {Object.values(filters).some(Boolean) || filterProject ? 'No matching issues.' : 'No issues yet. Create one →'}
              </div>
            )}
            {!loading && issues.map(issue => (
              <IssueRow key={issue.id} issue={issue} active={selected?.id === issue.id} onClick={() => selectIssue(issue.id)} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {creating && (
            <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: 'var(--bg1)' }}>
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text2)', marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>New Issue</h2>
                <IssueForm onSaved={handleCreated} onCancel={() => setCreating(false)} />
              </div>
            </div>
          )}
          {selected && !creating && (
            <IssueDetail issue={selected} onUpdate={handleUpdated} onDelete={handleDeleted} onClose={() => setSelected(null)} />
          )}
          {!selected && !creating && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', gap: 10 }}>
              <span style={{ fontSize: 32 }}>⬡</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>select an issue or create a new one</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IssueRow({ issue, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: active ? 'var(--bg2)' : 'transparent', borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent', transition: 'background 0.1s' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg1)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
        <SevBadge value={issue.severity} />
        <StatusBadge value={issue.status} />
        {issue.project && <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--accent)', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{issue.project}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>#{issue.id}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text0)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{issue.title}</div>
      {issue.attachment_count > 0 && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text3)' }}>📎 {issue.attachment_count} attachment{issue.attachment_count !== 1 ? 's' : ''}</div>}
    </div>
  )
}

const sideLabel = { fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }

function SideItem({ children, active, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '5px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 12, color: active ? 'var(--accent)' : 'var(--text1)', background: active ? 'var(--accent-glow)' : 'transparent', fontFamily: 'var(--mono)', marginBottom: 1 }}>
      {children}
    </div>
  )
}
