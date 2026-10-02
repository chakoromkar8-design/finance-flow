import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../services/api.js'

const AuthContext = createContext(null)

// status: 'loading' (checking the cookie) | 'authed' | 'anon' | 'error' (server unreachable)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const check = useCallback(async () => {
    setStatus('loading')
    try {
      setUser(await api.fetchMe())
      setStatus('authed')
    } catch (err) {
      setUser(null)
      if (err.code === 'NETWORK') {
        setError(err.message)
        setStatus('error')
      } else {
        setStatus('anon')
      }
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  // api.js fires this when any request comes back 401 (session ended or expired).
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setStatus('anon')
    }
    window.addEventListener('ff:unauthorized', onUnauthorized)
    return () => window.removeEventListener('ff:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (email, password) => {
    const u = await api.login(email, password)
    setUser(u)
    setStatus('authed')
    return u
  }, [])

  const register = useCallback(async (name, email, password) => {
    const u = await api.register(name, email, password)
    setUser(u)
    setStatus('authed')
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      setStatus('anon')
    }
  }, [])

  const value = useMemo(() => ({ user, status, error, login, register, logout, retry: check }), [user, status, error, login, register, logout, check])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
