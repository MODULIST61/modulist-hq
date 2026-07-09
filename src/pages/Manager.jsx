import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { resolveModel, modelLabel } from '../lib/aiModels'
import { buildManagerPayload } from '../lib/managerPayload'
import { requestManagerReport } from '../lib/managerApi'
import { downloadMarkdownPdf } from '../lib/pdfExport'
import { SectionCard } from '../components/dashboard/DashboardWidgets'
import { PageHeader } from '../components/ui/Page'
import { Button } from '../components/ui/Button'
import { formatDateTime, cn } from '../lib/utils'

function MarkdownView({ text }) {
  const lines = text.split('\n')
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {lines.map((line, i) => {
        const t = line.trim()
        if (!t) return <br key={i} />
        if (t.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{t.slice(4)}</h3>
        if (t.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-5 mb-2 text-primary dark:text-white border-b pb-1">{t.slice(3)}</h2>
        if (t.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-3">{t.slice(2)}</h1>
        if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} className="ml-4 text-sm text-slate-700 dark:text-slate-300 list-disc">{t.slice(2)}</li>
        return <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{t}</p>
      })}
    </div>
  )
}

export default function Manager({ embedded = false }) {
  const { users } = useAuth()
  const data = useData()
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(data.settings?.lastManagerReport || null)
  const [copied, setCopied] = useState(false)
  const modelName = modelLabel(resolveModel(data.settings, 'manager'))

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = buildManagerPayload(data, users, period)
      const result = await requestManagerReport(payload, period)
      setReport(result)
      await data.reload()
    } catch (e) {
      setError(e.message || 'Rapor oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const copyReport = async () => {
    if (!report?.report) return
    await navigator.clipboard.writeText(report.report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPdf = () => {
    if (!report?.report) return
    const label = period === 'day' ? 'gunluk' : 'haftalik'
    downloadMarkdownPdf({
      title: 'Müdür Raporu',
      subtitle: `${period === 'day' ? 'Günlük' : 'Haftalık'} · ${formatDateTime(report.generated_at)} · ${report.model || 'GPT'}`,
      markdown: report.report,
      filename: `modulist-mudur-${label}-${new Date().toISOString().split('T')[0]}.pdf`,
    })
  }

  const history = data.settings?.managerReportHistory || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {!embedded && (
        <PageHeader
          title="Müdür"
          subtitle="Yapay zeka destekli patron raporu — kim ne yaptı, ne eksik, neye dikkat"
        />
      )}

      <SectionCard title="Rapor Oluştur" subtitle={`Model: ${modelName} · ChatGPT`}>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              ['week', 'Haftalık'],
              ['day', 'Günlük (24s)'],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPeriod(k)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  period === k
                    ? 'bg-accent text-white border-accent'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-accent'
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            ChatGPT tüm HQ verisini (ekip, görev, firma, finans, reklam, karar, audit) analiz eder ve patron diliyle rapor yazar.
          </p>

          <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'ChatGPT analiz ediyor...' : 'Müdür Raporu Oluştur'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
              {error.includes('API key') && (
                <span> → <a href="/ayarlar" className="underline">Ayarlara git</a></span>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {report?.report && (
        <SectionCard
          title="Son Rapor"
          subtitle={report.generated_at ? formatDateTime(report.generated_at) : ''}
          action={
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={copyReport}>{copied ? 'Kopyalandı!' : 'Kopyala'}</Button>
              <Button variant="ghost" size="sm" onClick={downloadPdf}>PDF İndir</Button>
            </div>
          }
        >
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <MarkdownView text={report.report} />
          </div>
          {report.tokens && (
            <p className="text-xs text-slate-400 mt-2">Model: {report.model} · ~{report.tokens} token</p>
          )}
        </SectionCard>
      )}

      {history.length > 1 && (
        <SectionCard title="Geçmiş Raporlar" subtitle="Son 10 rapor">
          <div className="space-y-2">
            {history.slice(1, 6).map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReport(h)}
                className="w-full text-left p-3 rounded-lg border hover:border-accent text-sm transition-colors"
              >
                <span className="text-slate-500">{formatDateTime(h.generated_at)}</span>
                <span className="mx-2">·</span>
                <span>{h.period === 'day' ? 'Günlük' : 'Haftalık'}</span>
                <p className="text-xs text-slate-400 mt-1 truncate">{h.report?.slice(0, 120)}...</p>
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {!report?.report && !loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm">Henüz müdür raporu yok. Yukarıdan oluşturun.</p>
        </div>
      )}
    </div>
  )
}
