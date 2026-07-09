import { cn } from '../../lib/utils'

export function KanbanBoard({ columns, onCardClick, onDrop }) {
  const handleDragStart = (e, item, fromCol) => {
    e.dataTransfer.setData('itemId', item.id)
    e.dataTransfer.setData('fromCol', fromCol)
  }

  const handleDrop = (e, toCol) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('itemId')
    const fromCol = e.dataTransfer.getData('fromCol')
    if (itemId && fromCol !== toCol && onDrop) onDrop(itemId, fromCol, toCol)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 min-h-[420px]">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-shrink-0 w-64 sm:w-72 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className={cn('px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-sm flex justify-between', col.headerClass)}>
            <span>{col.title}</span>
            <span className="text-xs text-slate-400 font-normal">{col.items.length}</span>
          </div>
          <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[520px]">
            {col.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item, col.id)}
                onClick={() => onCardClick?.(item)}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing hover:border-accent/50 transition-colors shadow-sm"
              >
                <div className="font-medium text-sm">{item.title}</div>
                {item.subtitle && <div className="text-xs text-slate-500 mt-1">{item.subtitle}</div>}
                {item.badge && <div className="mt-2">{item.badge}</div>}
              </div>
            ))}
            {!col.items.length && <p className="text-xs text-slate-400 text-center py-6">Boş</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
