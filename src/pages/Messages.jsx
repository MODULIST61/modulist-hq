import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal, EmptyState } from '../components/ui/Modal'
import { JobBadge } from '../components/ui/Badge'
import { getVisibleRooms, canWriteRoom, canDo, isPatron } from '../lib/permissions'
import { getDmPartner } from '../lib/dm'
import { truncate } from '../lib/utils'
import {
  groupRoomsByHub,
  groupMessagesByDay,
  markRoomRead,
} from '../lib/messaging'
import { RoomSidebar } from '../components/messages/RoomSidebar'
import { ChatHeader, PinnedBar } from '../components/messages/ChatHeader'
import { ChatBubble } from '../components/messages/ChatBubble'
import { ChatComposer } from '../components/messages/ChatComposer'
import { BroadcastModal, LinkRecordModal } from '../components/messages/BroadcastModal'

export default function Messages() {
  const { currentUser, users } = useAuth()
  const {
    rooms, messages, companies, bugs, dmThreads,
    addMessage, updateMessage, deleteMessage, addTask,
    broadcastPatron, getOrCreateDmThread, sendDm, clearRoomMessages,
  } = useData()

  const [searchParams, setSearchParams] = useSearchParams()
  const panel = searchParams.get('panel') || 'oda'
  const activeSlug = searchParams.get('oda')
  const activeDm = searchParams.get('dm')

  const visibleRooms = getVisibleRooms(currentUser, rooms)
  const groupedRooms = useMemo(() => groupRoomsByHub(visibleRooms), [visibleRooms])
  const activeRoom = visibleRooms.find((r) => r.slug === activeSlug) || (panel === 'oda' ? visibleRooms[0] : null)
  const activeThread = dmThreads.find((t) => t.id === activeDm)
  const dmPartner = activeThread ? users.find((u) => u.id === getDmPartner(activeThread, currentUser.id)) : null

  const myDmThreads = useMemo(() => (
    dmThreads
      .filter((t) => t.participants.includes(currentUser.id))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
  ), [dmThreads, currentUser.id])

  const isDmMode = panel === 'dm' && activeThread
  const canWriteRoomNow = activeRoom ? canWriteRoom(currentUser, activeRoom.slug) : false
  const activeUsers = users.filter((u) => u.status === 'aktif')

  const [text, setText] = useState('')
  const [msgType, setMsgType] = useState('normal')
  const [replyTo, setReplyTo] = useState(null)
  const [linkRecord, setLinkRecord] = useState(null)
  const [taskModal, setTaskModal] = useState(null)
  const [taskForm, setTaskForm] = useState({})
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ text: '', type: 'duyuru', toAllRooms: true, toGenel: true })
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [newDmModal, setNewDmModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [roomSearch, setRoomSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [pinsExpanded, setPinsExpanded] = useState(false)
  const [expandedThreads, setExpandedThreads] = useState(new Set())
  const [mobileChat, setMobileChat] = useState(false)
  const [dmSearch, setDmSearch] = useState('')
  const bottomRef = useRef(null)

  const roomId = isDmMode ? activeThread?.id : activeRoom?.id

  useEffect(() => {
    if (roomId && currentUser?.id) markRoomRead(currentUser.id, roomId)
  }, [roomId, currentUser?.id, messages.length])

  const allRoomMessages = useMemo(() => {
    if (isDmMode) return messages.filter((m) => m.is_dm && m.room_id === activeThread.id)
    if (!activeRoom) return []
    return messages.filter((m) => m.room_id === activeRoom.id && !m.is_dm)
  }, [messages, activeRoom, activeThread, isDmMode])

  const displayMessages = useMemo(() => {
    const tops = allRoomMessages.filter((m) => !m.reply_to_id)
    if (!roomSearch.trim()) return tops
    const q = roomSearch.toLowerCase()
    return tops.filter((m) => {
      const sender = users.find((u) => u.id === m.user_id)?.name?.toLowerCase() || ''
      return m.text.toLowerCase().includes(q) || sender.includes(q)
    })
  }, [allRoomMessages, roomSearch, users])

  const pinnedMessages = useMemo(() => {
    if (isDmMode || !activeRoom) return []
    return messages.filter((m) => m.room_id === activeRoom.id && m.pinned && !m.is_dm)
  }, [messages, activeRoom, isDmMode])

  const replyMap = useMemo(() => {
    const map = {}
    allRoomMessages.filter((m) => m.reply_to_id).forEach((m) => {
      const root = m.reply_to_id
      if (!map[root]) map[root] = []
      map[root].push(m)
    })
    Object.values(map).forEach((arr) => arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    return map
  }, [allRoomMessages])

  const grouped = useMemo(() => groupMessagesByDay(displayMessages), [displayMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages.length, roomId, expandedThreads.size])

  const mentionQuery = useMemo(() => {
    const m = text.match(/@(\S*)$/)
    return m ? m[1] : null
  }, [text])

  const hashQuery = useMemo(() => {
    const m = text.match(/#(\S*)$/)
    return m ? m[1] : null
  }, [text])

  const mentionUsers = activeUsers.filter(
    (u) => u.id !== currentUser.id && (!mentionQuery || u.name.toLowerCase().includes(mentionQuery.toLowerCase())),
  )

  const hashSuggestions = useMemo(() => {
    if (hashQuery === null) return []
    const q = hashQuery.toLowerCase()
    const items = []
    companies.filter((c) => c.ad?.toLowerCase().includes(q)).slice(0, 5).forEach((c) => {
      items.push({ id: c.id, label: c.ad, type: 'firma' })
    })
    bugs.filter((b) => b.baslik?.toLowerCase().includes(q)).slice(0, 3).forEach((b) => {
      items.push({ id: b.id, label: b.baslik, type: 'bug' })
    })
    return items
  }, [hashQuery, companies, bugs])

  const handleSend = async () => {
    if (!text.trim()) return
    const payload = text.trim()
    try {
      const base = {
        text: payload,
        type: msgType,
        linked_record_type: linkRecord?.type || null,
        linked_record_id: linkRecord?.id || null,
      }
      if (isDmMode) {
        await sendDm(activeThread.id, payload, activeUsers)
      } else if (canWriteRoomNow && activeRoom) {
        await addMessage({
          ...base,
          room_id: activeRoom.id,
          user_id: currentUser.id,
          reply_to_id: replyTo?.id || null,
          is_dm: false,
        }, activeUsers)
        if (replyTo?.id) {
          setExpandedThreads((prev) => new Set(prev).add(replyTo.id))
        }
      } else return
      setText('')
      setReplyTo(null)
      setLinkRecord(null)
      setMsgType('normal')
    } catch (e) {
      alert(e.message || 'Mesaj gönderilemedi.')
    }
  }

  const handleClearRoom = async () => {
    if (!activeRoom || isDmMode || !isPatron(currentUser)) return
    const count = allRoomMessages.length
    if (!count) return alert('Bu odada silinecek mesaj yok.')
    const label = activeRoom.slug === 'genel' ? 'Genel oda' : `#${activeRoom.name}`
    if (!confirm(`${label} — ${count} mesaj silinsin mi?`)) return
    setClearing(true)
    try {
      await clearRoomMessages(activeRoom.id)
    } catch (e) {
      alert(e.message || 'Temizlenemedi.')
    } finally {
      setClearing(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastForm.text.trim()) return
    try {
      const count = await broadcastPatron(broadcastForm, activeUsers)
      alert(`${count} mesaj gönderildi.`)
      setBroadcastOpen(false)
      setBroadcastForm({ text: '', type: 'duyuru', toAllRooms: true, toGenel: true })
    } catch (e) {
      alert(e.message || 'Duyuru gönderilemedi.')
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

  const handleDelete = async (msg) => {
    if (!isPatron(currentUser) && msg.user_id !== currentUser.id) return
    if (!confirm('Mesaj silinsin mi?')) return
    try {
      await deleteMessage(msg.id)
    } catch (e) {
      alert(e.message || 'Silinemedi.')
    }
  }

  const handleCopy = (t) => {
    navigator.clipboard?.writeText(t)
  }

  const openTaskModal = (msg) => {
    setTaskForm({
      baslik: truncate(msg.text, 60),
      aciklama: msg.text,
      room_id: msg.room_id,
      sorumlu_id: currentUser.id,
      oncelik: 'normal',
      bitis_tarihi: '',
    })
    setTaskModal(msg)
  }

  const toggleThread = (id) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectRoom = (room) => {
    setSearchParams({ panel: 'oda', oda: room.slug })
    setMobileChat(true)
    setRoomSearch('')
    setExpandedThreads(new Set())
  }

  const selectDm = (id) => {
    setSearchParams({ panel: 'dm', dm: id })
    setMobileChat(true)
  }

  const setPanel = (p) => {
    if (p === 'oda') setSearchParams({ panel: 'oda', oda: activeRoom?.slug || visibleRooms[0]?.slug })
    else setSearchParams({ panel: 'dm' })
  }

  const startDm = async (userId) => {
    try {
      const thread = await getOrCreateDmThread(userId)
      selectDm(thread.id)
      setNewDmModal(false)
    } catch (e) {
      alert(e.message || 'DM başlatılamadı.')
    }
  }

  const pickMention = (name) => {
    setText(`${text.replace(/@\S*$/, '')}@${name} `)
  }

  const pickHash = (item) => {
    setText(`${text.replace(/#\S*$/, '')}#${item.label} `)
    setLinkRecord({ type: item.type || (item.sub === 'firma' ? 'firma' : 'bug'), id: item.id, label: item.label })
  }

  const handleTextChange = (val) => {
    setText(val)
  }

  const todayCount = allRoomMessages.filter((m) => {
    const d = new Date(m.created_at)
    const t = new Date()
    return d.toDateString() === t.toDateString()
  }).length

  const headerTitle = isDmMode ? dmPartner?.name : `#${activeRoom?.name || 'Mesajlar'}`
  const headerSub = isDmMode
    ? 'Direkt mesaj'
    : `${activeRoom?.description || ''}${todayCount ? ` · ${todayCount} mesaj bugün` : ''}${!canWriteRoomNow && activeRoom ? ' · Salt okuma' : ''}`

  const showSidebar = !mobileChat
  const showMain = mobileChat || typeof window === 'undefined' || window.innerWidth >= 768

  return (
    <div className="flex h-[calc(100dvh-7rem)] -m-4 md:-m-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-[#e5ddd5] dark:bg-slate-950">
      {/* Sidebar */}
      <div className={cn('w-full md:w-80 lg:w-96 shrink-0 flex flex-col', !showSidebar && 'hidden md:flex')}>
        <RoomSidebar
          panel={panel}
          setPanel={setPanel}
          groupedRooms={groupedRooms}
          activeRoom={activeRoom}
          myDmThreads={myDmThreads}
          activeDm={activeDm}
          messages={messages}
          currentUserId={currentUser.id}
          users={users}
          getDmPartner={getDmPartner}
          onSelectRoom={selectRoom}
          onSelectDm={selectDm}
          onNewDm={() => setNewDmModal(true)}
          dmSearch={dmSearch}
          setDmSearch={setDmSearch}
        />
      </div>

      {/* Chat */}
      <div className={cn('flex-1 flex flex-col min-w-0', !showMain && 'hidden md:flex')}>
        <ChatHeader
          title={headerTitle}
          subtitle={headerSub}
          showBack={mobileChat}
          onBack={() => setMobileChat(false)}
          roomSearch={roomSearch}
          setRoomSearch={setRoomSearch}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          pinnedCount={pinnedMessages.length}
          onShowPins={() => setPinsExpanded(!pinsExpanded)}
          onClear={handleClearRoom}
          clearing={clearing}
          clearLabel={activeRoom?.slug === 'genel' ? 'Geneli Temizle' : 'Odayı Temizle'}
          onBroadcast={() => setBroadcastOpen(true)}
          canBroadcast={canDo(currentUser, 'patronBroadcast') && panel === 'oda'}
          canClear={isPatron(currentUser) && panel === 'oda' && activeRoom && !isDmMode}
        />

        <PinnedBar
          pins={pinnedMessages}
          onUnpin={handlePin}
          expanded={pinsExpanded}
          onToggle={() => setPinsExpanded(!pinsExpanded)}
        />

        <div
          className="flex-1 overflow-y-auto px-1 py-2"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        >
          {!activeRoom && !isDmMode ? (
            <EmptyState icon="💬" title="Konuşma seçin" description="Sol panelden oda veya DM seçin." />
          ) : displayMessages.length === 0 ? (
            <EmptyState icon="💬" title={roomSearch ? 'Sonuç yok' : 'Henüz mesaj yok'} description={roomSearch ? 'Farklı kelime dene.' : 'İlk mesajı sen gönder.'} />
          ) : (
            grouped.map((item) => {
              if (item.type === 'day') {
                return (
                  <div key={item.key} className="flex justify-center my-3">
                    <span className="text-[11px] font-medium px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-600 shadow-sm">
                      {item.label}
                    </span>
                  </div>
                )
              }
              const msg = item.msg
              const replies = replyMap[msg.id] || []
              const threadOpen = expandedThreads.has(msg.id)
              return (
                <div key={item.key}>
                  <ChatBubble
                    message={msg}
                    users={users}
                    currentUserId={currentUser.id}
                    companies={companies}
                    bugs={bugs}
                    isDm={isDmMode}
                    onReply={!isDmMode && canWriteRoomNow ? setReplyTo : null}
                    onPin={handlePin}
                    onCreateTask={openTaskModal}
                    onDelete={(isPatron(currentUser) || msg.user_id === currentUser.id) ? handleDelete : null}
                    onCopy={handleCopy}
                    onToggleThread={replies.length ? toggleThread : null}
                    replyCount={replies.length}
                    threadExpanded={threadOpen}
                  />
                  {threadOpen && replies.map((r) => (
                    <div key={r.id} className="ml-8 md:ml-14 pl-3 border-l-2 border-accent/30">
                      <ChatBubble
                        message={r}
                        users={users}
                        currentUserId={currentUser.id}
                        companies={companies}
                        bugs={bugs}
                        isDm={isDmMode}
                        compact
                        showAvatar={false}
                        onPin={handlePin}
                        onCreateTask={openTaskModal}
                        onDelete={(isPatron(currentUser) || r.user_id === currentUser.id) ? handleDelete : null}
                        onCopy={handleCopy}
                      />
                    </div>
                  ))}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {(isDmMode || canWriteRoomNow) ? (
          <ChatComposer
            text={text}
            setText={handleTextChange}
            msgType={msgType}
            setMsgType={setMsgType}
            replyTo={replyTo}
            clearReply={() => setReplyTo(null)}
            linkRecord={linkRecord}
            clearLink={() => setLinkRecord(null)}
            onSend={handleSend}
            disabled={false}
            isDm={isDmMode}
            mentionUsers={mentionUsers}
            mentionQuery={mentionQuery}
            onPickMention={pickMention}
            hashSuggestions={hashQuery !== null ? hashSuggestions : []}
            onPickHash={pickHash}
            onLinkPicker={() => setLinkModalOpen(true)}
          />
        ) : activeRoom ? (
          <div className="border-t p-4 text-center text-sm text-slate-500 bg-[#f0f2f5]">Salt okuma</div>
        ) : null}
      </div>

      <BroadcastModal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        form={broadcastForm}
        setForm={setBroadcastForm}
        onSend={handleBroadcast}
        rooms={visibleRooms}
      />

      <LinkRecordModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        companies={companies}
        bugs={bugs}
        onSelect={(rec) => { setLinkRecord(rec); setLinkModalOpen(false) }}
      />

      <Modal open={newDmModal} onClose={() => setNewDmModal(false)} title="Direkt Mesaj">
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {activeUsers.filter((u) => u.id !== currentUser.id).map((u) => (
            <button key={u.id} type="button" onClick={() => startDm(u.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">{u.name[0]}</span>
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
          <Button onClick={() => { if (taskForm.baslik) { addTask({ ...taskForm, olusturan_id: currentUser.id }); setTaskModal(null) } }} className="w-full">
            Oluştur
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
