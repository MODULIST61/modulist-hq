import { HubLayout, useHubTab } from '../../components/hubs/HubLayout'
import { SecretaryToday } from '../../components/hubs/SecretaryToday'
import { ExpenseRequests } from '../../components/hubs/ExpenseRequests'
import Companies from '../records/Companies'
import Calendar from '../Calendar'
import DailyMetrics from '../records/DailyMetrics'
import Tasks from '../Tasks'

const TABS = [
  { id: 'bugun', label: 'Bugün', icon: '📅' },
  { id: 'firmalar', label: 'Firmalar', icon: '🏢' },
  { id: 'takvim', label: 'Takvim', icon: '🗓️' },
  { id: 'metrik', label: 'Günlük Metrik', icon: '📞' },
  { id: 'giderler', label: 'Gider Talepleri', icon: '💸' },
  { id: 'isler', label: 'İşler', icon: '✅' },
]

export default function SekreterHub() {
  const { tab, setTab } = useHubTab('bugun')

  return (
    <HubLayout
      title="Sekreter & Satış"
      subtitle="Pipeline, demo, arama metrikleri ve operasyon"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'bugun' && <SecretaryToday />}
      {tab === 'firmalar' && <Companies firmalarPath="/sekreter/firmalar" />}
      {tab === 'takvim' && <Calendar embedded />}
      {tab === 'metrik' && <DailyMetrics embedded />}
      {tab === 'giderler' && <ExpenseRequests />}
      {tab === 'isler' && <Tasks hub="sekreter" title="Sekreter İşleri" subtitle="Operasyon ve satış görevleri" />}
    </HubLayout>
  )
}
