import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { PageHeader } from '../components/ui/Page'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { Drawer, EmptyState } from '../components/ui/Modal'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { KanbanBoard } from '../components/ui/KanbanBoard'
import { TASK_STATUS_LABELS } from '../lib/constants'
import { formatDate, getUserName, isOverdue, cn } from '../lib/utils'
import { taskRecordLink } from '../lib/hubTasks'

const KANBAN_COLS = ['yapilacak', 'devam', 'tamamlandi']

export default function MyTasks() {
  const { currentUser, users } = useAuth()
  const { tasks, rooms, updateTask, taskComments } = useData()
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState({ durum: '', oncelik: '' })
  const [detail, setDetail] = useState(null)

  const mine = useMemo(
    () => tasks.filter((t) => t.sorumlu_id === currentUser?.id),
    [tasks, currentUser?.id],
  )

  const open = useMemo(
    () => mine.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum)),
    [mine],
  )

  const filtered = useMemo(() => mine.filter((t) => {
    if (filter.durum && t.durum !== filter.durum) return false
    if (filter.oncelik && t.oncelik !== filter.oncelik) return false
    return true
  }).sort((a, b) => {
    const ao = isOverdue(a.bitis_tarihi) && a.durum !== 'tamamlandi' ? 0 : 1
    const bo = isOverdue(b.bitis_tarihi) && b.durum !== 'tamamlandi' ? 0 : 1
    if (ao !== bo) return ao - bo
    return new Date(b.created_at || 0) - new Date(a.created_at || 0)
  }), [mine, filter])

  const kanbanColumns = useMemo(() => KANBAN_COLS.map((status) => ({
    id: status,
    title: TASK_STATUS_LABELS[status],
    headerClass: status === 'tamamlandi' ? 'text-emerald-600' : status === 'devam' ? 'text-blue-600' : '',
    items: filtered.filter((t) => t.durum === status).map((t) => ({
      id: t.id,
      title: t.baslik,
      subtitle: `${formatDate(t.bitis_tarihi) || 'Tarih yok'}${isOverdue(t.bitis_tarihi) && t.durum !== 'tamamlandi' ? ' · Gecikti' : ''}`,
      badge: <PriorityBadge priority={t.oncelik} />,
      raw: t,
    })),
  })), [filtered])

  const detailComments = detail ? taskComments.filter((c) => c.task_id === detail.id) : []
  const recordLink = detail ? taskRecordLink(detail) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Görevlerim"
        subtitle={`${open.length} açık · ${mine.length} toplam`}
        action={
          <div className="flex rounded-lg border overflow-hidden">
            <button type="button" onClick={() => setView('list')} className={cn('px-3 py-1.5 text-xs font-medium', view === 'list' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900')}>Liste</button>
            <button type="button" onClick={() => setView('kanban')} className={cn('px-3 py-1.5 text-xs font-medium', view === 'kanban' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900')}>Kanban</button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select value={filter.durum} onChange={(e) => setFilter({ ...filter, durum: e.target.value })} className="w-auto">
          <option value="">Tüm durumlar</option>
          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={filter.oncelik} onChange={(e) => setFilter({ ...filter, oncelik: e.target.value })} className="w-auto">
          <option value="">Tüm öncelikler</option>
          <option value="dusuk">Düşük</option>
          <option value="normal">Normal</option>
          <option value="yuksek">Yüksek</option>
          <option value="acil">Acil</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="✅" title="Görev yok" description="Size atanmış açık görev bulunmuyor." />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          onCardClick={(item) => setDetail(item.raw)}
          onDrop={(itemId, _from, toCol) => updateTask(itemId, { durum: toCol })}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border divide-y dark:divide-slate-800">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={cn(
                'px-4 py-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer',
                isOverdue(task.bitis_tarihi) && task.durum !== 'tamamlandi' && 'border-l-4 border-l-red-500',
              )}
              onClick={() => setDetail(task)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{task.baslik}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {task.olusturan_id && task.olusturan_id !== currentUser?.id && (
                    <span>Atayan: {getUserName(users, task.olusturan_id)} · </span>
                  )}
                  Bitiş: {formatDate(task.bitis_tarihi) || '—'}
                  {task.room_id && ` · #${rooms.find((r) => r.id === task.room_id)?.name || 'oda'}`}
                </div>
              </div>
              <PriorityBadge priority={task.oncelik} />
              <StatusBadge status={task.durum} />
              {task.durum !== 'tamamlandi' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); updateTask(task.id, { durum: 'tamamlandi' }) }}
                >
                  Tamamla
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!detail} onClose={() => setDetail(null)} title="Görev Detayı">
        {detail && (
          <div className="space-y-4 text-sm">
            <div><span className="text-slate-500 block">Başlık</span><p className="font-medium">{detail.baslik}</p></div>
            <div><span className="text-slate-500 block">Açıklama</span><p>{detail.aciklama || '—'}</p></div>
            <div className="flex gap-2"><StatusBadge status={detail.durum} /><PriorityBadge priority={detail.oncelik} /></div>
            {detail.olusturan_id && (
              <div><span className="text-slate-500 block">Atayan</span><p>{getUserName(users, detail.olusturan_id)}</p></div>
            )}
            <div><span className="text-slate-500 block">Bitiş</span><p>{formatDate(detail.bitis_tarihi) || '—'}</p></div>
            {recordLink && (
              <a href={recordLink} className="text-accent text-sm hover:underline">İlişkili kayda git →</a>
            )}
            {detail.durum !== 'tamamlandi' && (
              <div className="flex gap-2 flex-wrap">
                {detail.durum === 'yapilacak' && (
                  <Button size="sm" variant="outline" onClick={() => { updateTask(detail.id, { durum: 'devam' }); setDetail({ ...detail, durum: 'devam' }) }}>Başla</Button>
                )}
                <Button size="sm" onClick={() => { updateTask(detail.id, { durum: 'tamamlandi' }); setDetail(null) }}>Tamamlandı</Button>
              </div>
            )}
            {detailComments.length > 0 && (
              <div>
                <span className="text-slate-500 block mb-2">Yorumlar</span>
                <div className="space-y-2">
                  {detailComments.map((c) => (
                    <div key={c.id} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <strong>{getUserName(users, c.user_id)}</strong>: {c.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
