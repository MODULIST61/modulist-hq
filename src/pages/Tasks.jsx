import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal, Drawer, EmptyState } from '../components/ui/Modal'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../lib/constants'
import { formatDate, getUserName, isOverdue, cn } from '../lib/utils'

export default function Tasks() {
  const { currentUser, users } = useAuth()
  const { tasks, rooms, companies, bugs, campaigns, addTask, updateTask, deleteTask } = useData()
  const [filter, setFilter] = useState({ assignee: 'mine', durum: '', oncelik: '', room: '' })
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({})

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter.assignee === 'mine' && t.sorumlu_id !== currentUser.id) return false
      if (filter.durum && t.durum !== filter.durum) return false
      if (filter.oncelik && t.oncelik !== filter.oncelik) return false
      if (filter.room && t.room_id !== filter.room) return false
      return true
    })
  }, [tasks, filter, currentUser.id])

  const openNew = () => {
    setForm({ baslik: '', aciklama: '', sorumlu_id: currentUser.id, durum: 'yapilacak', oncelik: 'normal', bitis_tarihi: '', room_id: '', kayit_tipi: '', kayit_id: '' })
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

  const getRecordLink = (task) => {
    if (!task.kayit_tipi || !task.kayit_id) return null
    if (task.kayit_tipi === 'firma') return `/kayitlar/firmalar/${task.kayit_id}`
    if (task.kayit_tipi === 'bug') return `/kayitlar/buglar?detay=${task.kayit_id}`
    return '/kayitlar/kampanyalar'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-white">İşler</h1>
          <p className="text-sm text-slate-500">{filtered.length} görev</p>
        </div>
        <Button onClick={openNew}>+ Yeni Görev</Button>
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
          </div>
        )}
      </Drawer>
    </div>
  )
}
