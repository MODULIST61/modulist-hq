import { formatCurrency, getUserName } from './utils'

function weekRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 7)
  return { start, end: now }
}

function inLastWeek(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const { start, end } = weekRange()
  return d >= start && d <= end
}

export function generateWeeklyReport(data, users) {
  const { tasks, companies, finance, campaigns, bugs, feedback, dailyMetrics, messages } = data
  const { start, end } = weekRange()

  const weekTasks = tasks.filter((t) => inLastWeek(t.created_at) || inLastWeek(t.updated_at))
  const completedTasks = weekTasks.filter((t) => t.durum === 'tamamlandi')
  const weekFinance = finance.filter((f) => inLastWeek(f.tarih) && f.durum === 'onaylandi')
  const gelir = weekFinance.filter((f) => f.tip === 'gelir').reduce((s, f) => s + f.tutar, 0)
  const gider = weekFinance.filter((f) => f.tip === 'gider').reduce((s, f) => s + f.tutar, 0)
  const weekCalls = dailyMetrics.filter((d) => inLastWeek(d.tarih))
  const totalCalls = weekCalls.reduce((s, d) => s + (d.arama_sayisi || 0), 0)
  const totalDemos = weekCalls.reduce((s, d) => s + (d.demo_ayarlanan || 0), 0)
  const newLeads = companies.filter((c) => inLastWeek(c.created_at)).length
  const newMusteri = companies.filter((c) => c.pipeline === 'musteri' && inLastWeek(c.updated_at)).length
  const openBugs = bugs.filter((b) => b.durum !== 'kapali').length
  const closedBugs = bugs.filter((b) => b.durum === 'kapali' && inLastWeek(b.updated_at)).length
  const adSpend = campaigns.reduce((s, c) => s + (c.butce_harcanan || 0), 0)
  const adLeads = campaigns.reduce((s, c) => s + (c.kayit_sayisi || 0), 0)
  const openFeedback = feedback.filter((f) => f.durum !== 'cozuldu').length
  const weekMessages = messages.filter((m) => inLastWeek(m.created_at) && !m.is_dm).length

  const lines = [
    '═══════════════════════════════════════',
    '  MODULIST HQ — HAFTALIK ÖZET RAPORU',
    `  ${start.toLocaleDateString('tr-TR')} — ${end.toLocaleDateString('tr-TR')}`,
    '  hq.modulist.net',
    '═══════════════════════════════════════',
    '',
    '📊 OPERASYON',
    `  • Toplam arama: ${totalCalls}`,
    `  • Demo ayarlanan: ${totalDemos}`,
    `  • Yeni lead: ${newLeads}`,
    `  • Yeni müşteri: ${newMusteri}`,
    `  • Mesaj aktivitesi: ${weekMessages} mesaj`,
    '',
    '✅ GÖREVLER',
    `  • Haftalık görev hareketi: ${weekTasks.length}`,
    `  • Tamamlanan: ${completedTasks.length}`,
    '',
    '💰 FİNANS (onaylı)',
    `  • Gelir: ${formatCurrency(gelir)}`,
    `  • Gider: ${formatCurrency(gider)}`,
    `  • Net: ${formatCurrency(gelir - gider)}`,
    '',
    '📣 REKLAM',
    `  • Toplam harcama: ${formatCurrency(adSpend)}`,
    `  • Lead/kayıt: ${adLeads}`,
    `  • CPA: ${adLeads > 0 ? formatCurrency(Math.round(adSpend / adLeads)) : '—'}`,
    '',
    '🐛 ÜRÜN',
    `  • Açık bug: ${openBugs}`,
    `  • Bu hafta kapanan: ${closedBugs}`,
    `  • Açık geri dönüş: ${openFeedback}`,
    '',
    '👥 EKİP AKTİVİTESİ (arama)',
  ]

  const byUser = {}
  weekCalls.forEach((d) => {
    const name = getUserName(users, d.user_id)
    byUser[name] = (byUser[name] || 0) + (d.arama_sayisi || 0)
  })
  Object.entries(byUser).forEach(([name, count]) => lines.push(`  • ${name}: ${count} arama`))
  if (!Object.keys(byUser).length) lines.push('  • Henüz veri yok')

  lines.push('', '— Modulist HQ haftalık özet —')

  return {
    text: lines.join('\n'),
    stats: { totalCalls, totalDemos, gelir, gider, completedTasks: completedTasks.length, newMusteri, adSpend, adLeads },
    period: { start: start.toISOString(), end: end.toISOString() },
  }
}
