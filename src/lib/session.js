const SESSION_KEY = 'hq_session'

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(userId) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    userId,
    loginAt: new Date().toISOString(),
  }))
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
