import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { todayCallTotals } from '../../lib/analytics'
import { StatCard } from '../dashboard/DashboardWidgets'
import { isToday, daysUntil } from '../../lib/utils'
import {
  pendingTriageCount,
  closedUnreportedBugs,
  openBugsForCompany,
} from '../../lib/bugFlow'

export function SecretaryToday() {
  const navigate = useNavigate()
  const { companies, dailyMetrics, tasks, bugs, feedback } = useData()
  const todayDemos = companies.filter((c) => isToday(c.demo_tarihi))
  const trialEnding = companies.filter((c) => {
    const d = daysUntil(c.trial_bitis)
    return d !== null && d >= 0 && d <= 3 && c.pipeline === 'trial'
  })
  const trialWithBugs = trialEnding.filter((c) => openBugsForCompany(bugs, c.id).length > 0)
  const calls = todayCallTotals(dailyMetrics)
  const openTasks = tasks.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum)).length
  const triageCount = pendingTriageCount(bugs, feedback)
  const unreportedClosed = closedUnreportedBugs(bugs)

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Bugün Demo" value={todayDemos.length} variant={todayDemos.length ? 'success' : 'default'} onClick={() => navigate('/sekreter?tab=firmalar')} />
        <StatCard label="Trial Bitiyor" value={trialEnding.length} variant={trialEnding.length ? 'warning' : 'default'} onClick={() => navigate('/sekreter?tab=firmalar')} />
        <StatCard label="Bugün Arama" value={calls.arama} sub={`${calls.entries} giriş`} onClick={() => navigate('/sekreter?tab=metrik')} />
        <StatCard label="Açık Görev" value={openTasks} onClick={() => navigate('/sekreter?tab=isler')} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Yazılım Triage"
          value={triageCount}
          sub="Bug + geri dönüş bekliyor"
          variant={triageCount ? 'warning' : 'default'}
          onClick={() => navigate('/yazilim?tab=buglar')}
        />
        <StatCard
          label="Müşteriye Bildirilmemiş"
          value={unreportedClosed.length}
          sub="Kapalı bug — geri dönüş gerek"
          variant={unreportedClosed.length ? 'warning' : 'default'}
          onClick={() => navigate('/yazilim?tab=buglar')}
        />
        <StatCard
          label="Trial + Açık Bug"
          value={trialWithBugs.length}
          sub={trialWithBugs.length ? 'Acil takip' : 'Temiz'}
          variant={trialWithBugs.length ? 'warning' : 'success'}
          onClick={() => navigate('/sekreter?tab=firmalar')}
        />
      </div>

      {(triageCount > 0 || unreportedClosed.length > 0) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold mb-3">Yazılım ↔ Sekreter Köprüsü</h3>
          <div className="space-y-2 text-sm">
            {triageCount > 0 && (
              <button type="button" onClick={() => navigate('/yazilim?tab=buglar')} className="w-full text-left flex justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <span>📥 {triageCount} kayıt yazılım triage&apos;ında</span>
                <span className="text-accent">Git →</span>
              </button>
            )}
            {unreportedClosed.slice(0, 5).map((b) => {
              const firma = companies.find((c) => c.id === b.iliskili_firma_id)
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => (firma ? navigate(`/sekreter/firmalar/${firma.id}`) : navigate('/yazilim?tab=buglar'))}
                  className="w-full text-left flex justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="truncate">📞 {firma?.ad || 'Firma'} — {b.baslik}</span>
                  <span className="text-amber-600 shrink-0 ml-2">Bildir</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
