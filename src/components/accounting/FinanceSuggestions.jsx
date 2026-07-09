import { useMemo } from 'react'
import { useData } from '../../context/DataContext'
import { buildFinanceSuggestions } from '../../lib/accounting'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'

export function FinanceSuggestions() {
  const { finance, campaigns, companies, upsertFinance, createRevenueFromCompany, recordCollectionPayment } = useData()

  const suggestions = useMemo(
    () => buildFinanceSuggestions(finance, campaigns, companies),
    [finance, campaigns, companies],
  )

  const apply = async (s) => {
    if (s.action === 'create_expense') {
      await upsertFinance({
        tip: 'gider',
        kategori: s.payload.kategori,
        tutar: s.payload.tutar,
        kampanya_id: s.payload.kampanya_id,
        tarih: new Date().toISOString().split('T')[0],
        aciklama: s.title,
        durum: 'onaylandi',
      })
    } else if (s.action === 'create_revenue') {
      await createRevenueFromCompany(s.payload.firma_id)
    } else if (s.action === 'mark_collection') {
      await recordCollectionPayment(s.payload.firma_id)
    }
  }

  if (!suggestions.length) {
    return (
      <SectionCard title="Finans Önerileri" subtitle="Hub entegrasyonu — eksik kayıt uyarıları">
        <p className="text-sm text-slate-400 py-12 text-center">Tüm kayıtlar uyumlu görünüyor ✓</p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Finans Önerileri" subtitle="Kampanya, tahsilat ve gelir uyarıları">
      <div className="space-y-3">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-4 p-4 rounded-lg border dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span>{s.icon}</span>
                <span className="font-medium text-sm">{s.title}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{s.detail}</p>
            </div>
            <Button size="sm" onClick={() => apply(s)}>Uygula</Button>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
