import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  canAccessFinance,
  canManageTeam,
  canAccessMarketing,
  canAccessPage,
  isPatron,
} from '../../lib/permissions'

function AuthLoading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center text-slate-500">
      Yükleniyor...
    </div>
  )
}

export function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!currentUser) return <Navigate to="/giris" replace />
  return children
}

export function RequireSetup({ children }) {
  const { isInitialized, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!isInitialized) return <Navigate to="/kurulum" replace />
  return children
}

export function PageGuard({ page, children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  if (!canAccessPage(currentUser, page)) return <Navigate to="/erisim-reddedildi" replace />
  return children
}

export function PatronFinanceGuard({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  if (!canAccessFinance(currentUser)) return <Navigate to="/erisim-reddedildi" replace />
  return children
}

export function PatronTeamGuard({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  if (!canManageTeam(currentUser)) return <Navigate to="/erisim-reddedildi" replace />
  return children
}

export function PatronPersonnelGuard({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  if (!isPatron(currentUser)) return <Navigate to="/erisim-reddedildi" replace />
  return children
}

export function PatronAuditGuard({ children }) {
  return <PatronPersonnelGuard>{children}</PatronPersonnelGuard>
}

export function PatronManagerGuard({ children }) {
  return <PatronPersonnelGuard>{children}</PatronPersonnelGuard>
}

export function MarketingGuard({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  if (!canAccessMarketing(currentUser)) return <Navigate to="/erisim-reddedildi" replace />
  return children
}

export function PatronWeeklyGuard({ children }) {
  return <PageGuard page="weeklyReport">{children}</PageGuard>
}
