import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { SectionCard } from '../components/dashboard/DashboardWidgets'
import { Button } from '../components/ui/Button'
import { meetingsOnDate, callbacksOnDate, interactionIcon } from '../lib/interactions'
import { cn } from '../lib/utils'

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function Calendar({ embedded = false, firmalarPath = '/sekreter/firmalar' }) {
  const { companies, interactions } = useData()
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
      id: c.id, ad: c.ad, type: 'demo', time: c.demo_saati || '', date: c.demo_tarihi,
    })),
    [companies],
  )

  const firstDay = new Date(year, month, 1)
  const startPad = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dateKey = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const eventsOnDay = (day) => {
    if (!day) return { demos: [], meetings: [], callbacks: [] }
    const key = dateKey(day)
    return {
      demos: demos.filter((c) => c.date === key),
      meetings: meetingsOnDate(interactions, key).map((i) => ({
        id: i.id, label: i.konu || i.kisi_adi || 'Toplantı', time: i.toplanti_saati, firma_id: i.firma_id, type: 'meeting',
      })),
      callbacks: callbacksOnDate(interactions, key).map((i) => ({
        id: i.id, label: i.takip_notu || i.konu || 'Geri ara', firma_id: i.firma_id, type: 'callback',
      })),
    }
  }

  const upcoming = useMemo(() => {
    const items = [
      ...demos.map((d) => ({ ...d, sort: d.date, kind: 'demo' })),
      ...interactions.filter((i) => i.toplanti_tarihi).map((i) => ({
        id: i.id, ad: i.konu || i.kisi_adi, date: i.toplanti_tarihi, time: i.toplanti_saati,
        firma_id: i.firma_id, sort: i.toplanti_tarihi, kind: 'meeting', icon: interactionIcon(i.tip),
      })),
      ...interactions.filter((i) => i.takip_tarihi && i.durum !== 'tamamlandi').map((i) => ({
        id: i.id, ad: i.takip_notu || i.konu, date: i.takip_tarihi.split('T')[0], time: '',
        firma_id: i.firma_id, sort: i.takip_tarihi, kind: 'callback', icon: '↻',
      })),
    ]
    return items
      .filter((i) => new Date(i.sort) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.sort) - new Date(b.sort))
      .slice(0, 10)
  }, [demos, interactions])

  const today = new Date()
  const isTodayCell = (day) => day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  const go = (firmaId) => navigate(firmaId ? `${firmalarPath}/${firmaId}` : '/sekreter?tab=iletisim')

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">İletişim Takvimi</h1>
          <p className="text-sm text-slate-500">Demo, yüz yüze görüşme ve geri arama hatırlatmaları</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border p-5">
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
              const ev = eventsOnDay(day)
              const total = ev.demos.length + ev.meetings.length + ev.callbacks.length
              return (
                <div key={i} className={cn('min-h-[80px] p-1 rounded-lg border text-xs', !day && 'border-transparent', day && 'border-slate-100 dark:border-slate-800', isTodayCell(day) && 'bg-blue-50 dark:bg-blue-900/20 border-accent/30')}>
                  {day && <span className={cn('font-medium', isTodayCell(day) && 'text-accent')}>{day}</span>}
                  {ev.demos.slice(0, 1).map((c) => (
                    <button key={c.id} type="button" onClick={() => go(c.id)} className="block w-full text-left mt-0.5 px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 truncate">🖥 {c.ad}</button>
                  ))}
                  {ev.meetings.slice(0, 1).map((m) => (
                    <button key={m.id} type="button" onClick={() => go(m.firma_id)} className="block w-full text-left mt-0.5 px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 truncate">🤝 {m.label}</button>
                  ))}
                  {ev.callbacks.slice(0, 1).map((c) => (
                    <button key={c.id} type="button" onClick={() => go(c.firma_id)} className="block w-full text-left mt-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-800 truncate">↻ {c.label}</button>
                  ))}
                  {total > 3 && <span className="text-[10px] text-slate-400">+{total - 3}</span>}
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-3 text-[10px] text-slate-500">
            <span>🖥 Demo</span><span>🤝 Toplantı</span><span>↻ Geri arama</span>
          </div>
        </div>

        <SectionCard title="Yaklaşan" subtitle="Demo · toplantı · geri arama">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Planlı etkinlik yok</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((c) => (
                <button key={`${c.kind}-${c.id}`} type="button" onClick={() => go(c.firma_id || c.id)} className="w-full text-left p-3 rounded-lg border hover:border-accent">
                  <div className="font-medium text-sm">{c.icon || '🖥'} {c.ad}</div>
                  <div className="text-xs text-slate-500">{new Date(c.sort).toLocaleDateString('tr-TR')} {c.time && `· ${c.time}`}</div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
