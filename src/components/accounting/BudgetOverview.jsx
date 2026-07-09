import { useMemo } from 'react'
import { useData } from '../../context/DataContext'
import { buildBudgetOverview } from '../../lib/accounting'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { formatCurrency, cn } from '../../lib/utils'

export function BudgetOverview() {
  const { campaigns, finance, settings } = useData()
  const budget = useMemo(() => buildBudgetOverview(campaigns, finance, settings), [campaigns, finance, settings])

  return (
    <div className="space-y-6">
      <SectionCard title="Bütçe vs Gerçekleşen" subtitle="Bu ay onaylı giderler">
        <div className="space-y-4">
          {budget.rows.map((row) => {
            const pct = row.budget > 0 ? Math.min(100, Math.round((row.spent / row.budget) * 100)) : 0
            const over = row.budget > 0 && row.spent > row.budget
            return (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{row.label}</span>
                  <span className={cn(over && 'text-red-500 font-semibold')}>
                    {formatCurrency(row.spent)} / {formatCurrency(row.budget)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', over ? 'bg-red-500' : 'bg-accent')} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Kampanya Bütçesi" subtitle="Plan vs harcanan">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="text-2xl font-bold">{formatCurrency(budget.campaignPlan)}</div>
            <div className="text-xs text-slate-500">Plan</div>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="text-2xl font-bold text-accent">{formatCurrency(budget.campaignSpent)}</div>
            <div className="text-xs text-slate-500">Harcanan</div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
