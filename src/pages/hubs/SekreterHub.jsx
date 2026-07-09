import { HubLayout, useHubTab } from '../../components/hubs/HubLayout'
import { SecretaryToday } from '../../components/hubs/SecretaryToday'
import { ExpenseRequests } from '../../components/hubs/ExpenseRequests'
import { InteractionLog } from '../../components/secretary/InteractionLog'
import { SecretaryRequests } from '../../components/secretary/SecretaryRequests'
import Companies from '../records/Companies'
import Calendar from '../Calendar'
import DailyMetrics from '../records/DailyMetrics'
import Tasks from '../Tasks'

const TABS = [
  { id: 'bugun', label: 'Bugün', icon: '📅' },
  { id: 'talepler', label: 'Talepler', icon: '📥' },
  { id: 'iletisim', label: 'İletişim', icon: '📞' },
  { id: 'firmalar', label: 'Firmalar', icon: '🏢' },
  { id: 'takvim', label: 'Takvim', icon: '🗓️' },
  { id: 'metrik', label: 'Metrik', icon: '📊' },
  { id: 'giderler', label: 'Giderler', icon: '💸' },
  { id: 'isler', label: 'İşler', icon: '✅' },
]

export default function SekreterHub() {
  const { tab, setTab } = useHubTab('bugun')

  return (
    <HubLayout
      title="Sekreter & Satış"
      subtitle="Dış iletişim merkezi — arama, görüşme, talepler ve müşteri takibi"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'bugun' && <SecretaryToday />}
      {tab === 'talepler' && <SecretaryRequests />}
      {tab === 'iletisim' && <InteractionLog embedded />}
      {tab === 'firmalar' && <Companies firmalarPath="/sekreter/firmalar" />}
      {tab === 'takvim' && <Calendar embedded firmalarPath="/sekreter/firmalar" />}
      {tab === 'metrik' && <DailyMetrics embedded />}
      {tab === 'giderler' && <ExpenseRequests />}
      {tab === 'isler' && <Tasks hub="sekreter" title="Sekreter İşleri" subtitle="Operasyon ve satış görevleri" />}
    </HubLayout>
  )
}
