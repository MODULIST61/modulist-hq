import { buildMorningBriefing } from '../../lib/patronPulse'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'

export function MorningBriefing({ data, users, onNavigate }) {
  const briefing = buildMorningBriefing(data, users)
  const h = briefing.highlights

  return (
    <SectionCard
      title="Sabah Brifingi"
      subtitle={new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
      action={<Button variant="ghost" size="sm" onClick={() => onNavigate?.('/patron?tab=mudur')}>Müdür AI →</Button>}
    >
      <div className="flex gap-2 flex-wrap mb-3">
        {h.demosToday > 0 && <Chip label={`${h.demosToday} demo`} />}
        {h.followUps > 0 && <Chip label={`${h.followUps} geri arama`} />}
        {h.inbox > 0 && <Chip label={`${h.inbox} inbox`} warn />}
        {h.pendingFinance > 0 && <Chip label={`${h.pendingFinance} onay`} warn />}
        {h.criticalBugs > 0 && <Chip label={`${h.criticalBugs} kritik bug`} danger />}
      </div>
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
        {briefing.text}
      </div>
    </SectionCard>
  )
}

function Chip({ label, warn, danger }) {
  const cls = danger
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
    : warn
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
}
