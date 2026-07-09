import {
  INTERACTION_TYPES,
  INTERACTION_RESULTS,
  interactionIcon,
  inboxItems,
  followUpsToday,
  isPhoneInteraction,
} from './interactions'
import { formatCurrency, getUserName, isOverdue, isToday, relativeTime } from './utils'

export const TIMELINE_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'iletisim', label: 'İletişim' },
  { id: 'gorev', label: 'Görev' },
  { id: 'firma', label: 'Firma' },
  { id: 'bug', label: 'Bug' },
  { id: 'finans', label: 'Finans' },
  { id: 'mesaj', label: 'Mesaj' },
  { id: 'reklam', label: 'Reklam' },
  { id: 'karar', label: 'Karar' },
]

function pushItem(items, row) {
  if (row.time) items.push(row)
}

export function buildUnifiedTimeline(data, users, { limit = 80, userId, type, sinceDays = 30 } = {}) {
  const items = []
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)

  const inWindow = (t) => t && new Date(t) >= since
  const companyName = (id) => data.companies.find((c) => c.id === id)?.ad

  ;(data.interactions || []).forEach((i) => {
    if (!inWindow(i.created_at)) return
    const who = getUserName(users, i.user_id)
    const firma = companyName(i.firma_id)
    const tip = INTERACTION_TYPES[i.tip] || i.tip
    const sonuc = INTERACTION_RESULTS[i.sonuc] ? ` — ${INTERACTION_RESULTS[i.sonuc]}` : ''
    pushItem(items, {
      id: `int-${i.id}`,
      type: 'iletisim',
      hub: 'sekreter',
      icon: interactionIcon(i.tip),
      text: `${who}: ${tip}${firma ? ` · ${firma}` : ''}${i.kisi_adi ? ` (${i.kisi_adi})` : ''}${sonuc}`,
      time: i.created_at,
      userId: i.user_id,
      link: i.firma_id ? `/sekreter/firmalar/${i.firma_id}` : '/sekreter?tab=iletisim',
    })
  })

  data.messages.filter((m) => !m.is_dm && inWindow(m.created_at)).slice(-80).forEach((m) => {
    const room = data.rooms.find((r) => r.id === m.room_id)
    const isKarar = m.type === 'karar'
    pushItem(items, {
      id: `msg-${m.id}`,
      type: isKarar ? 'karar' : 'mesaj',
      hub: 'mesajlar',
      icon: isKarar ? '⚖️' : '💬',
      text: `${getUserName(users, m.user_id)} #${room?.name || 'oda'}: ${m.text.slice(0, 100)}`,
      time: m.created_at,
      userId: m.user_id,
      link: `/mesajlar?oda=${room?.slug || 'genel'}`,
    })
  })

  data.tasks.filter((t) => inWindow(t.updated_at || t.created_at)).slice(-60).forEach((t) => {
    const done = t.durum === 'tamamlandi'
    pushItem(items, {
      id: `task-${t.id}-${t.updated_at}`,
      type: 'gorev',
      hub: 'yazilim',
      icon: done ? '✅' : '📋',
      text: done ? `Görev tamamlandı: ${t.baslik}` : `Görev [${t.durum}]: ${t.baslik} (${getUserName(users, t.sorumlu_id)})`,
      time: t.updated_at || t.created_at,
      userId: t.sorumlu_id,
      link: '/yazilim?tab=isler',
    })
  })

  data.companies.filter((c) => inWindow(c.updated_at)).slice(-40).forEach((c) => {
    pushItem(items, {
      id: `co-${c.id}-${c.updated_at}`,
      type: 'firma',
      hub: 'sekreter',
      icon: '🏢',
      text: `${c.ad} — pipeline: ${c.pipeline}${c.sorumlu_id ? ` (${getUserName(users, c.sorumlu_id)})` : ''}`,
      time: c.updated_at,
      userId: c.sorumlu_id,
      link: `/sekreter/firmalar/${c.id}`,
    })
  })

  data.bugs.filter((b) => inWindow(b.updated_at || b.created_at)).slice(-30).forEach((b) => {
    pushItem(items, {
      id: `bug-${b.id}`,
      type: 'bug',
      hub: 'yazilim',
      icon: '🐛',
      text: `Bug [${b.durum}]: ${b.baslik}${b.oncelik === 'kritik' ? ' ⚠️ KRİTİK' : ''}`,
      time: b.updated_at || b.created_at,
      userId: b.sorumlu_id || b.bildiren_id,
      link: '/yazilim?tab=buglar',
    })
  })

  data.finance.filter((f) => inWindow(f.created_at || f.tarih)).slice(-30).forEach((f) => {
    const pending = f.durum === 'bekliyor'
    pushItem(items, {
      id: `fin-${f.id}`,
      type: 'finans',
      hub: 'patron',
      icon: pending ? '⏳' : f.tip === 'gelir' ? '💵' : '💸',
      text: pending
        ? `Onay bekleyen: ${formatCurrency(f.tutar)} — ${f.aciklama || f.kategori} (${getUserName(users, f.giren_id)})`
        : `${f.tip === 'gelir' ? 'Gelir' : 'Gider'} ${f.durum}: ${formatCurrency(f.tutar)} — ${f.aciklama || f.kategori}`,
      time: f.created_at || f.tarih,
      userId: f.giren_id,
      link: '/patron?tab=finans',
    })
  })

  data.feedback.filter((f) => inWindow(f.created_at)).slice(-20).forEach((f) => {
    pushItem(items, {
      id: `fb-${f.id}`,
      type: 'mesaj',
      hub: 'yazilim',
      icon: '📣',
      text: `Geri dönüş [${f.durum}]: ${f.metin?.slice(0, 80)}`,
      time: f.created_at,
      userId: f.user_id,
      link: '/yazilim?tab=geri-donusler',
    })
  })

  data.campaigns.filter((c) => inWindow(c.updated_at || c.created_at)).slice(-15).forEach((c) => {
    pushItem(items, {
      id: `camp-${c.id}`,
      type: 'reklam',
      hub: 'reklam',
      icon: '📢',
      text: `Kampanya: ${c.ad} (${c.kanal}) — harcanan ${formatCurrency(c.butce_harcanan || 0)}`,
      time: c.updated_at || c.created_at,
      userId: null,
      link: '/reklam',
    })
  })

  ;(data.contents || []).filter((c) => inWindow(c.created_at)).slice(-15).forEach((c) => {
    pushItem(items, {
      id: `cnt-${c.id}`,
      type: 'reklam',
      hub: 'reklam',
      icon: '🎨',
      text: `İçerik brief: ${c.baslik || c.tip || 'Yeni içerik'} [${c.durum || 'taslak'}]`,
      time: c.created_at,
      userId: c.sorumlu_id,
      link: '/reklam?tab=studio',
    })
  })

  ;(data.auditLogs || []).filter((a) => inWindow(a.created_at)).slice(-40).forEach((a) => {
    pushItem(items, {
      id: `audit-${a.id}`,
      type: 'mesaj',
      hub: 'patron',
      icon: '📋',
      text: `${getUserName(users, a.user_id)}: ${a.summary}`,
      time: a.created_at,
      userId: a.user_id,
      link: '/patron?tab=denetim',
    })
  })

  data.dailyMetrics.filter((d) => isToday(d.tarih)).forEach((d) => {
    pushItem(items, {
      id: `dm-${d.id}`,
      type: 'iletisim',
      hub: 'sekreter',
      icon: '📊',
      text: `${getUserName(users, d.user_id)} bugün ${d.arama_sayisi || 0} arama, ${d.demo_ayarlanan || 0} demo`,
      time: d.created_at || d.tarih,
      userId: d.user_id,
      link: '/sekreter?tab=metrik',
    })
  })

  let result = items.sort((a, b) => new Date(b.time) - new Date(a.time))
  if (userId) result = result.filter((i) => i.userId === userId)
  if (type && type !== 'all') result = result.filter((i) => i.type === type)
  return result.slice(0, limit)
}

export function buildTodayInteractionStats(interactions) {
  const today = new Date().toISOString().split('T')[0]
  const todayItems = (interactions || []).filter((i) => i.created_at?.split('T')[0] === today)
  const phone = todayItems.filter(isPhoneInteraction)
  const demos = todayItems.filter((i) => i.sonuc === 'demo_ayarlandi' || i.tip === 'demo')
  const inbox = inboxItems(interactions).length
  const followUps = followUpsToday(interactions).length
  return { calls: phone.length, demos: demos.length, total: todayItems.length, inbox, followUps }
}

export function buildTeamLiveSummary(users, data) {
  const today = new Date().toISOString().split('T')[0]
  const interactions = data.interactions || []

  return users
    .filter((u) => u.role !== 'patron' && u.status === 'aktif')
    .map((u) => {
      const metric = data.dailyMetrics.find((m) => m.user_id === u.id && m.tarih === today)
      const todayInts = interactions.filter((i) => i.user_id === u.id && i.created_at?.split('T')[0] === today)
      const phoneToday = todayInts.filter(isPhoneInteraction).length
      const demoToday = todayInts.filter((i) => i.sonuc === 'demo_ayarlandi' || i.tip === 'demo').length
      const arama = Math.max(metric?.arama_sayisi || 0, phoneToday)
      const demo = Math.max(metric?.demo_ayarlanan || 0, demoToday)
      const openTasks = data.tasks.filter((t) => t.sorumlu_id === u.id && !['tamamlandi', 'iptal'].includes(t.durum))
      const overdue = openTasks.filter((t) => isOverdue(t.bitis_tarihi))
      const inbox = interactions.filter((i) => (i.sorumlu_id === u.id || i.user_id === u.id) && i.durum === 'inbox').length
      const activity = data.userActivity?.find((a) => a.user_id === u.id)
      const lastSeen = activity?.last_seen_at
      const activeToday = (lastSeen && isToday(lastSeen.split('T')[0])) || todayInts.length > 0 || !!metric

      const lastMetric = data.dailyMetrics
        .filter((m) => m.user_id === u.id)
        .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))[0]
      const daysSinceMetric = lastMetric
        ? Math.floor((new Date() - new Date(lastMetric.tarih)) / 86400000)
        : 999

      let status = 'ok'
      let statusLabel = 'Aktif'
      if (overdue.length > 0) {
        status = 'danger'
        statusLabel = `${overdue.length} geciken`
      } else if (!activeToday && daysSinceMetric >= 2) {
        status = 'warning'
        statusLabel = daysSinceMetric >= 999 ? 'Metrik yok' : `${daysSinceMetric}g sessiz`
      } else if (inbox > 0) {
        status = 'warning'
        statusLabel = `${inbox} inbox`
      } else if (!activeToday) {
        status = 'idle'
        statusLabel = 'Bugün yok'
      }

      return {
        user: u,
        arama,
        demo,
        openTasks: openTasks.length,
        overdue: overdue.length,
        inbox,
        activeToday,
        lastSeen,
        lastSeenLabel: lastSeen ? relativeTime(lastSeen) : '—',
        status,
        statusLabel,
        interactionsToday: todayInts.length,
      }
    })
    .sort((a, b) => {
      const order = { danger: 0, warning: 1, idle: 2, ok: 3 }
      return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    })
}

export function buildAttentionCompanies(data, interactions = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const results = []

  data.companies.forEach((c) => {
    if (['kaybedildi'].includes(c.pipeline)) return
    const reasons = []
    let score = 0

    if (c.pipeline === 'trial' && c.trial_bitis) {
      const days = Math.ceil((new Date(c.trial_bitis) - new Date()) / 86400000)
      if (days >= 0 && days <= 3) {
        reasons.push(`Trial ${days} gün içinde bitiyor`)
        score += 30 - days * 5
      }
    }

    if (isToday(c.demo_tarihi)) {
      reasons.push('Bugün demo var')
      score += 25
    }

    const openBugs = data.bugs.filter((b) => b.iliskili_firma_id === c.id && b.durum !== 'kapali')
    if (openBugs.length) {
      reasons.push(`${openBugs.length} açık bug`)
      score += openBugs.length * 10
    }

    const lastInt = interactions
      .filter((i) => i.firma_id === c.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const lastContact = lastInt?.created_at || c.updated_at
    if (lastContact) {
      const daysSince = Math.floor((today - new Date(lastContact)) / 86400000)
      if (daysSince >= 14 && !['musteri'].includes(c.pipeline)) {
        reasons.push(`${daysSince} gündür iletişim yok`)
        score += Math.min(daysSince, 40)
      }
    }

    if (c.updated_at && !['musteri', 'kaybedildi'].includes(c.pipeline)) {
      const stale = Math.floor((today - new Date(c.updated_at)) / 86400000)
      if (stale >= 7) {
        reasons.push(`Pipeline durgun (${stale}g)`)
        score += stale
      }
    }

    if (c.pipeline === 'demo' || c.pipeline === 'trial') {
      const pendingFb = data.feedback.filter((f) => f.firma_id === c.id && f.durum !== 'cozuldu')
      if (pendingFb.length) {
        reasons.push(`${pendingFb.length} açık geri dönüş`)
        score += 8
      }
    }

    if (reasons.length) {
      results.push({
        company: c,
        score,
        reasons,
        owner: c.sorumlu_id,
        lastContact,
      })
    }
  })

  return results.sort((a, b) => b.score - a.score).slice(0, 12)
}

export function buildMorningBriefing(data, users) {
  const todayStr = new Date().toISOString().split('T')[0]
  const stats = buildTodayInteractionStats(data.interactions)
  const team = buildTeamLiveSummary(users, data)
  const attention = buildAttentionCompanies(data, data.interactions)
  const demosToday = data.companies.filter((c) => isToday(c.demo_tarihi))
  const trialsEnding = data.companies.filter((c) => {
    if (c.pipeline !== 'trial' || !c.trial_bitis) return false
    const d = Math.ceil((new Date(c.trial_bitis) - new Date()) / 86400000)
    return d >= 0 && d <= 3
  })
  const pendingFinance = data.finance.filter((f) => f.durum === 'bekliyor')
  const criticalBugs = data.bugs.filter((b) => b.oncelik === 'kritik' && b.durum !== 'kapali')
  const inactive = team.filter((t) => t.status === 'danger' || t.status === 'warning')
  const followUps = followUpsToday(data.interactions)

  const lines = []
  lines.push(`Günaydın. Bugün ${demosToday.length} demo, ${followUps.length} geri arama ve ${stats.inbox} inbox talebi var.`)

  if (stats.calls > 0) {
    lines.push(`Bugün şu ana kadar ${stats.calls} telefon görüşmesi loglandı${stats.demos ? `, ${stats.demos} demo ayarlandı` : ''}.`)
  }

  if (pendingFinance.length) {
    const total = pendingFinance.reduce((s, f) => s + f.tutar, 0)
    lines.push(`${pendingFinance.length} gider onayı bekliyor (toplam ${formatCurrency(total)}).`)
  }

  if (trialsEnding.length) {
    lines.push(`${trialsEnding.length} firmanın trial süresi 3 gün içinde bitiyor: ${trialsEnding.map((c) => c.ad).join(', ')}.`)
  }

  if (criticalBugs.length) {
    lines.push(`${criticalBugs.length} kritik bug açık — yazılım ekibine bakın.`)
  }

  if (inactive.length) {
    lines.push(`Dikkat gerektiren ${inactive.length} personel: ${inactive.map((t) => `${t.user.name} (${t.statusLabel})`).join('; ')}.`)
  }

  if (attention.length) {
    lines.push(`Öncelikli firmalar: ${attention.slice(0, 3).map((a) => a.company.ad).join(', ')}.`)
  }

  const musteri = data.companies.filter((c) => c.pipeline === 'musteri').length
  lines.push(`Pipeline özeti: ${musteri} aktif müşteri, ${data.companies.filter((c) => c.pipeline === 'trial').length} trial, ${data.companies.filter((c) => c.pipeline === 'lead').length} lead.`)

  return {
    text: lines.join('\n\n'),
    highlights: {
      demosToday: demosToday.length,
      followUps: followUps.length,
      inbox: stats.inbox,
      pendingFinance: pendingFinance.length,
      criticalBugs: criticalBugs.length,
      attentionCount: attention.length,
    },
  }
}

export function buildCompany360(companyId, data, users) {
  const company = data.companies.find((c) => c.id === companyId)
  if (!company) return null

  const interactions = (data.interactions || []).filter((i) => i.firma_id === companyId)
  const bugs = data.bugs.filter((b) => b.iliskili_firma_id === companyId)
  const feedback = data.feedback.filter((f) => f.firma_id === companyId)
  const tasks = data.tasks.filter((t) => t.kayit_tipi === 'firma' && t.kayit_id === companyId)
  const fin = data.finance.filter((f) => f.firma_id === companyId)
  const gelir = fin.filter((f) => f.tip === 'gelir' && f.durum === 'onaylandi').reduce((s, f) => s + f.tutar, 0)
  const gider = fin.filter((f) => f.tip === 'gider' && f.durum === 'onaylandi').reduce((s, f) => s + f.tutar, 0)

  const lastContact = interactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const attention = buildAttentionCompanies(data, data.interactions).find((a) => a.company.id === companyId)

  const pipelineEvents = [
    { date: company.created_at, text: 'Firma oluşturuldu' },
    ...interactions.filter((i) => i.sonuc === 'demo_ayarlandi').map((i) => ({
      date: i.created_at,
      text: `Demo ayarlandı${i.toplanti_tarihi ? ` (${i.toplanti_tarihi})` : ''}`,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    company,
    owner: getUserName(users, company.sorumlu_id),
    stats: {
      interactions: interactions.length,
      openBugs: bugs.filter((b) => b.durum !== 'kapali').length,
      openFeedback: feedback.filter((f) => f.durum !== 'cozuldu').length,
      tasks: tasks.length,
      gelir,
      gider,
      net: gelir - gider,
    },
    lastContact: lastContact?.created_at,
    lastContactSummary: lastContact
      ? `${INTERACTION_TYPES[lastContact.tip] || lastContact.tip} — ${lastContact.ozet || lastContact.konu || '—'}`
      : null,
    attention: attention?.reasons || [],
    pipelineEvents,
  }
}

export function buildWeeklyPerformanceTrend(users, tasks, companies, dailyMetrics, weeks = 4) {
  const staff = users.filter((u) => u.status === 'aktif' && u.role !== 'patron')
  const result = []

  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date()
    end.setDate(end.getDate() - w * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    const label = w === 0 ? 'Bu hafta' : `${w} hf önce`
    let totalCalls = 0
    let totalDemos = 0
    let totalDone = 0

    staff.forEach((u) => {
      const metrics = dailyMetrics.filter((m) => {
        if (m.user_id !== u.id) return false
        const d = new Date(m.tarih)
        return d >= start && d <= end
      })
      totalCalls += metrics.reduce((s, m) => s + (m.arama_sayisi || 0), 0)
      totalDemos += metrics.reduce((s, m) => s + (m.demo_ayarlanan || 0), 0)
      totalDone += tasks.filter((t) => {
        if (t.sorumlu_id !== u.id || t.durum !== 'tamamlandi') return false
        const d = new Date(t.updated_at || t.created_at)
        return d >= start && d <= end
      }).length
    })

    const newCustomers = companies.filter((c) => {
      if (c.pipeline !== 'musteri') return false
      const d = new Date(c.updated_at || c.created_at)
      return d >= start && d <= end
    }).length

    result.push({ label, weekOffset: w, calls: totalCalls, demos: totalDemos, tasksDone: totalDone, newCustomers })
  }

  return result
}

export function answerPatronQuestion(question, data, users) {
  const q = question.toLowerCase().trim()
  const team = buildTeamLiveSummary(users, data)
  const stats = buildTodayInteractionStats(data.interactions)
  const attention = buildAttentionCompanies(data, data.interactions)

  if (q.includes('en çok') && (q.includes('arama') || q.includes('telefon'))) {
    const top = [...team].sort((a, b) => b.arama - a.arama)[0]
    return top?.arama
      ? `Bugün en çok arama yapan: **${top.user.name}** (${top.arama} arama).`
      : 'Bugün henüz arama kaydı yok.'
  }

  if (q.includes('inbox') || q.includes('talep')) {
    return `Inbox'ta **${stats.inbox}** açık talep var. Bugün ${stats.followUps} geri arama planlandı.`
  }

  if (q.includes('onay') || q.includes('gider')) {
    const pending = data.finance.filter((f) => f.durum === 'bekliyor')
    const total = pending.reduce((s, f) => s + f.tutar, 0)
    return pending.length
      ? `**${pending.length}** gider onayı bekliyor (toplam ${formatCurrency(total)}). Finans sekmesinden onaylayabilirsiniz.`
      : 'Onay bekleyen gider yok.'
  }

  if (q.includes('durgun') || q.includes('firma')) {
    if (!attention.length) return 'Dikkat gerektiren firma görünmüyor.'
    return `**${attention.length}** firma dikkat gerektiriyor:\n${attention.slice(0, 5).map((a) => `• ${a.company.ad}: ${a.reasons.join(', ')}`).join('\n')}`
  }

  if (q.includes('bug') || q.includes('kritik')) {
    const open = data.bugs.filter((b) => b.durum !== 'kapali')
    const crit = open.filter((b) => b.oncelik === 'kritik')
    return `**${open.length}** açık bug (${crit.length} kritik).`
  }

  if (q.includes('müşteri') || q.includes('musteri')) {
    const n = data.companies.filter((c) => c.pipeline === 'musteri').length
    return `Aktif müşteri sayısı: **${n}**. Trial: ${data.companies.filter((c) => c.pipeline === 'trial').length}, Lead: ${data.companies.filter((c) => c.pipeline === 'lead').length}.`
  }

  if (q.includes('kim') && (q.includes('aktif') || q.includes('çalış'))) {
    const active = team.filter((t) => t.activeToday)
    return active.length
      ? `Bugün aktif: ${active.map((t) => t.user.name).join(', ')}.`
      : 'Bugün henüz kimse aktivite kaydetmemiş.'
  }

  if (q.includes('demo')) {
    const demos = data.companies.filter((c) => isToday(c.demo_tarihi))
    return demos.length
      ? `Bugün **${demos.length}** demo: ${demos.map((c) => c.ad).join(', ')}.`
      : 'Bugün planlı demo yok.'
  }

  return 'Şu soruları sorabilirsiniz: "En çok kim arama yaptı?", "Kaç inbox talebi var?", "Onay bekleyen gider?", "Durgun firmalar?", "Kaç kritik bug?", "Kaç müşteri?", "Bugün kim aktif?", "Bugün demo var mı?"'
}
