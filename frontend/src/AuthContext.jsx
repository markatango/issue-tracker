import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined)  // undefined = loading
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
    return unsub
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, ready, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
