import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { buildPersonProfile } from '../lib/personAnalytics'
import { PageHeader, Card } from '../components/ui/Page'
import { JobBadge } from '../components/ui/Badge'
import { relativeTime, cn } from '../lib/utils'

export default function Personnel() {
  const { users } = useAuth()
  const data = useData()

  const staff = useMemo(() => {
    return users
      .filter((u) => u.role !== 'patron')
      .map((u) => buildPersonProfile(u.id, data, users))
      .filter(Boolean)
      .sort((a, b) => (b.stats.overdueTasks || 0) - (a.stats.overdueTasks || 0))
  }, [users, data])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Personeller"
        subtitle="Tıkla — o kişiyle ilgili her şeyi gör (görev, firma, mesaj, metrik, performans)"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((p) => (
          <Link key={p.user.id} to={`/personel/${p.user.id}`}>
            <Card className={cn(
              'p-5 hover:border-accent hover:shadow-md transition-all h-full',
              p.stats.overdueTasks > 0 && 'border-danger/40'
            )}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-lg">{p.user.name}</div>
                  <div className="text-xs text-slate-500">{p.user.email}</div>
                </div>
                <JobBadge user={p.user} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <div className="text-lg font-bold text-accent">{p.stats.openTasks}</div>
                  <div className="text-[10px] text-slate-500">Açık iş</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <div className={cn('text-lg font-bold', p.stats.overdueTasks ? 'text-danger' : '')}>{p.stats.overdueTasks}</div>
                  <div className="text-[10px] text-slate-500">Geciken</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                  <div className="text-lg font-bold">{p.perf?.score ?? '—'}</div>
                  <div className="text-[10px] text-slate-500">Skor</div>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Bugün: {p.stats.todayCalls} arama · {p.stats.todayDemos} demo</div>
                <div>{p.stats.companies} firma · {p.stats.customers} müşteri</div>
                {p.lastSeen && <div>Son görülme: {relativeTime(p.lastSeen)}</div>}
              </div>

              <div className="mt-3 text-xs text-accent font-medium">Detay →</div>
            </Card>
          </Link>
        ))}
      </div>

      {staff.length === 0 && (
        <Card className="p-8 text-center text-slate-500">
          Henüz personel yok. <Link to="/ekip" className="text-accent hover:underline">Ekip</Link> sayfasından ekleyin.
        </Card>
      )}
    </div>
  )
}
