import { calculatePerformanceScores } from './performance'
import { isOverdue, isToday, formatDate } from './utils'

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
  return alerts.sort((a, b) => ({ danger: 0, warning: 1, accent: 2 }[a.level] - { danger: 0, warning: 1, accent: 2 }[b.level]))
}
