export const STORAGE_KEYS = {
  USERS: 'hq_users',
  SESSION: 'hq_session',
  ROOMS: 'hq_rooms',
  MESSAGES: 'hq_messages',
  TASKS: 'hq_tasks',
  COMPANIES: 'hq_companies',
  BUGS: 'hq_bugs',
  CAMPAIGNS: 'hq_campaigns',
  CONTENTS: 'hq_contents',
  FINANCE: 'hq_finance',
  FEEDBACK: 'hq_feedback',
  DAILY_METRICS: 'hq_daily_metrics',
  DM_THREADS: 'hq_dm_threads',
  NOTIFICATIONS: 'hq_notifications',
  SETTINGS: 'hq_settings',
  INITIALIZED: 'hq_initialized',
}

export const ROLES = {
  PATRON: 'patron',
  DEV: 'dev',
  MARKETING: 'marketing',
  SALES: 'sales',
  OPS: 'ops',
}

export const ROLE_LABELS = {
  patron: 'Patron',
  member: 'Ekip Üyesi',
  dev: 'Yazılım',
  marketing: 'Pazarlama',
  sales: 'Satış',
  ops: 'Operasyon',
}

export const ROLE_COLORS = {
  patron: 'bg-amber-100 text-amber-800 border-amber-200',
  dev: 'bg-blue-100 text-blue-800 border-blue-200',
  marketing: 'bg-purple-100 text-purple-800 border-purple-200',
  sales: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ops: 'bg-orange-100 text-orange-800 border-orange-200',
}

export const ROOMS = [
  { slug: 'genel', name: 'Genel', description: 'Tüm ekip' },
  { slug: 'urun', name: 'Ürün', description: 'Yazılım ve ürün' },
  { slug: 'satis', name: 'Satış', description: 'Satış koordinasyonu' },
  { slug: 'buyume', name: 'Büyüme', description: 'Pazarlama ve büyüme' },
  { slug: 'finans', name: 'Finans', description: 'Finans (sadece Patron)' },
  { slug: 'operasyon', name: 'Operasyon', description: 'Operasyon ve sekreterya' },
]

export const PIPELINE_STAGES = [
  'lead',
  'temas',
  'demo',
  'trial',
  'odeme_bekliyor',
  'musteri',
  'kayip',
]

export const PIPELINE_LABELS = {
  lead: 'Lead',
  temas: 'Temas',
  demo: 'Demo',
  trial: 'Trial',
  odeme_bekliyor: 'Ödeme Bekliyor',
  musteri: 'Müşteri',
  kayip: 'Kayıp',
}

export const PIPELINE_COLORS = {
  lead: 'bg-slate-100 text-slate-700',
  temas: 'bg-blue-100 text-blue-700',
  demo: 'bg-indigo-100 text-indigo-700',
  trial: 'bg-purple-100 text-purple-700',
  odeme_bekliyor: 'bg-amber-100 text-amber-700',
  musteri: 'bg-emerald-100 text-emerald-700',
  kayip: 'bg-red-100 text-red-700',
}

export const MESSAGE_TYPES = {
  NORMAL: 'normal',
  DUYURU: 'duyuru',
  KARAR: 'karar',
  GOREV: 'gorev',
}

export const MESSAGE_TYPE_LABELS = {
  normal: 'Normal',
  duyuru: 'Duyuru',
  karar: 'Karar',
  gorev: 'Görev',
}

export const TASK_STATUS = ['yapilacak', 'devam', 'tamamlandi', 'iptal']
export const TASK_STATUS_LABELS = {
  yapilacak: 'Yapılacak',
  devam: 'Devam Ediyor',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
}

export const TASK_PRIORITY = ['dusuk', 'normal', 'yuksek', 'acil']
export const TASK_PRIORITY_LABELS = {
  dusuk: 'Düşük',
  normal: 'Normal',
  yuksek: 'Yüksek',
  acil: 'Acil',
}

export const BUG_PRIORITY = ['dusuk', 'normal', 'yuksek', 'kritik']
export const BUG_STATUS = ['acik', 'devam', 'test', 'kapali']

export const FINANCE_CATEGORIES = ['abonelik', 'reklam', 'altyapi', 'maas', 'diger']
export const FINANCE_CATEGORY_LABELS = {
  abonelik: 'Abonelik',
  reklam: 'Reklam',
  altyapi: 'Altyapı',
  maas: 'Maaş',
  diger: 'Diğer',
}

export const FEEDBACK_TYPES = {
  sikayet: 'Şikayet',
  oneri: 'Öneri',
  olumlu: 'Olumlu',
  soru: 'Soru',
}

export const FEEDBACK_STATUS = {
  yeni: 'Yeni',
  inceleniyor: 'İnceleniyor',
  cozuldu: 'Çözüldü',
}

export const FINANCE_STATUS = {
  bekliyor: 'Onay Bekliyor',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
}

export const CONTENT_TYPES = {
  reels: 'Reels',
  story: 'Story',
  carousel: 'Carousel',
  post: 'Gönderi',
  linkedin: 'LinkedIn',
}

export const CONTENT_PLATFORMS = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube Shorts',
  linkedin: 'LinkedIn',
}

export const CONTENT_STATUS = ['fikir', 'senaryo', 'cekim', 'kurgu', 'yayinda', 'olculdu', 'arsiv']

export const CONTENT_STATUS_LABELS = {
  fikir: 'Fikir',
  senaryo: 'Senaryo',
  cekim: 'Çekim',
  kurgu: 'Kurgu',
  yayinda: 'Yayında',
  olculdu: 'Ölçüldü',
  arsiv: 'Arşiv',
  cekildi: 'Çekildi',
  kurgu_old: 'Kurgu',
}

export const NAV_ITEMS = [
  { path: '/', label: 'Bugün', icon: 'today', section: 'genel', permission: 'today' },
  { path: '/mesajlar', label: 'Mesajlar', icon: 'messages', section: 'genel', permission: 'messages' },
  { path: '/isler', label: 'İşler', icon: 'tasks', section: 'genel', permission: 'tasks' },
  { path: '/kayitlar', label: 'Kayıtlar', icon: 'records', section: 'genel', permission: 'records' },
  { path: '/reklam', label: 'Reklam', icon: 'marketing', section: 'buyume', permission: 'marketing' },
  { path: '/takvim', label: 'Takvim', icon: 'calendar', section: 'buyume', permission: 'calendar' },
  { path: '/performans', label: 'Performans', icon: 'performance', section: 'buyume', permission: 'performance' },
  { path: '/haftalik-ozet', label: 'Haftalık Özet', icon: 'report', section: 'yonetim', permission: 'weeklyReport' },
  { path: '/finans', label: 'Finans', icon: 'finance', section: 'yonetim', permission: 'finance' },
  { path: '/kararlar', label: 'Kararlar', icon: 'decisions', section: 'yonetim', permission: 'decisions' },
  { path: '/personel', label: 'Personeller', icon: 'personnel', section: 'yonetim', permission: 'personnel' },
  { path: '/denetim', label: 'Denetim', icon: 'audit', section: 'yonetim', permission: 'audit' },
  { path: '/mudur', label: 'Müdür', icon: 'manager', section: 'yonetim', permission: 'manager' },
  { path: '/ekip', label: 'Ekip', icon: 'team', section: 'yonetim', permission: 'team' },
  { path: '/ayarlar', label: 'Ayarlar', icon: 'settings', section: 'sistem', permission: 'settings' },
]

export const NAV_SECTIONS = {
  genel: 'Genel',
  buyume: 'Büyüme',
  yonetim: 'Yönetim',
  sistem: '',
}
