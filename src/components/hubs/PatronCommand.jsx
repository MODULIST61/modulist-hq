import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import {
  buildActivityFeed,
  buildTeamWorkload,
  buildMarketingStats,
  pipelineFunnel,
} from '../../lib/analytics'
import { buildAlerts, buildTeamDailySummary } from '../../lib/personAnalytics'
import {
  StatCard,
  ActivityFeed,
  TeamWorkloadTable,
  BarChart,
  PipelineFunnel,
  SectionCard,
} from '../../components/dashboard/DashboardWidgets'
import { Button } from '../../components/ui/Button'
import { formatCurrency, isThisMonth } from '../../lib/utils'

export function PatronCommand() {
  const { users } = useAuth()
  const navigate = useNavigate()
  const data = useData()

  const activity = useMemo(() => buildActivityFeed({ ...data, rooms: data.rooms }, users, 25), [data, users])
  const workload = useMemo(() => buildTeamWorkload(data.tasks, users), [data.tasks, users])
  const marketing = useMemo(() => buildMarketingStats(data.campaigns, data.companies), [data.campaigns, data.companies])
  const funnel = useMemo(() => pipelineFunnel(data.companies), [data.companies])
  const alerts = useMemo(() => buildAlerts(data, users), [data, users])
  const teamDaily = useMemo(() => buildTeamDailySummary(users, data), [users, data])

  const pendingFinance = data.finance.filter((f) => f.durum === 'bekliyor')
  const monthApproved = data.finance.filter((f) => isThisMonth(f.tarih) && f.durum === 'onaylandi')
  const monthGelir = monthApproved.filter((f) => f.tip === 'gelir').reduce((s, f) => s + f.tutar, 0)
  const monthGider = monthApproved.filter((f) => f.tip === 'gider').reduce((s, f) => s + f.tutar, 0)
  const channelData = Object.entries(marketing.byChannel).map(([label, v]) => ({ label, value: v.harcanan }))

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {pendingFinance.length > 0 && (
          <Button onClick={() => navigate('/patron?tab=finans')} variant="accent">
            {pendingFinance.length} gider onayı bekliyor
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate('/patron?tab=haftalik')}>Haftalık Özet →</Button>
        <Button variant="outline" onClick={() => navigate('/patron?tab=personel')}>Personeller →</Button>
        <Button variant="outline" onClick={() => navigate('/patron?tab=mudur')}>Müdür AI →</Button>
        <Button variant="outline" onClick={() => navigate('/patron?tab=denetim')}>Denetim →</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Bu Ay Net" value={formatCurrency(monthGelir - monthGider)} sub={`${formatCurrency(monthGelir)} / ${formatCurrency(monthGider)}`} onClick={() => navigate('/patron?tab=finans')} />
        <StatCard label="Reklam Harcama" value={formatCurrency(marketing.harcanan)} sub={`CPA ₺${marketing.cpa}`} trend={marketing.spendDelta} onClick={() => navigate('/reklam')} />
        <StatCard label="Onay Bekleyen" value={pendingFinance.length} variant={pendingFinance.length ? 'warning' : 'default'} onClick={() => navigate('/patron?tab=finans')} />
        <StatCard label="Aktif Müşteri" value={data.companies.filter((c) => c.pipeline === 'musteri').length} onClick={() => navigate('/sekreter?tab=firmalar')} />
      </div>

      {alerts.length > 0 && (
        <SectionCard title="Uyarılar" subtitle="Geciken işler, trial, demo, onay bekleyen">
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(a.link)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-90 ${
                  a.level === 'danger' ? 'bg-red-50 text-red-800 dark:bg-red-900/20' :
                  a.level === 'warning' ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20' :
                  'bg-blue-50 text-blue-800 dark:bg-blue-900/20'
                }`}
              >
                {a.text}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {teamDaily.length > 0 && (
        <SectionCard title="Ekip Bugün" subtitle="Günlük aktivite özeti" action={<Button variant="ghost" size="sm" onClick={() => navigate('/patron?tab=personel')}>Tüm personel →</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Kişi</th>
                  <th>Arama</th>
                  <th>Demo</th>
                  <th>Açık iş</th>
                  <th>Geciken</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {teamDaily.map((row) => (
                  <tr key={row.user.id} className="border-t dark:border-slate-800">
                    <td className="py-2">
                      <button type="button" className="text-accent hover:underline font-medium" onClick={() => navigate(`/patron/personel/${row.user.id}`)}>
                        {row.user.name}
                      </button>
                    </td>
                    <td>{row.arama}</td>
                    <td>{row.demo}</td>
                    <td>{row.openTasks}</td>
                    <td className={row.overdue ? 'text-danger font-medium' : ''}>{row.overdue}</td>
                    <td>{row.activeToday ? <span className="text-emerald-600 text-xs">Aktif</span> : <span className="text-slate-400 text-xs">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Canlı Aktivite" subtitle="Son işlemler">
            <ActivityFeed items={activity} onItemClick={(item) => navigate(item.link)} />
          </SectionCard>
        </div>
        <SectionCard title="Ekip Yükü" subtitle="Açık görevler">
          <TeamWorkloadTable workload={workload} />
        </SectionCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Satış Hunisi" subtitle="Pipeline dağılımı">
          <PipelineFunnel stages={funnel} />
        </SectionCard>
        <SectionCard title="Reklam Kanalları" subtitle="Harcama dağılımı" action={<Button variant="ghost" size="sm" onClick={() => navigate('/reklam')}>Detay →</Button>}>
          {channelData.length ? (
            <BarChart data={channelData} format={(v) => formatCurrency(v)} />
          ) : (
            <p className="text-sm text-slate-400">Kampanya ekleyin</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
