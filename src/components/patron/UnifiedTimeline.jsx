import { useMemo, useState } from 'react'
import { TIMELINE_FILTERS, buildUnifiedTimeline } from '../../lib/patronPulse'
import { ActivityFeed, SectionCard } from '../dashboard/DashboardWidgets'
import { Input } from '../ui/Input'
import { cn } from '../../lib/utils'

export function UnifiedTimeline({ data, users, onNavigate, limit = 50 }) {
  const [type, setType] = useState('all')
  const [userId, setUserId] = useState('')
  const [search, setSearch] = useState('')

  const items = useMemo(
    () => buildUnifiedTimeline(data, users, { limit: 100, userId: userId || undefined, type: type === 'all' ? undefined : type }),
    [data, users, userId, type],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items.slice(0, limit)
    return items.filter((i) => i.text.toLowerCase().includes(q)).slice(0, limit)
  }, [items, search, limit])

  const staff = users.filter((u) => u.role !== 'patron' && u.status === 'aktif')

  return (
    <SectionCard title="Şirket Nabzı" subtitle="Tüm hub'lardan birleşik timeline" action={<span className="text-xs text-slate-400">{filtered.length} olay</span>}>
      <div className="space-y-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {TIMELINE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setType(f.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                type === f.id ? 'bg-accent text-white border-accent' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-accent',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Olay ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs text-sm" />
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="">Tüm personel</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>
      <ActivityFeed items={filtered} onItemClick={(item) => item.link && onNavigate?.(item.link)} />
    </SectionCard>
  )
}
