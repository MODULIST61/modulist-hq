import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { canSubmitExpenseRequest } from '../../lib/permissions'
import { EXPENSE_MARKETING_CATEGORIES } from '../../lib/marketingStudio'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal, EmptyState } from '../ui/Modal'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { FINANCE_STATUS } from '../../lib/constants'
import { formatCurrency, formatDate, generateId } from '../../lib/utils'

export function MarketingExpenses() {
  const { currentUser } = useAuth()
  const { finance, campaigns, upsertFinance } = useData()
  const canSubmit = canSubmitExpenseRequest(currentUser)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tutar: 0, kategori: 'reklam', aciklama: '', kampanya_id: '' })

  const mine = finance.filter((f) => f.giren_id === currentUser?.id && f.tip === 'gider')
  const pending = mine.filter((f) => f.durum === 'bekliyor')
  const approved = mine.filter((f) => f.durum === 'onaylandi')

  const submit = () => {
    if (!form.tutar || !canSubmit) return
    const camp = campaigns.find((c) => c.id === form.kampanya_id)
    const catLabel = EXPENSE_MARKETING_CATEGORIES.find((c) => c.id === form.kategori)?.label || form.kategori
    upsertFinance({
      id: generateId(),
      tip: 'gider',
      kategori: form.kategori === 'freelancer' || form.kategori === 'stok' || form.kategori === 'yazilim' ? 'diger' : form.kategori,
      tutar: form.tutar,
      aciklama: form.aciklama || `${catLabel}${camp ? `: ${camp.ad}` : ''}`,
      kampanya_id: form.kampanya_id || null,
      tarih: new Date().toISOString().split('T')[0],
      durum: 'bekliyor',
      giren_id: currentUser.id,
    })
    setModal(false)
    setForm({ tutar: 0, kategori: 'reklam', aciklama: '', kampanya_id: '' })
  }

  const ExpenseModal = (
    <Modal open={modal} onClose={() => setModal(false)} title="Reklam Gider Talebi">
      <div className="space-y-4">
        <Select label="Gider tipi" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
          {EXPENSE_MARKETING_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Select label="Kampanya (opsiyonel)" value={form.kampanya_id} onChange={(e) => setForm({ ...form, kampanya_id: e.target.value })}>
          <option value="">— Genel</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad} ({c.kanal})</option>)}
        </Select>
        <Input label="Tutar (₺)" type="number" value={form.tutar || ''} onChange={(e) => setForm({ ...form, tutar: Number(e.target.value) })} />
        <Textarea label="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Meta Ads Şubat bütçesi, videocu ücreti..." />
        <p className="text-xs text-slate-500">Patron onayından sonra kampanyaya bağlıysa harcama otomatik güncellenir.</p>
        <Button onClick={submit} className="w-full">Patron Onayına Gönder</Button>
      </div>
    </Modal>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary dark:text-white">Gider Merkezi</h2>
          <p className="text-sm text-slate-500">Reklam bütçesi, freelancer, asset — patron onayı</p>
        </div>
        {canSubmit && <Button onClick={() => setModal(true)}>+ Gider Talebi</Button>}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200/60">
          <p className="text-xs text-amber-700 font-medium">Bekleyen</p>
          <p className="text-2xl font-bold text-amber-900">{pending.length}</p>
        </div>
        <div className="p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60">
          <p className="text-xs text-emerald-700 font-medium">Onaylanan</p>
          <p className="text-2xl font-bold text-emerald-900">{approved.length}</p>
        </div>
        <div className="p-4 rounded-xl border">
          <p className="text-xs text-slate-500 font-medium">Toplam talep</p>
          <p className="text-2xl font-bold">{mine.length}</p>
        </div>
      </div>

      {mine.length === 0 ? (
        <EmptyState icon="💸" title="Gider talebi yok" description="Reklam harcamalarını buradan patron onayına gönderin." action={canSubmit ? <Button onClick={() => setModal(true)}>İlk talebi oluştur</Button> : null} />
      ) : (
        <SectionCard title="Taleplerim">
          <div className="space-y-2">
            {mine.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).map((f) => {
              const camp = campaigns.find((c) => c.id === f.kampanya_id)
              return (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-800 text-sm gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold">{formatCurrency(f.tutar)}</span>
                    <span className="text-slate-500 ml-2 truncate">{f.aciklama}</span>
                    {camp && <span className="text-xs text-accent ml-2">→ {camp.ad}</span>}
                    <div className="text-xs text-slate-400 mt-1">{formatDate(f.tarih)}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    f.durum === 'onaylandi' ? 'bg-emerald-100 text-emerald-700' :
                    f.durum === 'reddedildi' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {FINANCE_STATUS[f.durum] || f.durum}
                  </span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {ExpenseModal}
    </div>
  )
}

export function MarketingExpenseModal({ open, onClose }) {
  const { currentUser } = useAuth()
  const { campaigns, upsertFinance } = useData()
  const canSubmit = canSubmitExpenseRequest(currentUser)
  const [form, setForm] = useState({ tutar: 0, kategori: 'reklam', aciklama: '', kampanya_id: '' })

  const submit = () => {
    if (!form.tutar || !canSubmit) return
    const camp = campaigns.find((c) => c.id === form.kampanya_id)
    upsertFinance({
      id: generateId(),
      tip: 'gider',
      kategori: ['freelancer', 'stok', 'yazilim'].includes(form.kategori) ? 'diger' : form.kategori,
      tutar: form.tutar,
      aciklama: form.aciklama || `Reklam gideri${camp ? `: ${camp.ad}` : ''}`,
      kampanya_id: form.kampanya_id || null,
      tarih: new Date().toISOString().split('T')[0],
      durum: 'bekliyor',
      giren_id: currentUser.id,
    })
    onClose()
    setForm({ tutar: 0, kategori: 'reklam', aciklama: '', kampanya_id: '' })
  }

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Hızlı Gider Talebi">
      <div className="space-y-4">
        <Select label="Gider tipi" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
          {EXPENSE_MARKETING_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Select label="Kampanya" value={form.kampanya_id} onChange={(e) => setForm({ ...form, kampanya_id: e.target.value })}>
          <option value="">—</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
        </Select>
        <Input label="Tutar (₺)" type="number" value={form.tutar || ''} onChange={(e) => setForm({ ...form, tutar: Number(e.target.value) })} />
        <Textarea label="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
        <Button onClick={submit} className="w-full">Gönder</Button>
      </div>
    </Modal>
  )
}
