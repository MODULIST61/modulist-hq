import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { downloadCsv, financeToCsv } from '../lib/csv'
import { uploadDekont } from '../lib/financeStorage'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal, EmptyState } from '../components/ui/Modal'
import { SectionCard } from '../components/dashboard/DashboardWidgets'
import { FINANCE_CATEGORY_LABELS, FINANCE_STATUS } from '../lib/constants'
import { formatCurrency, formatDate, isThisMonth, generateId, getUserName, cn } from '../lib/utils'
import { BarChart } from '../components/dashboard/DashboardWidgets'

const emptyEntry = () => ({
  id: '',
  tip: 'gelir',
  kategori: 'abonelik',
  tutar: 0,
  firma_adi: '',
  firma_id: '',
  kampanya_id: '',
  tarih: new Date().toISOString().split('T')[0],
  aciklama: '',
  dekont_dosya_adi: '',
  dekont_url: '',
  fatura_no: '',
  odeme_yontemi: 'havale',
  durum: 'onaylandi',
})

export default function Finance({ mode = 'patron', embedded = false }) {
  const { users } = useAuth()
  const { finance, companies, campaigns, settings, upsertFinance, approveFinance, rejectFinance, deleteFinance } = useData()
  const isPatronMode = mode === 'patron'
  const isAccountingMode = mode === 'accounting'
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyEntry())
  const [tab, setTab] = useState('all')
  const [approvalModal, setApprovalModal] = useState(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [uploading, setUploading] = useState(false)

  const pending = finance.filter((f) => f.durum === 'bekliyor')
  const thisMonth = useMemo(() => finance.filter((f) => isThisMonth(f.tarih)), [finance])
  const gelir = thisMonth.filter((f) => f.tip === 'gelir' && f.durum === 'onaylandi').reduce((s, f) => s + f.tutar, 0)
  const gider = thisMonth.filter((f) => f.tip === 'gider' && f.durum === 'onaylandi').reduce((s, f) => s + f.tutar, 0)
  const bekleyenHavale = companies.filter((c) => c.dekont_durumu === 'bekliyor').reduce((s, c) => s + (c.aylik_tutar || 0), 0)
  const musteriCount = companies.filter((c) => c.pipeline === 'musteri').length
  const mrr = companies.filter((c) => c.pipeline === 'musteri').reduce((s, c) => s + (c.aylik_tutar || 0), 0)

  const giderByPerson = useMemo(() => {
    const map = {}
    thisMonth.filter((f) => f.tip === 'gider' && f.durum === 'onaylandi').forEach((f) => {
      const name = getUserName(users, f.giren_id) || 'Patron'
      map[name] = (map[name] || 0) + f.tutar
    })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  }, [thisMonth, users])

  const list = tab === 'pending' ? pending : tab === 'gider' ? finance.filter((f) => f.tip === 'gider') : finance

  const save = async () => {
    if (!form.tutar || !form.tarih) return
    const firma = companies.find((c) => c.id === form.firma_id)
    upsertFinance({
      ...form,
      id: form.id || generateId(),
      firma_id: form.firma_id || null,
      firma_adi: firma?.ad || form.firma_adi || '',
      kampanya_id: form.kampanya_id || null,
    })
    setModal(false)
  }

  const handleDekontUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadDekont(file, 'finance')
      setForm((prev) => ({
        ...prev,
        dekont_url: url,
        dekont_dosya_adi: file.name,
      }))
    } finally {
      setUploading(false)
    }
  }

  const statusColor = { bekliyor: 'bg-amber-100 text-amber-700', onaylandi: 'bg-emerald-100 text-emerald-700', reddedildi: 'bg-red-100 text-red-600' }

  const openApproval = (item, action) => {
    setApprovalModal({ item, action })
    setApprovalNote('')
  }

  const submitApproval = async () => {
    if (!approvalModal) return
    const { item, action } = approvalModal
    if (action === 'approve') await approveFinance(item.id, approvalNote)
    else await rejectFinance(item.id, approvalNote)
    setApprovalModal(null)
    setApprovalNote('')
  }

  const monthByCategory = useMemo(() => {
    const map = {}
    thisMonth.filter((f) => f.durum === 'onaylandi').forEach((f) => {
      const key = FINANCE_CATEGORY_LABELS[f.kategori] || f.kategori
      map[key] = (map[key] || 0) + (f.tip === 'gelir' ? f.tutar : -f.tutar)
    })
    return Object.entries(map).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  }, [thisMonth])

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-white">{isAccountingMode ? 'Muhasebe Kayıtları' : 'Finans'}</h1>
            <p className="text-sm text-slate-500">{isPatronMode ? 'Gelir, gider, onay akışı' : 'Gelir-gider defteri'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setForm({ ...emptyEntry(), durum: isAccountingMode ? 'onaylandi' : 'onaylandi' }); setModal(true) }}>+ Hareket</Button>
            <Button variant="outline" onClick={() => downloadCsv(`finans-${new Date().toISOString().split('T')[0]}.csv`, financeToCsv(finance, users, campaigns))}>CSV İndir</Button>
          </div>
        </div>
      )}
      {embedded && (
        <div className="flex justify-end gap-2">
          <Button onClick={() => { setForm({ ...emptyEntry(), durum: isAccountingMode ? 'onaylandi' : 'onaylandi' }); setModal(true) }}>+ Hareket</Button>
          <Button variant="outline" onClick={() => downloadCsv(`finans-${new Date().toISOString().split('T')[0]}.csv`, financeToCsv(finance, users, campaigns))}>CSV</Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Bu Ay Gelir', value: formatCurrency(gelir), cls: 'text-emerald-600' },
          { label: 'Bu Ay Gider', value: formatCurrency(gider), cls: 'text-red-500' },
          { label: 'Net', value: formatCurrency(gelir - gider), cls: gelir - gider >= 0 ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Onay Bekleyen', value: pending.length, cls: pending.length ? 'text-amber-600' : '' },
          { label: 'Bekleyen Havale', value: formatCurrency(bekleyenHavale), cls: 'text-amber-600' },
          { label: 'MRR', value: formatCurrency(mrr || settings.estimatedMrr), cls: 'text-accent' },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className={`text-lg font-bold ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {isAccountingMode && pending.length > 0 && (
        <SectionCard title={`Patron Onayı Bekleyen (${pending.length})`} subtitle="Bu kayıtlar patron panelinde onaylanır">
          <p className="text-sm text-slate-500">Onay için Patron → Finans sekmesine gidin.</p>
        </SectionCard>
      )}

      {isPatronMode && pending.length > 0 && (
        <SectionCard title={`Onay Bekleyen Giderler (${pending.length})`} subtitle="Pazarlama ve operasyon talepleri">
          <div className="space-y-2">
            {pending.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-sm">
                  <span className="font-bold text-lg">{formatCurrency(f.tutar)}</span>
                  <span className="text-slate-500 ml-2">{f.aciklama || FINANCE_CATEGORY_LABELS[f.kategori]}</span>
                  <div className="text-xs text-slate-400 mt-1">
                    {getUserName(users, f.giren_id)} · {formatDate(f.tarih)}
                    {f.kampanya_id && ` · Kampanya: ${campaigns.find((c) => c.id === f.kampanya_id)?.ad}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isPatronMode && (
                    <>
                      <Button size="sm" onClick={() => openApproval(f, 'approve')}>Onayla</Button>
                      <Button size="sm" variant="danger" onClick={() => openApproval(f, 'reject')}>Reddet</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {giderByPerson.length > 0 && (
        <SectionCard title="Kim Ne Harcadı (Bu Ay)" subtitle="Onaylı giderler — giren kişi">
          <BarChart data={giderByPerson} format={(v) => formatCurrency(v)} />
        </SectionCard>
      )}

      {monthByCategory.length > 0 && (
        <SectionCard title="Aylık Kategori Özeti" subtitle="Onaylı hareketler — net etki">
          <div className="space-y-2 text-sm">
            {monthByCategory.map(([cat, amount]) => (
              <div key={cat} className="flex justify-between py-2 border-b dark:border-slate-800 last:border-0">
                <span className="text-slate-500">{cat}</span>
                <span className={cn('font-semibold', amount >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {formatCurrency(Math.abs(amount))} {amount >= 0 ? 'gelir' : 'gider'}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="flex gap-2 border-b">
        {[['all', 'Tümü'], ['pending', 'Onay Bekleyen'], ['gider', 'Giderler']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-accent text-accent' : 'border-transparent text-slate-500'}`}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon="💰" title="Kayıt yok" action={<Button onClick={() => setModal(true)}>Hareket ekle</Button>} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Tip</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Giren</th>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {list.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">{formatDate(f.tarih)}</td>
                  <td className="px-4 py-3"><span className={f.tip === 'gelir' ? 'text-emerald-600' : 'text-red-500'}>{f.tip}</span></td>
                  <td className="px-4 py-3">{FINANCE_CATEGORY_LABELS[f.kategori] || f.kategori}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(f.tutar)}</td>
                  <td className="px-4 py-3 text-slate-500">{getUserName(users, f.giren_id)}</td>
                  <td className="px-4 py-3 text-slate-500">{f.firma_adi || companies.find((c) => c.id === f.firma_id)?.ad || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[f.durum]}`}>{FINANCE_STATUS[f.durum] || f.durum}</span>
                    {f.onay_notu && <p className="text-xs text-slate-400 mt-1 max-w-[200px] truncate" title={f.onay_notu}>{f.onay_notu}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => { setForm(f); setModal(true) }}>Düzenle</Button>
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm('Sil?') && deleteFinance(f.id)}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Düzenle' : 'Yeni Hareket'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Tip" value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })}>
            <option value="gelir">Gelir</option>
            <option value="gider">Gider</option>
          </Select>
          <Select label="Kategori" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
            {Object.entries(FINANCE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Tutar" type="number" value={form.tutar} onChange={(e) => setForm({ ...form, tutar: Number(e.target.value) })} />
          <Input label="Tarih" type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} />
          <Select label="Kampanya" value={form.kampanya_id || ''} onChange={(e) => setForm({ ...form, kampanya_id: e.target.value })}>
            <option value="">—</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Select label="Firma" value={form.firma_id || ''} onChange={(e) => setForm({ ...form, firma_id: e.target.value })}>
            <option value="">—</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
          <Input label="Fatura No" value={form.fatura_no || ''} onChange={(e) => setForm({ ...form, fatura_no: e.target.value })} />
          <Select label="Ödeme yöntemi" value={form.odeme_yontemi || 'havale'} onChange={(e) => setForm({ ...form, odeme_yontemi: e.target.value })}>
            <option value="havale">Havale / EFT</option>
            <option value="kart">Kredi kartı</option>
            <option value="nakit">Nakit</option>
            <option value="diger">Diğer</option>
          </Select>
          <Select label="Durum" value={form.durum} onChange={(e) => setForm({ ...form, durum: e.target.value })}>
            {Object.entries(FINANCE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Textarea label="Açıklama" value={form.aciklama || ''} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} className="col-span-2" />
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Dekont / Fatura</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-2 text-sm border rounded-lg hover:border-accent">
                {uploading ? 'Yükleniyor...' : 'Dosya seç'}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDekontUpload(e.target.files?.[0])} />
              </label>
              {form.dekont_url && (
                <a href={form.dekont_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                  {form.dekont_dosya_adi || 'Dekont görüntüle'}
                </a>
              )}
            </div>
          </div>
        </div>
        <Button onClick={save} className="w-full mt-4">Kaydet</Button>
      </Modal>

      <Modal
        open={!!approvalModal}
        onClose={() => setApprovalModal(null)}
        title={approvalModal?.action === 'approve' ? 'Gideri Onayla' : 'Gideri Reddet'}
      >
        {approvalModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>{formatCurrency(approvalModal.item.tutar)}</strong> — {approvalModal.item.aciklama || FINANCE_CATEGORY_LABELS[approvalModal.item.kategori]}
            </p>
            <Textarea
              label="Patron notu (isteğe bağlı)"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder={approvalModal.action === 'approve' ? 'Onay notu...' : 'Red gerekçesi...'}
            />
            <Button
              className="w-full"
              variant={approvalModal.action === 'reject' ? 'danger' : 'default'}
              onClick={submitApproval}
            >
              {approvalModal.action === 'approve' ? 'Onayla' : 'Reddet'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
