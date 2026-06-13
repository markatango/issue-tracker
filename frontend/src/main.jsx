import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './AuthContext'
import Root from './Root'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
)
