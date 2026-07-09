import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, EmptyState } from '../../components/ui/Modal'
import { PipelineBadge } from '../../components/ui/Badge'
import { KanbanBoard } from '../../components/ui/KanbanBoard'
import { PIPELINE_STAGES, PIPELINE_LABELS } from '../../lib/constants'
import { formatDate, generateId, cn } from '../../lib/utils'

const emptyCompany = () => ({
  id: '',
  ad: '',
  sektor: 'emlak',
  yetkili: '',
  telefon: '',
  email: '',
  kaynak: 'soguk',
  sorumlu_id: '',
  pipeline: 'lead',
  demo_tarihi: '',
  demo_saati: '',
  trial_baslangic: '',
  trial_bitis: '',
  paket: 'baslangic',
  aylik_tutar: 0,
  dekont_durumu: 'yok',
  modulist_tenant_acildi: false,
  modulist_email: '',
  kayip_nedeni: '',
  notlar: '',
})

export default function Companies() {
  const { users, currentUser } = useAuth()
  const { companies, upsertCompany, deleteCompany } = useData()
  const navigate = useNavigate()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyCompany())
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState('')
  const [view, setView] = useState('kanban')

  const filtered = companies.filter((c) => !search || c.ad.toLowerCase().includes(search.toLowerCase()))

  const pipelineColumns = useMemo(() => {
    return PIPELINE_STAGES.filter((p) => p !== 'kayip').map((stage) => ({
      id: stage,
      title: PIPELINE_LABELS[stage],
      items: filtered.filter((c) => c.pipeline === stage).map((c) => ({
        id: c.id,
        title: c.ad,
        subtitle: c.yetkili || c.sektor,
        badge: <PipelineBadge stage={stage} />,
        raw: c,
      })),
    }))
  }, [filtered])

  const handlePipelineDrop = (itemId, _from, toStage) => {
    const company = companies.find((c) => c.id === itemId)
    if (company) upsertCompany({ ...company, pipeline: toStage })
  }

  const validate = () => {
    const e = {}
    if (!form.ad?.trim()) e.ad = 'Firma adı zorunlu.'
    if (form.pipeline === 'kayip' && !form.kayip_nedeni?.trim()) e.kayip_nedeni = 'Kayıp nedeni zorunlu.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openNew = () => {
    setForm({ ...emptyCompany(), sorumlu_id: currentUser.id })
    setErrors({})
    setModal(true)
  }

  const openEdit = (c) => {
    setForm({ ...c })
    setErrors({})
    setModal(true)
  }

  const save = () => {
    if (!validate()) return
    upsertCompany({ ...form, id: form.id || generateId() })
    setModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Input placeholder="Firma ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setView('kanban')} className={cn('px-3 py-1.5 text-xs font-medium', view === 'kanban' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900')}>Pipeline</button>
            <button onClick={() => setView('list')} className={cn('px-3 py-1.5 text-xs font-medium', view === 'list' ? 'bg-accent text-white' : 'bg-white dark:bg-slate-900')}>Liste</button>
          </div>
          <Button onClick={openNew}>+ Firma Ekle</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🏢" title="Henüz firma yok" description="Satış pipeline'ınızı takip etmek için ilk firmayı ekleyin." action={<Button onClick={openNew}>İlk firmayı ekle</Button>} />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={pipelineColumns}
          onCardClick={(item) => navigate(`/kayitlar/firmalar/${item.raw.id}`)}
          onDrop={handlePipelineDrop}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
              <tr>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3 hidden md:table-cell">Yetkili</th>
                <th className="px-4 py-3 hidden lg:table-cell">Demo</th>
                <th className="px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link to={`/kayitlar/firmalar/${c.id}`} className="font-medium text-accent hover:underline">{c.ad}</Link>
                    <div className="text-xs text-slate-400">{c.sektor}</div>
                  </td>
                  <td className="px-4 py-3"><PipelineBadge stage={c.pipeline} /></td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500">{c.yetkili || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{formatDate(c.demo_tarihi)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Düzenle</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm('Silinsin mi?') && deleteCompany(c.id)}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Firma Düzenle' : 'Yeni Firma'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Firma Adı" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} error={errors.ad} />
          <Select label="Sektör" value={form.sektor} onChange={(e) => setForm({ ...form, sektor: e.target.value })}>
            <option value="emlak">Emlak</option>
            <option value="yapsat">Yap-Sat</option>
            <option value="ikisi">İkisi</option>
          </Select>
          <Input label="Yetkili" value={form.yetkili} onChange={(e) => setForm({ ...form, yetkili: e.target.value })} />
          <Input label="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
          <Input label="E-posta" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Kaynak" value={form.kaynak} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}>
            {['soguk', 'reels', 'referans', 'fuar', 'waitlist', 'google', 'diger'].map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
          <Select label="Pipeline" value={form.pipeline} onChange={(e) => setForm({ ...form, pipeline: e.target.value })}>
            {PIPELINE_STAGES.map((p) => <option key={p} value={p}>{PIPELINE_LABELS[p]}</option>)}
          </Select>
          <Select label="Sorumlu" value={form.sorumlu_id} onChange={(e) => setForm({ ...form, sorumlu_id: e.target.value })}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Input label="Demo Tarihi" type="date" value={form.demo_tarihi || ''} onChange={(e) => setForm({ ...form, demo_tarihi: e.target.value })} />
          <Input label="Demo Saati" value={form.demo_saati || ''} onChange={(e) => setForm({ ...form, demo_saati: e.target.value })} />
          <Input label="Trial Başlangıç" type="date" value={form.trial_baslangic || ''} onChange={(e) => setForm({ ...form, trial_baslangic: e.target.value })} />
          <Input label="Trial Bitiş" type="date" value={form.trial_bitis || ''} onChange={(e) => setForm({ ...form, trial_bitis: e.target.value })} />
          <Select label="Paket" value={form.paket} onChange={(e) => setForm({ ...form, paket: e.target.value })}>
            <option value="baslangic">Başlangıç</option>
            <option value="profesyonel">Profesyonel</option>
            <option value="kurumsal">Kurumsal</option>
          </Select>
          <Input label="Aylık Tutar" type="number" value={form.aylik_tutar} onChange={(e) => setForm({ ...form, aylik_tutar: Number(e.target.value) })} />
          <Select label="Dekont" value={form.dekont_durumu} onChange={(e) => setForm({ ...form, dekont_durumu: e.target.value })}>
            {['yok', 'bekliyor', 'geldi', 'onaylandi'].map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          {form.pipeline === 'kayip' && (
            <Input label="Kayıp Nedeni" value={form.kayip_nedeni} onChange={(e) => setForm({ ...form, kayip_nedeni: e.target.value })} error={errors.kayip_nedeni} className="md:col-span-2" />
          )}
          <Textarea label="Notlar" value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="md:col-span-2" />
        </div>
        <Button onClick={save} className="w-full mt-4">Kaydet</Button>
      </Modal>
    </div>
  )
}
