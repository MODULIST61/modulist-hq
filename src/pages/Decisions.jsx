import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Input } from '../components/ui/Input'
import { RoleBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/Modal'
import { formatDateTime, truncate } from '../lib/utils'

export default function Decisions() {
  const { users } = useAuth()
  const { messages, rooms } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const decisions = useMemo(() => {
    return messages
      .filter((m) => m.type === 'karar')
      .filter((m) => !search || m.text.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
  }, [messages, search])

  const goToMessage = (msg) => {
    const room = rooms.find((r) => r.id === msg.room_id)
    navigate(`/mesajlar?oda=${room?.slug || 'genel'}`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary dark:text-white">Kararlar</h1>
        <p className="text-sm text-slate-500">Karar tipi mesajların arşivi</p>
      </div>

      <Input placeholder="Karar ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md mb-4" />

      {decisions.length === 0 ? (
        <EmptyState icon="⚖️" title="Karar kaydı yok" description="Mesajlarda 'Karar' tipi mesaj göndererek karar arşivi oluşturun." />
      ) : (
        <div className="space-y-3">
          {decisions.map((msg) => {
            const sender = users.find((u) => u.id === msg.user_id)
            const room = rooms.find((r) => r.id === msg.room_id)
            return (
              <button
                key={msg.id}
                onClick={() => goToMessage(msg)}
                className="w-full text-left bg-white dark:bg-slate-900 rounded-xl border p-4 hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {msg.pinned && <span className="text-amber-500 text-xs">📌 Sabitli</span>}
                  <span className="text-xs text-slate-400">#{room?.name}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(msg.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{truncate(msg.text, 200)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">{sender?.name}</span>
                  {sender && <RoleBadge role={sender.role} />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
