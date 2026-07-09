import { formatCurrency, getUserName, isOverdue } from './utils'
import { buildPersonWeeklyComparison } from './personAnalytics'

function periodRange(period) {
  const end = new Date()
  const start = new Date()
  if (period === 'day') {
    start.setDate(end.getDate() - 1)
  } else {
    start.setDate(end.getDate() - 7)
  }
  return { start, end, label: period === 'day' ? 'Son 24 saat' : 'Son 7 gün' }
}

function inRange(dateStr, start, end) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= start && d <= end
}

export function buildManagerPayload(data, users, period = 'week') {
  const { start, end, label } = periodRange(period)

  const staff = users.filter((u) => u.role !== 'patron' && u.status === 'aktif')

  const team = staff.map((u) => {
    const metrics = data.dailyMetrics.filter((m) => m.user_id === u.id && inRange(m.tarih, start, end))
    const calls = metrics.reduce((s, m) => s + (m.arama_sayisi || 0), 0)
    const demos = metrics.reduce((s, m) => s + (m.demo_ayarlanan || 0), 0)
    const tasks = data.tasks.filter((t) => t.sorumlu_id === u.id)
    const openTasks = tasks.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum))
    const overdue = openTasks.filter((t) => isOverdue(t.bitis_tarihi))
    const doneInPeriod = tasks.filter(
      (t) => t.durum === 'tamamlandi' && inRange(t.updated_at || t.created_at, start, end)
    )
    const companies = data.companies.filter((c) => c.sorumlu_id === u.id)
    const activity = data.userActivity?.find((a) => a.user_id === u.id)
    const weekly = buildPersonWeeklyComparison(u.id, data)
    const audit = (data.auditLogs || []).filter(
      (a) => a.user_id === u.id && inRange(a.created_at, start, end)
    ).slice(0, 15)

    return {
      name: u.name,
      role: u.job_title || u.role,
      calls,
      demos,
      metricDaysLogged: metrics.length,
      openTasks: openTasks.length,
      overdueTasks: overdue.length,
      tasksCompletedInPeriod: doneInPeriod.length,
      companies: companies.length,
      customers: companies.filter((c) => c.pipeline === 'musteri').length,
      lastLogin: activity?.last_login_at,
      lastSeen: activity?.last_seen_at,
      weekOverWeek: {
        callsDelta: weekly.deltas.arama,
        demosDelta: weekly.deltas.demo,
      },
      recentActions: audit.map((a) => a.summary),
    }
  })

  const decisions = data.messages
    .filter((m) => m.type === 'karar' && inRange(m.created_at, start, end))
    .map((m) => ({
      text: m.text.slice(0, 300),
      by: getUserName(users, m.user_id),
      at: m.created_at,
    }))

  const financePending = data.finance.filter((f) => f.durum === 'bekliyor')
  const financePeriod = data.finance.filter((f) => inRange(f.tarih, start, end) && f.durum === 'onaylandi')
  const gelir = financePeriod.filter((f) => f.tip === 'gelir').reduce((s, f) => s + f.tutar, 0)
  const gider = financePeriod.filter((f) => f.tip === 'gider').reduce((s, f) => s + f.tutar, 0)

  const staleCompanies = data.companies
    .filter((c) => !['musteri', 'kaybedildi'].includes(c.pipeline))
    .filter((c) => {
      if (!c.updated_at) return false
      const days = Math.floor((end - new Date(c.updated_at)) / 86400000)
      return days >= 7
    })
    .map((c) => ({ name: c.ad, pipeline: c.pipeline, owner: getUserName(users, c.sorumlu_id) }))

  const overdueTasks = data.tasks
    .filter((t) => isOverdue(t.bitis_tarihi) && !['tamamlandi', 'iptal'].includes(t.durum))
    .map((t) => ({
      title: t.baslik,
      assignee: getUserName(users, t.sorumlu_id),
      due: t.bitis_tarihi,
    }))

  return {
    period: { label, start: start.toISOString(), end: end.toISOString() },
    team,
    operations: {
      totalCalls: team.reduce((s, t) => s + t.calls, 0),
      totalDemos: team.reduce((s, t) => s + t.demos, 0),
      newLeads: data.companies.filter((c) => inRange(c.created_at, start, end)).length,
      newCustomers: data.companies.filter((c) => c.pipeline === 'musteri' && inRange(c.updated_at, start, end)).length,
      messageCount: data.messages.filter((m) => inRange(m.created_at, start, end) && !m.is_dm).length,
      openBugs: data.bugs.filter((b) => b.durum !== 'kapali').length,
      criticalBugs: data.bugs.filter((b) => b.oncelik === 'kritik' && b.durum !== 'kapali').length,
    },
    marketing: {
      campaigns: data.campaigns.map((c) => ({
        name: c.ad,
        channel: c.kanal,
        spend: c.butce_harcanan,
        clicks: c.tiklama,
        impressions: c.gosterim,
        reach: c.erisim,
        leads: c.kayit_sayisi,
      })),
      totalSpend: data.campaigns.reduce((s, c) => s + (c.butce_harcanan || 0), 0),
      totalLeads: data.campaigns.reduce((s, c) => s + (c.kayit_sayisi || 0), 0),
    },
    finance: {
      periodGelir: gelir,
      periodGider: gider,
      periodNet: gelir - gider,
      pendingCount: financePending.length,
      pendingItems: financePending.map((f) => ({
        amount: f.tutar,
        desc: f.aciklama || f.kategori,
        by: getUserName(users, f.giren_id),
      })),
    },
    decisions,
    risks: {
      overdueTasks,
      staleCompanies,
      noMetricStaff: team.filter((t) => t.metricDaysLogged === 0).map((t) => t.name),
    },
    pipeline: {
      lead: data.companies.filter((c) => c.pipeline === 'lead').length,
      demo: data.companies.filter((c) => c.pipeline === 'demo').length,
      trial: data.companies.filter((c) => c.pipeline === 'trial').length,
      musteri: data.companies.filter((c) => c.pipeline === 'musteri').length,
    },
  }
}
