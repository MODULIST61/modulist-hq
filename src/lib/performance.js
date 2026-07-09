function daysAgo(dateStr) {
  if (!dateStr) return 999
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / 86400000)
}

export function calculatePerformanceScores(users, tasks, companies, dailyMetrics) {
  const activeUsers = users.filter((u) => u.status === 'aktif')

  return activeUsers.map((user) => {
    const uid = user.id

    const weekMetrics = dailyMetrics.filter((d) => d.user_id === uid && daysAgo(d.tarih) <= 30)
    const calls = weekMetrics.reduce((s, d) => s + (d.arama_sayisi || 0), 0)
    const reached = weekMetrics.reduce((s, d) => s + (d.ulasilan || 0), 0)
    const demos = weekMetrics.reduce((s, d) => s + (d.demo_ayarlanan || 0), 0)

    const userTasks = tasks.filter((t) => t.sorumlu_id === uid)
    const completed = userTasks.filter((t) => t.durum === 'tamamlandi').length
    const open = userTasks.filter((t) => !['tamamlandi', 'iptal'].includes(t.durum)).length
    const overdue = userTasks.filter((t) => t.bitis_tarihi && new Date(t.bitis_tarihi) < new Date() && t.durum !== 'tamamlandi').length

    const musteri = companies.filter((c) => c.sorumlu_id === uid && c.pipeline === 'musteri').length
    const trials = companies.filter((c) => c.sorumlu_id === uid && c.pipeline === 'trial').length
    const conversions = companies.filter((c) => c.sorumlu_id === uid && ['musteri', 'odeme_bekliyor'].includes(c.pipeline)).length

    const callScore = Math.min(calls * 2, 25)
    const demoScore = Math.min(demos * 5, 25)
    const taskScore = Math.min(completed * 3, 25)
    const convScore = Math.min(conversions * 8 + musteri * 5, 25)
    const penalty = overdue * 3
    const score = Math.max(0, Math.min(100, Math.round(callScore + demoScore + taskScore + convScore - penalty)))

    let grade = 'C'
    if (score >= 85) grade = 'A'
    else if (score >= 70) grade = 'B'
    else if (score >= 50) grade = 'C'
    else grade = 'D'

    const conversionRate = calls > 0 ? Math.round((conversions / calls) * 100) : demos > 0 ? Math.round((demos / calls) * 100) : 0

    return {
      userId: uid,
      name: user.name,
      role: user.role,
      job_title: user.job_title || user.role,
      score,
      grade,
      calls,
      reached,
      demos,
      completed,
      open,
      overdue,
      musteri,
      trials,
      conversions,
      conversionRate,
      breakdown: { callScore, demoScore, taskScore, convScore, penalty },
    }
  }).sort((a, b) => b.score - a.score)
}

export function getTeamAverage(scores) {
  if (!scores.length) return 0
  return Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length)
}
