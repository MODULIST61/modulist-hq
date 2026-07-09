import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { buildMarketingStats, pipelineFunnel } from '../../lib/analytics'
import { buildAlerts } from '../../lib/personAnalytics'
import { buildTodayInteractionStats } from '../../lib/patronPulse'
import { StatCard, BarChart, PipelineFunnel, SectionCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { MorningBriefing } from './MorningBriefing'
import { TeamLiveTable } from './TeamLiveTable'
import { UnifiedTimeline } from './UnifiedTimeline'
import { AttentionCompanies } from './AttentionCompanies'
import { PatronInsights } from './PatronInsights'
import { formatCurrency, isThisMonth } from '../../lib/utils'

export function PatronOversight() {
  const { users } = useAuth()
  const data = useData()
  const navigate = useNavigate()

  const marketing = useMemo(() => buildMarketingStats(data.campaigns, data.companies), [data.campaigns, data.companies])
  const funnel = useMemo(() => pipelineFunnel(data.companies), [data.companies])
  const alerts = useMemo(() => buildAlerts(data, users), [data, users])

  const pendingFinance = data.finance.filter((f) => f.durum === 'bekliyor')
  const monthApproved = data.finance.filter((f) => isThisMonth(f.tarih) && f.durum === 'onaylandi')
  const monthGelir = monthApproved.filter((f) => f.tip === 'gelir').reduce((s, f) => s + f.tutar, 0)
  const monthGider = monthApproved.filter((f) => f.tip === 'gider').reduce((s, f) => s + f.tutar, 0)
  const todayStats = buildTodayInteractionStats(data.interactions)

  const recentDecisions = useMemo(
    () => data.messages.filter((m) => m.type === 'karar').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    [data.messages],
  )

  const recentApprovals = useMemo(
    () => (data.auditLogs || []).filter((a) => a.action === 'finance_approve' || a.action === 'finance_reject').slice(0, 8),
    [data.auditLogs],
  )

  const channelData = Object.entries(marketing.byChannel).map(([label, v]) => ({ label, value: v.harcanan }))

  return (
    <div className="space-y-6">
      <MorningBriefing data={data} users={users} onNavigate={navigate} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Bu Ay Net" value={formatCurrency(monthGelir - monthGider)} sub={`${formatCurrency(monthGelir)} / ${formatCurrency(monthGider)}`} onClick={() => navigate('/patron?tab=finans')} />
        <StatCard label="Bugün Arama" value={todayStats.calls} sub={`${todayStats.total} iletişim kaydı`} onClick={() => navigate('/sekreter?tab=iletisim')} />
        <StatCard label="Inbox" value={todayStats.inbox} variant={todayStats.inbox ? 'warning' : 'default'} onClick={() => navigate('/sekreter?tab=talepler')} />
        <StatCard label="Onay Bekleyen" value={pendingFinance.length} variant={pendingFinance.length ? 'warning' : 'default'} onClick={() => navigate('/patron?tab=finans')} />
        <StatCard label="Aktif Müşteri" value={data.companies.filter((c) => c.pipeline === 'musteri').length} onClick={() => navigate('/sekreter?tab=firmalar')} />
        <StatCard label="Reklam Harcama" value={formatCurrency(marketing.harcanan)} sub={`CPA ₺${marketing.cpa}`} trend={marketing.spendDelta} onClick={() => navigate('/reklam')} />
      </div>

      {alerts.length > 0 && (
        <SectionCard title="Uyarılar" subtitle="Geciken işler, trial, demo, metrik">
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a, i) => (
              <button key={i} type="button" onClick={() => navigate(a.link)} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-90 ${a.level === 'danger' ? 'bg-red-50 text-red-800 dark:bg-red-900/20' : a.level === 'warning' ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20' : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20'}`}>
                {a.text}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      <TeamLiveTable users={users} data={data} onPersonClick={navigate} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UnifiedTimeline data={data} users={users} onNavigate={navigate} />
        </div>
        <div className="space-y-6">
          <AttentionCompanies data={data} users={users} onNavigate={navigate} />
          <PatronInsights data={data} users={users} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Satış Hunisi" subtitle="Pipeline dağılımı">
          <PipelineFunnel stages={funnel} />
        </SectionCard>
        <SectionCard title="Reklam Kanalları" subtitle="Harcama dağılımı" action={<Button variant="ghost" size="sm" onClick={() => navigate('/reklam')}>Detay →</Button>}>
          {channelData.length ? <BarChart data={channelData} format={(v) => formatCurrency(v)} /> : <p className="text-sm text-slate-400">Kampanya ekleyin</p>}
        </SectionCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Son Kararlar" subtitle="Mesajlardan karar kayıtları" action={<Button variant="ghost" size="sm" onClick={() => navigate('/patron?tab=kararlar')}>Tümü →</Button>}>
          {recentDecisions.length ? (
            <div className="space-y-2">
              {recentDecisions.map((m) => (
                <button key={m.id} type="button" onClick={() => navigate('/patron?tab=kararlar')} className="w-full text-left p-2 rounded-lg border text-sm hover:border-accent">
                  {m.text.slice(0, 120)}{m.text.length > 120 ? '…' : ''}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">Henüz karar kaydı yok</p>
          )}
        </SectionCard>
        <SectionCard title="Onay Geçmişi" subtitle="Gider onay / red audit kayıtları" action={<Button variant="ghost" size="sm" onClick={() => navigate('/patron?tab=denetim')}>Denetim →</Button>}>
          {recentApprovals.length ? (
            <div className="space-y-2 text-sm">
              {recentApprovals.map((a) => (
                <div key={a.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  {a.summary}
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString('tr-TR')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">Onay geçmişi yok</p>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
