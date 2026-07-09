import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { MainLayout } from './components/layout/MainLayout'
import { RequireAuth, RequireSetup, PatronFinanceGuard, PatronTeamGuard, PatronPersonnelGuard, PatronAuditGuard, MarketingGuard, PatronWeeklyGuard, PageGuard } from './components/guards/RouteGuards'

import Setup from './pages/Setup'
import Login from './pages/Login'
import AccessDenied from './pages/AccessDenied'
import Today from './pages/Today'
import Messages from './pages/Messages'
import Tasks from './pages/Tasks'
import Marketing from './pages/Marketing'
import RecordsLayout from './pages/records/RecordsLayout'
import Companies from './pages/records/Companies'
import CompanyDetail from './pages/records/CompanyDetail'
import Bugs from './pages/records/Bugs'
import Campaigns from './pages/records/Campaigns'
import Feedback from './pages/records/Feedback'
import DailyMetrics from './pages/records/DailyMetrics'
import Calendar from './pages/Calendar'
import Performance from './pages/Performance'
import WeeklyReport from './pages/WeeklyReport'
import Finance from './pages/Finance'
import Decisions from './pages/Decisions'
import Team from './pages/Team'
import Personnel from './pages/Personnel'
import PersonDetail from './pages/PersonDetail'
import AuditLog from './pages/AuditLog'
import Settings from './pages/Settings'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/kurulum" element={<Setup />} />
      <Route path="/giris" element={<Login />} />
      <Route path="/erisim-reddedildi" element={<AccessDenied />} />

      <Route element={<RequireAuth><RequireSetup><MainLayout /></RequireSetup></RequireAuth>}>
        <Route index element={<PageGuard page="today"><Today /></PageGuard>} />
        <Route path="mesajlar" element={<PageGuard page="messages"><Messages /></PageGuard>} />
        <Route path="isler" element={<PageGuard page="tasks"><Tasks /></PageGuard>} />
        <Route path="kayitlar" element={<PageGuard page="records"><RecordsLayout /></PageGuard>}>
          <Route index element={<Navigate to="firmalar" replace />} />
          <Route path="firmalar" element={<Companies />} />
          <Route path="firmalar/:id" element={<CompanyDetail />} />
          <Route path="buglar" element={<Bugs />} />
          <Route path="kampanyalar" element={<Campaigns />} />
          <Route path="geri-donusler" element={<Feedback />} />
          <Route path="gunluk-metrik" element={<DailyMetrics />} />
        </Route>
        <Route path="reklam" element={<MarketingGuard><Marketing /></MarketingGuard>} />
        <Route path="takvim" element={<PageGuard page="calendar"><Calendar /></PageGuard>} />
        <Route path="performans" element={<PageGuard page="performance"><Performance /></PageGuard>} />
        <Route path="haftalik-ozet" element={<PatronWeeklyGuard><WeeklyReport /></PatronWeeklyGuard>} />
        <Route path="finans" element={<PatronFinanceGuard><Finance /></PatronFinanceGuard>} />
        <Route path="kararlar" element={<PageGuard page="decisions"><Decisions /></PageGuard>} />
        <Route path="ekip" element={<PatronTeamGuard><Team /></PatronTeamGuard>} />
        <Route path="personel" element={<PatronPersonnelGuard><Personnel /></PatronPersonnelGuard>} />
        <Route path="personel/:id" element={<PatronPersonnelGuard><PersonDetail /></PatronPersonnelGuard>} />
        <Route path="denetim" element={<PatronAuditGuard><AuditLog /></PatronAuditGuard>} />
        <Route path="ayarlar" element={<PageGuard page="settings"><Settings /></PageGuard>} />
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
