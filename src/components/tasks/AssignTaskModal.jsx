import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { TASK_PRIORITY_LABELS } from '../../lib/constants'

const emptyForm = () => ({
  baslik: '',
  aciklama: '',
  sorumlu_id: '',
  oncelik: 'normal',
  bitis_tarihi: '',
  room_id: '',
})

export function AssignTaskModal({ open, onClose, onCreated }) {
  const { currentUser, users } = useAuth()
  const { rooms, addTask } = useData()
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const team = users.filter((u) => u.status === 'aktif' && u.id !== currentUser?.id)

  const submit = async () => {
    if (!form.baslik?.trim() || !form.sorumlu_id) return
    setSaving(true)
    try {
      await addTask({
        baslik: form.baslik.trim(),
        aciklama: form.aciklama?.trim() || '',
        sorumlu_id: form.sorumlu_id,
        olusturan_id: currentUser?.id,
        durum: 'yapilacak',
        oncelik: form.oncelik,
        bitis_tarihi: form.bitis_tarihi || null,
        room_id: form.room_id || null,
      })
      setForm(emptyForm())
      onCreated?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Görev Oluştur — Ekip üyesine ata" size="lg">
      <div className="space-y-4">
        <Input
          label="Görev başlığı"
          value={form.baslik}
          onChange={(e) => setForm({ ...form, baslik: e.target.value })}
          placeholder="Örn: ABC Ltd demo hazırlığı"
        />
        <Textarea
          label="Açıklama"
          value={form.aciklama}
          onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
          rows={3}
          placeholder="Ne yapılması gerekiyor?"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Atanan kişi *" value={form.sorumlu_id} onChange={(e) => setForm({ ...form, sorumlu_id: e.target.value })}>
            <option value="">Seçin...</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>{u.name}{u.job_title ? ` · ${u.job_title}` : ''}</option>
            ))}
          </Select>
          <Select label="Öncelik" value={form.oncelik} onChange={(e) => setForm({ ...form, oncelik: e.target.value })}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Input label="Bitiş tarihi" type="date" value={form.bitis_tarihi} onChange={(e) => setForm({ ...form, bitis_tarihi: e.target.value })} />
          <Select label="Oda (opsiyonel)" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
            <option value="">—</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </div>
        <Button onClick={submit} disabled={saving || !form.baslik?.trim() || !form.sorumlu_id} className="w-full">
          {saving ? 'Atanıyor...' : 'Görevi Ata'}
        </Button>
      </div>
    </Modal>
  )
}
