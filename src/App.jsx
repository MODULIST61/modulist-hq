import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import {
  RequireAuth,
  RequireSetup,
  MarketingGuard,
  PageGuard,
  PatronHubGuard,
  SoftwareHubGuard,
  SecretaryHubGuard,
  AccountingHubGuard,
  PatronPersonnelGuard,
  LegacyFinanceRedirect,
  LegacyTasksRedirect,
} from './components/guards/RouteGuards'

import Setup from './pages/Setup'
import Login from './pages/Login'
import AccessDenied from './pages/AccessDenied'
import Today from './pages/Today'
import Messages from './pages/Messages'
import Marketing from './pages/Marketing'
import CompanyDetail from './pages/records/CompanyDetail'
import PersonDetail from './pages/PersonDetail'
import Settings from './pages/Settings'
import PatronHub from './pages/hubs/PatronHub'
import SekreterHub from './pages/hubs/SekreterHub'
import YazilimHub from './pages/hubs/YazilimHub'
import MuhasebeHub from './pages/hubs/MuhasebeHub'

function LegacyCompanyRedirect() {
  const { id } = useParams()
  return <Navigate to={`/sekreter/firmalar/${id}`} replace />
}

function LegacyPersonDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/patron/personel/${id}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/kurulum" element={<Setup />} />
      <Route path="/giris" element={<Login />} />
      <Route path="/erisim-reddedildi" element={<AccessDenied />} />

      <Route element={<RequireAuth><RequireSetup><MainLayout /></RequireSetup></RequireAuth>}>
        <Route index element={<PageGuard page="today"><Today /></PageGuard>} />
        <Route path="mesajlar" element={<PageGuard page="messages"><Messages /></PageGuard>} />

        <Route path="yazilim" element={<SoftwareHubGuard><YazilimHub /></SoftwareHubGuard>} />
        <Route path="reklam" element={<MarketingGuard><Marketing /></MarketingGuard>} />
        <Route path="sekreter" element={<SecretaryHubGuard><SekreterHub /></SecretaryHubGuard>} />
        <Route path="sekreter/firmalar/:id" element={<SecretaryHubGuard><CompanyDetail backPath="/sekreter?tab=firmalar" /></SecretaryHubGuard>} />
        <Route path="patron" element={<PatronHubGuard><PatronHub /></PatronHubGuard>} />
        <Route path="patron/personel/:id" element={<PatronPersonnelGuard><PersonDetail backPath="/patron?tab=personel" personBasePath="/patron/personel" /></PatronPersonnelGuard>} />
        <Route path="muhasebe" element={<AccountingHubGuard><MuhasebeHub /></AccountingHubGuard>} />
        <Route path="ayarlar" element={<PageGuard page="settings"><Settings /></PageGuard>} />

        {/* Eski URL yönlendirmeleri */}
        <Route path="isler" element={<LegacyTasksRedirect />} />
        <Route path="kayitlar/firmalar/:id" element={<LegacyCompanyRedirect />} />
        <Route path="kayitlar/*" element={<Navigate to="/sekreter?tab=firmalar" replace />} />
        <Route path="takvim" element={<Navigate to="/sekreter?tab=takvim" replace />} />
        <Route path="performans" element={<Navigate to="/patron?tab=performans" replace />} />
        <Route path="haftalik-ozet" element={<Navigate to="/patron?tab=haftalik" replace />} />
        <Route path="finans" element={<LegacyFinanceRedirect />} />
        <Route path="kararlar" element={<Navigate to="/yazilim?tab=kararlar" replace />} />
        <Route path="ekip" element={<Navigate to="/patron?tab=ekip" replace />} />
        <Route path="personel" element={<Navigate to="/patron?tab=personel" replace />} />
        <Route path="personel/:id" element={<LegacyPersonDetailRedirect />} />
        <Route path="denetim" element={<Navigate to="/patron?tab=denetim" replace />} />
        <Route path="mudur" element={<Navigate to="/patron?tab=mudur" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
