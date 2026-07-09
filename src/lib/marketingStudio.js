/** Modulist Creative Studio — ilham şablonları ve yardımcılar */

export const PROMPT_TONES = {
  egitici: 'Eğitici / Değer',
  agresif: 'Agresif / Hook',
  hikaye: 'Hikâye / Storytelling',
  meme: 'Meme / Eğlenceli',
  kurumsal: 'Kurumsal B2B',
}

export const PROMPT_GOALS = {
  demo: 'Demo / Trial lead',
  marka: 'Marka bilinirliği',
  retarget: 'Retargeting / hatırlatma',
  egitim: 'Eğitim / güven',
}

export const EXPENSE_MARKETING_CATEGORIES = [
  { id: 'reklam', label: 'Reklam bütçesi (Meta/Google)' },
  { id: 'freelancer', label: 'Freelancer / videocu' },
  { id: 'stok', label: 'Stok foto / asset' },
  { id: 'yazilim', label: 'Araç / yazılım aboneliği' },
  { id: 'diger', label: 'Diğer' },
]

export const INSPIRATION_CARDS = [
  {
    id: 'excel-vs-modulist',
    title: 'Excel vs Modulist',
    hook: 'Emlakçılar hâlâ Excel mi kullanıyor?',
    format: 'reels',
    platform: 'instagram',
    why: 'Karşılaştırma formatı yüksek kaydetme oranı getirir.',
    tags: ['karşılaştırma', 'pain point'],
  },
  {
    id: '3-hata',
    title: '3 Hata Emlakçılar Yapıyor',
    hook: 'Bu 3 hatayı yapıyorsan lead kaçırıyorsun…',
    format: 'reels',
    platform: 'instagram',
    why: 'Liste formatı izlenme süresini uzatır.',
    tags: ['liste', 'eğitim'],
  },
  {
    id: 'demo-an',
    title: 'Demo Anı',
    hook: 'Müşteri ekranda bunu görünce şok oldu',
    format: 'reels',
    platform: 'instagram',
    why: 'Sosyal kanıt + reaksiyon güven oluşturur.',
    tags: ['demo', 'sosyal kanıt'],
  },
  {
    id: 'gunluk-rutin',
    title: 'Emlakçı Günü',
    hook: 'Sabah 9 — Modulist açılmadan önce vs sonra',
    format: 'carousel',
    platform: 'instagram',
    why: 'Before/after carousel DM oranını artırır.',
    tags: ['carousel', 'before-after'],
  },
  {
    id: 'linkedin-b2b',
    title: 'Ofis Sahibi Perspektifi',
    hook: '10 kişilik ofiste Excel ile yönetmek imkânsız',
    format: 'linkedin',
    platform: 'linkedin',
    why: 'LinkedIn B2B karar vericiye hitap eder.',
    tags: ['linkedin', 'b2b'],
  },
  {
    id: 'trial-urgency',
    title: 'Trial Bitiyor',
    hook: 'Trial bitmeden bunu dene yoksa pişman olursun',
    format: 'story',
    platform: 'instagram',
    why: 'Aciliyet story swipe-up / DM tetikler.',
    tags: ['story', 'urgency'],
  },
  {
    id: 'musteri-yorumu',
    title: 'Müşteri Yorumu',
    hook: '"Modulist olmadan ofisi yönetemem" — Atlas Emlak',
    format: 'reels',
    platform: 'instagram',
    why: 'Testimonial en yüksek güven formatı.',
    tags: ['testimonial', 'trust'],
  },
  {
    id: 'feature-spotlight',
    title: 'Özellik Spotlight',
    hook: 'İhale takibi 30 saniyede — böyle çalışıyor',
    format: 'reels',
    platform: 'tiktok',
    why: 'Tek özellik derinlemesine anlatım demo lead getirir.',
    tags: ['feature', 'product'],
  },
]

export function cardToPromptParams(card, overrides = {}) {
  return {
    format: overrides.format || card.format,
    platform: overrides.platform || card.platform,
    hook: overrides.hook || card.hook,
    konu: card.title,
    ton: overrides.ton || 'egitici',
    hedef: overrides.hedef || 'demo',
    sektor: 'emlak ofisleri',
    not: `${card.why} Etiketler: ${card.tags?.join(', ') || ''}`,
  }
}

export function parsePromptSections(text) {
  if (!text) return {}
  const sections = {}
  const headers = [
    { key: 'ozet', re: /##?\s*(Özet|Kısa özet)/i },
    { key: 'hook', re: /##?\s*Hook/i },
    { key: 'senaryo', re: /##?\s*(Senaryo|Tam senaryo|Sahne)/i },
    { key: 'gorsel', re: /##?\s*(Görsel prompt|Gorsel|Midjourney|DALL)/i },
    { key: 'video', re: /##?\s*(Video prompt|Runway|Pika|Kling)/i },
    { key: 'caption', re: /##?\s*(Caption|Metin|Hashtag)/i },
    { key: 'adcopy', re: /##?\s*(Reklam metni|Meta Ads|Ad copy)/i },
    { key: 'checklist', re: /##?\s*Checklist/i },
  ]
  for (const h of headers) {
    const match = text.match(new RegExp(`${h.re.source}[\\s\\S]*?(?=\\n##|$)`, 'i'))
    if (match) sections[h.key] = match[0].replace(/^[^\n]+\n/, '').trim()
  }
  if (!sections.hook) {
    const hookMatch = text.match(/hook[:\s]+(.+)/i)
    if (hookMatch) sections.hook = hookMatch[1].trim()
  }
  return sections
}

export function marketingTodayStats({ contents, campaigns, finance, currentUserId }) {
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const upcoming = contents.filter((c) => {
    if (!c.yayin_tarihi) return ['fikir', 'senaryo', 'cekim', 'kurgu'].includes(c.durum)
    const d = new Date(c.yayin_tarihi)
    return d <= weekEnd && !['yayinda', 'arsiv'].includes(c.durum)
  })
  const pendingExpenses = finance.filter(
    (f) => f.giren_id === currentUserId && f.tip === 'gider' && f.durum === 'bekliyor',
  )
  const pipeline = contents.filter((c) => !['yayinda', 'olculdu', 'arsiv'].includes(c.durum))
  const activeCampaigns = campaigns.filter((c) => {
    if (!c.donem_bitis) return true
    return new Date(c.donem_bitis) >= new Date()
  })
  return { upcoming: upcoming.length, pendingExpenses: pendingExpenses.length, pipeline: pipeline.length, activeCampaigns: activeCampaigns.length }
}
