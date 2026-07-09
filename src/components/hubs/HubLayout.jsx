import { useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function HubLayout({ title, subtitle, tabs, activeTab, onTabChange, children }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              activeTab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            )}
          >
            {t.icon ? `${t.icon} ` : ''}{t.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}

export function useHubTab(defaultTab) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || defaultTab

  const setTab = (next) => {
    setSearchParams({ tab: next }, { replace: true })
  }

  return { tab, setTab }
}
