import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as storage from '../lib/storage'
import { STORAGE_KEYS } from '../lib/constants'
import { ROLES } from '../lib/constants'
import { generateId } from '../lib/utils'
import { seedWorkspace } from '../lib/seed'
import { migrateUser } from '../lib/access'

const AuthContext = createContext(null)

function loadAndMigrateUsers() {
  const users = storage.get(STORAGE_KEYS.USERS, [])
  const migrated = users.map(migrateUser)
  const changed = migrated.some((u, i) => JSON.stringify(u) !== JSON.stringify(users[i]))
  if (changed) storage.set(STORAGE_KEYS.USERS, migrated)
  return migrated
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => storage.getSession())
  const [users, setUsers] = useState(() => loadAndMigrateUsers())

  useEffect(() => {
    const data = storage.init()
    const migrated = loadAndMigrateUsers()
    setUsers(migrated.length ? migrated : data.users.map(migrateUser))
    setSession(storage.getSession())
  }, [])

  const currentUser = users.find((u) => u.id === session?.userId && u.status !== 'pasif') || null
  const isInitialized = storage.get(STORAGE_KEYS.INITIALIZED, false)

  const login = useCallback((email, password) => {
    const allUsers = loadAndMigrateUsers()
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.status !== 'pasif'
    )
    if (!user) return { ok: false, error: 'E-posta veya şifre hatalı.' }
    storage.setSession(user.id)
    setSession({ userId: user.id, loginAt: new Date().toISOString() })
    setUsers(allUsers)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    storage.clearSession()
    setSession(null)
    window.location.href = '/giris'
  }, [])

  const setupPatron = useCallback(({ name, email, password }) => {
    const patron = {
      id: generateId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: ROLES.PATRON,
      job_title: 'Patron',
      status: 'aktif',
      created_at: new Date().toISOString(),
    }
    const workspace = seedWorkspace(patron)
    storage.persistAll(workspace)
    storage.setSession(patron.id)
    setUsers(workspace.users)
    setSession({ userId: patron.id, loginAt: new Date().toISOString() })
    return { ok: true }
  }, [])

  const refreshUsers = useCallback(() => {
    setUsers(loadAndMigrateUsers())
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser,
        users,
        isInitialized,
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
