import { cn } from '../../lib/utils'

export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="mb-6">
      {breadcrumb && <div className="text-xs text-slate-400 mb-2">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex gap-2 flex-wrap">{action}</div>}
      </div>
    </div>
  )
}

export function Card({ children, className, hover }) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm',
      hover && 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all',
      className
    )}>
      {children}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-slate-200 dark:bg-slate-800 rounded', className)} />
}

export function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
      {children}
    </kbd>
  )
}

export function EmptyIllustration({ emoji, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-4">{emoji}</div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
