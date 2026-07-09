import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { generateId } from '../../lib/utils'

export function QuickBugModal({ open, onClose, companyId, companyName, onSave }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ baslik: '', aciklama: '', oncelik: 'normal', kaynak: 'musteri' })

  const reset = () => setForm({ baslik: '', aciklama: '', oncelik: 'normal', kaynak: 'musteri' })

  const save = async () => {
    if (!form.baslik.trim()) return
    await onSave({
      id: generateId(),
      baslik: form.baslik.trim(),
      aciklama: form.aciklama.trim(),
      kaynak: form.kaynak,
      oncelik: form.oncelik,
      durum: 'acik',
      hub_durum: 'triage',
      sektor: 'genel',
      iliskili_firma_id: companyId,
      bildiren_id: currentUser.id,
      sorumlu_id: '',
    })
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Bug Raporla — ${companyName}`} size="lg">
      <div className="space-y-4">
        <Input label="Kısa başlık" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} placeholder="Örn: PDF export hatası" />
        <Textarea label="Ne oldu?" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} rows={4} placeholder="Müşterinin tarif ettiği sorun..." />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Kaynak" value={form.kaynak} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}>
            <option value="musteri">Müşteri</option>
            <option value="demo">Demo</option>
            <option value="denetim">Denetim</option>
            <option value="simulasyon">Simülasyon</option>
          </Select>
          <Select label="Öncelik" value={form.oncelik} onChange={(e) => setForm({ ...form, oncelik: e.target.value })}>
            <option value="dusuk">Düşük</option>
            <option value="normal">Normal</option>
            <option value="yuksek">Yüksek</option>
            <option value="kritik">Kritik</option>
          </Select>
        </div>
        <p className="text-xs text-slate-500">Yazılım ekibine otomatik görev ve #ürün mesajı gider.</p>
        <Button onClick={save} className="w-full">Bug Raporla</Button>
      </div>
    </Modal>
  )
}

export function QuickFeedbackModal({ open, onClose, companyId, companyName, onSave }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ tip: 'sikayet', metin: '', kaynak: 'telefon' })

  const reset = () => setForm({ tip: 'sikayet', metin: '', kaynak: 'telefon' })

  const save = async () => {
    if (!form.metin.trim()) return
    await onSave({
      id: generateId(),
      tip: form.tip,
      metin: form.metin.trim(),
      firma_id: companyId,
      kaynak: form.kaynak,
      durum: 'yeni',
      sorumlu_id: currentUser.id,
    })
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Geri Dönüş — ${companyName}`} size="lg">
      <div className="space-y-4">
        <Select label="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
          <option value="sikayet">Şikayet</option>
          <option value="soru">Soru</option>
          <option value="oneri">Öneri</option>
          <option value="olumlu">Olumlu</option>
        </Select>
        <Select label="Kaynak" value={form.kaynak} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}>
          <option value="telefon">Telefon</option>
          <option value="demo">Demo</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">E-posta</option>
          <option value="destek">Destek</option>
        </Select>
        <Textarea label="Geri dönüş" value={form.metin} onChange={(e) => setForm({ ...form, metin: e.target.value })} rows={4} />
        <p className="text-xs text-slate-500">Şikayet/soru tipinde yazılım ekibine bildirim gider. İsterseniz Yazılım&apos;dan bug&apos;a çevrilebilir.</p>
        <Button onClick={save} className="w-full">Kaydet</Button>
      </div>
    </Modal>
  )
}
