import { HubLayout, useHubTab } from '../../components/hubs/HubLayout'
import { AccountingToday } from '../../components/accounting/AccountingToday'
import { CollectionCenter } from '../../components/accounting/CollectionCenter'
import { AccountingReports } from '../../components/accounting/AccountingReports'
import { BudgetOverview } from '../../components/accounting/BudgetOverview'
import { FinanceSuggestions } from '../../components/accounting/FinanceSuggestions'
import { ExpenseRequests } from '../../components/hubs/ExpenseRequests'
import Finance from '../Finance'

const TABS = [
  { id: 'bugun', label: 'Bugün', icon: '📅' },
  { id: 'tahsilat', label: 'Tahsilat', icon: '🏦' },
  { id: 'hareketler', label: 'Hareketler', icon: '📒' },
  { id: 'giderler', label: 'Gider Talepleri', icon: '💸' },
  { id: 'butce', label: 'Bütçe', icon: '📊' },
  { id: 'raporlar', label: 'Raporlar', icon: '📈' },
  { id: 'oneriler', label: 'Öneriler', icon: '💡' },
]

export default function MuhasebeHub() {
  const { tab, setTab } = useHubTab('bugun')

  return (
    <HubLayout
      title="Muhasebe"
      subtitle="Tahsilat merkezi, gelir-gider defteri, bütçe ve raporlar"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'bugun' && <AccountingToday onTabChange={setTab} />}
      {tab === 'tahsilat' && <CollectionCenter />}
      {tab === 'hareketler' && <Finance mode="accounting" embedded />}
      {tab === 'giderler' && <ExpenseRequests />}
      {tab === 'butce' && <BudgetOverview />}
      {tab === 'raporlar' && <AccountingReports />}
      {tab === 'oneriler' && <FinanceSuggestions />}
    </HubLayout>
  )
}
