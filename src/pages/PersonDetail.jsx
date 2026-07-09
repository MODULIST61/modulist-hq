import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { buildPersonProfile, buildPersonWeeklyComparison, buildPersonReportText } from '../lib/personAnalytics'
import { printPersonReport } from '../lib/print'
import { PageHeader, Card } from '../components/ui/Page'
import { JobBadge, StatusBadge, PriorityBadge, PipelineBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatDate, formatDateTime, relativeTime, cn } from '../lib/utils'
import { TASK_STATUS_LABELS } from '../lib/constants'

const TABS = [
  { id: 'ozet', label: 'Özet' },
  { id: 'gorevler', label: 'Görevler' },
  { id: 'firmalar', label: 'Firmalar' },
  { id: 'metrikler', label: 'Metrikler' },
  { id: 'mesajlar', label: 'Mesajlar' },
  { id: 'aktivite', label: 'Aktivite' },
]

const TIMELINE_ICONS = { audit: '📋', mesaj: '💬', gorev: '✅', metrik: '📊', iletisim: '📞' }

export default function PersonDetail({ backPath = '/patron?tab=personel' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { users } = useAuth()
  const data = useData()
  const [tab, setTab] = useState('ozet')

  const profile = useMemo(() => buildPersonProfile(id, data, users), [id, data, users])
  const weekly = useMemo(() => (profile ? buildPersonWeeklyComparison(id, data) : null), [id, data, profile])

  const handlePrint = () => {
    if (!profile || !weekly) return
    printPersonReport(buildPersonReportText(profile, weekly), profile.user.name)
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500 mb-4">Personel bulunamadı.</p>
        <Button onClick={() => navigate(backPath)}>← Personellere dön</Button>
      </Card>
    )
  }

  const { user, stats, perf, tasks, companies, metrics, messages, timeline, lastSeen, lastLogin } = profile

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="mb-2">← Personeller</Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-primary dark:text-white">{user.name}</h1>
            <JobBadge user={user} />
            <span className={cn('text-xs px-2 py-0.5 rounded-full', user.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
              {user.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{user.email}</p>
          {(lastSeen || lastLogin) && (
            <p className="text-xs text-slate-400 mt-1">
              {lastLogin && `Son giriş: ${formatDateTime(lastLogin)}`}
              {lastSeen && ` · Son aktif: ${relativeTime(lastSeen)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {perf && (
            <Card className="p-4 text-center min-w-[120px]">
              <div className="text-3xl font-bold text-accent">{perf.score}</div>
              <div className="text-xs text-slate-500">Performans ({perf.grade})</div>
            </Card>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>Rapor Yazdır</Button>
        </div>
      </div>

      {weekly && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Bu Hafta vs Geçen Hafta</h3>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            {[
              { label: 'Arama', cur: weekly.current.arama, prev: weekly.previous.arama, delta: weekly.deltas.arama },
              { label: 'Demo', cur: weekly.current.demo, prev: weekly.previous.demo, delta: weekly.deltas.demo },
              { label: 'Görev', cur: weekly.tasksDone.current, prev: weekly.tasksDone.previous, delta: weekly.deltas.tasks },
            ].map((row) => (
              <div key={row.label}>
                <div className="text-xs text-slate-500 mb-1">{row.label}</div>
                <div className="text-xl font-bold">{row.cur}</div>
                <div className="text-xs text-slate-400">geçen: {row.prev}</div>
                <div className={cn('text-xs font-medium mt-1', row.delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {row.delta >= 0 ? '+' : ''}{row.delta}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Açık görev', value: stats.openTasks, danger: stats.overdueTasks },
          { label: 'Tamamlanan', value: stats.doneTasks },
          { label: 'Firmalar', value: stats.companies },
          { label: 'Müşteri', value: stats.customers },
          { label: 'Bugün arama', value: stats.todayCalls },
          { label: 'İletişim bugün', value: stats.todayInteractions || 0 },
          { label: 'Inbox', value: stats.inboxItems || 0 },
          { label: 'Mesaj', value: stats.messages + stats.dmMessages },
        ].map((k) => (
          <Card key={k.label} className={cn('p-3 text-center', k.danger > 0 && 'border-danger/30')}>
            <div className="text-xl font-bold">{k.value}</div>
            <div className="text-[10px] text-slate-500">{k.label}</div>
            {k.danger > 0 && <div className="text-[10px] text-danger">{k.danger} geciken</div>}
          </Card>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ozet' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Son aktivite</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {timeline.slice(0, 12).map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex gap-2 text-sm">
                  <span>{TIMELINE_ICONS[item.type] || '•'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.text}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(item.date)}</p>
                  </div>
                </div>
              ))}
              {!timeline.length && <p className="text-sm text-slate-400">Henüz aktivite yok</p>}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Performans detay</h3>
            {perf ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Arama (30g)</span><strong>{perf.calls}</strong></div>
                <div className="flex justify-between"><span>Demo</span><strong>{perf.demos}</strong></div>
                <div className="flex justify-between"><span>Görev tamamlama</span><strong>{perf.tasksDone}</strong></div>
                <div className="flex justify-between"><span>Dönüşüm</span><strong>{perf.conversionRate}%</strong></div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/patron?tab=performans')}>Performans paneli →</Button>
          </Card>
        </div>
      )}

      {tab === 'gorevler' && (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t.baslik}</div>
                <div className="text-xs text-slate-500">{formatDate(t.bitis_tarihi)}</div>
              </div>
              <PriorityBadge priority={t.oncelik} />
              <StatusBadge status={t.durum} />
            </Card>
          ))}
          {!tasks.length && <p className="text-sm text-slate-400">Görev yok</p>}
        </div>
      )}

      {tab === 'firmalar' && (
        <div className="space-y-2">
          {companies.map((c) => (
            <Link key={c.id} to={`/sekreter/firmalar/${c.id}`}>
              <Card className="p-4 flex items-center justify-between hover:border-accent">
                <div>
                  <div className="font-medium">{c.ad}</div>
                  <div className="text-xs text-slate-500">{c.yetkili || '—'}</div>
                </div>
                <PipelineBadge stage={c.pipeline} />
              </Card>
            </Link>
          ))}
          {!companies.length && <p className="text-sm text-slate-400">Firma yok</p>}
        </div>
      )}

      {tab === 'metrikler' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 text-left">Tarih</th>
                <th className="px-4 py-2">Arama</th>
                <th className="px-4 py-2">Ulaşılan</th>
                <th className="px-4 py-2">Demo</th>
                <th className="px-4 py-2">Takip</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {metrics.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2">{formatDate(m.tarih)}</td>
                  <td className="px-4 py-2 text-center">{m.arama_sayisi}</td>
                  <td className="px-4 py-2 text-center">{m.ulasilan}</td>
                  <td className="px-4 py-2 text-center">{m.demo_ayarlanan}</td>
                  <td className="px-4 py-2 text-center">{m.takip_aramasi}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!metrics.length && <p className="p-4 text-sm text-slate-400">Metrik girişi yok</p>}
        </div>
      )}

      {tab === 'mesajlar' && (
        <div className="space-y-2">
          {messages.map((m) => (
            <Card key={m.id} className="p-3">
              <p className="text-sm">{m.text}</p>
              <p className="text-xs text-slate-400 mt-1">{formatDateTime(m.created_at)}{m.is_dm ? ' · DM' : ''}</p>
            </Card>
          ))}
          {!messages.length && <p className="text-sm text-slate-400">Mesaj yok</p>}
        </div>
      )}

      {tab === 'aktivite' && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {timeline.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="p-3 flex gap-3">
              <span className="text-lg">{TIMELINE_ICONS[item.type] || '•'}</span>
              <div>
                <p className="text-sm">{item.text}</p>
                <p className="text-xs text-slate-400">{formatDateTime(item.date)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
