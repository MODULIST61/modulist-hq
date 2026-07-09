import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { SectionCard } from '../components/dashboard/DashboardWidgets'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function Calendar() {
  const { companies } = useData()
  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)

  const viewDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + offset)
    return d
  }, [offset])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthLabel = viewDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  const demos = useMemo(
    () => companies.filter((c) => c.demo_tarihi).map((c) => ({
      ...c,
      date: c.demo_tarihi,
      time: c.demo_saati || '',
    })),
    [companies]
  )

  const firstDay = new Date(year, month, 1)
  const startPad = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const demosOnDay = (day) => {
    if (!day) return []
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return demos.filter((c) => c.demo_tarihi === key)
  }

  const upcoming = demos
    .filter((c) => new Date(c.demo_tarihi) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.demo_tarihi) - new Date(b.demo_tarihi))
    .slice(0, 8)

  const today = new Date()
  const isToday = (day) => day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-white">Demo Takvimi</h1>
        <p className="text-sm text-slate-500">Firma demo randevuları — firmalardan otomatik çekilir</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => setOffset(offset - 1)}>←</Button>
            <h2 className="font-semibold capitalize">{monthLabel}</h2>
            <Button variant="ghost" size="sm" onClick={() => setOffset(offset + 1)}>→</Button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const dayDemos = demosOnDay(day)
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[72px] p-1 rounded-lg border text-xs',
                    !day && 'border-transparent',
                    day && 'border-slate-100 dark:border-slate-800',
                    isToday(day) && 'bg-blue-50 dark:bg-blue-900/20 border-accent/30'
                  )}
                >
                  {day && <span className={cn('font-medium', isToday(day) && 'text-accent')}>{day}</span>}
                  {dayDemos.slice(0, 2).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/kayitlar/firmalar/${c.id}`)}
                      className="block w-full text-left mt-0.5 px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 truncate hover:bg-indigo-200"
                      title={`${c.ad} ${c.demo_saati || ''}`}
                    >
                      {c.demo_saati ? `${c.demo_saati} ` : ''}{c.ad}
                    </button>
                  ))}
                  {dayDemos.length > 2 && <span className="text-[10px] text-slate-400">+{dayDemos.length - 2}</span>}
                </div>
              )
            })}
          </div>
        </div>

        <SectionCard title="Yaklaşan Demolar" subtitle="Tıklayın → firma detay">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Planlı demo yok. Firmalara demo tarihi ekleyin.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/kayitlar/firmalar/${c.id}`)}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-accent transition-colors"
                >
                  <div className="font-medium text-sm">{c.ad}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(c.demo_tarihi).toLocaleDateString('tr-TR')} {c.demo_saati && `· ${c.demo_saati}`}
                  </div>
                  <div className="text-xs text-accent mt-0.5">{c.pipeline}</div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
