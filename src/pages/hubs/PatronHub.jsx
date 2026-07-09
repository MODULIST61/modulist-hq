import { HubLayout, useHubTab } from '../../components/hubs/HubLayout'
import { PatronCommand } from '../../components/hubs/PatronCommand'
import Finance from '../Finance'
import Personnel from '../Personnel'
import Manager from '../Manager'
import AuditLog from '../AuditLog'
import WeeklyReport from '../WeeklyReport'
import Performance from '../Performance'
import Team from '../Team'

const TABS = [
  { id: 'komuta', label: 'Komuta Merkezi', icon: '🎯' },
  { id: 'finans', label: 'Finans', icon: '💰' },
  { id: 'personel', label: 'Personeller', icon: '👥' },
  { id: 'mudur', label: 'Müdür AI', icon: '🤖' },
  { id: 'denetim', label: 'Denetim', icon: '📋' },
  { id: 'haftalik', label: 'Haftalık Özet', icon: '📊' },
  { id: 'performans', label: 'Performans', icon: '📈' },
  { id: 'ekip', label: 'Ekip', icon: '⚙️' },
]

export default function PatronHub() {
  const { tab, setTab } = useHubTab('komuta')

  return (
    <HubLayout
      title="Patron Paneli"
      subtitle="Komuta merkezi, finans onayı, ekip ve AI raporları"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'komuta' && <PatronCommand />}
      {tab === 'finans' && <Finance mode="patron" embedded />}
      {tab === 'personel' && <Personnel embedded />}
      {tab === 'mudur' && <Manager embedded />}
      {tab === 'denetim' && <AuditLog embedded />}
      {tab === 'haftalik' && <WeeklyReport embedded />}
      {tab === 'performans' && <Performance embedded />}
      {tab === 'ekip' && <Team embedded />}
    </HubLayout>
  )
}
