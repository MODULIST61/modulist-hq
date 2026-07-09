import { cn } from '../../lib/utils'

export function StatCard({ label, value, sub, trend, variant = 'default', onClick }) {
  const variants = {
    default: 'border-slate-200 dark:border-slate-800',
    accent: 'border-accent/30 bg-blue-50/40 dark:bg-blue-900/10',
    success: 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10',
    warning: 'border-amber-200 bg-amber-50/40 dark:bg-amber-900/10',
    danger: 'border-red-200 bg-red-50/40 dark:bg-red-900/10',
  }
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 text-left w-full transition-shadow',
        variants[variant],
        onClick && 'hover:shadow-md cursor-pointer'
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-primary dark:text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      {trend != null && (
        <div className={cn('text-xs mt-1 font-medium', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% geçen aya göre
        </div>
      )}
    </Tag>
  )
}

export function BarChart({ data, labelKey = 'label', valueKey = 'value', format }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d[labelKey]} className="flex items-center gap-3 text-sm">
          <span className="w-24 truncate text-slate-500 text-xs">{d[labelKey]}</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all min-w-[2px]"
              style={{ width: `${(d[valueKey] / max) * 100}%` }}
            />
          </div>
          <span className="w-16 text-right text-xs font-medium">{format ? format(d[valueKey]) : d[valueKey]}</span>
        </div>
      ))}
    </div>
  )
}

export function ActivityFeed({ items, onItemClick }) {
  if (!items.length) return <p className="text-sm text-slate-400 py-8 text-center">Henüz aktivite yok</p>
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex gap-3 items-start"
        >
          <span className="text-lg shrink-0">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{item.text}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.time ? new Date(item.time).toLocaleString('tr-TR') : ''}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export function TeamWorkloadTable({ workload }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
            <th className="pb-2 font-medium">Kişi</th>
            <th className="pb-2 font-medium">Açık</th>
            <th className="pb-2 font-medium">Geciken</th>
            <th className="pb-2 font-medium">Tamamlanan</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-slate-800">
          {workload.map((w) => (
            <tr key={w.userId}>
              <td className="py-2 font-medium">{w.name}</td>
              <td className="py-2">{w.open}</td>
              <td className={cn('py-2', w.overdue > 0 && 'text-danger font-semibold')}>{w.overdue}</td>
              <td className="py-2 text-emerald-600">{w.done}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PipelineFunnel({ stages }) {
  const max = Math.max(...stages.map((s) => s.count), 1)
  return (
    <div className="flex items-end gap-2 h-32">
      {stages.filter((s) => s.stage !== 'kayip').map((s) => (
        <div key={s.stage} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-accent/80 rounded-t-md min-h-[4px] transition-all"
            style={{ height: `${Math.max((s.count / max) * 100, 8)}%` }}
          />
          <span className="text-[10px] text-slate-500 text-center leading-tight">{s.stage}</span>
          <span className="text-xs font-bold">{s.count}</span>
        </div>
      ))}
    </div>
  )
}

export function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-primary dark:text-white text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
