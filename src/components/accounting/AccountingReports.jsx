import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import {
  buildAccountingKpis,
  buildAdRoi,
  buildCategoryBreakdown,
  buildMonthlyTrend,
  buildMonthlyReportText,
  buildMrrTrend,
  financeToAccountantCsv,
} from '../../lib/accounting'
import { downloadCsv, financeToCsv } from '../../lib/csv'
import { downloadTextPdf } from '../../lib/pdfExport'
import { SectionCard, BarChart } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/utils'

export function AccountingReports() {
  const { users } = useAuth()
  const { finance, companies, campaigns, settings } = useData()

  const kpis = useMemo(() => buildAccountingKpis(finance, companies, settings), [finance, companies, settings])
  const trend = useMemo(() => buildMonthlyTrend(finance, 6), [finance])
  const categories = useMemo(() => buildCategoryBreakdown(finance, true), [finance])
  const mrrTrend = useMemo(() => buildMrrTrend(companies, 6), [companies])
  const roi = useMemo(() => buildAdRoi(campaigns, finance, companies), [campaigns, finance, companies])

  const trendChart = trend.map((t) => ({ label: t.label, value: Math.max(0, t.net) }))
  const categoryChart = categories.filter((c) => c.gider > 0).map((c) => ({ label: c.label, value: c.gider }))

  const monthLabel = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  const downloadPdf = () => {
    const text = buildMonthlyReportText(kpis, trend, categories, roi, monthLabel)
    downloadTextPdf({
      title: 'Aylık Muhasebe Özeti',
      subtitle: monthLabel,
      body: text,
      filename: `modulist-muhasebe-${new Date().toISOString().split('T')[0]}.pdf`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap justify-end">
        <Button variant="outline" onClick={() => downloadCsv(`finans-${new Date().toISOString().split('T')[0]}.csv`, financeToCsv(finance, users, campaigns))}>CSV</Button>
        <Button variant="outline" onClick={() => downloadCsv(`muhasebeci-${new Date().toISOString().split('T')[0]}.csv`, financeToAccountantCsv(finance, users, companies))}>Muhasebeci CSV</Button>
        <Button onClick={downloadPdf}>PDF Özet</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Bu ay net', value: formatCurrency(kpis.net) },
          { label: 'MRR', value: formatCurrency(kpis.mrr) },
          { label: 'Reklam ROI', value: `${roi.roiPct}%` },
          { label: 'CPA', value: `₺${roi.cpa}` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border p-4">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <SectionCard title="6 Aylık Trend" subtitle="Onaylı gelir / gider / net">
        {trendChart.length ? (
          <>
            <BarChart data={trendChart} format={(v) => formatCurrency(v)} />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 text-xs text-center">
              {trend.map((t) => (
                <div key={t.key} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-medium">{t.label}</div>
                  <div className="text-emerald-600">{formatCurrency(t.gelir)}</div>
                  <div className="text-red-500">{formatCurrency(t.gider)}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center">Veri yok</p>
        )}
      </SectionCard>

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Kategori Dağılımı (Bu Ay)" subtitle="Onaylı hareketler">
          {categoryChart.length ? (
            <>
              <BarChart data={categoryChart} format={(v) => formatCurrency(v)} />
              <div className="mt-4 space-y-2 text-sm">
                {categories.map((c) => (
                  <div key={c.label} className="flex justify-between">
                    <span className="text-slate-500">{c.label}</span>
                    <span>{formatCurrency(c.gelir)} / {formatCurrency(c.gider)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Veri yok</p>
          )}
        </SectionCard>

        <SectionCard title="MRR Trendi" subtitle="Müşteri sayısı ve aylık tekrarlayan gelir">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-center">
            {mrrTrend.map((m) => (
              <div key={m.label} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                <div className="font-medium">{m.label}</div>
                <div className="text-lg font-bold">{formatCurrency(m.mrr)}</div>
                <div className="text-slate-400">{m.count} müşteri</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Reklam ROI" subtitle="Harcama vs gelir">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-slate-500 block">Toplam harcama</span><strong>{formatCurrency(roi.spend)}</strong></div>
          <div><span className="text-slate-500 block">Lead</span><strong>{roi.leads}</strong></div>
          <div><span className="text-slate-500 block">Müşteri</span><strong>{roi.customers}</strong></div>
          <div><span className="text-slate-500 block">Bu ay gelir</span><strong>{formatCurrency(roi.monthlyRevenue)}</strong></div>
        </div>
      </SectionCard>
    </div>
  )
}
