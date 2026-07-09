import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { migrateUser } from '../lib/access'
import * as api from '../lib/api'
import * as session from '../lib/session'
import { isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessionState, setSessionState] = useState(() => session.getSession())
  const [users, setUsers] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(null)

  const refreshUsers = useCallback(async () => {
    const list = await api.fetchUsers()
    setUsers(list)
    return list
  }, [])

  const bootstrap = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setConfigError('Supabase yapılandırması eksik (.env)')
      setLoading(false)
      return
    }
    try {
      const ws = await api.fetchWorkspace()
      setIsInitialized(ws.initialized)
      await refreshUsers()
    } catch (e) {
      console.error(e)
      setConfigError(e.message || 'Supabase bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }, [refreshUsers])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const currentUser = users.find((u) => u.id === sessionState?.userId && u.status !== 'pasif') || null

  const login = useCallback(async (email, password) => {
    try {
      const user = await api.loginUser(email, password)
      if (!user) return { ok: false, error: 'E-posta veya şifre hatalı.' }
      session.setSession(user.id)
      setSessionState(session.getSession())
      await refreshUsers()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message || 'Giriş başarısız.' }
    }
  }, [refreshUsers])

  const logout = useCallback(() => {
    session.clearSession()
    setSessionState(null)
    window.location.href = '/giris'
  }, [])

  const setupPatron = useCallback(async ({ name, email, password }) => {
    try {
      const id = await api.setupPatron({ name, email, password })
      session.setSession(id)
      setSessionState(session.getSession())
      setIsInitialized(true)
      await refreshUsers()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message || 'Kurulum başarısız.' }
    }
  }, [refreshUsers])

  return (
    <AuthContext.Provider
      value={{
        session: sessionState,
        currentUser,
        users,
        isInitialized,
        loading,
        configError,
        login,
        logout,
        setupPatron,
        refreshUsers,
        setUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
