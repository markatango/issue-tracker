import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export default function LoginScreen() {
  const [mode, setMode]       = useState('signin')   // 'signin' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const clearError = () => setError('')

  const handleEmailAuth = async () => {
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true); setError('')
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (e) {
      setError(friendlyError(e.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(e.code))
      }
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') handleEmailAuth() }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg0)',
    }}>
      {/* subtle grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.3,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 380, background: 'var(--bg1)',
        border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* header stripe */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg1) 100%)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            ⬡ issue-tracker
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
            {mode === 'signin' ? 'sign in to continue' : 'create an account'}
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Google SSO */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%', padding: '9px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--bg3)', border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius)', color: 'var(--text0)',
              fontSize: 14, fontFamily: 'var(--sans)', cursor: 'pointer',
              marginBottom: 20, transition: 'all 0.15s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* email */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); clearError() }}
              onKeyDown={onKey}
              placeholder="you@example.com"
              autoComplete="email"
              style={{ fontSize: 14 }}
            />
          </div>

          {/* password */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password}
              onChange={e => { setPassword(e.target.value); clearError() }}
              onKeyDown={onKey}
              placeholder={mode === 'register' ? 'min 6 characters' : '••••••••'}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              style={{ fontSize: 14 }}
            />
          </div>

          {/* error */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '9px 12px',
              background: 'var(--red-bg)', border: '1px solid var(--red)44',
              borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* submit */}
          <button
            onClick={handleEmailAuth}
            disabled={loading}
            style={{
              width: '100%', padding: '9px',
              background: loading ? 'var(--accent-dim)' : 'var(--accent)',
              color: '#fff', fontWeight: 600, fontSize: 14,
              border: 'none', borderRadius: 'var(--radius)',
              cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.15s',
              marginBottom: 16,
            }}
          >
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {/* toggle mode */}
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
            {mode === 'signin' ? (
              <>No account?{' '}
                <span style={{ color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={() => { setMode('register'); clearError() }}>
                  Register
                </span>
              </>
            ) : (
              <>Already have an account?{' '}
                <span style={{ color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={() => { setMode('signin'); clearError() }}>
                  Sign In
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, color: 'var(--text2)',
  marginBottom: 5, fontFamily: 'var(--mono)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/too-many-requests':    'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked':        'Popup was blocked. Allow popups for this site.',
  }
  return map[code] || `Sign-in error (${code})`
}
