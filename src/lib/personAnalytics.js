import { calculatePerformanceScores } from './performance'
import { isOverdue, isToday } from './utils'

function weekRange(offsetWeeks = 0) {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = new Date(now)
  start.setDate(now.getDate() + mondayOffset - offsetWeeks * 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function sumMetrics(metrics, start, end) {
  return metrics
    .filter((m) => {
      const d = new Date(m.tarih)
      return d >= start && d <= end
    })
    .reduce(
      (acc, m) => ({
        arama: acc.arama + (m.arama_sayisi || 0),
        demo: acc.demo + (m.demo_ayarlanan || 0),
        ulasilan: acc.ulasilan + (m.ulasilan || 0),
        days: acc.days + 1,
      }),
      { arama: 0, demo: 0, ulasilan: 0, days: 0 }
    )
}

export function buildPersonWeeklyComparison(userId, data) {
  const metrics = data.dailyMetrics.filter((m) => m.user_id === userId)
  const thisWeek = weekRange(0)
  const lastWeek = weekRange(1)
  const current = sumMetrics(metrics, thisWeek.start, thisWeek.end)
  const previous = sumMetrics(metrics, lastWeek.start, lastWeek.end)

  const tasks = data.tasks.filter((t) => t.sorumlu_id === userId)
  const doneThis = tasks.filter((t) => {
    if (t.durum !== 'tamamlandi') return false
    const d = new Date(t.updated_at || t.created_at)
    return d >= thisWeek.start && d <= thisWeek.end
  }).length
  const doneLast = tasks.filter((t) => {
    if (t.durum !== 'tamamlandi') return false
    const d = new Date(t.updated_at || t.created_at)
    return d >= lastWeek.start && d <= lastWeek.end
  }).length

  const delta = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0)

  return {
    current,
    previous,
    tasksDone: { current: doneThis, previous: doneLast },
    deltas: {
      arama: delta(current.arama, previous.arama),
      demo: delta(current.demo, previous.demo),
      tasks: delta(doneThis, doneLast),
    },
  }
}

export function buildPersonReportText(profile, weekly) {
  const { user, stats, perf, lastSeen, lastLogin } = profile
  const lines = [
    'MODULIST HQ — PERSONEL RAPORU',
    `${user.name} (${user.email})`,
    `Tarih: ${new Date().toLocaleString('tr-TR')}`,
    '',
    '--- ÖZET ---',
    `Açık görev: ${stats.openTasks} (${stats.overdueTasks} geciken)`,
    `Tamamlanan görev: ${stats.doneTasks}`,
    `Firmalar: ${stats.companies} · Müşteri: ${stats.customers}`,
    `Bugün arama/demo: ${stats.todayCalls} / ${stats.todayDemos}`,
    perf ? `Performans skoru: ${perf.score} (${perf.grade})` : '',
    lastLogin ? `Son giriş: ${new Date(lastLogin).toLocaleString('tr-TR')}` : '',
    lastSeen ? `Son aktif: ${new Date(lastSeen).toLocaleString('tr-TR')}` : '',
    '',
    '--- BU HAFTA vs GEÇEN HAFTA ---',
    `Arama: ${weekly.current.arama} (geçen: ${weekly.previous.arama}, ${weekly.deltas.arama >= 0 ? '+' : ''}${weekly.deltas.arama}%)`,
    `Demo: ${weekly.current.demo} (geçen: ${weekly.previous.demo}, ${weekly.deltas.demo >= 0 ? '+' : ''}${weekly.deltas.demo}%)`,
    `Tamamlanan görev: ${weekly.tasksDone.current} (geçen: ${weekly.tasksDone.previous})`,
    '',
    '— Modulist HQ iç rapor —',
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildPersonProfile(userId, data, users) {
  const user = users.find((u) => u.id === userId)
  if (!user) return null

  const tasks = data.tasks.filter((t) => t.sorumlu_id === userId || t.olusturan_id === userId)
  const myTasks = data.tasks.filter((t) => t.sorumlu_id === userId)
  const openTasks = myTasks.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum))
  const overdueTasks = openTasks.filter((t) => isOverdue(t.bitis_tarihi))
  const companies = data.companies.filter((c) => c.sorumlu_id === userId)
  const messages = data.messages.filter((m) => m.user_id === userId && !m.is_dm)
  const dmMessages = data.messages.filter((m) => m.user_id === userId && m.is_dm)
  const metrics = data.dailyMetrics.filter((m) => m.user_id === userId)
  const todayMetric = metrics.find((m) => m.tarih === new Date().toISOString().split('T')[0])
  const finance = data.finance.filter((f) => f.giren_id === userId)
  const bugs = data.bugs.filter((b) => b.sorumlu_id === userId || b.bildiren_id === userId)
  const feedback = data.feedback.filter((f) => f.sorumlu_id === userId || f.user_id === userId)
  const audit = (data.auditLogs || []).filter((a) => a.user_id === userId)
  const activity = data.userActivity?.find((a) => a.user_id === userId)
  const comments = (data.taskComments || []).filter((c) => c.user_id === userId)

  const scores = calculatePerformanceScores(users, data.tasks, data.companies, data.dailyMetrics)
  const perf = scores.find((s) => s.userId === userId)

  const timeline = [
    ...audit.map((a) => ({ type: 'audit', date: a.created_at, text: a.summary, id: a.id })),
    ...messages.slice(-30).map((m) => ({ type: 'mesaj', date: m.created_at, text: m.text, id: m.id })),
    ...myTasks.slice(-20).map((t) => ({ type: 'gorev', date: t.updated_at || t.created_at, text: `${t.baslik} (${t.durum})`, id: t.id })),
    ...metrics.slice(-14).map((m) => ({
      type: 'metrik',
      date: m.tarih,
      text: `${m.arama_sayisi} arama, ${m.demo_ayarlanan} demo`,
      id: m.id,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40)

  return {
    user,
    perf,
    activity,
    stats: {
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      doneTasks: myTasks.filter((t) => t.durum === 'tamamlandi').length,
      companies: companies.length,
      customers: companies.filter((c) => c.pipeline === 'musteri').length,
      messages: messages.length,
      dmMessages: dmMessages.length,
      bugs: bugs.length,
      financePending: finance.filter((f) => f.durum === 'bekliyor').length,
      todayCalls: todayMetric?.arama_sayisi || 0,
      todayDemos: todayMetric?.demo_ayarlanan || 0,
    },
    tasks: myTasks.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)),
    companies: companies.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
    metrics: metrics.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).slice(0, 30),
    messages: [...messages, ...dmMessages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30),
    finance,
    bugs,
    feedback,
    comments,
    timeline,
    lastSeen: activity?.last_seen_at,
    lastLogin: activity?.last_login_at,
  }
}

export function buildTeamDailySummary(users, data) {
  const today = new Date().toISOString().split('T')[0]
  return users
    .filter((u) => u.role !== 'patron' && u.status === 'aktif')
    .map((u) => {
      const metric = data.dailyMetrics.find((m) => m.user_id === u.id && m.tarih === today)
      const openTasks = data.tasks.filter((t) => t.sorumlu_id === u.id && !['tamamlandi', 'iptal'].includes(t.durum))
      const activity = data.userActivity?.find((a) => a.user_id === u.id)
      const loggedInToday = activity?.last_seen_at && isToday(activity.last_seen_at.split('T')[0])
      return {
        user: u,
        arama: metric?.arama_sayisi || 0,
        demo: metric?.demo_ayarlanan || 0,
        openTasks: openTasks.length,
        overdue: openTasks.filter((t) => isOverdue(t.bitis_tarihi)).length,
        activeToday: loggedInToday || !!metric,
        lastSeen: activity?.last_seen_at,
      }
    })
}

export function buildAlerts(data, users) {
  const alerts = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  data.tasks
    .filter((t) => isOverdue(t.bitis_tarihi) && !['tamamlandi', 'iptal'].includes(t.durum))
    .forEach((t) => {
      const name = users.find((u) => u.id === t.sorumlu_id)?.name || 'Atanmamış'
      alerts.push({ level: 'danger', text: `Geciken görev: ${t.baslik} (${name})`, link: '/isler' })
    })

  data.companies
    .filter((c) => c.pipeline === 'trial' && c.trial_bitis)
    .forEach((c) => {
      const end = new Date(c.trial_bitis)
      const days = Math.ceil((end - new Date()) / 86400000)
      if (days >= 0 && days <= 3) {
        alerts.push({ level: 'warning', text: `Trial bitiyor: ${c.ad} (${days} gün)`, link: `/kayitlar/firmalar/${c.id}` })
      }
    })

  data.companies.filter((c) => isToday(c.demo_tarihi)).forEach((c) => {
    alerts.push({ level: 'accent', text: `Bugün demo: ${c.ad}`, link: `/kayitlar/firmalar/${c.id}` })
  })

  data.finance.filter((f) => f.durum === 'bekliyor').forEach((f) => {
    alerts.push({ level: 'warning', text: `Onay bekleyen gider: ${f.aciklama || f.kategori}`, link: '/finans' })
  })

  data.bugs.filter((b) => b.oncelik === 'kritik' && b.durum !== 'kapali').forEach((b) => {
    alerts.push({ level: 'danger', text: `Kritik bug: ${b.baslik}`, link: '/kayitlar/buglar' })
  })

  users
    .filter((u) => u.status === 'aktif' && u.role !== 'patron')
    .forEach((u) => {
      const perms = u.permissions?.actions || {}
      if (!perms.logDailyMetrics) return
      const lastMetric = data.dailyMetrics
        .filter((m) => m.user_id === u.id)
        .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))[0]
      const daysSince = lastMetric
        ? Math.floor((today - new Date(lastMetric.tarih)) / 86400000)
        : 999
      if (daysSince >= 3) {
        alerts.push({
          level: 'warning',
          text: `${u.name}: ${daysSince >= 999 ? 'hiç' : daysSince} gündür metrik girmedi`,
          link: '/kayitlar/gunluk-metrik',
        })
      }
    })

  data.companies
    .filter((c) => !['musteri', 'kaybedildi'].includes(c.pipeline))
    .forEach((c) => {
      const updated = c.updated_at ? new Date(c.updated_at) : null
      if (!updated) return
      const days = Math.floor((today - updated) / 86400000)
      if (days >= 7) {
        alerts.push({
          level: 'warning',
          text: `Durgun firma (${days}g): ${c.ad} — ${c.pipeline}`,
          link: `/kayitlar/firmalar/${c.id}`,
        })
      }
    })

  users
    .filter((u) => u.status === 'aktif' && u.role !== 'patron')
    .forEach((u) => {
      const activity = data.userActivity?.find((a) => a.user_id === u.id)
      if (!activity?.last_login_at) return
      const days = Math.floor((today - new Date(activity.last_login_at)) / 86400000)
      if (days >= 3) {
        alerts.push({
          level: 'accent',
          text: `${u.name}: ${days} gündür giriş yapmadı`,
          link: `/personel/${u.id}`,
        })
      }
    })

  return alerts.sort((a, b) => ({ danger: 0, warning: 1, accent: 2 }[a.level] - { danger: 0, warning: 1, accent: 2 }[b.level]))
}
