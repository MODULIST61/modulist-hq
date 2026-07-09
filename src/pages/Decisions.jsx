import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { isPatron } from '../lib/permissions'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { RoleBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/Modal'
import { formatDateTime, truncate, cn } from '../lib/utils'

export default function Decisions({ embedded = false }) {
  const { currentUser, users } = useAuth()
  const { messages, rooms, deleteMessage } = useData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const patron = isPatron(currentUser)

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

  const handleDelete = async (e, msg) => {
    e.stopPropagation()
    if (!confirm(`Bu kararı kalıcı olarak silmek istediğinize emin misiniz?\n\n"${truncate(msg.text, 80)}"`)) return
    await deleteMessage(msg.id)
  }

  return (
    <div>
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary dark:text-white">Kararlar</h1>
          <p className="text-sm text-slate-500">Karar tipi mesajların arşivi{patron ? ' — patron silebilir' : ''}</p>
        </div>
      )}

      <Input placeholder="Karar ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md mb-4" />

      {decisions.length === 0 ? (
        <EmptyState icon="⚖️" title="Karar kaydı yok" description="Mesajlarda 'Karar' tipi mesaj göndererek karar arşivi oluşturun." />
      ) : (
        <div className="space-y-3">
          {decisions.map((msg) => {
            const sender = users.find((u) => u.id === msg.user_id)
            const room = rooms.find((r) => r.id === msg.room_id)
            return (
              <div
                key={msg.id}
                className="bg-white dark:bg-slate-900 rounded-xl border p-4 hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => goToMessage(msg)} className="flex-1 text-left min-w-0">
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
                  {patron && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('text-danger shrink-0 hover:bg-red-50 dark:hover:bg-red-900/20')}
                      onClick={(e) => handleDelete(e, msg)}
                    >
                      Sil
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
