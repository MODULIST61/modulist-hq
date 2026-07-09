/** Eski URL'lerden yeni hub yapısına yönlendirme */

export const LEGACY_REDIRECTS = {
  '/isler': '/yazilim?tab=isler',
  '/kayitlar': '/sekreter?tab=firmalar',
  '/kayitlar/firmalar': '/sekreter?tab=firmalar',
  '/kayitlar/buglar': '/yazilim?tab=buglar',
  '/kayitlar/kampanyalar': '/reklam?tab=kampanya',
  '/kayitlar/geri-donusler': '/yazilim?tab=geri-donusler',
  '/kayitlar/gunluk-metrik': '/sekreter?tab=metrik',
  '/takvim': '/sekreter?tab=takvim',
  '/performans': '/patron?tab=performans',
  '/haftalik-ozet': '/patron?tab=haftalik',
  '/finans': '/patron?tab=finans',
  '/kararlar': '/yazilim?tab=kararlar',
  '/ekip': '/patron?tab=ekip',
  '/personel': '/patron?tab=personel',
  '/denetim': '/patron?tab=denetim',
  '/mudur': '/patron?tab=mudur',
}

export function hubPathForUser(user) {
  if (!user) return '/'
  if (user.role === 'patron') return '/patron'
  const pages = user.permissions?.pages || {}
  if (pages.software) return '/yazilim'
  if (pages.secretary) return '/sekreter'
  if (pages.marketing) return '/reklam'
  if (pages.accounting) return '/muhasebe'
  return '/'
}
