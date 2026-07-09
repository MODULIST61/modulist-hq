import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { JobBadge, MessageTypeBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/Modal'
import { getVisibleRooms, canWriteRoom, canDo, isPatron } from '../lib/permissions'
import { getDmPartner } from '../lib/dm'
import { relativeTime, truncate, getUserName, cn } from '../lib/utils'
import { MESSAGE_TYPE_LABELS, TASK_PRIORITY_LABELS } from '../lib/constants'

function MessageText({ text, users }) {
  const parts = text.split(/(@\S+)/g)
  return (
    <span>
      {parts.map((part, i) => {
        const mention = users.find((u) => part === `@${u.name}`)
        if (mention) return <span key={i} className="text-accent font-medium bg-blue-50 dark:bg-blue-900/30 px-0.5 rounded">{part}</span>
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

function MessageBubble({ message, users, onReply, onPin, onCreateTask, canWrite }) {
  const sender = users.find((u) => u.id === message.user_id)
  return (
    <div className="group px-4 py-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {sender?.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{sender?.name}</span>
            {sender && <JobBadge user={sender} />}
            <MessageTypeBadge type={message.type} />
            <span className="text-xs text-slate-400">{relativeTime(message.created_at)}</span>
            {message.pinned && <span className="text-xs text-amber-500">📌</span>}
          </div>
          <p className="text-sm mt-1 text-slate-700 dark:text-slate-200 whitespace-pre-wrap"><MessageText text={message.text} users={users} /></p>
          {canWrite && (
            <div className="mt-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onReply && <button onClick={() => onReply(message)} className="text-xs text-slate-500 hover:text-accent">Yanıtla</button>}
              <button onClick={() => onPin(message)} className="text-xs text-slate-500 hover:text-accent">{message.pinned ? 'Pin kaldır' : 'Pinle'}</button>
              <button onClick={() => onCreateTask(message)} className="text-xs text-slate-500 hover:text-accent">Görev oluştur</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Messages() {
  const { currentUser, users } = useAuth()
  const {
    rooms, messages, companies, bugs, dmThreads,
    addMessage, updateMessage, addTask, broadcastPatron, getOrCreateDmThread, sendDm,
  } = useData()

  const [searchParams, setSearchParams] = useSearchParams()
  const panel = searchParams.get('panel') || 'oda'
  const activeSlug = searchParams.get('oda')
  const activeDm = searchParams.get('dm')

  const visibleRooms = getVisibleRooms(currentUser, rooms)
  const activeRoom = visibleRooms.find((r) => r.slug === activeSlug) || (panel === 'oda' ? visibleRooms[0] : null)
  const activeThread = dmThreads.find((t) => t.id === activeDm)
  const dmPartner = activeThread ? users.find((u) => u.id === getDmPartner(activeThread, currentUser.id)) : null

  const myDmThreads = useMemo(() => {
    return dmThreads
      .filter((t) => t.participants.includes(currentUser.id))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
  }, [dmThreads, currentUser.id])

  const canWriteRoomNow = activeRoom ? canWriteRoom(currentUser, activeRoom.slug) : false
  const isDmMode = panel === 'dm' && activeThread

  const [text, setText] = useState('')
  const [msgType, setMsgType] = useState('normal')
  const [replyTo, setReplyTo] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [mentionQuery, setMentionQuery] = useState(null)
  const [taskModal, setTaskModal] = useState(null)
  const [taskForm, setTaskForm] = useState({})
  const [broadcastModal, setBroadcastModal] = useState(false)
  const [newDmModal, setNewDmModal] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ text: '', type: 'duyuru', toAllRooms: true, toGenel: true })
  const fileRef = useRef(null)
  const bottomRef = useRef(null)

  const displayMessages = useMemo(() => {
    if (isDmMode) {
      return messages.filter((m) => m.is_dm && m.room_id === activeThread.id && !m.reply_to_id)
    }
    if (!activeRoom) return []
    return messages.filter((m) => m.room_id === activeRoom.id && !m.is_dm && !m.reply_to_id)
  }, [messages, activeRoom, activeThread, isDmMode])

  const pinnedMessages = useMemo(() => {
    if (!activeRoom || isDmMode) return []
    return messages.filter((m) => m.room_id === activeRoom.id && m.pinned && !m.is_dm).slice(0, 3)
  }, [messages, activeRoom, isDmMode])

  const replies = (parentId) =>
    messages.filter((m) => m.reply_to_id === parentId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages.length, activeRoom?.id, activeThread?.id])

  const activeUsers = users.filter((u) => u.status === 'aktif')

  const handleSend = async () => {
    if (!text.trim()) return
    const payload = text.trim()
    try {
      if (isDmMode) {
        await sendDm(activeThread.id, payload, activeUsers)
      } else if (canWriteRoomNow && activeRoom) {
        await addMessage({
          room_id: activeRoom.id,
          user_id: currentUser.id,
          text: payload,
          type: msgType,
          reply_to_id: replyTo?.id || null,
          attachments,
          is_dm: false,
        }, activeUsers)
      } else return
      setText('')
      setReplyTo(null)
      setAttachments([])
      setMsgType('normal')
    } catch (e) {
      alert(e.message || 'Mesaj gönderilemedi.')
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastForm.text.trim()) return
    try {
      const count = await broadcastPatron(broadcastForm, activeUsers)
      alert(`${count} mesaj gönderildi.`)
      setBroadcastModal(false)
      setBroadcastForm({ text: '', type: 'duyuru', toAllRooms: true, toGenel: true })
    } catch (e) {
      alert(e.message || 'Duyuru gönderilemedi.')
    }
  }

  const startDm = async (userId) => {
    try {
      const thread = await getOrCreateDmThread(userId)
      setSearchParams({ panel: 'dm', dm: thread.id })
      setNewDmModal(false)
    } catch (e) {
      alert(e.message || 'Direkt mesaj başlatılamadı.')
    }
  }

  const handlePin = async (msg) => {
    if (!isPatron(currentUser) && msg.user_id !== currentUser.id) return
    try {
      await updateMessage(msg.id, { pinned: !msg.pinned })
    } catch (e) {
      alert(e.message || 'Pin güncellenemedi.')
    }
  }

  const openTaskModal = (msg) => {
    setTaskForm({ baslik: truncate(msg.text, 60), aciklama: msg.text, room_id: msg.room_id, sorumlu_id: currentUser.id, oncelik: 'normal', bitis_tarihi: '' })
    setTaskModal(msg)
  }

  const mentionUsers = activeUsers.filter(
    (u) => u.id !== currentUser.id && (!mentionQuery || u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
  )

  return (
    <div className="flex h-[calc(100dvh-7rem)] -m-4 md:-m-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Sol panel */}
      <div className="w-full md:w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 hidden sm:flex">
        <div className="flex border-b">
          <button onClick={() => setSearchParams({ panel: 'oda', oda: activeRoom?.slug || visibleRooms[0]?.slug })} className={cn('flex-1 py-2.5 text-xs font-semibold', panel === 'oda' ? 'text-accent border-b-2 border-accent' : 'text-slate-500')}>Odalar</button>
          <button onClick={() => setSearchParams({ panel: 'dm' })} className={cn('flex-1 py-2.5 text-xs font-semibold', panel === 'dm' ? 'text-accent border-b-2 border-accent' : 'text-slate-500')}>Direkt</button>
        </div>

        {panel === 'oda' ? (
          <div className="flex-1 overflow-y-auto">
            {visibleRooms.map((room) => {
              const last = messages.filter((m) => m.room_id === room.id && !m.is_dm).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
              return (
                <button
                  key={room.id}
                  onClick={() => setSearchParams({ panel: 'oda', oda: room.slug })}
                  className={cn('w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50', activeRoom?.id === room.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-accent')}
                >
                  <span className="font-medium text-sm">#{room.name}</span>
                  {last && <p className="text-xs text-slate-400 mt-0.5 truncate">{truncate(last.text, 40)}</p>}
                </button>
              )
            })}
          </div>
        ) : (
          <>
            <div className="p-2 border-b">
              <Button size="sm" variant="outline" className="w-full" onClick={() => setNewDmModal(true)}>+ Yeni mesaj</Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {myDmThreads.map((t) => {
                const partner = users.find((u) => u.id === getDmPartner(t, currentUser.id))
                const last = messages.filter((m) => m.room_id === t.id && m.is_dm).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                return (
                  <button
                    key={t.id}
                    onClick={() => setSearchParams({ panel: 'dm', dm: t.id })}
                    className={cn('w-full text-left px-4 py-3 border-b hover:bg-slate-50 dark:hover:bg-slate-800/50', activeDm === t.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-accent')}
                  >
                    <span className="font-medium text-sm">{partner?.name}</span>
                    {last && <p className="text-xs text-slate-400 truncate">{truncate(last.text, 40)}</p>}
                  </button>
                )
              })}
              {!myDmThreads.length && <p className="text-xs text-slate-400 p-4 text-center">Henüz direkt mesaj yok</p>}
            </div>
          </>
        )}
      </div>

      {/* Ana panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-primary dark:text-white">
              {isDmMode ? dmPartner?.name : `#${activeRoom?.name || 'Mesajlar'}`}
            </h2>
            <p className="text-xs text-slate-500">
              {isDmMode ? 'Direkt mesaj' : `${activeRoom?.description || ''}${!canWriteRoomNow && activeRoom ? ' · Salt okuma' : ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            {canDo(currentUser, 'patronBroadcast') && panel === 'oda' && (
              <Button size="sm" variant="accent" onClick={() => setBroadcastModal(true)}>Patron Duyuru</Button>
            )}
          </div>
        </div>

        {pinnedMessages.length > 0 && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b text-xs space-y-1">
            <span className="font-medium text-amber-700">📌 Sabitlenmiş</span>
            {pinnedMessages.map((m) => <div key={m.id} className="truncate">{truncate(m.text, 100)}</div>)}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!activeRoom && !isDmMode ? (
            <EmptyState icon="💬" title="Konuşma seçin" description="Sol panelden oda veya direkt mesaj seçin." />
          ) : displayMessages.length === 0 ? (
            <EmptyState icon="💬" title="Henüz mesaj yok" description="İlk mesajı gönderin." />
          ) : (
            displayMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((msg) => (
              <div key={msg.id}>
                <MessageBubble message={msg} users={users} onReply={isDmMode ? null : setReplyTo} onPin={handlePin} onCreateTask={openTaskModal} canWrite={isDmMode || canWriteRoomNow} />
                {!isDmMode && replies(msg.id).map((r) => (
                  <div key={r.id} className="ml-12 border-l-2 border-slate-100 dark:border-slate-800">
                    <MessageBubble message={r} users={users} onPin={handlePin} onCreateTask={openTaskModal} canWrite={canWriteRoomNow} />
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {(isDmMode || canWriteRoomNow) ? (
          <div className="border-t p-4 space-y-2">
            {!isDmMode && (
              <Select value={msgType} onChange={(e) => setMsgType(e.target.value)} className="w-32">
                {Object.entries(MESSAGE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            )}
            <div className="relative">
              <Textarea value={text} onChange={(e) => { setText(e.target.value); const m = e.target.value.match(/@(\S*)$/); setMentionQuery(m ? m[1] : null) }} placeholder={isDmMode ? 'Direkt mesaj yazın...' : 'Mesaj yazın... @mention'} className="min-h-[60px]" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} />
              {mentionQuery !== null && mentionUsers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                  {mentionUsers.map((u) => (
                    <button key={u.id} onClick={() => { setText(`${text.replace(/@\S*$/, '')}@${u.name} `); setMentionQuery(null) }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{u.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={!text.trim()}>Gönder</Button>
            </div>
          </div>
        ) : activeRoom && (
          <div className="border-t p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50">Salt okuma — mesaj yazamazsınız</div>
        )}
      </div>

      {/* Patron broadcast */}
      <Modal open={broadcastModal} onClose={() => setBroadcastModal(false)} title="Patron Duyuru" size="lg">
        <p className="text-sm text-slate-500 mb-4">Kurumsal duyuru — her odaya ayrı mesaj ve/veya genel oda duyurusu.</p>
        <div className="space-y-4">
          <Textarea label="Mesaj" value={broadcastForm.text} onChange={(e) => setBroadcastForm({ ...broadcastForm, text: e.target.value })} />
          <Select label="Tip" value={broadcastForm.type} onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}>
            <option value="duyuru">Duyuru</option>
            <option value="karar">Karar</option>
            <option value="normal">Normal</option>
          </Select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={broadcastForm.toAllRooms} onChange={(e) => setBroadcastForm({ ...broadcastForm, toAllRooms: e.target.checked })} />Tüm odalara ayrı mesaj gönder</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={broadcastForm.toGenel} onChange={(e) => setBroadcastForm({ ...broadcastForm, toGenel: e.target.checked })} />Genel oda + tüm ekibe @mention (sabitlenir)</label>
          <Button onClick={handleBroadcast} className="w-full" disabled={!broadcastForm.text.trim()}>Gönder</Button>
        </div>
      </Modal>

      {/* Yeni DM */}
      <Modal open={newDmModal} onClose={() => setNewDmModal(false)} title="Direkt Mesaj Başlat">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activeUsers.filter((u) => u.id !== currentUser.id).map((u) => (
            <button key={u.id} onClick={() => startDm(u.id)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">{u.name[0]}</span>
              <span className="font-medium text-sm">{u.name}</span>
              <JobBadge user={u} />
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!taskModal} onClose={() => setTaskModal(null)} title="Görev Oluştur">
        <div className="space-y-4">
          <Input label="Başlık" value={taskForm.baslik || ''} onChange={(e) => setTaskForm({ ...taskForm, baslik: e.target.value })} />
          <Select label="Sorumlu" value={taskForm.sorumlu_id || ''} onChange={(e) => setTaskForm({ ...taskForm, sorumlu_id: e.target.value })}>
            {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Button onClick={() => { if (taskForm.baslik) { addTask({ ...taskForm, olusturan_id: currentUser.id }); setTaskModal(null) } }} className="w-full">Oluştur</Button>
        </div>
      </Modal>
    </div>
  )
}
