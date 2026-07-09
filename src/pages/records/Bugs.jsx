import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, EmptyState } from '../../components/ui/Modal'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import { generateId, getUserName, cn } from '../../lib/utils'
import {
  isTriageBug,
  bugAgeDays,
  pendingTriageBugs,
  BUG_KAYNAK_LABELS,
  HUB_DURUM_LABELS,
  devUsers,
} from '../../lib/bugFlow'

const STEPS = [
  { key: 'acik', label: 'Açık', desc: 'Bulundu / raporlandı' },
  { key: 'devam', label: 'Devam', desc: 'Üzerinde çalışılıyor' },
  { key: 'test', label: 'Test', desc: 'Çözüldü, test ediliyor' },
  { key: 'kapali', label: 'Kapalı', desc: 'Onaylandı, müşteriye kapandı' },
]

const VIEWS = [
  { id: 'triage', label: 'Triage', icon: '📥' },
  { id: 'board', label: 'Board', icon: '📋' },
  { id: 'all', label: 'Tümü', icon: '📄' },
]

const emptyBug = () => ({
  id: '', baslik: '', aciklama: '', kaynak: 'musteri', sektor: 'genel',
  oncelik: 'normal', durum: 'acik', hub_durum: 'triage', modulist_referans: '', sorumlu_id: '',
  iliskili_firma_id: '', cozum_notu: '', musteri_bildirildi: false, bildiren_id: '', feedback_id: null,
})

export default function Bugs({ embedded = false }) {
  const { users, currentUser } = useAuth()
  const { bugs, companies, feedback, upsertBug, deleteBug } = useData()
  const [view, setView] = useState('triage')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyBug())
  const [filters, setFilters] = useState({ kaynak: '', oncelik: '', firma: '' })

  const devs = useMemo(() => devUsers(users), [users])
  const triageList = useMemo(() => pendingTriageBugs(bugs), [bugs])

  const filtered = useMemo(() => {
    return bugs.filter((b) => {
      if (filters.kaynak && b.kaynak !== filters.kaynak) return false
      if (filters.oncelik && b.oncelik !== filters.oncelik) return false
      if (filters.firma && b.iliskili_firma_id !== filters.firma) return false
      if (view === 'triage') return isTriageBug(b)
      if (view === 'board') return b.durum !== 'kapali'
      return true
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [bugs, filters, view])

  const boardGroups = useMemo(() => {
    const groups = STEPS.map((s) => ({ ...s, items: [] }))
    filtered.forEach((b) => {
      const col = groups.find((g) => g.key === b.durum) || groups[0]
      col.items.push(b)
    })
    return groups
  }, [filtered])

  const openNew = () => {
    setForm({ ...emptyBug(), sorumlu_id: devs[0]?.id || currentUser.id, bildiren_id: currentUser.id })
    setModal(true)
  }

  const openEdit = (b) => { setForm({ ...b }); setModal(true) }

  const save = () => {
    if (!form.baslik?.trim()) return
    upsertBug({
      ...form,
      id: form.id || generateId(),
      iliskili_firma_id: form.iliskili_firma_id || null,
      feedback_id: form.feedback_id || null,
    })
    setModal(false)
  }

  const advanceStatus = (bug, next) => upsertBug({ ...bug, durum: next })

  const assignToMe = (bug) => upsertBug({ ...bug, sorumlu_id: currentUser.id, hub_durum: 'sprint' })

  const openCount = bugs.filter((b) => b.durum !== 'kapali').length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors',
                view === v.id ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-600',
              )}
            >
              {v.icon} {v.label}
              {v.id === 'triage' && triageList.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{triageList.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">{openCount} açık · {bugs.filter((b) => b.durum === 'test').length} testte</span>
          <Button onClick={openNew}>+ Bug Raporla</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={filters.kaynak} onChange={(e) => setFilters({ ...filters, kaynak: e.target.value })} className="w-36 text-sm">
          <option value="">Tüm kaynaklar</option>
          {Object.entries(BUG_KAYNAK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={filters.oncelik} onChange={(e) => setFilters({ ...filters, oncelik: e.target.value })} className="w-36 text-sm">
          <option value="">Tüm öncelikler</option>
          {['dusuk', 'normal', 'yuksek', 'kritik'].map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select value={filters.firma} onChange={(e) => setFilters({ ...filters, firma: e.target.value })} className="w-44 text-sm">
          <option value="">Tüm firmalar</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
        </Select>
      </div>

      {view === 'triage' && triageList.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 text-sm text-amber-900 dark:text-amber-100">
          <strong>{triageList.length} triage bekliyor</strong> — sekreterden veya geri dönüşten gelen kayıtlar. Sorumlu atayıp sprint&apos;e alın.
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="🐛"
          title={view === 'triage' ? 'Triage boş' : 'Bug kaydı yok'}
          description={view === 'triage' ? 'Atanmayı bekleyen bug yok — güzel!' : 'Yeni bug raporlayın veya filtreleri değiştirin.'}
          action={view !== 'triage' ? <Button onClick={openNew}>Bug ekle</Button> : null}
        />
      ) : view === 'board' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {boardGroups.map((col) => (
            <div key={col.key} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 min-h-[200px]">
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">{col.label} ({col.items.length})</h3>
              <div className="space-y-2">
                {col.items.map((b) => (
                  <BugCard key={b.id} bug={b} users={users} companies={companies} feedback={feedback} compact onEdit={openEdit} onAdvance={advanceStatus} onAssign={assignToMe} currentUserId={currentUser.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BugCard key={b.id} bug={b} users={users} companies={companies} feedback={feedback} onEdit={openEdit} onAdvance={advanceStatus} onAssign={assignToMe} currentUserId={currentUser.id} />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Bug Düzenle' : 'Yeni Bug Raporu'} size="lg">
        <div className="space-y-4">
          <Input label="Başlık" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} />
          <Textarea label="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Kaynak" value={form.kaynak} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}>
              {Object.entries(BUG_KAYNAK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select label="Öncelik" value={form.oncelik} onChange={(e) => setForm({ ...form, oncelik: e.target.value })}>
              {['dusuk', 'normal', 'yuksek', 'kritik'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Durum" value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
              {STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
            <Select label="Hub" value={form.hub_durum || 'triage'} onChange={(e) => setForm({ ...form, hub_durum: e.target.value })}>
              {Object.entries(HUB_DURUM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select label="Sorumlu (Yazılım)" value={form.sorumlu_id || ''} onChange={(e) => setForm({ ...form, sorumlu_id: e.target.value })}>
              <option value="">—</option>
              {devs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Input label="Modulist Ref" value={form.modulist_referans} onChange={(e) => setForm({ ...form, modulist_referans: e.target.value })} />
            <Select label="İlişkili Firma" value={form.iliskili_firma_id || ''} onChange={(e) => setForm({ ...form, iliskili_firma_id: e.target.value })} className="col-span-2">
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

function BugCard({ bug, users, companies, feedback, compact, onEdit, onAdvance, onAssign, currentUserId }) {
  const stepIdx = STEPS.findIndex((s) => s.key === bug.durum)
  const firma = companies.find((c) => c.id === bug.iliskili_firma_id)
  const fb = bug.feedback_id ? feedback.find((f) => f.id === bug.feedback_id) : null
  const age = bugAgeDays(bug)
  const triage = isTriageBug(bug)

  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-xl border p-4', triage && 'border-amber-300 dark:border-amber-700', compact && 'p-3')}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('font-semibold', compact && 'text-sm')}>{bug.baslik}</span>
            <PriorityBadge priority={bug.oncelik} />
            <StatusBadge status={bug.durum} type="bug" />
            {triage && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">TRIAGE</span>}
            {age > 2 && bug.durum !== 'kapali' && (
              <span className="text-[10px] text-red-500">{age}g</span>
            )}
          </div>
          {!compact && <p className="text-sm text-slate-500 line-clamp-2">{bug.aciklama}</p>}
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2">
            <span>{BUG_KAYNAK_LABELS[bug.kaynak] || bug.kaynak}</span>
            <span>· Bildiren: {getUserName(users, bug.bildiren_id)}</span>
            <span>· {getUserName(users, bug.sorumlu_id) || 'Atanmadı'}</span>
            {firma && (
              <Link to={`/sekreter/firmalar/${firma.id}`} className="text-accent hover:underline">🏢 {firma.ad}</Link>
            )}
            {fb && <span className="text-purple-600">↳ geri dönüşten</span>}
          </p>
        </div>
        <div className="flex gap-1 flex-wrap shrink-0">
          {triage && (
            <Button variant="accent" size="sm" onClick={() => onAssign(bug)}>Bana ata</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(bug)}>Düzenle</Button>
          {bug.durum !== 'kapali' && stepIdx < 3 && (
            <Button variant="outline" size="sm" onClick={() => onAdvance(bug, STEPS[stepIdx + 1].key)}>
              → {STEPS[stepIdx + 1].label}
            </Button>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex gap-1 mt-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`flex-1 h-1.5 rounded-full ${i <= stepIdx ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700'}`} title={s.desc} />
          ))}
        </div>
      )}
      {bug.durum === 'kapali' && bug.cozum_notu && (
        <p className="text-xs text-emerald-600 mt-2">✓ {bug.cozum_notu}</p>
      )}
      {bug.durum === 'kapali' && !bug.musteri_bildirildi && bug.iliskili_firma_id && (
        <p className="text-xs text-amber-600 mt-2">⚠ Müşteriye henüz bildirilmedi — sekreter bilgilendirildi</p>
      )}
    </div>
  )
}
