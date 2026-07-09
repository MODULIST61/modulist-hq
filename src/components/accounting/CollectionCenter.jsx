import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { buildCollectionQueue } from '../../lib/accounting'
import { uploadDekont } from '../../lib/financeStorage'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { PipelineBadge } from '../ui/Badge'
import { formatCurrency, formatDate, cn } from '../../lib/utils'

const STATUS_STYLE = {
  ok: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  idle: 'bg-slate-100 text-slate-500',
}

export function CollectionCenter() {
  const navigate = useNavigate()
  const { companies, finance, recordCollectionPayment, createRevenueFromCompany, upsertCompany } = useData()
  const [uploading, setUploading] = useState(null)

  const queue = useMemo(() => buildCollectionQueue(companies, finance), [companies, finance])

  const markDekontPending = async (company) => {
    await upsertCompany({ ...company, dekont_durumu: 'bekliyor', updated_at: new Date().toISOString() })
  }

  const handleDekontUpload = async (company, file) => {
    if (!file) return
    setUploading(company.id)
    try {
      const url = await uploadDekont(file, `companies/${company.id}`)
      await upsertCompany({
        ...company,
        dekont_url: url,
        dekont_durumu: 'alindi',
        son_odeme_tarihi: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
    } finally {
      setUploading(null)
    }
  }

  const handleRecordPayment = async (company) => {
    await recordCollectionPayment(company.id)
  }

  const handleCreateRevenue = async (company) => {
    await createRevenueFromCompany(company.id)
  }

  if (!queue.length) {
    return (
      <SectionCard title="Tahsilat Merkezi" subtitle="Müşteri ödemeleri ve dekont takibi">
        <p className="text-sm text-slate-400 py-12 text-center">Tahsilat bekleyen müşteri yok</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Tahsilat Merkezi" subtitle="Müşteri ödemeleri, dekont ve gelir kaydı">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
              <th className="pb-2">Firma</th>
              <th className="pb-2">Paket / Aylık</th>
              <th className="pb-2">Dekont</th>
              <th className="pb-2">Son ödeme</th>
              <th className="pb-2">Toplam</th>
              <th className="pb-2">Durum</th>
              <th className="pb-2">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {queue.map(({ company, lastPayment, totalPaid, status, statusLabel }) => (
              <tr key={company.id}>
                <td className="py-3">
                  <button type="button" className="font-medium text-accent hover:underline" onClick={() => navigate(`/sekreter/firmalar/${company.id}`)}>
                    {company.ad}
                  </button>
                  <div className="mt-1"><PipelineBadge stage={company.pipeline} /></div>
                </td>
                <td className="py-3">{company.paket || '—'} · {formatCurrency(company.aylik_tutar)}</td>
                <td className="py-3">
                  <span className="text-xs">{company.dekont_durumu || 'yok'}</span>
                  {company.dekont_url && (
                    <a href={company.dekont_url} target="_blank" rel="noreferrer" className="block text-xs text-accent hover:underline">Görüntüle</a>
                  )}
                </td>
                <td className="py-3 text-xs">{lastPayment ? formatDate(lastPayment.tarih) : '—'}</td>
                <td className="py-3">{formatCurrency(totalPaid)}</td>
                <td className="py-3">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_STYLE[status])}>{statusLabel}</span>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {company.dekont_durumu !== 'bekliyor' && company.pipeline === 'musteri' && (
                      <Button size="sm" variant="ghost" onClick={() => markDekontPending(company)}>Dekont bekle</Button>
                    )}
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg border hover:border-accent">
                        {uploading === company.id ? '...' : 'Dekont yükle'}
                      </span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDekontUpload(company, e.target.files?.[0])} />
                    </label>
                    <Button size="sm" variant="outline" onClick={() => handleRecordPayment(company)}>Tahsil et</Button>
                    <Button size="sm" onClick={() => handleCreateRevenue(company)}>Gelir kaydı</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
