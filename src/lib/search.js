export function buildSearchIndex(data, users) {
  const results = []
  const getName = (id) => users.find((u) => u.id === id)?.name || ''

  data.companies?.forEach((c) => {
    results.push({
      id: `co-${c.id}`,
      type: 'firma',
      typeLabel: 'Firma',
      title: c.ad,
      subtitle: `${c.pipeline} · ${c.yetkili || ''}`,
      path: `/sekreter/firmalar/${c.id}`,
      icon: '🏢',
    })
  })

  data.tasks?.forEach((t) => {
    results.push({
      id: `task-${t.id}`,
      type: 'gorev',
      typeLabel: 'Görev',
      title: t.baslik,
      subtitle: `${t.durum} · ${getName(t.sorumlu_id)}`,
      path: '/yazilim?tab=isler',
      icon: '✅',
    })
  })

  data.bugs?.forEach((b) => {
    results.push({
      id: `bug-${b.id}`,
      type: 'bug',
      typeLabel: 'Bug',
      title: b.baslik,
      subtitle: `${b.oncelik} · ${b.durum}`,
      path: '/yazilim?tab=buglar',
      icon: '🐛',
    })
  })

  data.messages?.filter((m) => !m.is_dm).forEach((m) => {
    results.push({
      id: `msg-${m.id}`,
      type: 'mesaj',
      typeLabel: 'Mesaj',
      title: m.text.slice(0, 60),
      subtitle: getName(m.user_id),
      path: `/mesajlar?oda=${m.room_id}`,
      icon: '💬',
    })
  })

  data.feedback?.forEach((f) => {
    results.push({
      id: `fb-${f.id}`,
      type: 'geri_donus',
      typeLabel: 'Geri Dönüş',
      title: f.metin?.slice(0, 60),
      subtitle: f.tip,
      path: '/yazilim?tab=geri-donusler',
      icon: '📣',
    })
  })

  data.campaigns?.forEach((c) => {
    results.push({
      id: `camp-${c.id}`,
      type: 'kampanya',
      typeLabel: 'Kampanya',
      title: c.ad,
      subtitle: c.kanal,
      path: '/reklam',
      icon: '📣',
    })
  })

  users?.filter((u) => u.status === 'aktif').forEach((u) => {
    results.push({
      id: `user-${u.id}`,
      type: 'kisi',
      typeLabel: 'Kişi',
      title: u.name,
      subtitle: u.email,
      path: `/mesajlar?panel=dm&start=${u.id}`,
      icon: '👤',
    })
  })

  return results
}

export function searchItems(index, query) {
  if (!query?.trim()) return index.slice(0, 12)
  const q = query.toLowerCase().trim()
  return index
    .filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.typeLabel?.toLowerCase().includes(q)
    )
    .slice(0, 20)
}
