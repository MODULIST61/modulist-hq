import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { canEditMarketing } from '../lib/permissions'
import { buildMarketingStats } from '../lib/analytics'
import { BarChart, SectionCard } from '../components/dashboard/DashboardWidgets'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ContentStudio } from '../components/marketing/ContentStudio'
import { IdeaLab } from '../components/marketing/IdeaLab'
import { ImpactAnalysis } from '../components/marketing/ImpactAnalysis'
import { PromptStudio } from '../components/marketing/PromptStudio'
import { InspirationGallery } from '../components/marketing/InspirationGallery'
import { MarketingToday } from '../components/marketing/MarketingToday'
import { MarketingExpenses, MarketingExpenseModal } from '../components/marketing/MarketingExpenses'
import Tasks from './Tasks'
import { formatCurrency, generateId, cn } from '../lib/utils'

const TABS = [
  { id: 'ozet', label: 'Özet', icon: '📊' },
  { id: 'ilham', label: 'İlham', icon: '💡' },
  { id: 'prompt', label: 'Prompt Stüdyosu', icon: '✨' },
  { id: 'studio', label: 'İçerik Stüdyosu', icon: '🎬' },
  { id: 'fikir', label: 'Fikir Lab', icon: '🧪' },
  { id: 'etki', label: 'Etki Analizi', icon: '📈' },
  { id: 'kampanya', label: 'Kampanyalar', icon: '💰' },
  { id: 'gider', label: 'Giderler', icon: '💸' },
  { id: 'isler', label: 'İşler', icon: '✅' },
]

export default function Marketing() {
  const { currentUser } = useAuth()
  const { campaigns, companies, contents, upsertCampaign } = useData()
  const canEdit = canEditMarketing(currentUser)
  const readOnly = !canEdit
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'ozet'
  const setTab = (id) => setSearchParams({ tab: id }, { replace: true })

  const stats = useMemo(() => buildMarketingStats(campaigns, companies), [campaigns, companies])
  const channelData = Object.entries(stats.byChannel).map(([label, v]) => ({ label, value: v.harcanan }))

  const [campModal, setCampModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkRows, setBulkRows] = useState([])
  const [form, setForm] = useState({})

  const openCampaign = (c = null) => {
    setForm(c || {
      ad: '', kanal: 'Meta', donem_baslangic: '', donem_bitis: '',
      butce_plan: 0, butce_harcanan: 0, gosterim: 0, erisim: 0, tiklama: 0, kayit_sayisi: 0, notlar: '',
    })
    setCampModal(true)
  }

  const saveCampaign = () => {
    if (!form.ad?.trim()) return
    upsertCampaign({ ...form, id: form.id || generateId() })
    setCampModal(false)
  }

  const openBulk = () => {
    setBulkRows(campaigns.map((c) => ({
      id: c.id, ad: c.ad, butce_harcanan: c.butce_harcanan || 0, tiklama: c.tiklama || 0,
      gosterim: c.gosterim || 0, erisim: c.erisim || 0, kayit_sayisi: c.kayit_sayisi || 0,
    })))
    setBulkModal(true)
  }

  const saveBulk = async () => {
    for (const row of bulkRows) {
      const original = campaigns.find((c) => c.id === row.id)
      if (!original) continue
      await upsertCampaign({
        ...original,
        butce_harcanan: Number(row.butce_harcanan) || 0,
        tiklama: Number(row.tiklama) || 0,
        gosterim: Number(row.gosterim) || 0,
        erisim: Number(row.erisim) || 0,
        kayit_sayisi: Number(row.kayit_sayisi) || 0,
      })
    }
    setBulkModal(false)
  }

  const linkedContents = (campId) => contents.filter((c) => c.kampanya_id === campId)

  return (
    <div className="space-y-6 relative">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">Reklam & Büyüme</h1>
          <p className="text-sm text-slate-500">
            Creative Studio · İlham · AI Prompt · Kampanya · Gider
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => setExpenseModal(true)}>💸 Gider</Button>
              {tab === 'kampanya' && (
                <>
                  {campaigns.length > 0 && <Button variant="outline" onClick={openBulk}>Toplu Giriş</Button>}
                  <Button onClick={() => openCampaign()}>+ Kampanya</Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5',
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'ozet' && (
        <>
          <MarketingToday canEdit={canEdit} onExpense={() => setExpenseModal(true)} onTab={setTab} />
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Kanal Kırılımı">
              {channelData.length ? <BarChart data={channelData} format={(v) => formatCurrency(v)} /> : <p className="text-sm text-slate-400">Kampanya ekleyin</p>}
            </SectionCard>
            <SectionCard title="Hızlı Erişim">
              <div className="grid grid-cols-2 gap-2">
                {['ilham', 'prompt', 'studio', 'gider', 'kampanya', 'etki'].map((id) => {
                  const t = TABS.find((x) => x.id === id)
                  return t ? <Button key={id} variant="outline" size="sm" onClick={() => setTab(id)}>{t.icon} {t.label}</Button> : null
                })}
              </div>
            </SectionCard>
          </div>
        </>
      )}

      {tab === 'ilham' && <InspirationGallery canEdit={canEdit} />}
      {tab === 'prompt' && <PromptStudio canEdit={canEdit} />}
      {tab === 'studio' && <ContentStudio canEdit={canEdit} />}
      {tab === 'fikir' && <IdeaLab canEdit={canEdit} />}
      {tab === 'etki' && <ImpactAnalysis />}
      {tab === 'gider' && <MarketingExpenses />}
      {tab === 'isler' && <Tasks hub="reklam" title="Reklam İşleri" subtitle="Büyüme ve kampanya görevleri" />}

      {tab === 'kampanya' && (
        <SectionCard title="Kampanyalar" subtitle={readOnly ? 'Salt okuma' : 'Meta/Google — içerik ve gider bağlantılı'}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
                <tr>
                  <th className="pb-2">Kampanya</th>
                  <th className="pb-2">Kanal</th>
                  <th className="pb-2">Harcanan / Plan</th>
                  <th className="pb-2">Tıklama</th>
                  <th className="pb-2">Lead</th>
                  <th className="pb-2">İçerik</th>
                  {canEdit && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {campaigns.map((c) => {
                  const linked = linkedContents(c.id)
                  const pct = c.butce_plan ? Math.round((c.butce_harcanan / c.butce_plan) * 100) : 0
                  return (
                    <tr key={c.id}>
                      <td className="py-3 font-medium">{c.ad}</td>
                      <td className="py-3"><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{c.kanal}</span></td>
                      <td className="py-3">
                        {formatCurrency(c.butce_harcanan)} / {formatCurrency(c.butce_plan)}
                        {pct >= 90 && <span className="text-[10px] text-red-500 ml-1">%{pct}</span>}
                      </td>
                      <td className="py-3">{c.tiklama || 0}</td>
                      <td className="py-3">{c.kayit_sayisi || 0}</td>
                      <td className="py-3">
                        <span className="text-xs text-slate-500">{linked.length} içerik</span>
                        {linked.filter((x) => x.durum === 'yayinda').length > 0 && (
                          <span className="text-[10px] text-emerald-600 ml-1">{linked.filter((x) => x.durum === 'yayinda').length} yayında</span>
                        )}
                      </td>
                      {canEdit && <td className="py-3"><Button variant="ghost" size="sm" onClick={() => openCampaign(c)}>Düzenle</Button></td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!campaigns.length && <p className="text-sm text-slate-400 py-6 text-center">Henüz kampanya yok</p>}
          </div>
        </SectionCard>
      )}

      <Modal open={campModal} onClose={() => setCampModal(false)} title={form.id ? 'Kampanya Düzenle' : 'Yeni Kampanya'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Kampanya Adı" value={form.ad || ''} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="col-span-2" />
          <Select label="Kanal" value={form.kanal || 'Meta'} onChange={(e) => setForm({ ...form, kanal: e.target.value })}>
            {['Meta', 'Google', 'Reels', 'LinkedIn', 'Diğer'].map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
          <Input label="Dönem Başlangıç" type="date" value={form.donem_baslangic || ''} onChange={(e) => setForm({ ...form, donem_baslangic: e.target.value })} />
          <Input label="Dönem Bitiş" type="date" value={form.donem_bitis || ''} onChange={(e) => setForm({ ...form, donem_bitis: e.target.value })} />
          <Input label="Bütçe Plan" type="number" value={form.butce_plan || 0} onChange={(e) => setForm({ ...form, butce_plan: Number(e.target.value) })} />
          <Input label="Harcanan" type="number" value={form.butce_harcanan || 0} onChange={(e) => setForm({ ...form, butce_harcanan: Number(e.target.value) })} />
          <Input label="Tıklama" type="number" value={form.tiklama || 0} onChange={(e) => setForm({ ...form, tiklama: Number(e.target.value) })} />
          <Input label="Gösterim" type="number" value={form.gosterim || 0} onChange={(e) => setForm({ ...form, gosterim: Number(e.target.value) })} />
          <Input label="Erişim" type="number" value={form.erisim || 0} onChange={(e) => setForm({ ...form, erisim: Number(e.target.value) })} />
          <Input label="Lead" type="number" value={form.kayit_sayisi || 0} onChange={(e) => setForm({ ...form, kayit_sayisi: Number(e.target.value) })} />
          <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="col-span-2" />
        </div>
        <Button onClick={saveCampaign} className="w-full mt-4">Kaydet</Button>
      </Modal>

      <MarketingExpenseModal open={expenseModal} onClose={() => setExpenseModal(false)} />

      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Haftalık Toplu Giriş" size="xl">
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 text-xs text-slate-500">
              <tr>
                <th className="pb-2">Kampanya</th>
                {['butce_harcanan', 'tiklama', 'gosterim', 'erisim', 'kayit_sayisi'].map((f) => (
                  <th key={f} className="pb-2 px-1">{f.replace('butce_harcanan', 'Harcanan').replace('kayit_sayisi', 'Lead')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bulkRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-medium">{row.ad}</td>
                  {['butce_harcanan', 'tiklama', 'gosterim', 'erisim', 'kayit_sayisi'].map((field) => (
                    <td key={field} className="py-2 px-1">
                      <input type="number" className="w-20 rounded border px-2 py-1 text-sm dark:bg-slate-900" value={row[field]} onChange={(e) => setBulkRows(bulkRows.map((r) => r.id === row.id ? { ...r, [field]: e.target.value } : r))} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={saveBulk} className="w-full mt-4">Kaydet</Button>
      </Modal>
    </div>
  )
}
