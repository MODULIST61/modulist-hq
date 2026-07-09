import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { canEditMarketing } from '../lib/permissions'
import { buildMarketingStats } from '../lib/analytics'
import { StatCard, BarChart, SectionCard } from '../components/dashboard/DashboardWidgets'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatCurrency, generateId } from '../lib/utils'
import { FINANCE_CATEGORY_LABELS } from '../lib/constants'

export default function Marketing() {
  const { currentUser } = useAuth()
  const { campaigns, companies, upsertCampaign, upsertFinance } = useData()
  const canEdit = canEditMarketing(currentUser)
  const readOnly = !canEdit

  const stats = useMemo(() => buildMarketingStats(campaigns, companies), [campaigns, companies])
  const [campModal, setCampModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [form, setForm] = useState({})
  const [expense, setExpense] = useState({ tutar: 0, aciklama: '', kampanya_id: '', kategori: 'reklam' })

  const channelData = Object.entries(stats.byChannel).map(([label, v]) => ({ label, value: v.harcanan }))

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
      id: generateId(),
      tip: 'gider',
      kategori: expense.kategori,
      tutar: expense.tutar,
      aciklama: expense.aciklama || `Reklam gideri: ${camp?.ad || ''}`,
      kampanya_id: expense.kampanya_id || null,
      kampanya_adi: camp?.ad,
      tarih: new Date().toISOString().split('T')[0],
      durum: 'bekliyor',
      giren_id: currentUser.id,
    })
    setExpenseModal(false)
    setExpense({ tutar: 0, aciklama: '', kampanya_id: '', kategori: 'reklam' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">Reklam & Büyüme</h1>
          <p className="text-sm text-slate-500">
            {readOnly ? 'Salt okuma — performans özeti' : 'Kampanya verileri elle girilir (Meta/Google panelinden kopyala)'}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExpenseModal(true)}>Gider Talebi</Button>
            <Button onClick={() => openCampaign()}>+ Kampanya</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Toplam Harcama" value={formatCurrency(stats.harcanan)} sub={`Plan: ${formatCurrency(stats.plan)}`} variant={stats.budgetPct >= 80 ? 'warning' : 'accent'} />
        <StatCard label="Bütçe Kullanımı" value={`%${stats.budgetPct}`} variant={stats.budgetPct >= 90 ? 'danger' : 'default'} />
        <StatCard label="Tıklama" value={stats.tiklama.toLocaleString('tr-TR')} />
        <StatCard label="Lead / Kayıt" value={stats.kayit} />
        <StatCard label="CPA" value={formatCurrency(stats.cpa)} sub="Harcama / kayıt" variant="success" />
        <StatCard label="Aktif Kampanya" value={stats.activeCount} trend={stats.spendDelta} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Kanal Kırılımı" subtitle="Harcama dağılımı">
          {channelData.length ? <BarChart data={channelData} format={(v) => formatCurrency(v)} /> : <p className="text-sm text-slate-400">Kampanya ekleyin</p>}
        </SectionCard>
        <SectionCard title="Performans Özeti">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b dark:border-slate-800">
              <span className="text-slate-500">Bu ay harcama</span>
              <span className="font-semibold">{formatCurrency(stats.thisMonthSpend)}</span>
            </div>
            <div className="flex justify-between py-2 border-b dark:border-slate-800">
              <span className="text-slate-500">Geçen ay</span>
              <span>{formatCurrency(stats.lastMonthSpend)}</span>
            </div>
            <div className="flex justify-between py-2 border-b dark:border-slate-800">
              <span className="text-slate-500">Müşteriye dönüşen</span>
              <span className="text-emerald-600 font-semibold">{stats.musteri} firma</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">CPM (tıklama başı)</span>
              <span>{stats.tiklama ? formatCurrency(Math.round(stats.harcanan / stats.tiklama)) : '—'}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Kampanyalar"
        action={canEdit && <Link to="/kayitlar/kampanyalar"><Button variant="ghost" size="sm">Tümü →</Button></Link>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
              <tr>
                <th className="pb-2">Kampanya</th>
                <th className="pb-2">Kanal</th>
                <th className="pb-2">Harcanan / Plan</th>
                <th className="pb-2">Tıklama</th>
                <th className="pb-2">Gösterim</th>
                <th className="pb-2">Erişim</th>
                <th className="pb-2">Kayıt</th>
                <th className="pb-2">CPA</th>
                {canEdit && <th className="pb-2" />}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {campaigns.map((c) => {
                const cpa = c.kayit_sayisi > 0 ? Math.round((c.butce_harcanan || 0) / c.kayit_sayisi) : 0
                const pct = c.butce_plan > 0 ? Math.round(((c.butce_harcanan || 0) / c.butce_plan) * 100) : 0
                return (
                  <tr key={c.id}>
                    <td className="py-3 font-medium">{c.ad}</td>
                    <td className="py-3"><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{c.kanal}</span></td>
                    <td className="py-3">{formatCurrency(c.butce_harcanan)} / {formatCurrency(c.butce_plan)} <span className={`text-xs ml-1 ${pct >= 80 ? 'text-amber-600' : 'text-slate-400'}`}>(%{pct})</span></td>
                    <td className="py-3">{c.tiklama || 0}</td>
                    <td className="py-3">{(c.gosterim || 0).toLocaleString('tr-TR')}</td>
                    <td className="py-3">{(c.erisim || 0).toLocaleString('tr-TR')}</td>
                    <td className="py-3">{c.kayit_sayisi || 0}</td>
                    <td className="py-3">{cpa ? formatCurrency(cpa) : '—'}</td>
                    {canEdit && <td className="py-3"><Button variant="ghost" size="sm" onClick={() => openCampaign(c)}>Düzenle</Button></td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!campaigns.length && <p className="text-sm text-slate-400 py-6 text-center">Henüz kampanya yok</p>}
        </div>
      </SectionCard>

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
          <Input label="Kayıt / Lead" type="number" value={form.kayit_sayisi || 0} onChange={(e) => setForm({ ...form, kayit_sayisi: Number(e.target.value) })} />
          <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="col-span-2" />
        </div>
        <Button onClick={saveCampaign} className="w-full mt-4">Kaydet</Button>
      </Modal>

      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Gider Talebi (Patron Onayı)">
        <p className="text-sm text-slate-500 mb-4">Talep patron onayına gönderilir.</p>
        <div className="space-y-4">
          <Select label="Kampanya" value={expense.kampanya_id} onChange={(e) => setExpense({ ...expense, kampanya_id: e.target.value })}>
            <option value="">—</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Select label="Kategori" value={expense.kategori} onChange={(e) => setExpense({ ...expense, kategori: e.target.value })}>
            {Object.entries(FINANCE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Tutar (TRY)" type="number" value={expense.tutar} onChange={(e) => setExpense({ ...expense, tutar: Number(e.target.value) })} />
          <Textarea label="Açıklama" value={expense.aciklama} onChange={(e) => setExpense({ ...expense, aciklama: e.target.value })} />
          <Button onClick={submitExpense} className="w-full">Onaya Gönder</Button>
        </div>
      </Modal>
    </div>
  )
}
