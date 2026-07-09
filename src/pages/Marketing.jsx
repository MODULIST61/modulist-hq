import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { canEditMarketing } from '../lib/permissions'
import { buildMarketingStats } from '../lib/analytics'
import { resolveModel } from '../lib/aiModels'
import { StatCard, BarChart, SectionCard } from '../components/dashboard/DashboardWidgets'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ContentStudio } from '../components/marketing/ContentStudio'
import { IdeaLab } from '../components/marketing/IdeaLab'
import { ImpactAnalysis } from '../components/marketing/ImpactAnalysis'
import { formatCurrency, generateId, cn } from '../lib/utils'
import { FINANCE_CATEGORY_LABELS } from '../lib/constants'

const TABS = [
  { id: 'ozet', label: 'Özet', icon: '📊' },
  { id: 'studio', label: 'İçerik Stüdyosu', icon: '🎬' },
  { id: 'fikir', label: 'Fikir Lab', icon: '💡' },
  { id: 'etki', label: 'Etki Analizi', icon: '📈' },
  { id: 'kampanya', label: 'Kampanyalar', icon: '💰' },
]

export default function Marketing() {
  const { currentUser } = useAuth()
  const { campaigns, companies, contents, upsertCampaign, upsertFinance, settings } = useData()
  const canEdit = canEditMarketing(currentUser)
  const readOnly = !canEdit
  const [tab, setTab] = useState('ozet')

  const stats = useMemo(() => buildMarketingStats(campaigns, companies), [campaigns, companies])
  const channelData = Object.entries(stats.byChannel).map(([label, v]) => ({ label, value: v.harcanan }))

  const [campModal, setCampModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkRows, setBulkRows] = useState([])
  const [form, setForm] = useState({})
  const [expense, setExpense] = useState({ tutar: 0, aciklama: '', kampanya_id: '', kategori: 'reklam' })

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

  const submitExpense = () => {
    if (!expense.tutar) return
    const camp = campaigns.find((c) => c.id === expense.kampanya_id)
    upsertFinance({
      id: generateId(), tip: 'gider', kategori: expense.kategori, tutar: expense.tutar,
      aciklama: expense.aciklama || `Reklam gideri: ${camp?.ad || ''}`,
      kampanya_id: expense.kampanya_id || null, tarih: new Date().toISOString().split('T')[0],
      durum: 'bekliyor', giren_id: currentUser.id,
    })
    setExpenseModal(false)
    setExpense({ tutar: 0, aciklama: '', kampanya_id: '', kategori: 'reklam' })
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">Reklam & Büyüme</h1>
          <p className="text-sm text-slate-500">
            Kampanya · İçerik Stüdyosu · AI Fikir Lab · Etki analizi
          </p>
        </div>
        {canEdit && tab === 'kampanya' && (
          <div className="flex gap-2 flex-wrap">
            {campaigns.length > 0 && <Button variant="outline" onClick={openBulk}>Toplu Giriş</Button>}
            <Button variant="outline" onClick={() => setExpenseModal(true)}>Gider Talebi</Button>
            <Button onClick={() => openCampaign()}>+ Kampanya</Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5',
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <span>{t.icon}</span>{t.label}
            {t.id === 'studio' && contents.length > 0 && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full">{contents.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'ozet' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Harcama" value={formatCurrency(stats.harcanan)} sub={`Plan: ${formatCurrency(stats.plan)}`} variant={stats.budgetPct >= 80 ? 'warning' : 'accent'} />
            <StatCard label="Bütçe %" value={`%${stats.budgetPct}`} variant={stats.budgetPct >= 90 ? 'danger' : 'default'} />
            <StatCard label="Tıklama" value={stats.tiklama.toLocaleString('tr-TR')} />
            <StatCard label="Lead" value={stats.kayit} />
            <StatCard label="CPA" value={formatCurrency(stats.cpa)} variant="success" />
            <StatCard label="İçerik" value={contents.length} sub={`${contents.filter((c) => c.durum === 'yayinda').length} yayında`} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Kanal Kırılımı">
              {channelData.length ? <BarChart data={channelData} format={(v) => formatCurrency(v)} /> : <p className="text-sm text-slate-400">Kampanya ekleyin</p>}
            </SectionCard>
            <SectionCard title="Hızlı Erişim">
              <div className="grid grid-cols-2 gap-2">
                {TABS.filter((t) => t.id !== 'ozet').map((t) => (
                  <Button key={t.id} variant="outline" size="sm" onClick={() => setTab(t.id)}>{t.icon} {t.label}</Button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">AI model: {resolveModel(settings, 'marketing')}</p>
            </SectionCard>
          </div>
        </>
      )}

      {tab === 'studio' && <ContentStudio canEdit={canEdit} />}
      {tab === 'fikir' && <IdeaLab canEdit={canEdit} />}
      {tab === 'etki' && <ImpactAnalysis />}

      {tab === 'kampanya' && (
        <SectionCard title="Kampanyalar" subtitle={readOnly ? 'Salt okuma' : 'Meta/Google — elle giriş'}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
                <tr>
                  <th className="pb-2">Kampanya</th>
                  <th className="pb-2">Kanal</th>
                  <th className="pb-2">Harcanan / Plan</th>
                  <th className="pb-2">Tıklama</th>
                  <th className="pb-2">Gösterim</th>
                  <th className="pb-2">Lead</th>
                  {canEdit && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-medium">{c.ad}</td>
                    <td className="py-3"><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{c.kanal}</span></td>
                    <td className="py-3">{formatCurrency(c.butce_harcanan)} / {formatCurrency(c.butce_plan)}</td>
                    <td className="py-3">{c.tiklama || 0}</td>
                    <td className="py-3">{(c.gosterim || 0).toLocaleString('tr-TR')}</td>
                    <td className="py-3">{c.kayit_sayisi || 0}</td>
                    {canEdit && <td className="py-3"><Button variant="ghost" size="sm" onClick={() => openCampaign(c)}>Düzenle</Button></td>}
                  </tr>
                ))}
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

      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Gider Talebi">
        <div className="space-y-4">
          <Select label="Kampanya" value={expense.kampanya_id} onChange={(e) => setExpense({ ...expense, kampanya_id: e.target.value })}>
            <option value="">—</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Input label="Tutar" type="number" value={expense.tutar} onChange={(e) => setExpense({ ...expense, tutar: Number(e.target.value) })} />
          <Textarea label="Açıklama" value={expense.aciklama} onChange={(e) => setExpense({ ...expense, aciklama: e.target.value })} />
          <Button onClick={submitExpense} className="w-full">Onaya Gönder</Button>
        </div>
      </Modal>

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
