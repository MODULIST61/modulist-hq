import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import { KanbanBoard } from '../ui/KanbanBoard'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { CONTENT_STATUS, CONTENT_STATUS_LABELS, CONTENT_TYPES, CONTENT_PLATFORMS } from '../../lib/constants'
import { PROMPT_TONES } from '../../lib/marketingStudio'
import { downloadMarkdownPdf } from '../../lib/pdfExport'
import { formatDate, generateId, cn } from '../../lib/utils'

const emptyContent = () => ({
  baslik: '', hook: '', senaryo: '', sektor: 'emlak', tip: 'reels', platform: 'instagram',
  durum: 'fikir', yayin_tarihi: '', kampanya_id: '', notlar: '', ton: 'egitici',
  ai_prompt: '', ai_video_prompt: '', ai_caption: '', ai_ad_copy: '', brief: '', referans_url: '',
  goruntulenme: 0, begeni: 0, kaydetme: 0, dm_sayisi: 0, yorum_sayisi: 0, lead_sayisi: 0,
})

export function ContentStudio({ canEdit }) {
  const { contents, campaigns, upsertContent, deleteContent } = useData()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyContent())
  const [tab, setTab] = useState('genel')

  const columns = useMemo(() => CONTENT_STATUS.map((status) => ({
    id: status,
    title: CONTENT_STATUS_LABELS[status] || status,
    items: contents
      .filter((c) => c.durum === status || (status === 'kurgu' && c.durum === 'kurgu_old'))
      .map((c) => ({
        id: c.id,
        title: c.baslik || c.hook || 'İsimsiz',
        subtitle: `${CONTENT_TYPES[c.tip] || c.tip} · ${CONTENT_PLATFORMS[c.platform] || c.platform}`,
        badge: (
          <span className="flex gap-1">
            {c.ai_uretim && <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-700">AI</span>}
            {c.yayin_tarihi && <span className="text-[10px] text-slate-400">{formatDate(c.yayin_tarihi)}</span>}
          </span>
        ),
        raw: c,
      })),
  })), [contents])

  const open = (c = null) => {
    setForm(c ? { ...emptyContent(), ...c } : emptyContent())
    setTab('genel')
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

  const exportBrief = () => {
    const md = `# ${form.baslik || form.hook || 'Creative Brief'}

## Hook
${form.hook || '—'}

## Senaryo
${form.senaryo || '—'}

## Görsel Prompt
${form.ai_prompt || '—'}

## Video Prompt
${form.ai_video_prompt || '—'}

## Caption
${form.ai_caption || '—'}

## Reklam Metni
${form.ai_ad_copy || '—'}

## Notlar
${form.notlar || '—'}
`
    downloadMarkdownPdf({
      title: 'Modulist Creative Brief',
      subtitle: form.baslik,
      markdown: md,
      filename: `brief-${form.id || Date.now()}.pdf`,
    })
  }

  const tabs = [
    { id: 'genel', label: 'Genel' },
    { id: 'brief', label: 'Brief & AI' },
    { id: 'metrik', label: 'Metrikler' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-slate-500">Fikir → Senaryo → Çekim → Kurgu → Yayın — AI prompt alanları dahil</p>
        {canEdit && <Button onClick={() => open()}>+ Yeni İçerik</Button>}
      </div>
      <KanbanBoard columns={columns} onCardClick={(item) => open(item.raw)} onDrop={canEdit ? onDrop : undefined} />

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'İçerik Düzenle' : 'Yeni İçerik'} size="lg">
        <div className="flex gap-1 border-b mb-4">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn('px-3 py-2 text-sm border-b-2 -mb-px', tab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-500')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {tab === 'genel' && (
            <>
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
              <Select label="Ton" value={form.ton || 'egitici'} onChange={(e) => setForm({ ...form, ton: e.target.value })}>
                {Object.entries(PROMPT_TONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <Select label="Kampanya" value={form.kampanya_id || ''} onChange={(e) => setForm({ ...form, kampanya_id: e.target.value })}>
                <option value="">—</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
              </Select>
              <Input label="Yayın Tarihi" type="date" value={form.yayin_tarihi || ''} onChange={(e) => setForm({ ...form, yayin_tarihi: e.target.value })} />
              <Input label="Referans URL" value={form.referans_url || ''} onChange={(e) => setForm({ ...form, referans_url: e.target.value })} placeholder="Pinterest, rakip link..." className="col-span-2" />
              <Textarea label="Senaryo" value={form.senaryo || ''} onChange={(e) => setForm({ ...form, senaryo: e.target.value })} className="col-span-2" rows={4} />
              <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="col-span-2" />
            </>
          )}

          {tab === 'brief' && (
            <>
              <Textarea label="Görsel prompt (Midjourney/DALL·E)" value={form.ai_prompt || ''} onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })} className="col-span-2" rows={3} />
              <Textarea label="Video prompt (Runway/Pika)" value={form.ai_video_prompt || ''} onChange={(e) => setForm({ ...form, ai_video_prompt: e.target.value })} className="col-span-2" rows={3} />
              <Textarea label="Caption + hashtag" value={form.ai_caption || ''} onChange={(e) => setForm({ ...form, ai_caption: e.target.value })} className="col-span-2" rows={3} />
              <Textarea label="Reklam metni (Meta Ads)" value={form.ai_ad_copy || ''} onChange={(e) => setForm({ ...form, ai_ad_copy: e.target.value })} className="col-span-2" rows={3} />
              <Textarea label="Tam brief (AI ham çıktı)" value={form.brief || ''} onChange={(e) => setForm({ ...form, brief: e.target.value })} className="col-span-2" rows={5} />
              <div className="col-span-2">
                <Button variant="outline" size="sm" onClick={exportBrief}>📄 Brief PDF İndir</Button>
              </div>
            </>
          )}

          {tab === 'metrik' && (
            <>
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
            </>
          )}
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
