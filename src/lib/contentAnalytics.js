import { formatDate } from './utils'

export function buildContentImpact(contents, campaigns, companies) {
  const published = contents.filter((c) => ['yayinda', 'olculdu'].includes(c.durum))

  const byContent = published.map((c) => {
    const camp = campaigns.find((x) => x.id === c.kampanya_id)
    const engagement = (c.begeni || 0) + (c.kaydetme || 0) * 2 + (c.dm_sayisi || 0) * 3
    const views = c.goruntulenme || 0
    const leads = c.lead_sayisi || 0
    const score = views > 0 ? Math.round((leads / views) * 10000) / 100 : leads > 0 ? 100 : 0
    return {
      id: c.id,
      baslik: c.baslik,
      tip: c.tip,
      platform: c.platform,
      yayin: c.yayin_tarihi,
      goruntulenme: views,
      begeni: c.begeni || 0,
      kaydetme: c.kaydetme || 0,
      dm: c.dm_sayisi || 0,
      leads,
      engagement,
      score,
      kampanya: camp?.ad,
    }
  }).sort((a, b) => b.score - a.score || b.leads - a.leads)

  const weeklyMap = {}
  published.forEach((c) => {
    if (!c.yayin_tarihi) return
    const w = getWeekKey(c.yayin_tarihi)
    if (!weeklyMap[w]) weeklyMap[w] = { week: w, contentCount: 0, leads: 0, views: 0 }
    weeklyMap[w].contentCount += 1
    weeklyMap[w].leads += c.lead_sayisi || 0
    weeklyMap[w].views += c.goruntulenme || 0
  })

  const weekly = Object.values(weeklyMap).sort((a, b) => b.week.localeCompare(a.week)).slice(0, 8)

  const byType = {}
  published.forEach((c) => {
    const t = c.tip || 'reels'
    if (!byType[t]) byType[t] = { count: 0, leads: 0, views: 0 }
    byType[t].count += 1
    byType[t].leads += c.lead_sayisi || 0
    byType[t].views += c.goruntulenme || 0
  })

  const pipelineLeads = companies.filter((c) => {
    const d = c.created_at ? new Date(c.created_at) : null
    if (!d) return false
    const days = (Date.now() - d) / 86400000
    return days <= 30
  }).length

  return {
    topContent: byContent.slice(0, 10),
    weekly,
    byType: Object.entries(byType).map(([label, v]) => ({ label, ...v })),
    totals: {
      published: published.length,
      totalLeads: byContent.reduce((s, c) => s + c.leads, 0),
      totalViews: byContent.reduce((s, c) => s + c.goruntulenme, 0),
      pipelineLeads30d: pipelineLeads,
    },
  }
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return monday.toISOString().split('T')[0]
}

export function formatContentSummaryForAi(contents, campaigns) {
  return contents.slice(0, 30).map((c) => ({
    baslik: c.baslik,
    hook: c.hook,
    tip: c.tip,
    platform: c.platform,
    durum: c.durum,
    yayin: c.yayin_tarihi,
    goruntulenme: c.goruntulenme,
    lead: c.lead_sayisi,
    kampanya: campaigns.find((x) => x.id === c.kampanya_id)?.ad,
  }))
}
