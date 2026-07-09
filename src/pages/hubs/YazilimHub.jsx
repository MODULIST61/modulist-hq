import { HubLayout, useHubTab } from '../../components/hubs/HubLayout'
import Tasks from '../Tasks'
import Bugs from '../records/Bugs'
import Decisions from '../Decisions'
import Feedback from '../records/Feedback'

const TABS = [
  { id: 'isler', label: 'Sprint / İşler', icon: '✅' },
  { id: 'buglar', label: "Bug'lar", icon: '🐛' },
  { id: 'kararlar', label: 'Kararlar', icon: '⚖️' },
  { id: 'geri-donusler', label: 'Geri Dönüşler', icon: '💬' },
]

export default function YazilimHub() {
  const { tab, setTab } = useHubTab('isler')

  return (
    <HubLayout
      title="Yazılım"
      subtitle="Sprint, bug takibi, teknik kararlar ve ürün geri bildirimi"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'isler' && <Tasks hub="yazilim" title="Yazılım İşleri" subtitle="Ürün ve geliştirme görevleri" />}
      {tab === 'buglar' && <Bugs embedded />}
      {tab === 'kararlar' && <Decisions embedded />}
      {tab === 'geri-donusler' && <Feedback embedded />}
    </HubLayout>
  )
}
