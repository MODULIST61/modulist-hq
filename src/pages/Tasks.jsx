import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal, Drawer, EmptyState } from '../components/ui/Modal'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { KanbanBoard } from '../components/ui/KanbanBoard'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../lib/constants'
import { formatDate, getUserName, isOverdue, cn } from '../lib/utils'
import { filterTasksByHub, taskRecordLink } from '../lib/hubTasks'

const KANBAN_COLS = ['yapilacak', 'devam', 'tamamlandi']

export default function Tasks({ hub, title = 'İşler', subtitle }) {
  const { currentUser, users } = useAuth()
  const { tasks, rooms, companies, bugs, campaigns, addTask, updateTask, deleteTask, taskComments, addTaskComment } = useData()
  const [view, setView] = useState('kanban')
  const [filter, setFilter] = useState({ assignee: 'mine', durum: '', oncelik: '', room: '' })
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({})
  const [commentText, setCommentText] = useState('')

  const hubTasks = useMemo(() => filterTasksByHub(tasks, rooms, hub), [tasks, rooms, hub])

  const kanbanColumns = useMemo(() => {
    const pool = filter.assignee === 'mine'
      ? hubTasks.filter((t) => t.sorumlu_id === currentUser.id)
      : hubTasks
    return KANBAN_COLS.map((status) => ({
      id: status,
      title: TASK_STATUS_LABELS[status],
      headerClass: status === 'tamamlandi' ? 'text-emerald-600' : status === 'devam' ? 'text-blue-600' : '',
      items: pool.filter((t) => t.durum === status && (!filter.oncelik || t.oncelik === filter.oncelik)).map((t) => ({
        id: t.id,
        title: t.baslik,
        subtitle: `${getUserName(users, t.sorumlu_id)} · ${formatDate(t.bitis_tarihi)}`,
        badge: <PriorityBadge priority={t.oncelik} />,
        raw: t,
      })),
    }))
  }, [hubTasks, filter, currentUser.id, users])

  const handleKanbanDrop = (itemId, _from, toCol) => {
    updateTask(itemId, { durum: toCol })
  }

  const detailComments = detail ? taskComments.filter((c) => c.task_id === detail.id) : []

  const filtered = useMemo(() => {
    return hubTasks.filter((t) => {
      if (filter.assignee === 'mine' && t.sorumlu_id !== currentUser.id) return false
      if (filter.durum && t.durum !== filter.durum) return false
      if (filter.oncelik && t.oncelik !== filter.oncelik) return false
      if (filter.room && t.room_id !== filter.room) return false
      return true
    })
  }, [hubTasks, filter, currentUser.id])

  const defaultRoomForHub = hub === 'yazilim' ? rooms.find((r) => r.slug === 'urun')?.id
    : hub === 'reklam' ? rooms.find((r) => r.slug === 'buyume')?.id
    : hub === 'sekreter' ? rooms.find((r) => r.slug === 'operasyon')?.id
    : ''

  const openNew = () => {
    setForm({ baslik: '', aciklama: '', sorumlu_id: currentUser.id, durum: 'yapilacak', oncelik: 'normal', bitis_tarihi: '', room_id: defaultRoomForHub || '', kayit_tipi: '', kayit_id: '' })
    setModal('new')
  }

  const openEdit = (task) => {
    setForm({ ...task })
    setModal('edit')
  }

  const save = () => {
    if (!form.baslik?.trim()) return
    const data = {
      ...form,
      kayit_tipi: form.kayit_tipi || null,
      kayit_id: form.kayit_id || null,
      room_id: form.room_id || null,
    }
    if (modal === 'new') addTask(data)
    else updateTask(form.id, data)
    setModal(null)
  }

  const getRecordLink = (task) => taskRecordLink(task)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle || `${filtered.length} görev`}</p>
        </div>
        <Button onClick={openNew}>+ Yeni Görev</Button>
        <div className="flex rounded-lg border overflow-hidden">
          <button onClick={() => setView('kanban')} className={cn('px-3 py-1.5 text-xs font-medium', view === 'kanban' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900')}>Kanban</button>
          <button onClick={() => setView('list')} className={cn('px-3 py-1.5 text-xs font-medium', view === 'list' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900')}>Liste</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={filter.assignee} onChange={(e) => setFilter({ ...filter, assignee: e.target.value })} className="w-auto">
          <option value="mine">Bana atanan</option>
          <option value="all">Tümü</option>
        </Select>
        <Select value={filter.durum} onChange={(e) => setFilter({ ...filter, durum: e.target.value })} className="w-auto">
          <option value="">Tüm durumlar</option>
          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={filter.oncelik} onChange={(e) => setFilter({ ...filter, oncelik: e.target.value })} className="w-auto">
          <option value="">Tüm öncelikler</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={filter.room} onChange={(e) => setFilter({ ...filter, room: e.target.value })} className="w-auto">
          <option value="">Tüm odalar</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="✅" title="Görev yok" description="Yeni görev oluşturun veya filtreleri değiştirin." action={<Button onClick={openNew}>İlk görevi ekle</Button>} />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          onCardClick={(item) => setDetail(item.raw)}
          onDrop={handleKanbanDrop}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y dark:divide-slate-800">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={cn('px-4 py-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer', isOverdue(task.bitis_tarihi) && task.durum !== 'tamamlandi' && 'border-l-4 border-l-danger')}
              onClick={() => setDetail(task)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{task.baslik}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {getUserName(users, task.sorumlu_id)} · {formatDate(task.bitis_tarihi)}
                </div>
              </div>
              <PriorityBadge priority={task.oncelik} />
              <StatusBadge status={task.durum} />
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {task.durum !== 'tamamlandi' && (
                  <Button variant="ghost" size="sm" onClick={() => updateTask(task.id, { durum: 'tamamlandi' })}>✓</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>Düzenle</Button>
                <Button variant="ghost" size="sm" onClick={() => confirm('Silinsin mi?') && deleteTask(task.id)} className="text-danger">Sil</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? 'Yeni Görev' : 'Görev Düzenle'} size="lg">
        <div className="space-y-4">
          <Input label="Başlık" value={form.baslik || ''} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
          <Textarea label="Açıklama" value={form.aciklama || ''} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Sorumlu" value={form.sorumlu_id || ''} onChange={(e) => setForm({ ...form, sorumlu_id: e.target.value })}>
              {users.filter((u) => u.status === 'aktif').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Select label="Durum" value={form.durum || 'yapilacak'} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
              {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select label="Öncelik" value={form.oncelik || 'normal'} onChange={(e) => setForm({ ...form, oncelik: e.target.value })}>
              {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Input label="Bitiş" type="date" value={form.bitis_tarihi || ''} onChange={(e) => setForm({ ...form, bitis_tarihi: e.target.value })} />
            <Select label="Oda" value={form.room_id || ''} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
              <option value="">—</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Select label="Kayıt tipi" value={form.kayit_tipi || ''} onChange={(e) => setForm({ ...form, kayit_tipi: e.target.value, kayit_id: '' })}>
              <option value="">—</option>
              <option value="firma">Firma</option>
              <option value="bug">Bug</option>
              <option value="kampanya">Kampanya</option>
            </Select>
          </div>
          <Button onClick={save} className="w-full">Kaydet</Button>
        </div>
      </Modal>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title="Görev Detayı">
        {detail && (
          <div className="space-y-4 text-sm">
            <div><span className="text-slate-500">Başlık</span><p className="font-medium">{detail.baslik}</p></div>
            <div><span className="text-slate-500">Açıklama</span><p>{detail.aciklama || '—'}</p></div>
            <div className="flex gap-2"><StatusBadge status={detail.durum} /><PriorityBadge priority={detail.oncelik} /></div>
            <div><span className="text-slate-500">Sorumlu</span><p>{getUserName(users, detail.sorumlu_id)}</p></div>
            <div><span className="text-slate-500">Bitiş</span><p>{formatDate(detail.bitis_tarihi)}</p></div>
            {getRecordLink(detail) && <Link to={getRecordLink(detail)} className="text-accent hover:underline">İlişkili kayda git →</Link>}
            <div className="border-t pt-4">
              <p className="text-slate-500 text-xs mb-2">Yorumlar</p>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {detailComments.map((c) => (
                  <div key={c.id} className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs">
                    <span className="font-medium">{getUserName(users, c.user_id)}: </span>{c.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Yorum yaz..." className="flex-1" />
                <Button size="sm" onClick={async () => {
                  if (!commentText.trim()) return
                  await addTaskComment(detail.id, commentText.trim())
                  setCommentText('')
                }}>Ekle</Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
