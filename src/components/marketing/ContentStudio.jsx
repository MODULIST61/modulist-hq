import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import { KanbanBoard } from '../ui/KanbanBoard'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { CONTENT_STATUS, CONTENT_STATUS_LABELS, CONTENT_TYPES, CONTENT_PLATFORMS } from '../../lib/constants'
import { formatDate, generateId } from '../../lib/utils'

const emptyContent = () => ({
  baslik: '', hook: '', senaryo: '', sektor: 'emlak', tip: 'reels', platform: 'instagram',
  durum: 'fikir', yayin_tarihi: '', kampanya_id: '', notlar: '',
  goruntulenme: 0, begeni: 0, kaydetme: 0, dm_sayisi: 0, yorum_sayisi: 0, lead_sayisi: 0,
})

export function ContentStudio({ canEdit }) {
  const { contents, campaigns, upsertContent, deleteContent } = useData()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyContent())

  const columns = useMemo(() => CONTENT_STATUS.map((status) => ({
    id: status,
    title: CONTENT_STATUS_LABELS[status] || status,
    items: contents
      .filter((c) => c.durum === status || (status === 'kurgu' && c.durum === 'kurgu_old'))
      .map((c) => ({
        id: c.id,
        title: c.baslik || c.hook || 'İsimsiz',
        subtitle: `${CONTENT_TYPES[c.tip] || c.tip} · ${CONTENT_PLATFORMS[c.platform] || c.platform}`,
        badge: c.yayin_tarihi ? (
          <span className="text-[10px] text-slate-400">{formatDate(c.yayin_tarihi)}</span>
        ) : null,
        raw: c,
      })),
  })), [contents])

  const open = (c = null) => {
    setForm(c ? { ...emptyContent(), ...c } : emptyContent())
    setModal(true)
  }

  const save = () => {
    if (!form.baslik?.trim() && !form.hook?.trim()) return
    upsertContent({
      ...form,
      id: form.id || generateId(),
      kampanya_id: form.kampanya_id || null,
    })
    setModal(false)
  }

  const onDrop = (itemId, _from, toCol) => {
    const item = contents.find((c) => c.id === itemId)
    if (!item || !canEdit) return
    upsertContent({ ...item, durum: toCol })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-slate-500">Reels, story ve gönderiler — sürükle bırak pipeline</p>
        {canEdit && <Button onClick={() => open()}>+ Yeni İçerik</Button>}
      </div>
      <KanbanBoard columns={columns} onCardClick={(item) => open(item.raw)} onDrop={canEdit ? onDrop : undefined} />

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'İçerik Düzenle' : 'Yeni İçerik'} size="lg">
        <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Başlık" value={form.baslik || ''} onChange={(e) => setForm({ ...form, baslik: e.target.value })} className="col-span-2" />
          <Input label="Hook (ilk 3 sn)" value={form.hook || ''} onChange={(e) => setForm({ ...form, hook: e.target.value })} className="col-span-2" />
          <Select label="Tip" value={form.tip || 'reels'} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
            {Object.entries(CONTENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Platform" value={form.platform || 'instagram'} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
            {Object.entries(CONTENT_PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Durum" value={form.durum || 'fikir'} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
            {CONTENT_STATUS.map((s) => <option key={s} value={s}>{CONTENT_STATUS_LABELS[s]}</option>)}
          </Select>
          <Select label="Kampanya" value={form.kampanya_id || ''} onChange={(e) => setForm({ ...form, kampanya_id: e.target.value })}>
            <option value="">—</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Input label="Yayın Tarihi" type="date" value={form.yayin_tarihi || ''} onChange={(e) => setForm({ ...form, yayin_tarihi: e.target.value })} />
          <Select label="Sektör" value={form.sektor || 'emlak'} onChange={(e) => setForm({ ...form, sektor: e.target.value })}>
            <option value="emlak">Emlak</option>
            <option value="yapsat">Yap-Sat</option>
            <option value="genel">Genel B2B</option>
          </Select>
          <Textarea label="Senaryo" value={form.senaryo || ''} onChange={(e) => setForm({ ...form, senaryo: e.target.value })} className="col-span-2" rows={4} />
          <p className="col-span-2 text-xs font-semibold text-slate-500 pt-2 border-t">Metrikler (elle gir)</p>
          {[
            ['goruntulenme', 'Görüntülenme'],
            ['begeni', 'Beğeni'],
            ['kaydetme', 'Kaydetme'],
            ['dm_sayisi', 'DM'],
            ['yorum_sayisi', 'Yorum'],
            ['lead_sayisi', 'Lead'],
          ].map(([key, label]) => (
            <Input key={key} label={label} type="number" value={form[key] || 0} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
          ))}
          <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="col-span-2" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save} className="flex-1">Kaydet</Button>
          {form.id && canEdit && (
            <Button variant="danger" onClick={() => { if (confirm('Sil?')) { deleteContent(form.id); setModal(false) } }}>Sil</Button>
          )}
        </div>
      </Modal>
    </div>
  )
}
