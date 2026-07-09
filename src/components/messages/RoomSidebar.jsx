import { cn, truncate } from '../../lib/utils'
import { groupRoomsByHub, countUnread } from '../../lib/messaging'

export function RoomSidebar({
  panel,
  setPanel,
  groupedRooms,
  activeRoom,
  myDmThreads,
  activeDm,
  messages,
  currentUserId,
  users,
  getDmPartner,
  onSelectRoom,
  onSelectDm,
  onNewDm,
  dmSearch,
  setDmSearch,
}) {
  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      <div className="p-3 bg-[#008069] dark:bg-primary text-white">
        <h2 className="font-semibold text-sm">Modulist Mesajlar</h2>
        <p className="text-[11px] text-white/80">Ekip iletişimi</p>
      </div>

      <div className="flex border-b bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setPanel('oda')}
          className={cn('flex-1 py-2.5 text-xs font-semibold', panel === 'oda' ? 'text-accent border-b-2 border-accent' : 'text-slate-500')}
        >
          Odalar
        </button>
        <button
          type="button"
          onClick={() => setPanel('dm')}
          className={cn('flex-1 py-2.5 text-xs font-semibold', panel === 'dm' ? 'text-accent border-b-2 border-accent' : 'text-slate-500')}
        >
          Direkt
        </button>
      </div>

      {panel === 'oda' ? (
        <div className="flex-1 overflow-y-auto">
          {groupedRooms.map((hub) => (
            <div key={hub.id}>
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/80 dark:bg-slate-900/80 sticky top-0">
                {hub.icon} {hub.label}
              </div>
              {hub.rooms.map((room) => {
                const last = messages
                  .filter((m) => m.room_id === room.id && !m.is_dm)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                const unread = countUnread(messages, currentUserId, room.id, false)
                const active = activeRoom?.id === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onSelectRoom(room)}
                    className={cn(
                      'w-full text-left px-4 py-3 flex gap-3 items-center border-b border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 transition-colors',
                      active && 'bg-white dark:bg-slate-900',
                    )}
                  >
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {hub.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">#{room.name}</span>
                        {last && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(last.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 truncate">{last ? truncate(last.text, 36) : room.description}</p>
                        {unread > 0 && (
                          <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="p-2 space-y-2 bg-white dark:bg-slate-900 border-b">
            <input
              type="search"
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Kişi ara..."
              className="w-full px-3 py-2 text-sm rounded-lg border dark:bg-slate-800 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={onNewDm}
              className="w-full py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90"
            >
              + Yeni mesaj
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {myDmThreads.map((t) => {
              const partner = users.find((u) => u.id === getDmPartner(t, currentUserId))
              if (dmSearch && !partner?.name?.toLowerCase().includes(dmSearch.toLowerCase())) return null
              const last = messages.filter((m) => m.room_id === t.id && m.is_dm).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
              const unread = countUnread(messages, currentUserId, t.id, true)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectDm(t.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex gap-3 border-b hover:bg-white dark:hover:bg-slate-900',
                    activeDm === t.id && 'bg-white dark:bg-slate-900',
                  )}
                >
                  <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-primary shrink-0">
                    {partner?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{partner?.name}</span>
                      {unread > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    {last && <p className="text-xs text-slate-500 truncate mt-0.5">{truncate(last.text, 40)}</p>}
                  </div>
                </button>
              )
            })}
            {!myDmThreads.length && (
              <p className="text-xs text-slate-400 p-6 text-center">Henüz direkt mesaj yok</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
