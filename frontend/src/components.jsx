import React from 'react'

const SEV_META = {
  critical: { label: 'CRIT', color: 'var(--red)',    bg: 'var(--red-bg)'    },
  high:     { label: 'HIGH', color: 'var(--orange)',  bg: 'var(--orange-bg)' },
  medium:   { label: 'MED',  color: 'var(--yellow)',  bg: 'var(--yellow-bg)' },
  low:      { label: 'LOW',  color: 'var(--blue)',    bg: 'var(--blue-bg)'   },
}

const STATUS_META = {
  open:        { label: 'open',        color: 'var(--red)',   bg: 'var(--red-bg)'   },
  'in-progress':{ label: 'in progress', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  resolved:    { label: 'resolved',    color: 'var(--green)', bg: 'var(--green-bg)' },
}

export function SevBadge({ value }) {
  const m = SEV_META[value] || SEV_META.medium
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: 3,
      color: m.color, background: m.bg, border: `1px solid ${m.color}33`
    }}>{m.label}</span>
  )
}

export function StatusBadge({ value }) {
  const m = STATUS_META[value] || STATUS_META.open
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 11,
      padding: '2px 8px', borderRadius: 3,
      color: m.color, background: m.bg, border: `1px solid ${m.color}33`
    }}>{m.label}</span>
  )
}

export function Btn({ children, onClick, variant = 'default', style = {}, disabled }) {
  const styles = {
    default: { background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border-bright)', padding: '6px 14px' },
    primary: { background: 'var(--accent)', color: '#fff', padding: '6px 14px', fontWeight: 600 },
    danger:  { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)44', padding: '6px 14px' },
    ghost:   { background: 'transparent', color: 'var(--text2)', padding: '4px 8px' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles[variant], borderRadius: 'var(--radius)', opacity: disabled ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontFamily: 'var(--mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function Spinner() {
  return <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}

// inject keyframe once
if (typeof document !== 'undefined' && !document.getElementById('__spin__')) {
  const s = document.createElement('style')
  s.id = '__spin__'
  s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}'
  document.head.appendChild(s)
}
