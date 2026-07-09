import { FINANCE_CATEGORY_LABELS } from './constants'
import { formatCurrency, getUserName, isThisMonth, isToday } from './utils'

const MS_DAY = 86400000

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  const names = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}

export function approvedFinance(finance, { tip, monthOnly } = {}) {
  return finance.filter((f) => {
    if (f.durum !== 'onaylandi') return false
    if (tip && f.tip !== tip) return false
    if (monthOnly && !isThisMonth(f.tarih)) return false
    return true
  })
}

export function sumFinance(items) {
  return items.reduce((s, f) => s + Number(f.tutar || 0), 0)
}

export function buildAccountingKpis(finance, companies, settings) {
  const monthApproved = approvedFinance(finance, { monthOnly: true })
  const gelir = sumFinance(monthApproved.filter((f) => f.tip === 'gelir'))
  const gider = sumFinance(monthApproved.filter((f) => f.tip === 'gider'))
  const pending = finance.filter((f) => f.durum === 'bekliyor')
  const customers = companies.filter((c) => c.pipeline === 'musteri')
  const mrr = customers.reduce((s, c) => s + Number(c.aylik_tutar || 0), 0)
  const bekleyenHavale = companies
    .filter((c) => ['musteri', 'odeme_bekliyor', 'trial'].includes(c.pipeline) && c.dekont_durumu === 'bekliyor')
    .reduce((s, c) => s + Number(c.aylik_tutar || 0), 0)

  return {
    gelir,
    gider,
    net: gelir - gider,
    pendingCount: pending.length,
    pendingTotal: sumFinance(pending),
    bekleyenHavale,
    mrr: mrr || settings?.estimatedMrr || 0,
    customerCount: customers.length,
  }
}

export function buildDueToday(companies, finance) {
  const items = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  companies.forEach((c) => {
    if (c.pipeline === 'trial' && c.trial_bitis) {
      const days = Math.ceil((new Date(c.trial_bitis) - today) / MS_DAY)
      if (days >= 0 && days <= 3) {
        items.push({
          type: 'trial',
          company: c,
          label: `Trial bitiyor: ${c.ad} (${days} gün)`,
          amount: c.aylik_tutar,
          priority: days === 0 ? 'danger' : 'warning',
        })
      }
    }
    if (['musteri', 'odeme_bekliyor'].includes(c.pipeline) && c.dekont_durumu === 'bekliyor') {
      items.push({
        type: 'dekont',
        company: c,
        label: `Dekont bekleniyor: ${c.ad}`,
        amount: c.aylik_tutar,
        priority: 'warning',
      })
    }
    if (c.pipeline === 'odeme_bekliyor') {
      items.push({
        type: 'odeme',
        company: c,
        label: `Ödeme bekliyor: ${c.ad}`,
        amount: c.aylik_tutar,
        priority: 'danger',
      })
    }
  })

  return items.sort((a, b) => {
    const order = { danger: 0, warning: 1, default: 2 }
    return (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
  })
}

export function buildRecentMovements(finance, users, days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  return finance
    .filter((f) => new Date(f.tarih) >= since)
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
    .slice(0, 15)
    .map((f) => ({
      ...f,
      girenName: getUserName(users, f.giren_id),
    }))
}

export function buildAdSpendVsExpense(campaigns, finance) {
  const campaignSpend = campaigns.reduce((s, c) => s + Number(c.butce_harcanan || 0), 0)
  const approvedAdExpense = sumFinance(
    approvedFinance(finance).filter((f) => f.tip === 'gider' && f.kategori === 'reklam'),
  )
  const pendingAd = sumFinance(
    finance.filter((f) => f.tip === 'gider' && f.kategori === 'reklam' && f.durum === 'bekliyor'),
  )
  const gap = campaignSpend - approvedAdExpense

  return {
    campaignSpend,
    approvedAdExpense,
    pendingAd,
    gap,
    matched: Math.abs(gap) < 100,
  }
}

export function buildCollectionQueue(companies, finance) {
  const relevant = companies.filter((c) =>
    ['musteri', 'odeme_bekliyor', 'trial'].includes(c.pipeline),
  )

  return relevant
    .map((c) => {
      const payments = finance.filter((f) => f.firma_id === c.id && f.tip === 'gelir' && f.durum === 'onaylandi')
      const lastPayment = payments.sort((a, b) => new Date(b.tarih) - new Date(a.tarih))[0]
      const daysSincePayment = lastPayment?.tarih
        ? Math.floor((new Date() - new Date(lastPayment.tarih)) / MS_DAY)
        : null

      let status = 'ok'
      let statusLabel = 'Güncel'
      if (c.dekont_durumu === 'bekliyor') {
        status = 'warning'
        statusLabel = 'Dekont bekliyor'
      } else if (c.pipeline === 'odeme_bekliyor') {
        status = 'danger'
        statusLabel = 'Ödeme bekliyor'
      } else if (daysSincePayment !== null && daysSincePayment > 35) {
        status = 'warning'
        statusLabel = `${daysSincePayment}g ödeme yok`
      } else if (c.dekont_durumu === 'yok' && c.pipeline === 'musteri') {
        status = 'idle'
        statusLabel = 'Dekont yok'
      }

      return {
        company: c,
        lastPayment,
        daysSincePayment,
        totalPaid: sumFinance(payments),
        status,
        statusLabel,
      }
    })
    .sort((a, b) => {
      const order = { danger: 0, warning: 1, idle: 2, ok: 3 }
      return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    })
}

export function buildMonthlyTrend(finance, months = 6) {
  const result = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d.toISOString())
    const monthItems = approvedFinance(finance).filter((f) => monthKey(f.tarih) === key)
    const gelir = sumFinance(monthItems.filter((f) => f.tip === 'gelir'))
    const gider = sumFinance(monthItems.filter((f) => f.tip === 'gider'))
    result.push({ key, label: monthLabel(key), gelir, gider, net: gelir - gider })
  }

  return result
}

export function buildCategoryBreakdown(finance, monthOnly = true) {
  const items = monthOnly ? approvedFinance(finance, { monthOnly: true }) : approvedFinance(finance)
  const map = {}
  items.forEach((f) => {
    const key = FINANCE_CATEGORY_LABELS[f.kategori] || f.kategori
    if (!map[key]) map[key] = { gelir: 0, gider: 0 }
    if (f.tip === 'gelir') map[key].gelir += Number(f.tutar)
    else map[key].gider += Number(f.tutar)
  })
  return Object.entries(map)
    .map(([label, v]) => ({ label, gelir: v.gelir, gider: v.gider, net: v.gelir - v.gider }))
    .sort((a, b) => Math.abs(b.gider + b.gelir) - Math.abs(a.gider + a.gelir))
}

export function buildMrrTrend(companies, months = 6) {
  const result = []
  const now = new Date()
  const customers = companies.filter((c) => c.pipeline === 'musteri')

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const count = customers.filter((c) => {
      const created = new Date(c.updated_at || c.created_at)
      return created <= end
    }).length
    const mrr = customers
      .filter((c) => {
        const became = new Date(c.updated_at || c.created_at)
        return became <= end
      })
      .reduce((s, c) => s + Number(c.aylik_tutar || 0), 0)

    result.push({
      label: monthLabel(monthKey(d.toISOString())),
      count,
      mrr,
    })
  }

  return result
}

export function buildAdRoi(campaigns, finance, companies) {
  const spend = campaigns.reduce((s, c) => s + Number(c.butce_harcanan || 0), 0)
  const leads = campaigns.reduce((s, c) => s + Number(c.kayit_sayisi || 0), 0)
  const customers = companies.filter((c) => c.pipeline === 'musteri').length
  const revenue = sumFinance(approvedFinance(finance).filter((f) => f.tip === 'gelir'))
  const monthlyRevenue = sumFinance(approvedFinance(finance, { tip: 'gelir', monthOnly: true }))

  return {
    spend,
    leads,
    customers,
    cpa: leads > 0 ? Math.round(spend / leads) : 0,
    cac: customers > 0 ? Math.round(spend / customers) : 0,
    revenue,
    monthlyRevenue,
    roiPct: spend > 0 ? Math.round(((monthlyRevenue - spend) / spend) * 100) : 0,
  }
}

export function buildBudgetOverview(campaigns, finance, settings) {
  const budgets = settings?.financeBudgets || { reklam: 10000, diger: 5000 }
  const monthGider = approvedFinance(finance, { tip: 'gider', monthOnly: true })
  const byCategory = {}
  monthGider.forEach((f) => {
    byCategory[f.kategori] = (byCategory[f.kategori] || 0) + Number(f.tutar)
  })

  const campaignPlan = campaigns.reduce((s, c) => s + Number(c.butce_plan || 0), 0)
  const campaignSpent = campaigns.reduce((s, c) => s + Number(c.butce_harcanan || 0), 0)
  const reklamBudget = budgets.reklam || campaignPlan || 0
  const reklamSpent = byCategory.reklam || 0

  return {
    rows: [
      {
        label: 'Reklam',
        budget: reklamBudget,
        spent: Math.max(reklamSpent, campaignSpent),
        source: 'campaign+finance',
      },
      {
        label: 'Diğer giderler',
        budget: budgets.diger || 0,
        spent: byCategory.diger || 0,
      },
      {
        label: 'Altyapı',
        budget: budgets.altyapi || 0,
        spent: byCategory.altyapi || 0,
      },
    ],
    campaignPlan,
    campaignSpent,
  }
}

export function buildFinanceSuggestions(finance, campaigns, companies) {
  const suggestions = []

  campaigns.forEach((c) => {
    const spent = Number(c.butce_harcanan || 0)
    if (spent <= 0) return
    const linked = finance.filter(
      (f) => f.kampanya_id === c.id && f.tip === 'gider' && f.durum === 'onaylandi',
    )
    const recorded = sumFinance(linked)
    if (spent - recorded > 50) {
      suggestions.push({
        id: `camp-${c.id}`,
        type: 'missing_expense',
        icon: '📢',
        title: `Kampanya gider kaydı eksik: ${c.ad}`,
        detail: `Kampanyada ${formatCurrency(spent)} harcanmış, onaylı gider ${formatCurrency(recorded)}`,
        action: 'create_expense',
        payload: { kampanya_id: c.id, tutar: spent - recorded, kategori: 'reklam' },
      })
    }
  })

  companies
    .filter((c) => c.pipeline === 'musteri' && c.dekont_durumu === 'alindi')
    .forEach((c) => {
      const thisMonthRevenue = finance.find(
        (f) =>
          f.firma_id === c.id &&
          f.tip === 'gelir' &&
          f.durum === 'onaylandi' &&
          isThisMonth(f.tarih),
      )
      if (!thisMonthRevenue && Number(c.aylik_tutar) > 0) {
        suggestions.push({
          id: `rev-${c.id}`,
          type: 'missing_revenue',
          icon: '💵',
          title: `Gelir kaydı eksik: ${c.ad}`,
          detail: `Dekont alındı ama bu ay ${formatCurrency(c.aylik_tutar)} gelir kaydı yok`,
          action: 'create_revenue',
          payload: { firma_id: c.id, tutar: c.aylik_tutar },
        })
      }
    })

  companies
    .filter((c) => c.pipeline === 'musteri' && c.dekont_durumu === 'bekliyor')
    .forEach((c) => {
      suggestions.push({
        id: `col-${c.id}`,
        type: 'collection',
        icon: '🏦',
        title: `Tahsilat bekleniyor: ${c.ad}`,
        detail: `${formatCurrency(c.aylik_tutar || 0)} — dekont bekliyor`,
        action: 'mark_collection',
        payload: { firma_id: c.id },
      })
    })

  return suggestions.slice(0, 12)
}

export function buildMonthlyReportText(kpis, trend, categories, roi, monthLabelStr) {
  const lines = [
    'MODULIST HQ — AYLIK MUHASEBE ÖZETİ',
    monthLabelStr,
    '',
    '--- ÖZET ---',
    `Gelir: ${formatCurrency(kpis.gelir)}`,
    `Gider: ${formatCurrency(kpis.gider)}`,
    `Net: ${formatCurrency(kpis.net)}`,
    `MRR: ${formatCurrency(kpis.mrr)} (${kpis.customerCount} müşteri)`,
    `Bekleyen havale: ${formatCurrency(kpis.bekleyenHavale)}`,
    '',
    '--- SON 6 AY ---',
    ...trend.map((t) => `${t.label}: gelir ${formatCurrency(t.gelir)}, gider ${formatCurrency(t.gider)}, net ${formatCurrency(t.net)}`),
    '',
    '--- KATEGORİ (BU AY) ---',
    ...categories.map((c) => `${c.label}: gelir ${formatCurrency(c.gelir)}, gider ${formatCurrency(c.gider)}`),
    '',
    '--- REKLAM ROI ---',
    `Harcama: ${formatCurrency(roi.spend)} · CPA: ₺${roi.cpa} · Bu ay gelir: ${formatCurrency(roi.monthlyRevenue)}`,
    '',
    '— Modulist HQ muhasebe raporu —',
  ]
  return lines.join('\n')
}

export function financeToAccountantCsv(finance, users, companies) {
  const getName = (id) => users.find((u) => u.id === id)?.name || ''
  const getCompany = (id) => companies.find((c) => c.id === id)?.ad || ''
  return finance
    .filter((f) => f.durum === 'onaylandi')
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
    .map((f) => ({
      Tarih: f.tarih,
      'Fiş No': f.fatura_no || f.id.slice(0, 8),
      Tip: f.tip === 'gelir' ? 'Gelir' : 'Gider',
      Kategori: FINANCE_CATEGORY_LABELS[f.kategori] || f.kategori,
      Tutar: f.tutar,
      KDV: f.tip === 'gelir' ? Math.round(Number(f.tutar) * 0.2 * 100) / 100 : '',
      Aciklama: f.aciklama || '',
      Firma: f.firma_adi || getCompany(f.firma_id),
      'Giren Kisi': getName(f.giren_id),
      'Odeme Yontemi': f.odeme_yontemi || 'havale',
    }))
}

export function emptyRevenueFromCompany(company, userId) {
  return {
    tip: 'gelir',
    kategori: 'abonelik',
    tutar: Number(company.aylik_tutar) || 0,
    firma_id: company.id,
    firma_adi: company.ad,
    tarih: new Date().toISOString().split('T')[0],
    aciklama: `${company.ad} — abonelik geliri`,
    durum: 'onaylandi',
    odeme_yontemi: 'havale',
    giren_id: userId,
  }
}
