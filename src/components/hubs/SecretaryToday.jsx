import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { todayCallTotals } from '../../lib/analytics'
import { computeDailyMetricsFromInteractions, followUpsToday, inboxItems, interactionIcon } from '../../lib/interactions'
import { pendingTriageCount, closedUnreportedBugs, openBugsForCompany } from '../../lib/bugFlow'
import { StatCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { isToday, daysUntil, formatDateTime, cn } from '../../lib/utils'
import { QuickLogModal } from '../secretary/QuickLogModal'

export function SecretaryToday() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { companies, dailyMetrics, tasks, bugs, feedback, interactions } = useData()
  const [logOpen, setLogOpen] = useState(false)

  const todayDemos = companies.filter((c) => isToday(c.demo_tarihi))
  const trialEnding = companies.filter((c) => {
    const d = daysUntil(c.trial_bitis)
    return d !== null && d >= 0 && d <= 3 && c.pipeline === 'trial'
  })
  const trialWithBugs = trialEnding.filter((c) => openBugsForCompany(bugs, c.id).length > 0)
  const calls = todayCallTotals(dailyMetrics)
  const todayStr = new Date().toISOString().split('T')[0]
  const autoMetrics = computeDailyMetricsFromInteractions(interactions, currentUser?.id, todayStr)
  const openTasks = tasks.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum)).length
  const triageCount = pendingTriageCount(bugs, feedback)
  const unreportedClosed = closedUnreportedBugs(bugs)
  const inbox = inboxItems(interactions)
  const followUps = followUpsToday(interactions)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-sm text-slate-500">Dış iletişim komuta merkezi — bugünkü öncelikler</p>
        <Button onClick={() => setLogOpen(true)}>📞 Hızlı Log</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Inbox" value={inbox.length} variant={inbox.length ? 'warning' : 'default'} onClick={() => navigate('/sekreter?tab=talepler')} />
        <StatCard label="Geri Arama" value={followUps.length} variant={followUps.length ? 'warning' : 'default'} onClick={() => navigate('/sekreter?tab=iletisim')} />
        <StatCard label="Bugün Demo" value={todayDemos.length} variant={todayDemos.length ? 'success' : 'default'} onClick={() => navigate('/sekreter?tab=takvim')} />
        <StatCard label="Bugün Arama" value={autoMetrics.arama_sayisi || calls.arama} sub={`${autoMetrics.ulasilan} ulaşılan`} onClick={() => navigate('/sekreter?tab=metrik')} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Trial Bitiyor" value={trialEnding.length} variant={trialEnding.length ? 'warning' : 'default'} onClick={() => navigate('/sekreter?tab=firmalar')} />
        <StatCard label="Açık Görev" value={openTasks} onClick={() => navigate('/sekreter?tab=isler')} />
        <StatCard label="Yazılım Triage" value={triageCount} variant={triageCount ? 'warning' : 'default'} onClick={() => navigate('/yazilim?tab=buglar')} />
        <StatCard label="Trial + Bug" value={trialWithBugs.length} variant={trialWithBugs.length ? 'warning' : 'success'} onClick={() => navigate('/sekreter?tab=firmalar')} />
      </div>

      {(followUps.length > 0 || inbox.length > 0) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold mb-3">Bugün yapılacaklar</h3>
          <div className="space-y-2 text-sm">
            {followUps.map((i) => {
              const firma = companies.find((c) => c.id === i.firma_id)
              return (
                <button key={i.id} type="button" onClick={() => (firma ? navigate(`/sekreter/firmalar/${firma.id}`) : navigate('/sekreter?tab=iletisim'))} className="w-full text-left flex justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="truncate">{interactionIcon(i.tip)} {firma?.ad || i.kisi_adi} — {i.takip_notu || i.konu || 'Geri ara'}</span>
                  <span className="text-amber-600 shrink-0 ml-2">{formatDateTime(i.takip_tarihi)}</span>
                </button>
              )
            })}
            {inbox.map((i) => (
              <button key={i.id} type="button" onClick={() => navigate('/sekreter?tab=talepler')} className="w-full text-left flex justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100">
                <span className="truncate">📥 {i.konu || i.ozet?.slice(0, 40) || 'Inbox'}</span>
                <span className="text-accent shrink-0 ml-2">İşle →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {unreportedClosed.length > 0 && (
        <div className="rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-2">Müşteriye bildirilmemiş bug</h3>
          {unreportedClosed.slice(0, 4).map((b) => {
            const firma = companies.find((c) => c.id === b.iliskili_firma_id)
            return (
              <button key={b.id} type="button" onClick={() => navigate(firma ? `/sekreter/firmalar/${firma.id}` : '/yazilim?tab=buglar')} className="w-full text-left text-sm p-2 hover:bg-slate-50 rounded-lg">
                📞 {firma?.ad} — {b.baslik}
              </button>
            )
          })}
        </div>
      )}

      <QuickLogModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}
