import { buildAttentionCompanies } from '../../lib/patronPulse'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { PipelineBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatDate, getUserName } from '../../lib/utils'

export function AttentionCompanies({ data, users, onNavigate }) {
  const items = buildAttentionCompanies(data, data.interactions)

  if (!items.length) {
    return (
      <SectionCard title="Dikkat Gerektiren Firmalar" subtitle="Trial, iletişim, bug ve durgunluk">
        <p className="text-sm text-slate-400 py-6 text-center">Şu an kritik firma yok 🎉</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Dikkat Gerektiren Firmalar" subtitle="Trial, iletişim, bug ve durgunluk" action={<Button variant="ghost" size="sm" onClick={() => onNavigate?.('/sekreter?tab=firmalar')}>Tüm firmalar →</Button>}>
      <div className="space-y-2 max-h-[320px] overflow-y-auto">
        {items.map(({ company, reasons, lastContact }) => (
          <button
            key={company.id}
            type="button"
            onClick={() => onNavigate?.(`/sekreter/firmalar/${company.id}`)}
            className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">{company.ad}</span>
              <PipelineBadge stage={company.pipeline} />
              {company.sorumlu_id && (
                <span className="text-[10px] text-slate-400">{getUserName(users, company.sorumlu_id)}</span>
              )}
            </div>
            <ul className="text-xs text-slate-500 space-y-0.5">
              {reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
            {lastContact && (
              <p className="text-[10px] text-slate-400 mt-1">Son temas: {formatDate(lastContact)}</p>
            )}
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
