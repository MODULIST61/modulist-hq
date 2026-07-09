/** Dış iletişim kayıtları — Sekreter merkezi */

export const INTERACTION_TYPES = {
  telefon_giden: 'Telefon (giden)',
  telefon_gelen: 'Telefon (gelen)',
  yuz_yuze: 'Yüz yüze',
  whatsapp: 'WhatsApp',
  email: 'E-posta',
  demo: 'Demo / sunum',
  destek: 'Destek talebi',
  diger: 'Diğer',
}

export const INTERACTION_RESULTS = {
  bekliyor: 'Bekliyor',
  ulasildi: 'Ulaşıldı',
  ulasilamadi: 'Ulaşılamadı',
  mesaj_birakildi: 'Mesaj bırakıldı',
  demo_ayarlandi: 'Demo ayarlandı',
  destek_acildi: 'Destek açıldı',
  bilgi_verildi: 'Bilgi verildi',
  kayip: 'Kayıp / ilgisiz',
  tamamlandi: 'Tamamlandı',
}

export const REQUEST_TYPES = {
  satis: 'Satış / demo',
  destek: 'Teknik destek',
  fatura: 'Fatura / dekont',
  is_birligi: 'İş birliği',
  genel: 'Genel',
}

export const INTERACTION_STATUS = {
  inbox: 'Inbox',
  islemde: 'İşlemde',
  tamamlandi: 'Tamamlandı',
}

export const PHONE_TYPES = ['telefon_giden', 'telefon_gelen']
export const MEETING_TYPES = ['yuz_yuze', 'demo']

export function isPhoneInteraction(i) {
  return PHONE_TYPES.includes(i?.tip)
}

export function isTodayDate(d) {
  if (!d) return false
  return new Date(d).toDateString() === new Date().toDateString()
}

export function isDueToday(d) {
  if (!d) return false
  const t = new Date(d)
  const now = new Date()
  return t.toDateString() === now.toDateString() || t < now
}

export function isOverdueFollowUp(i) {
  if (!i?.takip_tarihi || i.durum === 'tamamlandi') return false
  return new Date(i.takip_tarihi) < new Date()
}

export function inboxItems(interactions) {
  return (interactions || []).filter((i) => i.durum === 'inbox')
}

export function followUpsToday(interactions) {
  return (interactions || []).filter(
    (i) => i.takip_tarihi && i.durum !== 'tamamlandi' && isDueToday(i.takip_tarihi),
  ).sort((a, b) => new Date(a.takip_tarihi) - new Date(b.takip_tarihi))
}

export function meetingsOnDate(interactions, dateKey) {
  return (interactions || []).filter(
    (i) => i.toplanti_tarihi === dateKey && MEETING_TYPES.includes(i.tip),
  )
}

export function callbacksOnDate(interactions, dateKey) {
  return (interactions || []).filter((i) => {
    if (!i.takip_tarihi || i.durum === 'tamamlandi') return false
    const d = new Date(i.takip_tarihi)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return key === dateKey
  })
}

export function computeDailyMetricsFromInteractions(interactions, userId, tarih) {
  const dayItems = (interactions || []).filter((i) => {
    if (i.user_id !== userId) return false
    const created = i.created_at?.split('T')[0]
    return created === tarih
  })
  const phone = dayItems.filter(isPhoneInteraction)
  const reached = phone.filter((i) => ['ulasildi', 'demo_ayarlandi', 'destek_acildi', 'bilgi_verildi'].includes(i.sonuc))
  const demos = dayItems.filter((i) => i.sonuc === 'demo_ayarlandi' || i.tip === 'demo')
  const follow = dayItems.filter((i) => i.takip_tarihi && i.durum !== 'tamamlandi')

  return {
    arama_sayisi: phone.length,
    ulasilan: reached.length,
    demo_ayarlanan: demos.length,
    takip_aramasi: follow.length,
  }
}

export function interactionIcon(tip) {
  const map = {
    telefon_giden: '📞',
    telefon_gelen: '📲',
    yuz_yuze: '🤝',
    whatsapp: '💬',
    email: '✉️',
    demo: '🖥️',
    destek: '🛠️',
    diger: '📋',
  }
  return map[tip] || '📋'
}

export function emptyInteraction(userId, overrides = {}) {
  return {
    tip: 'telefon_giden',
    yon: 'giden',
    firma_id: null,
    kisi_adi: '',
    telefon: '',
    konu: '',
    ozet: '',
    sonuc: 'ulasildi',
    talep_tipi: 'genel',
    durum: 'islemde',
    takip_tarihi: null,
    takip_notu: '',
    toplanti_tarihi: '',
    toplanti_saati: '',
    lokasyon: '',
    sorumlu_id: userId,
    user_id: userId,
    ...overrides,
  }
}
