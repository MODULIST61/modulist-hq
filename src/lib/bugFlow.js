/** Sekreter ↔ Yazılım bug/feedback akış yardımcıları */

export const BUG_KAYNAK_LABELS = {
  simulasyon: 'Simülasyon',
  musteri: 'Müşteri',
  denetim: 'Denetim',
  ic_bulgu: 'İç bulgu',
  geri_donus: 'Geri dönüş',
}

export const HUB_DURUM_LABELS = {
  triage: 'Triage',
  sprint: 'Sprint',
  backlog: 'Backlog',
}

export function isDevUser(user) {
  if (!user || user.status !== 'aktif') return false
  return Boolean(
    user.permissions?.pages?.software
    || user.role === 'dev'
    || user.job_title === 'Yazılımcı',
  )
}

export function isSecretaryUser(user) {
  if (!user || user.status !== 'aktif') return false
  return Boolean(
    user.permissions?.pages?.secretary
    || user.role === 'ops'
    || user.job_title === 'Sekreter',
  )
}

export function devUsers(users) {
  return (users || []).filter(isDevUser)
}

export function pickDevAssignee(users, preferredId) {
  if (preferredId) return preferredId
  return devUsers(users)[0]?.id || null
}

export function isTriageBug(bug) {
  if (!bug || bug.durum === 'kapali') return false
  return bug.hub_durum === 'triage' || (bug.durum === 'acik' && !bug.sorumlu_id)
}

export function bugAgeDays(bug) {
  if (!bug?.created_at) return 0
  return Math.floor((Date.now() - new Date(bug.created_at)) / 86400000)
}

export function pendingTriageBugs(bugs) {
  return (bugs || []).filter(isTriageBug)
}

export function pendingTriageFeedback(feedback) {
  return (feedback || []).filter(
    (f) => f.durum === 'yeni' && ['sikayet', 'soru'].includes(f.tip) && !f.bug_id,
  )
}

export function pendingTriageCount(bugs, feedback) {
  return pendingTriageBugs(bugs).length + pendingTriageFeedback(feedback).length
}

export function closedUnreportedBugs(bugs) {
  return (bugs || []).filter(
    (b) => b.durum === 'kapali' && !b.musteri_bildirildi && b.iliskili_firma_id,
  )
}

export function openBugsForCompany(bugs, companyId) {
  return (bugs || []).filter(
    (b) => b.iliskili_firma_id === companyId && b.durum !== 'kapali',
  )
}

export function feedbackToBugDraft(feedback, assigneeId) {
  const priority = feedback.tip === 'sikayet' ? 'yuksek' : 'normal'
  return {
    baslik: feedback.metin.slice(0, 80),
    aciklama: feedback.metin,
    kaynak: 'geri_donus',
    oncelik: priority,
    durum: 'acik',
    hub_durum: 'triage',
    iliskili_firma_id: feedback.firma_id || null,
    feedback_id: feedback.id,
    sorumlu_id: assigneeId || '',
    bildiren_id: feedback.user_id || '',
  }
}

export function bugPriorityToTask(priority) {
  if (priority === 'kritik') return 'acil'
  if (priority === 'yuksek') return 'yuksek'
  return 'normal'
}
