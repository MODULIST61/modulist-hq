import { useMemo } from 'react'
import { useData } from '../../context/DataContext'
import { buildContentImpact } from '../../lib/contentAnalytics'
import { BarChart, SectionCard, StatCard } from '../dashboard/DashboardWidgets'
import { CONTENT_TYPES } from '../../lib/constants'

export function ImpactAnalysis() {
  const { contents, campaigns, companies } = useData()

  const impact = useMemo(
    () => buildContentImpact(contents, campaigns, companies),
    [contents, campaigns, companies]
  )

  const typeChart = impact.byType.map((t) => ({
    label: CONTENT_TYPES[t.label] || t.label,
    value: t.leads,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Yayınlanan İçerik" value={impact.totals.published} />
        <StatCard label="İçerik Lead" value={impact.totals.totalLeads} variant="success" />
        <StatCard label="Toplam Görüntülenme" value={impact.totals.totalViews.toLocaleString('tr-TR')} />
        <StatCard label="Pipeline Lead (30g)" value={impact.totals.pipelineLeads30d} variant="accent" />
      </div>

      {typeChart.some((t) => t.value > 0) && (
        <SectionCard title="Format → Lead" subtitle="Hangi format kaç lead getirdi">
          <BarChart data={typeChart} />
        </SectionCard>
      )}

      <SectionCard title="En İyi İçerikler" subtitle="Lead / görüntülenme skoruna göre">
        {impact.topContent.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Yayında veya ölçülmüş içerik yok — metrik girin</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 border-b dark:border-slate-800">
                <tr>
                  <th className="pb-2">İçerik</th>
                  <th className="pb-2">Tip</th>
                  <th className="pb-2">Görüntülenme</th>
                  <th className="pb-2">Lead</th>
                  <th className="pb-2">Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {impact.topContent.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">{c.baslik}</td>
                    <td className="py-2">{CONTENT_TYPES[c.tip] || c.tip}</td>
                    <td className="py-2">{c.goruntulenme.toLocaleString('tr-TR')}</td>
                    <td className="py-2 text-emerald-600 font-semibold">{c.leads}</td>
                    <td className="py-2">{c.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {impact.weekly.length > 0 && (
        <SectionCard title="Haftalık Trend" subtitle="Yayın sayısı vs lead">
          <div className="space-y-2 text-sm">
            {impact.weekly.map((w) => (
              <div key={w.week} className="flex justify-between py-2 border-b dark:border-slate-800 last:border-0">
                <span className="text-slate-500">Hafta {w.week}</span>
                <span>{w.contentCount} içerik · {w.leads} lead · {w.views.toLocaleString('tr-TR')} görüntülenme</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <p className="text-xs text-slate-400">
        Metrikler elle girilir. Detaylı AI yorumu için Fikir Lab → Etki Analizi (AI) kullanın.
      </p>
    </div>
  )
}
