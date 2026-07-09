import { ROOMS } from './constants'

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₺0'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

export function relativeTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`
  return formatDate(dateStr)
}

export function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24))
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  const days = daysUntil(dateStr)
  return days < 0
}

export function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function isThisMonth(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function truncate(str, len = 80) {
  if (!str) return ''
  return str.length > len ? `${str.slice(0, len)}…` : str
}

export function highlightMentions(text, users = []) {
  if (!text) return text
  let result = text
  users.forEach((u) => {
    const pattern = new RegExp(`@${u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    result = result.replace(pattern, `@@MENTION@@${u.name}@@END@@`)
  })
  return result
}

export function parseMentionIds(text, users = []) {
  const ids = []
  users.forEach((u) => {
    if (text.includes(`@${u.name}`)) ids.push(u.id)
  })
  return [...new Set(ids)]
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getRoomBySlug(rooms, slug) {
  return rooms.find((r) => r.slug === slug || r.id === slug)
}

export function getUserName(users, id) {
  const u = users.find((x) => x.id === id)
  return u ? u.name : 'Bilinmiyor'
}
