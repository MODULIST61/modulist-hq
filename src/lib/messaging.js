/** Mesajlaşma yardımcıları — oda grupları, okundu, gün ayırıcı */

export const ROOM_HUB_GROUPS = [
  { id: 'genel', label: 'Genel', icon: '🏠', slugs: ['genel'] },
  { id: 'yazilim', label: 'Yazılım', icon: '💻', slugs: ['urun'] },
  { id: 'reklam', label: 'Reklam', icon: '📣', slugs: ['buyume'] },
  { id: 'sekreter', label: 'Sekreter & Satış', icon: '📋', slugs: ['satis', 'operasyon'] },
  { id: 'yonetim', label: 'Yönetim', icon: '💰', slugs: ['finans'] },
]

export const MSG_TYPE_STYLES = {
  normal: { chip: 'bg-slate-100 text-slate-700', bubble: '' },
  duyuru: { chip: 'bg-amber-100 text-amber-800', bubble: 'ring-2 ring-amber-300/60' },
  karar: { chip: 'bg-purple-100 text-purple-800', bubble: 'ring-2 ring-purple-300/60' },
  gorev: { chip: 'bg-blue-100 text-blue-800', bubble: 'ring-2 ring-blue-300/60' },
}

const READ_KEY = 'hq_msg_read'

export function getLastRead(userId, roomId) {
  try {
    const raw = localStorage.getItem(`${READ_KEY}_${userId}_${roomId}`)
    return raw ? new Date(raw) : null
  } catch {
    return null
  }
}

export function markRoomRead(userId, roomId) {
  try {
    localStorage.setItem(`${READ_KEY}_${userId}_${roomId}`, new Date().toISOString())
  } catch { /* ignore */ }
}

export function countUnread(messages, userId, roomId, isDm = false) {
  const lastRead = getLastRead(userId, roomId)
  return messages.filter((m) => {
    if (m.room_id !== roomId) return false
    if (Boolean(m.is_dm) !== isDm) return false
    if (m.user_id === userId) return false
    if (!lastRead) return true
    return new Date(m.created_at) > lastRead
  }).length
}

export function groupRoomsByHub(visibleRooms) {
  const grouped = []
  const used = new Set()
  for (const hub of ROOM_HUB_GROUPS) {
    const rooms = visibleRooms.filter((r) => hub.slugs.includes(r.slug))
    if (rooms.length) {
      rooms.forEach((r) => used.add(r.id))
      grouped.push({ ...hub, rooms })
    }
  }
  const rest = visibleRooms.filter((r) => !used.has(r.id))
  if (rest.length) grouped.push({ id: 'other', label: 'Diğer', icon: '💬', rooms: rest })
  return grouped
}

export function dayLabel(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Bugün'
  if (d.toDateString() === yesterday.toDateString()) return 'Dün'
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function groupMessagesByDay(messages) {
  const sorted = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const groups = []
  let currentDay = null
  for (const msg of sorted) {
    const day = new Date(msg.created_at).toDateString()
    if (day !== currentDay) {
      currentDay = day
      groups.push({ type: 'day', key: `day-${day}`, label: dayLabel(msg.created_at) })
    }
    groups.push({ type: 'msg', key: msg.id, msg })
  }
  return groups
}

export function recordLink(type, id) {
  if (type === 'firma') return `/sekreter/firmalar/${id}`
  if (type === 'bug') return `/yazilim?tab=buglar`
  return null
}

export function formatMessageTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
