import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { buildMarketingStats } from '../../lib/analytics'
import { buildContentImpact } from '../../lib/contentAnalytics'
import { marketingTodayStats } from '../../lib/marketingStudio'
import { resolveModel } from '../../lib/aiModels'
import { StatCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/utils'
import { CONTENT_TYPES } from '../../lib/constants'

export function MarketingToday({ canEdit, onExpense, onTab }) {
  const { currentUser } = useAuth()
  const { campaigns, companies, contents, finance, settings } = useData()

  const stats = buildMarketingStats(campaigns, companies)
  const today = marketingTodayStats({ contents, campaigns, finance, currentUserId: currentUser?.id })
  const impact = buildContentImpact(contents, campaigns, companies)
  const topFormat = impact.byType.sort((a, b) => b.leads - a.leads)[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Harcama" value={formatCurrency(stats.harcanan)} sub={`Plan: ${formatCurrency(stats.plan)}`} variant={stats.budgetPct >= 80 ? 'warning' : 'accent'} />
        <StatCard label="Bütçe %" value={`%${stats.budgetPct}`} variant={stats.budgetPct >= 90 ? 'danger' : 'default'} />
        <StatCard label="Tıklama" value={stats.tiklama.toLocaleString('tr-TR')} />
        <StatCard label="Lead" value={stats.kayit} />
        <StatCard label="CPA" value={formatCurrency(stats.cpa)} variant="success" />
        <StatCard label="Pipeline" value={today.pipeline} sub={`${today.upcoming} bu hafta`} onClick={() => onTab('studio')} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Aktif Kampanya" value={today.activeCampaigns} onClick={() => onTab('kampanya')} />
        <StatCard label="Bekleyen Gider" value={today.pendingExpenses} variant={today.pendingExpenses ? 'warning' : 'default'} onClick={() => onTab('gider')} />
        <StatCard label="En İyi Format" value={topFormat ? (CONTENT_TYPES[topFormat.label] || topFormat.label) : '—'} sub={topFormat ? `${topFormat.leads} lead` : 'Veri yok'} onClick={() => onTab('etki')} />
        <StatCard label="AI Model" value={resolveModel(settings, 'marketing').replace('gpt-', '')} sub="Prompt Stüdyosu" onClick={() => onTab('prompt')} />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 p-5">
        <h3 className="font-semibold text-primary dark:text-white mb-1">Creative Studio</h3>
        <p className="text-sm text-slate-500 mb-4">İlham al → prompt üret → stüdyoya kaydet → gider iste</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onTab('ilham')}>💡 İlham Galerisi</Button>
          <Button size="sm" variant="accent" onClick={() => onTab('prompt')}>✨ Prompt Stüdyosu</Button>
          <Button size="sm" variant="outline" onClick={() => onTab('studio')}>🎬 İçerik Stüdyosu</Button>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onExpense}>💸 Gider Talebi</Button>
          )}
        </div>
      </div>
    </div>
  )
}
