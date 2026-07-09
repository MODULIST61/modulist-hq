import { buildTeamLiveSummary } from '../../lib/patronPulse'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

const STATUS_STYLE = {
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30',
  idle: 'bg-slate-100 text-slate-500 dark:bg-slate-800',
}

export function TeamLiveTable({ users, data, onPersonClick }) {
  const rows = buildTeamLiveSummary(users, data)

  return (
    <SectionCard
      title="Ekip Canlı"
      subtitle="Son aktivite, arama, inbox ve durum"
      action={onPersonClick && <Button variant="ghost" size="sm" onClick={() => onPersonClick('/patron?tab=personel')}>Tüm personel →</Button>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
              <th className="pb-2 font-medium">Kişi</th>
              <th className="pb-2 font-medium">Son aktif</th>
              <th className="pb-2 font-medium">Arama</th>
              <th className="pb-2 font-medium">Demo</th>
              <th className="pb-2 font-medium">Açık iş</th>
              <th className="pb-2 font-medium">Inbox</th>
              <th className="pb-2 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={row.user.id}>
                <td className="py-2">
                  <button type="button" className="font-medium text-accent hover:underline" onClick={() => onPersonClick?.(`/patron/personel/${row.user.id}`)}>
                    {row.user.name}
                  </button>
                </td>
                <td className="py-2 text-xs text-slate-500">{row.lastSeenLabel}</td>
                <td className="py-2">{row.arama}</td>
                <td className="py-2">{row.demo}</td>
                <td className={cn('py-2', row.overdue > 0 && 'text-danger font-semibold')}>{row.openTasks}{row.overdue > 0 ? ` (${row.overdue}⚠)` : ''}</td>
                <td className="py-2">{row.inbox || '—'}</td>
                <td className="py-2">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_STYLE[row.status])}>
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
