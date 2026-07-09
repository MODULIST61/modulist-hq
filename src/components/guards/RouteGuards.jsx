import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  canAccessFinance,
  canManageTeam,
  canAccessMarketing,
  canAccessPage,
} from '../../lib/permissions'

export function RequireAuth({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  return children
}

export function RequireSetup({ children }) {
  const { isInitialized } = useAuth()
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

export function MarketingGuard({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/giris" replace />
  if (!canAccessMarketing(currentUser)) return <Navigate to="/erisim-reddedildi" replace />
  return children
}

export function PatronWeeklyGuard({ children }) {
  return <PageGuard page="weeklyReport">{children}</PageGuard>
}
