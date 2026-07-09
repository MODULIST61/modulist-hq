import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { canDo } from '../lib/permissions'
import { calculatePerformanceScores, getTeamAverage } from '../lib/performance'
import { SectionCard, BarChart } from '../components/dashboard/DashboardWidgets'
import { PageHeader, Card } from '../components/ui/Page'
import { cn } from '../lib/utils'

const GRADE_COLORS = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  B: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  D: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
}

function GoalBar({ label, current, goal, unit = '' }) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0
  const met = current >= goal
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className={met ? 'text-emerald-600 font-medium' : 'text-slate-600 dark:text-slate-300'}>
          {current}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', met ? 'bg-emerald-500' : 'bg-accent')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Performance({ embedded = false }) {
  const { currentUser, users } = useAuth()
  const { tasks, companies, dailyMetrics, settings } = useData()
  const patron = canDo(currentUser, 'viewTeamPerformance')
  const goals = settings?.performanceGoals || { calls: 50, demos: 10, tasks: 15, score: 70 }

  const scores = useMemo(
    () => calculatePerformanceScores(users, tasks, companies, dailyMetrics),
    [users, tasks, companies, dailyMetrics]
  )

  const teamAvg = getTeamAverage(scores)
  const myScore = scores.find((s) => s.userId === currentUser?.id)
  const display = patron ? scores : scores.filter((s) => s.userId === currentUser?.id)
  const chartData = display.map((s) => ({ label: s.name.split(' ')[0], value: s.score }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {!embedded && (
        <PageHeader
          title="Performans Skorları"
          subtitle="Son 30 gün — arama, demo, görev tamamlama ve dönüşüm"
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-accent">{myScore?.score ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Sizin Skorunuz</div>
          {myScore && <span className={cn('inline-block mt-2 text-xs px-2 py-0.5 rounded-full border font-bold', GRADE_COLORS[myScore.grade])}>{myScore.grade}</span>}
        </Card>
        {patron && (
          <Card className="p-5 text-center">
            <div className="text-3xl font-bold text-primary dark:text-white">{teamAvg}</div>
            <div className="text-xs text-slate-500 mt-1">Ekip Ortalaması</div>
            <div className="text-[10px] text-slate-400 mt-1">Hedef: {goals.score}</div>
          </Card>
        )}
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold text-emerald-600">{myScore?.conversionRate ?? 0}%</div>
          <div className="text-xs text-slate-500 mt-1">Dönüşüm Oranı</div>
        </Card>
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold">{myScore?.calls ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Arama (30 gün)</div>
        </Card>
      </div>

      {myScore && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4">Hedeflerinize Ulaşım</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <GoalBar label="Arama" current={myScore.calls} goal={goals.calls} />
            <GoalBar label="Demo" current={myScore.demos} goal={goals.demos} />
            <GoalBar label="Tamamlanan görev" current={myScore.completed} goal={goals.tasks} />
            <GoalBar label="Performans skoru" current={myScore.score} goal={goals.score} />
          </div>
          {patron && <p className="text-xs text-slate-400 mt-3">Hedefleri Ayarlar sayfasından düzenleyebilirsiniz.</p>}
        </Card>
      )}

      {patron && chartData.length > 0 && (
        <SectionCard title="Ekip Skorları" subtitle="0–100 performans puanı">
          <BarChart data={chartData} />
        </SectionCard>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Kişi</th>
              <th className="px-4 py-3 font-medium">Skor</th>
              <th className="px-4 py-3 font-medium">Arama</th>
              <th className="px-4 py-3 font-medium">Demo</th>
              <th className="px-4 py-3 font-medium">Görev ✓</th>
              <th className="px-4 py-3 font-medium">Dönüşüm</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Kırılım</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {display.map((s) => (
              <tr key={s.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{s.job_title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-lg">{s.score}</span>
                  <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded border font-bold', GRADE_COLORS[s.grade])}>{s.grade}</span>
                </td>
                <td className="px-4 py-3">{s.calls}</td>
                <td className="px-4 py-3">{s.demos}</td>
                <td className="px-4 py-3 text-emerald-600">{s.completed}</td>
                <td className="px-4 py-3">{s.conversions} müşteri · %{s.conversionRate}</td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400">
                  A:{s.breakdown.callScore} D:{s.breakdown.demoScore} G:{s.breakdown.taskScore} M:{s.breakdown.convScore}
                  {s.breakdown.penalty > 0 && ` -${s.breakdown.penalty}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-slate-400">
        Skor formülü: arama (max 25) + demo (max 25) + tamamlanan görev (max 25) + dönüşüm (max 25) − geciken görev cezası
      </p>
    </div>
  )
}
