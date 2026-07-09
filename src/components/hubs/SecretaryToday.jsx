import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { todayCallTotals } from '../../lib/analytics'
import { StatCard } from '../dashboard/DashboardWidgets'
import { isToday, daysUntil } from '../../lib/utils'

export function SecretaryToday() {
  const navigate = useNavigate()
  const { companies, dailyMetrics, tasks } = useData()
  const todayDemos = companies.filter((c) => isToday(c.demo_tarihi))
  const trialEnding = companies.filter((c) => {
    const d = daysUntil(c.trial_bitis)
    return d !== null && d >= 0 && d <= 3 && c.pipeline === 'trial'
  })
  const calls = todayCallTotals(dailyMetrics)
  const openTasks = tasks.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum)).length

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <StatCard label="Bugün Demo" value={todayDemos.length} variant={todayDemos.length ? 'success' : 'default'} onClick={() => navigate('/sekreter?tab=firmalar')} />
      <StatCard label="Trial Bitiyor" value={trialEnding.length} variant={trialEnding.length ? 'warning' : 'default'} onClick={() => navigate('/sekreter?tab=firmalar')} />
      <StatCard label="Bugün Arama" value={calls.arama} sub={`${calls.entries} giriş`} onClick={() => navigate('/sekreter?tab=metrik')} />
      <StatCard label="Açık Görev" value={openTasks} onClick={() => navigate('/sekreter?tab=isler')} />
    </div>
  )
}
