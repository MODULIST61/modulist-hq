import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { generateWeeklyReport, mockSendWeeklyEmail } from '../lib/weeklyReport'
import { printWeeklyReport } from '../lib/print'
import { SectionCard, StatCard } from '../components/dashboard/DashboardWidgets'
import { PageHeader } from '../components/ui/Page'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { formatCurrency } from '../lib/utils'

export default function WeeklyReport() {
  const { currentUser, users } = useAuth()
  const data = useData()
  const [email, setEmail] = useState(currentUser?.email || '')
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState(null)
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

  const sendMockEmail = async () => {
    if (!email) return
    setSending(true)
    try {
      const result = await mockSendWeeklyEmail(report.text, email)
      setLastSent(result)
      data.updateSettings({
        lastWeeklyReport: result,
        weeklyReportEmail: email,
      })
    } finally {
      setSending(false)
    }
  }

  const { stats } = report

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Haftalık Özet Raporu"
        subtitle="Otomatik özet — yazdır, indir veya mock e-posta gönder"
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
              <Button variant="ghost" size="sm" onClick={() => printWeeklyReport(report.text)}>Yazdır / PDF</Button>
            </div>
          }
        >
          <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
            {report.text}
          </pre>
        </SectionCard>

        <SectionCard title="Mock E-posta Gönder" subtitle="Gerçek e-posta sunucusu yok — simülasyon">
          <div className="space-y-4">
            <Input label="Alıcı e-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patron@modulist.net" />
            <p className="text-xs text-slate-400">
              Haftalık özet bu adrese gönderilmiş gibi simüle edilir. Gerçek SMTP entegrasyonu V3+ backend ile eklenebilir.
            </p>
            <Button onClick={sendMockEmail} disabled={sending || !email} className="w-full">
              {sending ? 'Gönderiliyor...' : 'Haftalık Özet Gönder (Mock)'}
            </Button>
            {lastSent && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
                ✓ Mock gönderim başarılı — {lastSent.to}<br />
                <span className="text-xs opacity-75">{new Date(lastSent.sent_at).toLocaleString('tr-TR')}</span>
              </div>
            )}
            {data.settings?.lastWeeklyReport && !lastSent && (
              <p className="text-xs text-slate-400">
                Son gönderim: {data.settings.lastWeeklyReport.to} — {new Date(data.settings.lastWeeklyReport.sent_at).toLocaleString('tr-TR')}
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
