import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, EmptyState } from '../../components/ui/Modal'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import { generateId, getUserName } from '../../lib/utils'

const STEPS = [
  { key: 'acik', label: 'Açık', desc: 'Bulundu / raporlandı' },
  { key: 'devam', label: 'Devam', desc: 'Üzerinde çalışılıyor' },
  { key: 'test', label: 'Test', desc: 'Çözüldü, test ediliyor' },
  { key: 'kapali', label: 'Kapalı', desc: 'Onaylandı, müşteriye kapandı' },
]

const emptyBug = () => ({
  id: '', baslik: '', aciklama: '', kaynak: 'musteri', sektor: 'genel',
  oncelik: 'normal', durum: 'acik', modulist_referans: '', sorumlu_id: '',
  iliskili_firma_id: '', cozum_notu: '', musteri_bildirildi: false, bildiren_id: '',
})

export default function Bugs() {
  const { users, currentUser } = useAuth()
  const { bugs, companies, upsertBug, deleteBug } = useData()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyBug())

  const openNew = () => {
    setForm({ ...emptyBug(), sorumlu_id: currentUser.id, bildiren_id: currentUser.id })
    setModal(true)
  }

  const openEdit = (b) => { setForm({ ...b }); setModal(true) }

  const save = () => {
    if (!form.baslik?.trim()) return
    upsertBug({ ...form, id: form.id || generateId(), iliskili_firma_id: form.iliskili_firma_id || null })
    setModal(false)
  }

  const advanceStatus = (bug, next) => upsertBug({ ...bug, durum: next })

  return (
    <div>
      <div className="flex justify-between mb-4 flex-wrap gap-3">
        <div className="text-sm text-slate-500">
          {bugs.filter((b) => b.durum !== 'kapali').length} açık · {bugs.filter((b) => b.durum === 'test').length} testte
        </div>
        <Button onClick={openNew}>+ Bug Raporla</Button>
      </div>

      {bugs.length === 0 ? (
        <EmptyState icon="🐛" title="Bug kaydı yok" action={<Button onClick={openNew}>İlk bug'ı ekle</Button>} />
      ) : (
        <div className="space-y-3">
          {bugs.map((b) => {
            const stepIdx = STEPS.findIndex((s) => s.key === b.durum)
            return (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-xl border p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{b.baslik}</span>
                      <PriorityBadge priority={b.oncelik} />
                      <StatusBadge status={b.durum} type="bug" />
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{b.aciklama}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Bildiren: {getUserName(users, b.bildiren_id)} · Sorumlu: {getUserName(users, b.sorumlu_id)}
                      {b.modulist_referans && ` · ${b.modulist_referans}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>Düzenle</Button>
                    {b.durum !== 'kapali' && stepIdx < 3 && (
                      <Button variant="outline" size="sm" onClick={() => advanceStatus(b, STEPS[stepIdx + 1].key)}>
                        → {STEPS[stepIdx + 1].label}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 mt-3">
                  {STEPS.map((s, i) => (
                    <div key={s.key} className={`flex-1 h-1.5 rounded-full ${i <= stepIdx ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}`} title={s.desc} />
                  ))}
                </div>
                {b.durum === 'kapali' && b.cozum_notu && (
                  <p className="text-xs text-emerald-600 mt-2">✓ {b.cozum_notu}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Bug Düzenle' : 'Yeni Bug Raporu'} size="lg">
        <div className="space-y-4">
          <Input label="Başlık" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
          <Textarea label="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Kaynak" value={form.kaynak} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}>
              {['simulasyon', 'musteri', 'denetim', 'ic_bulgu'].map((k) => <option key={k} value={k}>{k}</option>)}
            </Select>
            <Select label="Öncelik" value={form.oncelik} onChange={(e) => setForm({ ...form, oncelik: e.target.value })}>
              {['dusuk', 'normal', 'yuksek', 'kritik'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Durum" value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
              {STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
            <Select label="Sorumlu (Yazılım)" value={form.sorumlu_id} onChange={(e) => setForm({ ...form, sorumlu_id: e.target.value })}>
              <option value="">—</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Input label="Modulist Ref" value={form.modulist_referans} onChange={(e) => setForm({ ...form, modulist_referans: e.target.value })} />
            <Select label="İlişkili Firma" value={form.iliskili_firma_id || ''} onChange={(e) => setForm({ ...form, iliskili_firma_id: e.target.value })}>
              <option value="">—</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
            </Select>
          </div>
          {(form.durum === 'test' || form.durum === 'kapali') && (
            <Textarea label="Çözüm Notu" value={form.cozum_notu || ''} onChange={(e) => setForm({ ...form, cozum_notu: e.target.value })} placeholder="Ne yapıldı, nasıl çözüldü?" />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.musteri_bildirildi || false} onChange={(e) => setForm({ ...form, musteri_bildirildi: e.target.checked })} />
            Müşteriye geri bildirim yapıldı
          </label>
          <Button onClick={save} className="w-full">Kaydet</Button>
        </div>
      </Modal>
    </div>
  )
}
