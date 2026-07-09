import { STORAGE_KEYS } from './constants'

const PREFIX = 'hq_'

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key.startsWith(PREFIX) ? key : `${PREFIX}${key}`)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function set(key, value) {
  const storageKey = key.startsWith(PREFIX) ? key : `${PREFIX}${key}`
  localStorage.setItem(storageKey, JSON.stringify(value))
}

export function remove(key) {
  const storageKey = key.startsWith(PREFIX) ? key : `${PREFIX}${key}`
  localStorage.removeItem(storageKey)
}

export function init() {
  const settings = get(STORAGE_KEYS.SETTINGS, null)
  if (!settings) {
    set(STORAGE_KEYS.SETTINGS, {
      darkMode: false,
      activeCustomerCount: 0,
      estimatedMrr: 0,
      performanceGoals: { calls: 50, demos: 10, tasks: 15, score: 70 },
    })
  }
  return {
    users: get(STORAGE_KEYS.USERS, []),
    session: get(STORAGE_KEYS.SESSION, null),
    rooms: get(STORAGE_KEYS.ROOMS, []),
    messages: get(STORAGE_KEYS.MESSAGES, []),
    tasks: get(STORAGE_KEYS.TASKS, []),
    companies: get(STORAGE_KEYS.COMPANIES, []),
    bugs: get(STORAGE_KEYS.BUGS, []),
    campaigns: get(STORAGE_KEYS.CAMPAIGNS, []),
    contents: get(STORAGE_KEYS.CONTENTS, []),
    finance: get(STORAGE_KEYS.FINANCE, []),
    feedback: get(STORAGE_KEYS.FEEDBACK, []),
    dailyMetrics: get(STORAGE_KEYS.DAILY_METRICS, []),
    dmThreads: get(STORAGE_KEYS.DM_THREADS, []),
    notifications: get(STORAGE_KEYS.NOTIFICATIONS, []),
    settings: get(STORAGE_KEYS.SETTINGS, {
      darkMode: false,
      activeCustomerCount: 0,
      estimatedMrr: 0,
      performanceGoals: { calls: 50, demos: 10, tasks: 15, score: 70 },
    }),
    initialized: get(STORAGE_KEYS.INITIALIZED, false),
  }
}

export function clearAll() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}

export function persistAll(data) {
  set(STORAGE_KEYS.USERS, data.users)
  set(STORAGE_KEYS.ROOMS, data.rooms)
  set(STORAGE_KEYS.MESSAGES, data.messages)
  set(STORAGE_KEYS.TASKS, data.tasks)
  set(STORAGE_KEYS.COMPANIES, data.companies)
  set(STORAGE_KEYS.BUGS, data.bugs)
  set(STORAGE_KEYS.CAMPAIGNS, data.campaigns)
  set(STORAGE_KEYS.CONTENTS, data.contents)
  set(STORAGE_KEYS.FINANCE, data.finance)
  set(STORAGE_KEYS.FEEDBACK, data.feedback || [])
  set(STORAGE_KEYS.DAILY_METRICS, data.dailyMetrics || [])
  set(STORAGE_KEYS.DM_THREADS, data.dmThreads || [])
  set(STORAGE_KEYS.NOTIFICATIONS, data.notifications)
  set(STORAGE_KEYS.SETTINGS, data.settings)
  set(STORAGE_KEYS.INITIALIZED, data.initialized)
}

export function setSession(userId) {
  set(STORAGE_KEYS.SESSION, { userId, loginAt: new Date().toISOString() })
}

export function getSession() {
  return get(STORAGE_KEYS.SESSION, null)
}

export function clearSession() {
  remove(STORAGE_KEYS.SESSION)
}
