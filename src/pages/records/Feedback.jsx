import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, EmptyState } from '../../components/ui/Modal'
import { FEEDBACK_TYPES, FEEDBACK_STATUS } from '../../lib/constants'
import { formatDateTime, generateId, getUserName } from '../../lib/utils'

export default function Feedback() {
  const { users, currentUser } = useAuth()
  const { feedback, companies, upsertFeedback, deleteFeedback } = useData()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [filter, setFilter] = useState('')

  const filtered = feedback.filter((f) => !filter || f.durum === filter)

  const openNew = () => {
    setForm({ tip: 'soru', metin: '', firma_id: '', kaynak: 'telefon', durum: 'yeni', sorumlu_id: currentUser.id })
    setModal(true)
  }

  const openEdit = (f) => { setForm({ ...f }); setModal(true) }

  const save = () => {
    if (!form.metin?.trim()) return
    upsertFeedback({ ...form, id: form.id || generateId() })
    setModal(false)
  }

  const tipColors = { sikayet: 'bg-red-100 text-red-700', oneri: 'bg-blue-100 text-blue-700', olumlu: 'bg-emerald-100 text-emerald-700', soru: 'bg-amber-100 text-amber-700' }

  return (
    <div>
      <div className="flex justify-between mb-4 flex-wrap gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
          <option value="">Tüm durumlar</option>
          {Object.entries(FEEDBACK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Button onClick={openNew}>+ Geri Dönüş Ekle</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📣" title="Geri dönüş yok" description="Müşteri ve aday geri bildirimlerini buradan takip edin." action={<Button onClick={openNew}>İlk kaydı ekle</Button>} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y dark:divide-slate-800">
          {filtered.map((f) => {
            const firma = companies.find((c) => c.id === f.firma_id)
            return (
              <div key={f.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipColors[f.tip]}`}>{FEEDBACK_TYPES[f.tip]}</span>
                      <span className="text-xs text-slate-400">{FEEDBACK_STATUS[f.durum]}</span>
                      {firma && <span className="text-xs text-accent">{firma.ad}</span>}
                    </div>
                    <p className="text-sm">{f.metin}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(f.created_at)} · {getUserName(users, f.sorumlu_id)} · {f.kaynak}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>Düzenle</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm('Sil?') && deleteFeedback(f.id)}>Sil</Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Geri Dönüş Düzenle' : 'Yeni Geri Dönüş'} size="lg">
        <div className="space-y-4">
          <Select label="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
            {Object.entries(FEEDBACK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Firma" value={form.firma_id || ''} onChange={(e) => setForm({ ...form, firma_id: e.target.value })}>
            <option value="">—</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Select label="Kaynak" value={form.kaynak || 'telefon'} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}>
            {['telefon', 'demo', 'destek', 'email', 'whatsapp'].map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
          <Textarea label="Geri dönüş metni" value={form.metin || ''} onChange={(e) => setForm({ ...form, metin: e.target.value })} />
          <Select label="Durum" value={form.durum || 'yeni'} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
            {Object.entries(FEEDBACK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Sorumlu" value={form.sorumlu_id || ''} onChange={(e) => setForm({ ...form, sorumlu_id: e.target.value })}>
            {users.filter((u) => u.status === 'aktif').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Button onClick={save} className="w-full">Kaydet</Button>
        </div>
      </Modal>
    </div>
  )
}
