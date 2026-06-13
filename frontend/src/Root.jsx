import React from 'react'
import { useAuth } from './AuthContext'
import LoginScreen from './LoginScreen'
import App from './App'

export default function Root() {
  const { user, ready, logout } = useAuth()

  // Firebase is resolving auth state
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg0)' }}>
        <div style={{ fontFamily: 'var(--mono)', color: 'var(--text3)', fontSize: 13 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 10, verticalAlign: 'middle' }} />
          authenticating…
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  // Not signed in → show login
  if (!user) return <LoginScreen />

  // Signed in → show app, pass user + logout down
  return <App user={user} onLogout={logout} />
}
