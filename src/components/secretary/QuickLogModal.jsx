import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { generateId } from '../../lib/utils'
import {
  INTERACTION_TYPES, INTERACTION_RESULTS, REQUEST_TYPES, emptyInteraction,
} from '../../lib/interactions'

export function QuickLogModal({ open, onClose, firmaId, companyName, defaultType, defaultYon }) {
  const { currentUser } = useAuth()
  const { companies, upsertInteraction } = useData()
  const [form, setForm] = useState(emptyInteraction(currentUser?.id))

  useEffect(() => {
    if (!open) return
    const company = firmaId ? companies.find((c) => c.id === firmaId) : null
    setForm(emptyInteraction(currentUser?.id, {
      firma_id: firmaId || '',
      kisi_adi: company?.yetkili || '',
      telefon: company?.telefon || '',
      tip: defaultType || 'telefon_giden',
      yon: defaultYon || 'giden',
    }))
  }, [open, firmaId, companies, currentUser?.id, defaultType, defaultYon])

  const save = async () => {
    if (!form.ozet?.trim() && !form.konu?.trim()) return
    await upsertInteraction({
      ...form,
      id: generateId(),
      firma_id: form.firma_id || null,
      takip_tarihi: form.takip_tarihi || null,
      toplanti_tarihi: form.toplanti_tarihi || null,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={companyName ? `Hızlı Log — ${companyName}` : 'Hızlı İletişim Logu'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
            {Object.entries(INTERACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Yön" value={form.yon} onChange={(e) => setForm({ ...form, yon: e.target.value })}>
            <option value="giden">Giden</option>
            <option value="gelen">Gelen</option>
          </Select>
          {!firmaId && (
            <Select label="Firma" value={form.firma_id || ''} onChange={(e) => {
              const c = companies.find((x) => x.id === e.target.value)
              setForm({ ...form, firma_id: e.target.value, kisi_adi: c?.yetkili || form.kisi_adi, telefon: c?.telefon || form.telefon })
            }} className="col-span-2">
              <option value="">— Bilinmeyen / yeni lead</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
            </Select>
          )}
          <Input label="Kişi" value={form.kisi_adi || ''} onChange={(e) => setForm({ ...form, kisi_adi: e.target.value })} />
          <Input label="Telefon" value={form.telefon || ''} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
          <Input label="Konu" value={form.konu || ''} onChange={(e) => setForm({ ...form, konu: e.target.value })} className="col-span-2" placeholder="Trial uzatma, fiyat sordu..." />
        </div>
        <Textarea label="Özet" value={form.ozet || ''} onChange={(e) => setForm({ ...form, ozet: e.target.value })} rows={3} placeholder="Ne konuşuldu, ne kararlaşıldı?" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Sonuç" value={form.sonuc} onChange={(e) => setForm({ ...form, sonuc: e.target.value })}>
            {Object.entries(INTERACTION_RESULTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Talep tipi" value={form.talep_tipi} onChange={(e) => setForm({ ...form, talep_tipi: e.target.value })}>
            {Object.entries(REQUEST_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Geri arama" type="datetime-local" value={form.takip_tarihi ? form.takip_tarihi.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, takip_tarihi: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          <Input label="Toplantı tarihi" type="date" value={form.toplanti_tarihi || ''} onChange={(e) => setForm({ ...form, toplanti_tarihi: e.target.value })} />
          <Input label="Toplantı saati" value={form.toplanti_saati || ''} onChange={(e) => setForm({ ...form, toplanti_saati: e.target.value })} placeholder="14:00" />
          <Input label="Lokasyon" value={form.lokasyon || ''} onChange={(e) => setForm({ ...form, lokasyon: e.target.value })} placeholder="Ofis / online" />
        </div>
        <Textarea label="Takip notu" value={form.takip_notu || ''} onChange={(e) => setForm({ ...form, takip_notu: e.target.value })} rows={2} />
        <Button onClick={save} className="w-full">Kaydet</Button>
      </div>
    </Modal>
  )
}
