import { ROLES } from './constants'

/** Oda erişimi: none | read | write */
export const ROOM_SLUGS = ['genel', 'urun', 'satis', 'buyume', 'finans', 'operasyon']

export const PAGE_KEYS = {
  today: 'Bugün',
  messages: 'Mesajlar',
  tasks: 'İşler',
  records: 'Kayıtlar',
  marketing: 'Reklam',
  calendar: 'Takvim',
  performance: 'Performans',
  weeklyReport: 'Haftalık Özet',
  finance: 'Finans',
  decisions: 'Kararlar',
  team: 'Ekip Yönetimi',
  personnel: 'Personeller',
  settings: 'Ayarlar',
}

export const ACTION_KEYS = {
  viewCommandCenter: 'Komuta merkezi (patron paneli)',
  manageTeam: 'Ekip üyesi ekle/düzenle',
  approveFinance: 'Gider onaylama/reddetme',
  editFinance: 'Finans kaydı ekle/düzenle',
  viewFinance: 'Finans verilerini görme',
  editMarketing: 'Reklam verisi düzenleme',
  viewMarketing: 'Reklam panelini görme',
  logDailyMetrics: 'Günlük metrik girişi',
  submitExpense: 'Gider talebi gönderme',
  viewTeamPerformance: 'Tüm ekip performansını görme',
  patronBroadcast: 'Patron duyurusu (tüm odalara)',
  manageRecords: 'Kayıt ekle/düzenle (firma, bug vb.)',
}

export const JOB_PRESETS = {
  sekreter: {
    label: 'Sekreter',
    job_title: 'Sekreter',
    permissions: {
      pages: { today: true, messages: true, tasks: true, records: true, marketing: false, calendar: true, performance: false, weeklyReport: false, finance: false, decisions: false, team: false, settings: true },
      rooms: { genel: 'write', urun: 'none', satis: 'read', buyume: 'none', finans: 'none', operasyon: 'write' },
      actions: { viewCommandCenter: false, manageTeam: false, approveFinance: false, editFinance: false, viewFinance: false, editMarketing: false, viewMarketing: false, logDailyMetrics: false, submitExpense: false, viewTeamPerformance: false, patronBroadcast: false, manageRecords: true },
    },
  },
  muhasebeci: {
    label: 'Muhasebeci',
    job_title: 'Muhasebeci',
    permissions: {
      pages: { today: true, messages: true, tasks: false, records: true, marketing: false, calendar: true, performance: false, weeklyReport: false, finance: true, decisions: false, team: false, settings: true },
      rooms: { genel: 'read', urun: 'none', satis: 'none', buyume: 'none', finans: 'write', operasyon: 'none' },
      actions: { viewCommandCenter: false, manageTeam: false, approveFinance: false, editFinance: true, viewFinance: true, editMarketing: false, viewMarketing: false, logDailyMetrics: false, submitExpense: true, viewTeamPerformance: false, patronBroadcast: false, manageRecords: true },
    },
  },
  reklamci: {
    label: 'Reklamcı',
    job_title: 'Reklamcı',
    permissions: {
      pages: { today: true, messages: true, tasks: true, records: true, marketing: true, calendar: true, performance: true, weeklyReport: false, finance: false, decisions: false, team: false, settings: true },
      rooms: { genel: 'write', urun: 'none', satis: 'read', buyume: 'write', finans: 'none', operasyon: 'none' },
      actions: { viewCommandCenter: false, manageTeam: false, approveFinance: false, editFinance: false, viewFinance: false, editMarketing: true, viewMarketing: true, logDailyMetrics: false, submitExpense: true, viewTeamPerformance: false, patronBroadcast: false, manageRecords: true },
    },
  },
  yazilimci: {
    label: 'Yazılımcı',
    job_title: 'Yazılımcı',
    permissions: {
      pages: { today: true, messages: true, tasks: true, records: true, marketing: false, calendar: true, performance: true, weeklyReport: false, finance: false, decisions: true, team: false, settings: true },
      rooms: { genel: 'write', urun: 'write', satis: 'read', buyume: 'none', finans: 'none', operasyon: 'none' },
      actions: { viewCommandCenter: false, manageTeam: false, approveFinance: false, editFinance: false, viewFinance: false, editMarketing: false, viewMarketing: false, logDailyMetrics: false, submitExpense: false, viewTeamPerformance: false, patronBroadcast: false, manageRecords: true },
    },
  },
  satisci: {
    label: 'Satışçı',
    job_title: 'Satışçı',
    permissions: {
      pages: { today: true, messages: true, tasks: true, records: true, marketing: true, calendar: true, performance: true, weeklyReport: false, finance: false, decisions: false, team: false, settings: true },
      rooms: { genel: 'write', urun: 'read', satis: 'write', buyume: 'read', finans: 'none', operasyon: 'read' },
      actions: { viewCommandCenter: false, manageTeam: false, approveFinance: false, editFinance: false, viewFinance: false, editMarketing: false, viewMarketing: true, logDailyMetrics: true, submitExpense: false, viewTeamPerformance: false, patronBroadcast: false, manageRecords: true },
    },
  },
  ozel: {
    label: 'Özel (manuel ayar)',
    job_title: '',
    permissions: null,
  },
}

const PATRON_PERMISSIONS = {
  pages: Object.fromEntries(Object.keys(PAGE_KEYS).map((k) => [k, true])),
  rooms: Object.fromEntries(ROOM_SLUGS.map((k) => [k, 'write'])),
  actions: Object.fromEntries(Object.keys(ACTION_KEYS).map((k) => [k, true])),
}

const DEFAULT_MEMBER = JOB_PRESETS.sekreter.permissions

const LEGACY_ROLE_MAP = {
  dev: 'yazilimci',
  marketing: 'reklamci',
  sales: 'satisci',
  ops: 'sekreter',
}

function deepMergePermissions(base, override) {
  if (!override) return JSON.parse(JSON.stringify(base))
  return {
    pages: { ...base.pages, ...override.pages },
    rooms: { ...base.rooms, ...override.rooms },
    actions: { ...base.actions, ...override.actions },
  }
}

export function createPermissionsFromPreset(presetKey) {
  const preset = JOB_PRESETS[presetKey]
  if (!preset?.permissions) return JSON.parse(JSON.stringify(DEFAULT_MEMBER))
  return JSON.parse(JSON.stringify(preset.permissions))
}

export function migrateUser(user) {
  if (!user || user.role === ROLES.PATRON) return user
  if (user.permissions?.pages && user.permissions?.rooms && user.permissions?.actions) {
    return { ...user, job_title: user.job_title || user.role }
  }
  const presetKey = LEGACY_ROLE_MAP[user.role] || 'sekreter'
  const preset = JOB_PRESETS[presetKey]
  return {
    ...user,
    role: 'member',
    job_title: user.job_title || preset.job_title,
    permissions: createPermissionsFromPreset(presetKey),
  }
}

export function resolveUser(user) {
  if (!user) return null
  if (user.role === ROLES.PATRON) return user
  return migrateUser(user)
}

export function getPermissions(user) {
  if (!user) return null
  if (user.role === ROLES.PATRON) return PATRON_PERMISSIONS
  const u = migrateUser(user)
  return deepMergePermissions(DEFAULT_MEMBER, u.permissions)
}

export function isPatron(userOrRole) {
  if (typeof userOrRole === 'string') return userOrRole === ROLES.PATRON
  return userOrRole?.role === ROLES.PATRON
}

export function canAccessPage(user, pageKey) {
  if (!user) return false
  if (isPatron(user)) return true
  return !!getPermissions(user)?.pages?.[pageKey]
}

export function canDo(user, actionKey) {
  if (!user) return false
  if (isPatron(user)) return true
  return !!getPermissions(user)?.actions?.[actionKey]
}

export function getRoomAccess(user, roomSlug) {
  if (!user) return 'none'
  if (isPatron(user)) return 'write'
  return getPermissions(user)?.rooms?.[roomSlug] || 'none'
}

export function canViewRoom(user, roomSlug) {
  return getRoomAccess(user, roomSlug) !== 'none'
}

export function canWriteRoom(user, roomSlug) {
  return getRoomAccess(user, roomSlug) === 'write'
}

export function canAccessFinance(user) {
  return canAccessPage(user, 'finance') || canDo(user, 'viewFinance')
}

export function canManageTeam(user) {
  return canDo(user, 'manageTeam') || canAccessPage(user, 'team')
}

export function canAccessMarketing(user) {
  return canAccessPage(user, 'marketing') || canDo(user, 'viewMarketing')
}

export function canEditMarketing(user) {
  return canDo(user, 'editMarketing')
}

export function canLogDailyMetrics(user) {
  return canDo(user, 'logDailyMetrics')
}

export function canSubmitExpenseRequest(user) {
  return canDo(user, 'submitExpense')
}

export function canViewCommandCenter(user) {
  return canDo(user, 'viewCommandCenter')
}

export function getVisibleNavItems(user, navItems) {
  const pathToPage = {
    '/': 'today',
    '/mesajlar': 'messages',
    '/isler': 'tasks',
    '/kayitlar': 'records',
    '/reklam': 'marketing',
    '/takvim': 'calendar',
    '/performans': 'performance',
    '/haftalik-ozet': 'weeklyReport',
    '/finans': 'finance',
    '/kararlar': 'decisions',
    '/ekip': 'team',
    '/personel': 'personnel',
    '/ayarlar': 'settings',
  }
  return navItems.filter((item) => {
    const key = item.permission || pathToPage[item.path]
    if (!key) return true
    return canAccessPage(user, key)
  })
}

export function getVisibleRooms(user, rooms) {
  return rooms.filter((room) => canViewRoom(user, room.slug))
}

export function getUserDisplayTitle(user) {
  if (!user) return ''
  if (isPatron(user)) return 'Patron'
  return user.job_title || 'Ekip Üyesi'
}
