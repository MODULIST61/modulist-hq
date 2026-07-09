/** Hub bazlı görev filtresi — hibrit: oda slug + kayıt tipi */

export const HUB_ROOM_SLUGS = {
  yazilim: ['urun'],
  reklam: ['buyume'],
  sekreter: ['operasyon', 'satis', 'genel'],
}

export function filterTasksByHub(tasks, rooms, hub) {
  if (!hub) return tasks

  const slugs = HUB_ROOM_SLUGS[hub] || []
  const roomIds = new Set(rooms.filter((r) => slugs.includes(r.slug)).map((r) => r.id))

  return tasks.filter((t) => {
    if (t.room_id && roomIds.has(t.room_id)) return true
    if (hub === 'yazilim' && t.kayit_tipi === 'bug') return true
    if (hub === 'reklam' && t.kayit_tipi === 'kampanya') return true
    if (hub === 'sekreter' && t.kayit_tipi === 'firma') return true
    return false
  })
}

export function taskRecordLink(task) {
  if (!task.kayit_tipi || !task.kayit_id) return null
  if (task.kayit_tipi === 'firma') return `/sekreter/firmalar/${task.kayit_id}`
  if (task.kayit_tipi === 'bug') return `/yazilim?tab=buglar`
  if (task.kayit_tipi === 'kampanya') return `/reklam?tab=kampanya`
  return null
}
