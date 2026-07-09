import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { canSubmitExpenseRequest } from '../../lib/permissions'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal, EmptyState } from '../ui/Modal'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { FINANCE_CATEGORY_LABELS, FINANCE_STATUS } from '../../lib/constants'
import { formatCurrency, formatDate, generateId } from '../../lib/utils'

export function ExpenseRequests() {
  const { currentUser } = useAuth()
  const { finance, campaigns, upsertFinance } = useData()
  const canSubmit = canSubmitExpenseRequest(currentUser)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ tutar: 0, kategori: 'diger', aciklama: '', kampanya_id: '' })

  const mine = finance.filter((f) => f.giren_id === currentUser?.id && f.tip === 'gider')

  const submit = () => {
    if (!form.tutar || !canSubmit) return
    upsertFinance({
      id: generateId(),
      tip: 'gider',
      kategori: form.kategori,
      tutar: form.tutar,
      aciklama: form.aciklama,
      kampanya_id: form.kampanya_id || null,
      tarih: new Date().toISOString().split('T')[0],
      durum: 'bekliyor',
      giren_id: currentUser.id,
    })
    setModal(false)
    setForm({ tutar: 0, kategori: 'diger', aciklama: '', kampanya_id: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary dark:text-white">Gider Talepleri</h2>
          <p className="text-sm text-slate-500">Patron onayına gönderilir</p>
        </div>
        {canSubmit && <Button onClick={() => setModal(true)}>+ Gider Talebi</Button>}
      </div>

      {mine.length === 0 ? (
        <EmptyState icon="💸" title="Talep yok" description="Harici gider talebi oluşturun." action={canSubmit ? <Button onClick={() => setModal(true)}>Talep oluştur</Button> : null} />
      ) : (
        <SectionCard title="Taleplerim">
          <div className="space-y-2">
            {mine.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-800 text-sm">
                <div>
                  <span className="font-semibold">{formatCurrency(f.tutar)}</span>
                  <span className="text-slate-500 ml-2">{f.aciklama || FINANCE_CATEGORY_LABELS[f.kategori]}</span>
                  <div className="text-xs text-slate-400 mt-1">{formatDate(f.tarih)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  f.durum === 'onaylandi' ? 'bg-emerald-100 text-emerald-700' :
                  f.durum === 'reddedildi' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {FINANCE_STATUS[f.durum] || f.durum}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Gider Talebi">
        <div className="space-y-4">
          <Input label="Tutar (₺)" type="number" value={form.tutar} onChange={(e) => setForm({ ...form, tutar: Number(e.target.value) })} />
          <Select label="Kategori" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
            {Object.entries(FINANCE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Kampanya (opsiyonel)" value={form.kampanya_id} onChange={(e) => setForm({ ...form, kampanya_id: e.target.value })}>
            <option value="">—</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Textarea label="Açıklama" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
          <Button onClick={submit} className="w-full">Patron Onayına Gönder</Button>
        </div>
      </Modal>
    </div>
  )
}
