import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as storage from '../lib/storage'
import { STORAGE_KEYS } from '../lib/constants'
import { generateId, parseMentionIds } from '../lib/utils'
import { dmThreadId } from '../lib/dm'
import { loadSampleData } from '../lib/seed'
import { useAuth } from './AuthContext'
import { canWriteRoom, isPatron, canDo } from '../lib/permissions'

const DataContext = createContext(null)

const emptyState = () => {
  const init = storage.init()
  return {
    rooms: init.rooms,
    messages: init.messages,
    tasks: init.tasks,
    companies: init.companies,
    bugs: init.bugs,
    campaigns: init.campaigns,
    contents: init.contents,
    finance: init.finance,
    feedback: init.feedback || [],
    dailyMetrics: init.dailyMetrics || [],
    dmThreads: init.dmThreads || [],
    notifications: init.notifications,
    settings: init.settings,
  }
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth()
  const [data, setData] = useState(emptyState)

  const persist = useCallback((next) => {
    setData((prev) => {
      const merged = typeof next === 'function' ? next(prev) : { ...prev, ...next }
      const full = storage.init()
      storage.persistAll({ ...full, ...merged })
      return merged
    })
  }, [])

  useEffect(() => {
    setData(emptyState())
  }, [])

  const addNotification = useCallback(
    (notif) => {
      persist((prev) => ({
        ...prev,
        notifications: [
          { id: generateId(), okundu: false, created_at: new Date().toISOString(), ...notif },
          ...prev.notifications,
        ],
      }))
    },
    [persist]
  )

  const markNotificationRead = useCallback(
    (id) => persist((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, okundu: true } : n)),
    })),
    [persist]
  )

  const markAllNotificationsRead = useCallback(
    (userId) => persist((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.user_id === userId ? { ...n, okundu: true } : n)),
    })),
    [persist]
  )

  const addMessage = useCallback(
    (msg, users) => {
      const message = {
        id: generateId(),
        created_at: new Date().toISOString(),
        pinned: false,
        reply_to_id: null,
        attachments: [],
        linked_record_type: null,
        linked_record_id: null,
        mentions: [],
        is_dm: false,
        ...msg,
      }
      if (msg.text && users) {
        message.mentions = parseMentionIds(msg.text, users)
        message.mentions.forEach((uid) => {
          if (uid !== currentUser?.id) {
            addNotification({
              tip: 'mention',
              user_id: uid,
              ref: { message_id: message.id, room_id: message.room_id, is_dm: message.is_dm },
            })
          }
        })
      }
      persist((prev) => ({ ...prev, messages: [...prev.messages, message] }))
      return message
    },
    [persist, currentUser, addNotification]
  )

  const updateMessage = useCallback(
    (id, updates) => persist((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
    [persist]
  )

  const broadcastPatron = useCallback(
    ({ text, type, toAllRooms, toGenel }, users) => {
      const { rooms: allRooms } = storage.init()
      const msgs = []
      if (toAllRooms) {
        allRooms.forEach((room) => {
          if (canWriteRoom(currentUser, room.slug)) {
            msgs.push({ room_id: room.id, user_id: currentUser.id, text, type: type || 'duyuru', is_dm: false })
          }
        })
      }
      if (toGenel) {
        const mentionText = users
          .filter((u) => u.status === 'aktif' && u.id !== currentUser.id)
          .map((u) => `@${u.name}`)
          .join(' ')
        msgs.push({
          room_id: 'genel',
          user_id: currentUser.id,
          text: `${text}\n\n${mentionText}`.trim(),
          type: type || 'duyuru',
          pinned: true,
          is_dm: false,
        })
      }
      msgs.forEach((m) => addMessage(m, users))
      return msgs.length
    },
    [currentUser, addMessage]
  )

  const getOrCreateDmThread = useCallback(
    (otherUserId) => {
      const tid = dmThreadId(currentUser.id, otherUserId)
      const threads = storage.get(STORAGE_KEYS.DM_THREADS, [])
      const existing = threads.find((t) => t.id === tid)
      if (existing) return existing
      const thread = {
        id: tid,
        participants: [currentUser.id, otherUserId].sort(),
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      }
      persist((prev) => ({ ...prev, dmThreads: [...(prev.dmThreads || []), thread] }))
      return thread
    },
    [currentUser, persist]
  )

  const sendDm = useCallback(
    (threadId, text, users) => {
      addMessage({ room_id: threadId, user_id: currentUser.id, text, type: 'normal', is_dm: true }, users)
      const partner = data.dmThreads.find((t) => t.id === threadId)?.participants.find((p) => p !== currentUser.id)
      if (partner) {
        addNotification({ tip: 'mention', user_id: partner, ref: { room_id: threadId, is_dm: true } })
      }
      persist((prev) => ({
        ...prev,
        dmThreads: prev.dmThreads.map((t) =>
          t.id === threadId ? { ...t, last_message_at: new Date().toISOString() } : t
        ),
      }))
    },
    [addMessage, addNotification, currentUser, data.dmThreads, persist]
  )

  const addTask = useCallback(
    (task) => {
      const t = {
        id: generateId(),
        durum: 'yapilacak',
        oncelik: 'normal',
        kayit_tipi: null,
        kayit_id: null,
        created_at: new Date().toISOString(),
        olusturan_id: currentUser?.id,
        ...task,
      }
      persist((prev) => ({ ...prev, tasks: [...prev.tasks, t] }))
      if (t.sorumlu_id && t.sorumlu_id !== currentUser?.id) {
        addNotification({ tip: 'gorev_atandi', user_id: t.sorumlu_id, ref: { task_id: t.id } })
      }
      return t
    },
    [persist, currentUser, addNotification]
  )

  const updateTask = useCallback(
    (id, updates) => persist((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)),
    })),
    [persist]
  )

  const deleteTask = useCallback((id) => persist((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) })), [persist])

  const upsertCompany = useCallback((company) => {
    persist((prev) => {
      const exists = prev.companies.find((c) => c.id === company.id)
      const updated = { ...company, updated_at: new Date().toISOString() }
      if (exists) return { ...prev, companies: prev.companies.map((c) => (c.id === company.id ? updated : c)) }
      return {
        ...prev,
        companies: [{ ...updated, id: company.id || generateId(), created_at: new Date().toISOString() }, ...prev.companies],
      }
    })
  }, [persist])

  const deleteCompany = useCallback((id) => persist((prev) => ({ ...prev, companies: prev.companies.filter((c) => c.id !== id) })), [persist])

  const upsertBug = useCallback((bug) => {
    persist((prev) => {
      const exists = prev.bugs.find((b) => b.id === bug.id)
      const updated = { ...bug, updated_at: new Date().toISOString() }
      if (bug.durum === 'kapali' && !updated.kapanis_tarihi) updated.kapanis_tarihi = new Date().toISOString().split('T')[0]
      if (exists) return { ...prev, bugs: prev.bugs.map((b) => (b.id === bug.id ? updated : b)) }
      return {
        ...prev,
        bugs: [{ ...updated, id: bug.id || generateId(), bildiren_id: bug.bildiren_id || currentUser?.id, created_at: new Date().toISOString() }, ...prev.bugs],
      }
    })
  }, [persist, currentUser])

  const deleteBug = useCallback((id) => persist((prev) => ({ ...prev, bugs: prev.bugs.filter((b) => b.id !== id) })), [persist])

  const upsertCampaign = useCallback((campaign) => {
    persist((prev) => {
      const exists = prev.campaigns.find((c) => c.id === campaign.id)
      if (exists) return { ...prev, campaigns: prev.campaigns.map((c) => (c.id === campaign.id ? campaign : c)) }
      return { ...prev, campaigns: [{ ...campaign, id: campaign.id || generateId(), created_at: new Date().toISOString() }, ...prev.campaigns] }
    })
  }, [persist])

  const deleteCampaign = useCallback((id) => persist((prev) => ({ ...prev, campaigns: prev.campaigns.filter((c) => c.id !== id) })), [persist])

  const upsertContent = useCallback((content) => {
    persist((prev) => {
      const exists = prev.contents.find((c) => c.id === content.id)
      if (exists) return { ...prev, contents: prev.contents.map((c) => (c.id === content.id ? content : c)) }
      return { ...prev, contents: [{ ...content, id: content.id || generateId(), created_at: new Date().toISOString() }, ...prev.contents] }
    })
  }, [persist])

  const deleteContent = useCallback((id) => persist((prev) => ({ ...prev, contents: prev.contents.filter((c) => c.id !== id) })), [persist])

  const upsertFinance = useCallback((entry) => {
    persist((prev) => {
      const exists = prev.finance.find((f) => f.id === entry.id)
      const item = {
        ...entry,
        id: entry.id || generateId(),
        created_at: entry.created_at || new Date().toISOString(),
        giren_id: entry.giren_id || currentUser?.id,
      }
      if (exists) return { ...prev, finance: prev.finance.map((f) => (f.id === entry.id ? item : f)) }
      if (item.tip === 'gider' && !isPatron(currentUser) && !canDo(currentUser, 'approveFinance') && !item.durum) item.durum = 'bekliyor'
      if ((isPatron(currentUser) || canDo(currentUser, 'approveFinance')) && item.durum === 'onaylandi' && !item.onaylayan_id) {
        item.onaylayan_id = currentUser.id
        item.onay_tarihi = new Date().toISOString()
      }
      return { ...prev, finance: [item, ...prev.finance] }
    })
  }, [persist, currentUser])

  const approveFinance = useCallback((id) => {
    persist((prev) => ({
      ...prev,
      finance: prev.finance.map((f) =>
        f.id === id ? { ...f, durum: 'onaylandi', onaylayan_id: currentUser?.id, onay_tarihi: new Date().toISOString() } : f
      ),
    }))
  }, [persist, currentUser])

  const rejectFinance = useCallback((id) => {
    persist((prev) => ({
      ...prev,
      finance: prev.finance.map((f) =>
        f.id === id ? { ...f, durum: 'reddedildi', onaylayan_id: currentUser?.id, onay_tarihi: new Date().toISOString() } : f
      ),
    }))
  }, [persist, currentUser])

  const deleteFinance = useCallback((id) => persist((prev) => ({ ...prev, finance: prev.finance.filter((f) => f.id !== id) })), [persist])

  const upsertFeedback = useCallback((fb) => {
    persist((prev) => {
      const exists = prev.feedback.find((f) => f.id === fb.id)
      const item = { ...fb, updated_at: new Date().toISOString() }
      if (exists) return { ...prev, feedback: prev.feedback.map((f) => (f.id === fb.id ? item : f)) }
      return {
        ...prev,
        feedback: [{ ...item, id: fb.id || generateId(), created_at: new Date().toISOString(), durum: fb.durum || 'yeni' }, ...prev.feedback],
      }
    })
  }, [persist])

  const deleteFeedback = useCallback((id) => persist((prev) => ({ ...prev, feedback: prev.feedback.filter((f) => f.id !== id) })), [persist])

  const upsertDailyMetric = useCallback((metric) => {
    persist((prev) => {
      const exists = prev.dailyMetrics.find((m) => m.id === metric.id)
      const item = { ...metric, user_id: metric.user_id || currentUser?.id }
      if (exists) return { ...prev, dailyMetrics: prev.dailyMetrics.map((m) => (m.id === metric.id ? item : m)) }
      const dup = prev.dailyMetrics.find((m) => m.tarih === item.tarih && m.user_id === item.user_id)
      if (dup) return { ...prev, dailyMetrics: prev.dailyMetrics.map((m) => (m.id === dup.id ? { ...item, id: dup.id } : m)) }
      return {
        ...prev,
        dailyMetrics: [{ ...item, id: metric.id || generateId(), created_at: new Date().toISOString() }, ...prev.dailyMetrics],
      }
    })
  }, [persist, currentUser])

  const deleteDailyMetric = useCallback((id) => persist((prev) => ({ ...prev, dailyMetrics: prev.dailyMetrics.filter((m) => m.id !== id) })), [persist])

  const updateSettings = useCallback((updates) => persist((prev) => ({ ...prev, settings: { ...prev.settings, ...updates } })), [persist])

  const resetAllData = useCallback(() => {
    storage.clearAll()
    window.location.href = '/kurulum'
  }, [])

  const loadSample = useCallback((patronId) => persist((prev) => loadSampleData(prev, patronId)), [persist])

  const addUser = useCallback((user) => {
    const users = storage.get(STORAGE_KEYS.USERS, [])
    const newUser = { ...user, id: generateId(), status: 'aktif', created_at: new Date().toISOString() }
    storage.set(STORAGE_KEYS.USERS, [...users, newUser])
    return newUser
  }, [])

  const updateUser = useCallback((id, updates) => {
    const users = storage.get(STORAGE_KEYS.USERS, [])
    storage.set(STORAGE_KEYS.USERS, users.map((u) => (u.id === id ? { ...u, ...updates } : u)))
  }, [])

  const deleteUser = useCallback((id) => {
    const users = storage.get(STORAGE_KEYS.USERS, [])
    storage.set(STORAGE_KEYS.USERS, users.filter((u) => u.id !== id))
  }, [])

  return (
    <DataContext.Provider
      value={{
        ...data,
        persist,
        addMessage,
        updateMessage,
        broadcastPatron,
        getOrCreateDmThread,
        sendDm,
        addTask,
        updateTask,
        deleteTask,
        upsertCompany,
        deleteCompany,
        upsertBug,
        deleteBug,
        upsertCampaign,
        deleteCampaign,
        upsertContent,
        deleteContent,
        upsertFinance,
        approveFinance,
        rejectFinance,
        deleteFinance,
        upsertFeedback,
        deleteFeedback,
        upsertDailyMetric,
        deleteDailyMetric,
        updateSettings,
        resetAllData,
        loadSample,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
