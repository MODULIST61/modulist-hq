import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { generateWeeklyReport } from '../lib/weeklyReport'
import { printWeeklyReport } from '../lib/print'
import { downloadTextPdf } from '../lib/pdfExport'
import { SectionCard, StatCard } from '../components/dashboard/DashboardWidgets'
import { PageHeader } from '../components/ui/Page'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../lib/utils'

export default function WeeklyReport() {
  const { users } = useAuth()
  const data = useData()
  const [copied, setCopied] = useState(false)

  const report = useMemo(() => generateWeeklyReport(data, users), [data, users])

  const copyReport = async () => {
    await navigator.clipboard.writeText(report.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    const blob = new Blob([report.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `modulist-hq-haftalik-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = () => {
    downloadTextPdf({
      title: 'Haftalık Özet Raporu',
      subtitle: `${new Date(report.period.start).toLocaleDateString('tr-TR')} — ${new Date(report.period.end).toLocaleDateString('tr-TR')}`,
      body: report.text,
      filename: `modulist-haftalik-${new Date().toISOString().split('T')[0]}.pdf`,
    })
  }

  const { stats } = report

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Haftalık Özet Raporu"
        subtitle="Otomatik özet — kopyala, PDF indir veya yazdır"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Haftalık Arama" value={stats.totalCalls} variant="accent" />
        <StatCard label="Demo Ayarlanan" value={stats.totalDemos} variant="success" />
        <StatCard label="Haftalık Net" value={formatCurrency(stats.gelir - stats.gider)} />
        <StatCard label="Yeni Müşteri" value={stats.newMusteri} variant="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Rapor Önizleme"
          action={
            <div className="flex gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={copyReport}>{copied ? 'Kopyalandı!' : 'Kopyala'}</Button>
              <Button variant="ghost" size="sm" onClick={downloadTxt}>.txt İndir</Button>
              <Button variant="ghost" size="sm" onClick={downloadPdf}>PDF İndir</Button>
              <Button variant="ghost" size="sm" onClick={() => printWeeklyReport(report.text)}>Yazdır</Button>
            </div>
          }
        >
          <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
            {report.text}
          </pre>
        </SectionCard>

        <SectionCard title="Paylaşım" subtitle="E-posta veya WhatsApp ile manuel gönderim">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Raporu <strong>Kopyala</strong> ile panoya alıp patron veya ekibe e-posta / WhatsApp üzerinden gönderebilirsiniz.
              Otomatik e-posta entegrasyonu bu sürümde yok — tüm paylaşım elle yapılır.
            </p>
            <ol className="text-xs text-slate-500 space-y-2 list-decimal list-inside">
              <li>Sol taraftan raporu kopyalayın veya .txt indirin</li>
              <li>E-posta istemcinizde veya WhatsApp’ta yapıştırın</li>
              <li>İsterseniz Yazdır / PDF ile arşivleyin</li>
            </ol>
            <Button onClick={copyReport} className="w-full">
              {copied ? 'Panoya kopyalandı!' : 'Raporu Kopyala'}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
