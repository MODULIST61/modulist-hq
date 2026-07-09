import { relativeTime, formatCurrency, isToday, isThisMonth, getUserName } from './utils'

const HOURS_24 = 24 * 60 * 60 * 1000

export function buildActivityFeed(data, users, limit = 30) {
  const items = []
  const { messages, tasks, companies, bugs, finance, feedback, dailyMetrics, rooms } = data

  messages.filter((m) => !m.is_dm).slice(-50).forEach((m) => {
    const room = rooms.find((r) => r.id === m.room_id)
    items.push({
      id: `msg-${m.id}`,
      type: 'mesaj',
      icon: '💬',
      text: `${getUserName(users, m.user_id)} #${room?.name || m.room_id}: ${m.text.slice(0, 80)}`,
      time: m.created_at,
      link: `/mesajlar?oda=${room?.slug || 'genel'}`,
    })
  })

  tasks.slice(-20).forEach((t) => {
    if (t.durum === 'tamamlandi') {
      items.push({
        id: `task-done-${t.id}`,
        type: 'gorev',
        icon: '✅',
        text: `Görev tamamlandı: ${t.baslik}`,
        time: t.updated_at || t.created_at,
        link: '/yazilim?tab=isler',
      })
    }
  })

  companies.filter((c) => c.updated_at).slice(-10).forEach((c) => {
    items.push({
      id: `co-${c.id}-${c.updated_at}`,
      type: 'firma',
      icon: '🏢',
      text: `${c.ad} — pipeline: ${c.pipeline}`,
      time: c.updated_at,
      link: `/sekreter/firmalar/${c.id}`,
    })
  })

  bugs.slice(-10).forEach((b) => {
    items.push({
      id: `bug-${b.id}`,
      type: 'bug',
      icon: '🐛',
      text: `Bug [${b.durum}]: ${b.baslik}`,
      time: b.updated_at || b.created_at,
      link: '/yazilim?tab=buglar',
    })
  })

  finance.filter((f) => f.durum === 'bekliyor').forEach((f) => {
    items.push({
      id: `fin-${f.id}`,
      type: 'finans',
      icon: '💰',
      text: `Onay bekleyen gider: ${formatCurrency(f.tutar)} — ${f.aciklama || f.kategori}`,
      time: f.created_at,
      link: '/patron?tab=finans',
    })
  })

  feedback.filter((f) => f.durum !== 'cozuldu').slice(-5).forEach((f) => {
    items.push({
      id: `fb-${f.id}`,
      type: 'geri_donus',
      icon: '📣',
      text: `Geri dönüş [${f.tip}]: ${f.metin?.slice(0, 60)}`,
      time: f.created_at,
      link: '/yazilim?tab=geri-donusler',
    })
  })

  dailyMetrics.filter((d) => isToday(d.tarih)).forEach((d) => {
    items.push({
      id: `dm-${d.id}`,
      type: 'metrik',
      icon: '📞',
      text: `${getUserName(users, d.user_id)} bugün ${d.arama_sayisi} arama yaptı`,
      time: d.created_at,
      link: '/sekreter?tab=metrik',
    })
  })

  return items
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit)
}

export function buildTeamWorkload(tasks, users) {
  return users
    .filter((u) => u.status === 'aktif')
    .map((u) => {
      const mine = tasks.filter((t) => t.sorumlu_id === u.id && t.durum !== 'tamamlandi' && t.durum !== 'iptal')
      const overdue = mine.filter((t) => t.bitis_tarihi && new Date(t.bitis_tarihi) < new Date())
      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        open: mine.length,
        overdue: overdue.length,
        done: tasks.filter((t) => t.sorumlu_id === u.id && t.durum === 'tamamlandi').length,
      }
    })
    .sort((a, b) => b.open - a.open)
}

export function buildRoomPulse(messages, rooms, users) {
  const since = Date.now() - HOURS_24
  return rooms.map((room) => {
    const recent = messages.filter((m) => m.room_id === room.id && !m.is_dm && new Date(m.created_at).getTime() > since)
    const authors = [...new Set(recent.map((m) => m.user_id))]
    return {
      room,
      count: recent.length,
      authors: authors.map((id) => getUserName(users, id)).slice(0, 3),
    }
  }).filter((r) => r.count > 0).sort((a, b) => b.count - a.count)
}

export function buildMarketingStats(campaigns, companies) {
  const active = campaigns.filter((c) => {
    const end = c.donem_bitis ? new Date(c.donem_bitis) : new Date()
    return end >= new Date()
  })
  const harcanan = campaigns.reduce((s, c) => s + (c.butce_harcanan || 0), 0)
  const plan = campaigns.reduce((s, c) => s + (c.butce_plan || 0), 0)
  const tiklama = campaigns.reduce((s, c) => s + (c.tiklama || 0), 0)
  const kayit = campaigns.reduce((s, c) => s + (c.kayit_sayisi || 0), 0)
  const musteri = companies.filter((c) => c.pipeline === 'musteri').length

  const byChannel = {}
  campaigns.forEach((c) => {
    const ch = c.kanal || 'Diğer'
    if (!byChannel[ch]) byChannel[ch] = { harcanan: 0, tiklama: 0, kayit: 0, count: 0 }
    byChannel[ch].harcanan += c.butce_harcanan || 0
    byChannel[ch].tiklama += c.tiklama || 0
    byChannel[ch].kayit += c.kayit_sayisi || 0
    byChannel[ch].count += 1
  })

  const thisMonth = campaigns.filter((c) => isThisMonth(c.donem_baslangic || c.created_at))
  const lastMonthSpend = campaigns
    .filter((c) => {
      const d = new Date(c.donem_baslangic || c.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, c) => s + (c.butce_harcanan || 0), 0)
  const thisMonthSpend = thisMonth.reduce((s, c) => s + (c.butce_harcanan || 0), 0)

  return {
    activeCount: active.length,
    harcanan,
    plan,
    tiklama,
    kayit,
    musteri,
    cpa: kayit > 0 ? Math.round(harcanan / kayit) : 0,
    cpm: tiklama > 0 ? Math.round((harcanan / tiklama) * 1000) : 0,
    budgetPct: plan > 0 ? Math.round((harcanan / plan) * 100) : 0,
    byChannel,
    thisMonthSpend,
    lastMonthSpend,
    spendDelta: lastMonthSpend > 0 ? Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100) : 0,
  }
}

export function todayCallTotals(dailyMetrics) {
  const today = dailyMetrics.filter((d) => isToday(d.tarih))
  return {
    arama: today.reduce((s, d) => s + (d.arama_sayisi || 0), 0),
    ulasilan: today.reduce((s, d) => s + (d.ulasilan || 0), 0),
    demo: today.reduce((s, d) => s + (d.demo_ayarlanan || 0), 0),
    entries: today.length,
  }
}

export function pipelineFunnel(companies) {
  const stages = ['lead', 'temas', 'demo', 'trial', 'odeme_bekliyor', 'musteri', 'kayip']
  return stages.map((s) => ({
    stage: s,
    count: companies.filter((c) => c.pipeline === s).length,
  }))
}
