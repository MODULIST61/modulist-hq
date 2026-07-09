import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { MSG_TYPE_STYLES } from '../../lib/messaging'
import { MESSAGE_TYPE_LABELS } from '../../lib/constants'
import { cn } from '../../lib/utils'

export function BroadcastModal({ open, onClose, form, setForm, onSend, rooms }) {
  if (!open) return null

  const previewRooms = []
  if (form.toGenel) previewRooms.push('Genel (pin + @mention)')
  if (form.toAllRooms) {
    rooms.forEach((r) => {
      if (r.slug !== 'genel') previewRooms.push(`#${r.name}`)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-primary dark:text-white">Patron Duyuru</h3>
        <p className="text-sm text-slate-500">Kurumsal duyuru — odalara dağıtılır ve Genel&apos;de sabitlenir.</p>

        <Textarea label="Mesaj" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} />

        <div className="flex flex-wrap gap-2">
          {['duyuru', 'karar', 'normal'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t })}
              className={cn('text-xs px-3 py-1.5 rounded-full font-medium', form.type === t ? MSG_TYPE_STYLES[t]?.chip : 'bg-slate-100 text-slate-500')}
            >
              {MESSAGE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.toAllRooms} onChange={(e) => setForm({ ...form, toAllRooms: e.target.checked })} />
          Tüm odalara ayrı mesaj
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.toGenel} onChange={(e) => setForm({ ...form, toGenel: e.target.checked })} />
          Genel + tüm ekibe @mention (otomatik pin)
        </label>

        {form.text.trim() && (
          <div className="rounded-xl bg-[#dcf8c6] dark:bg-emerald-900/30 p-3 text-sm">
            <p className="text-[10px] font-semibold text-emerald-800 mb-1">Önizleme</p>
            <p className="whitespace-pre-wrap">{form.text}</p>
            {previewRooms.length > 0 && (
              <p className="text-[10px] text-slate-500 mt-2">→ {previewRooms.join(', ')}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">İptal</Button>
          <Button onClick={onSend} disabled={!form.text.trim()} className="flex-1">Gönder</Button>
        </div>
      </div>
    </div>
  )
}

export function LinkRecordModal({ open, onClose, companies, bugs, onSelect }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="font-bold">Kayıt Bağla</h3>
          <p className="text-xs text-slate-500">Firma veya bug mesaja eklenir</p>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Firmalar</p>
          {companies.slice(0, 20).map((c) => (
            <button key={c.id} type="button" onClick={() => onSelect({ type: 'firma', id: c.id, label: c.ad })} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              🏢 {c.ad}
            </button>
          ))}
          <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase mt-2">Bug&apos;lar</p>
          {bugs.filter((b) => b.durum !== 'kapali').slice(0, 15).map((b) => (
            <button key={b.id} type="button" onClick={() => onSelect({ type: 'bug', id: b.id, label: b.baslik })} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              🐛 {b.baslik}
            </button>
          ))}
        </div>
        <div className="p-3 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">Kapat</Button>
        </div>
      </div>
    </div>
  )
}
