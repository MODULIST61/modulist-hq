import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { canAccessPage, isPatron } from '../lib/permissions'
import { buildRoomPulse } from '../lib/analytics'
import { SectionCard } from '../components/dashboard/DashboardWidgets'
import { formatDate, isOverdue } from '../lib/utils'

const HUB_CARDS = [
  { key: 'software', path: '/yazilim', title: 'Yazılım', desc: 'Sprint, bug, kararlar', icon: '💻', color: 'from-blue-500/10 to-blue-600/5 border-blue-200' },
  { key: 'marketing', path: '/reklam', title: 'Reklam', desc: 'İçerik stüdyosu, Fikir Lab, kampanyalar', icon: '📣', color: 'from-purple-500/10 to-purple-600/5 border-purple-200' },
  { key: 'secretary', path: '/sekreter', title: 'Sekreter & Satış', desc: 'Firmalar, demo, metrik', icon: '📋', color: 'from-orange-500/10 to-orange-600/5 border-orange-200' },
  { key: 'patronHub', path: '/patron', title: 'Patron Paneli', desc: 'Komuta, finans onay, AI müdür', icon: '👑', color: 'from-amber-500/10 to-amber-600/5 border-amber-200' },
  { key: 'accounting', path: '/muhasebe', title: 'Muhasebe', desc: 'Gelir-gider kayıtları', icon: '🧾', color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200' },
]

export default function Today() {
  const { currentUser, users } = useAuth()
  const navigate = useNavigate()
  const data = useData()

  const myTasks = data.tasks.filter(
    (t) => t.sorumlu_id === currentUser?.id && !['tamamlandi', 'iptal'].includes(t.durum),
  )
  const roomPulse = useMemo(
    () => buildRoomPulse(data.messages, data.rooms, users),
    [data.messages, data.rooms, users],
  )

  const visibleHubs = HUB_CARDS.filter((h) => canAccessPage(currentUser, h.key))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-white">Ana Sayfa</h1>
        <p className="text-sm text-slate-500">
          Merhaba {currentUser?.name} — {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {visibleHubs.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleHubs.map((hub) => (
            <button
              key={hub.key}
              type="button"
              onClick={() => navigate(hub.path)}
              className={`text-left p-5 rounded-2xl border bg-gradient-to-br ${hub.color} hover:shadow-md hover:border-accent/40 transition-all`}
            >
              <div className="text-3xl mb-3">{hub.icon}</div>
              <div className="font-bold text-primary dark:text-white">{hub.title}</div>
              <div className="text-sm text-slate-500 mt-1">{hub.desc}</div>
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Bugünkü Görevlerim" subtitle={`${myTasks.length} açık görev`}>
          {myTasks.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className={`text-sm py-2 border-b dark:border-slate-800 flex justify-between ${isOverdue(t.bitis_tarihi) ? 'text-danger' : ''}`}
            >
              <span>{t.baslik}</span>
              <span className="text-slate-400">{formatDate(t.bitis_tarihi) || '—'}</span>
            </div>
          ))}
          {!myTasks.length && <p className="text-sm text-slate-400">Açık görev yok</p>}
        </SectionCard>

        <SectionCard title="Mesaj Nabzı" subtitle="Son 24 saat" action={<button type="button" className="text-xs text-accent" onClick={() => navigate('/mesajlar')}>Mesajlar →</button>}>
          {roomPulse.length ? roomPulse.slice(0, 5).map((r) => (
            <div key={r.room.id} className="flex justify-between text-sm py-2 border-b dark:border-slate-800 last:border-0">
              <span className="font-medium">#{r.room.name}</span>
              <span className="text-slate-500">{r.count} mesaj</span>
            </div>
          )) : <p className="text-sm text-slate-400">Henüz aktivite yok</p>}
        </SectionCard>
      </div>

      {isPatron(currentUser) && (
        <SectionCard title="Hızlı Erişim" subtitle="Patron kısayolları">
          <div className="flex flex-wrap gap-2">
            {[
              ['/patron?tab=komuta', 'Komuta Merkezi'],
              ['/patron?tab=finans', 'Finans Onay'],
              ['/patron?tab=mudur', 'Müdür AI'],
              ['/patron?tab=personel', 'Personeller'],
            ].map(([path, label]) => (
              <button key={path} type="button" onClick={() => navigate(path)} className="px-3 py-1.5 text-sm rounded-lg border hover:border-accent">
                {label}
              </button>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
