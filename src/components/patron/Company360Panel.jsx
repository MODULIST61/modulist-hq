import { buildCompany360 } from '../../lib/patronPulse'
import { formatCurrency, formatDate } from '../../lib/utils'
import { PipelineBadge } from '../ui/Badge'

export function Company360Panel({ companyId, data, users }) {
  const c360 = buildCompany360(companyId, data, users)
  if (!c360) return null

  const { company, owner, stats, lastContact, lastContactSummary, attention, pipelineEvents } = c360

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/10 p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm">Patron 360°</h3>
          <p className="text-xs text-slate-500">Firma özeti — iletişim, finans, risk</p>
        </div>
        <PipelineBadge stage={company.pipeline} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <MiniStat label="İletişim" value={stats.interactions} />
        <MiniStat label="Açık bug" value={stats.openBugs} warn={stats.openBugs > 0} />
        <MiniStat label="Net finans" value={formatCurrency(stats.net)} />
        <MiniStat label="Görev" value={stats.tasks} />
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
        <p>Sorumlu: <strong>{owner || '—'}</strong></p>
        {lastContact && (
          <p>Son temas ({formatDate(lastContact)}): {lastContactSummary}</p>
        )}
      </div>

      {attention.length > 0 && (
        <div className="text-xs">
          <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">⚠️ Dikkat</p>
          <ul className="text-slate-600 dark:text-slate-400 space-y-0.5">
            {attention.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      {pipelineEvents.length > 1 && (
        <div className="text-xs">
          <p className="font-medium mb-1">Pipeline geçmişi</p>
          <ul className="text-slate-500 space-y-0.5 max-h-24 overflow-y-auto">
            {pipelineEvents.slice(0, 5).map((e, i) => (
              <li key={i}>{formatDate(e.date)} — {e.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, warn }) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-2">
      <div className={`text-lg font-bold ${warn ? 'text-amber-600' : ''}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  )
}
