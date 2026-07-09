import { ROLE_LABELS, ROLE_COLORS, PIPELINE_LABELS, PIPELINE_COLORS } from '../../lib/constants'
import { getUserDisplayTitle, isPatron } from '../../lib/permissions'
import { cn } from '../../lib/utils'

export function RoleBadge({ role, className }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', ROLE_COLORS[role] || 'bg-slate-100 text-slate-700 border-slate-200', className)}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

export function JobBadge({ user, className }) {
  const title = getUserDisplayTitle(user)
  const color = isPatron(user)
    ? ROLE_COLORS.patron
    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', color, className)}>
      {title}
    </span>
  )
}

export function PipelineBadge({ stage, className }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', PIPELINE_COLORS[stage], className)}>
      {PIPELINE_LABELS[stage] || stage}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const colors = {
    dusuk: 'bg-slate-100 text-slate-600',
    normal: 'bg-blue-100 text-blue-700',
    yuksek: 'bg-orange-100 text-orange-700',
    acil: 'bg-red-100 text-red-700',
    kritik: 'bg-red-200 text-red-800 font-semibold',
  }
  const labels = { dusuk: 'Düşük', normal: 'Normal', yuksek: 'Yüksek', acil: 'Acil', kritik: 'Kritik' }
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', colors[priority])}>
      {labels[priority] || priority}
    </span>
  )
}

export function StatusBadge({ status, type = 'task' }) {
  const taskColors = {
    yapilacak: 'bg-slate-100 text-slate-700',
    devam: 'bg-blue-100 text-blue-700',
    tamamlandi: 'bg-emerald-100 text-emerald-700',
    iptal: 'bg-red-100 text-red-600',
  }
  const bugColors = {
    acik: 'bg-red-100 text-red-700',
    devam: 'bg-blue-100 text-blue-700',
    test: 'bg-purple-100 text-purple-700',
    kapali: 'bg-slate-100 text-slate-600',
  }
  const taskLabels = { yapilacak: 'Yapılacak', devam: 'Devam', tamamlandi: 'Tamamlandı', iptal: 'İptal' }
  const bugLabels = { acik: 'Açık', devam: 'Devam', test: 'Test', kapali: 'Kapalı' }
  const colors = type === 'bug' ? bugColors : taskColors
  const labels = type === 'bug' ? bugLabels : taskLabels
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', colors[status])}>
      {labels[status] || status}
    </span>
  )
}

export function MessageTypeBadge({ type }) {
  if (!type || type === 'normal') return null
  const colors = {
    duyuru: 'bg-amber-100 text-amber-800',
    karar: 'bg-purple-100 text-purple-800',
    gorev: 'bg-blue-100 text-blue-800',
  }
  const labels = { duyuru: 'Duyuru', karar: 'Karar', gorev: 'Görev' }
  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide', colors[type])}>
      {labels[type]}
    </span>
  )
}
