export function dmThreadId(userId1, userId2) {
  return `dm-${[userId1, userId2].sort().join('-')}`
}

export function getDmPartner(thread, currentUserId) {
  return thread.participants.find((id) => id !== currentUserId)
}
