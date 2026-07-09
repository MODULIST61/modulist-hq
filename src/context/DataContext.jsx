import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import * as api from '../lib/api'
import { generateId, parseMentionIds } from '../lib/utils'
import { devUsers, pickDevAssignee, feedbackToBugDraft, bugPriorityToTask } from '../lib/bugFlow'
import { useAuth } from './AuthContext'
import { canWriteRoom, isPatron, canDo } from '../lib/permissions'
import { isSupabaseConfigured } from '../lib/supabase'
import { supabase } from '../lib/supabase'

const DataContext = createContext(null)

const emptyState = {
  rooms: [],
  messages: [],
  tasks: [],
  companies: [],
  bugs: [],
  campaigns: [],
  contents: [],
  finance: [],
  feedback: [],
  dailyMetrics: [],
  dmThreads: [],
  notifications: [],
  auditLogs: [],
  taskComments: [],
  userActivity: [],
  settings: {},
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth()
  const [data, setData] = useState(emptyState)
  const [loading, setLoading] = useState(true)
  const dataRef = useRef(data)
  dataRef.current = data

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    try {
      const next = await api.fetchAllData()
      setData(next)
    } catch (e) {
      console.error('Veri yükleme hatası:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    return api.subscribeToRealtime((table) => {
      if (['messages', 'notifications', 'tasks', 'dmThreads', 'audit'].includes(table)) {
        reload()
      }
    })
  }, [reload])

  const setLocal = useCallback((updater) => {
    setData((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }))
  }, [])

  const logAudit = useCallback(async (action, summary, entityType = null, entityId = null, meta = {}) => {
    if (!currentUser?.id) return null
    try {
      const saved = await api.insertAuditLog({
        user_id: currentUser.id,
        action,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        summary,
        meta,
      })
      setLocal((prev) => ({ ...prev, auditLogs: [saved, ...prev.auditLogs].slice(0, 500) }))
      return saved
    } catch (e) {
      console.warn('Audit log:', e.message)
      return null
    }
  }, [currentUser, setLocal])

  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured) return undefined
    api.upsertUserActivity(currentUser.id, { last_seen_at: new Date().toISOString() }).catch(() => {})
    const t = setInterval(() => {
      api.upsertUserActivity(currentUser.id, { last_seen_at: new Date().toISOString() }).catch(() => {})
    }, 120000)
    return () => clearInterval(t)
  }, [currentUser?.id])

  const addNotification = useCallback(async (notif) => {
    const row = {
      user_id: notif.user_id,
      tip: notif.tip,
      ref: notif.ref || {},
      okundu: false,
    }
    const saved = await api.insertNotification(row)
    setLocal((prev) => ({ ...prev, notifications: [saved, ...prev.notifications] }))
    return saved
  }, [setLocal])

  const markNotificationRead = useCallback(async (id) => {
    await api.patchNotification(id, { okundu: true })
    setLocal((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, okundu: true } : n)),
    }))
  }, [setLocal])

  const markAllNotificationsRead = useCallback(async (userId) => {
    await api.markAllNotificationsReadDb(userId)
    setLocal((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.user_id === userId ? { ...n, okundu: true } : n)),
    }))
  }, [setLocal])

  const addMessage = useCallback(async (msg, users) => {
    const payload = {
      room_id: msg.room_id,
      user_id: msg.user_id || currentUser?.id,
      text: msg.text,
      type: msg.type || 'normal',
      mentions: [],
      pinned: msg.pinned || false,
      reply_to_id: msg.reply_to_id || null,
      attachments: msg.attachments || [],
      linked_record_type: msg.linked_record_type || null,
      linked_record_id: msg.linked_record_id || null,
      is_dm: msg.is_dm || false,
    }
    if (msg.text && users) {
      payload.mentions = parseMentionIds(msg.text, users)
      for (const uid of payload.mentions) {
        if (uid !== currentUser?.id) {
          await addNotification({
            tip: 'mention',
            user_id: uid,
            ref: { room_id: payload.room_id, is_dm: payload.is_dm },
          })
        }
      }
    }
    const saved = await api.insertMessage(payload)
    setLocal((prev) => ({ ...prev, messages: [...prev.messages, saved] }))
    logAudit('message_send', `Mesaj: ${payload.text.slice(0, 60)}`, 'message', saved.id)
    return saved
  }, [currentUser, addNotification, setLocal, logAudit])

  const updateMessage = useCallback(async (id, updates) => {
    const saved = await api.patchMessage(id, updates)
    setLocal((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === id ? saved : m)),
    }))
  }, [setLocal])

  const deleteMessage = useCallback(async (id) => {
    const msg = dataRef.current.messages.find((m) => m.id === id)
    await api.removeMessage(id)
    setLocal((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== id) }))
    if (msg) {
      logAudit('message_delete', `Mesaj silindi: ${msg.text.slice(0, 60)}`, 'message', id, { type: msg.type })
    }
  }, [setLocal, logAudit])

  const clearRoomMessages = useCallback(async (roomId) => {
    if (!isPatron(currentUser)) throw new Error('Sadece patron oda mesajlarını temizleyebilir')
    const room = dataRef.current.rooms.find((r) => r.id === roomId)
    const count = dataRef.current.messages.filter((m) => m.room_id === roomId && !m.is_dm).length
    await api.removeRoomMessages(roomId)
    setLocal((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => !(m.room_id === roomId && !m.is_dm)),
    }))
    logAudit(
      'room_messages_clear',
      `#${room?.name || roomId} odası temizlendi (${count} mesaj)`,
      'room',
      roomId,
      { count },
    )
    return count
  }, [currentUser, setLocal, logAudit])

  const broadcastPatron = useCallback(async ({ text, type, toAllRooms, toGenel }, users) => {
    const rooms = dataRef.current.rooms
    const msgs = []
    if (toAllRooms) {
      rooms.forEach((room) => {
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
    for (const m of msgs) await addMessage(m, users)
    return msgs.length
  }, [currentUser, addMessage])

  const getOrCreateDmThread = useCallback(async (otherUserId) => {
    const thread = await api.getOrCreateDmThreadDb(currentUser.id, otherUserId)
    setLocal((prev) => {
      const exists = prev.dmThreads.find((t) => t.id === thread.id)
      if (exists) return prev
      return { ...prev, dmThreads: [thread, ...prev.dmThreads] }
    })
    return thread
  }, [currentUser, setLocal])

  const sendDm = useCallback(async (threadId, text, users) => {
    await addMessage({ room_id: threadId, user_id: currentUser.id, text, type: 'normal', is_dm: true }, users)
    const partner = dataRef.current.dmThreads.find((t) => t.id === threadId)?.participants?.find((p) => p !== currentUser.id)
    if (partner) {
      await addNotification({ tip: 'dm', user_id: partner, ref: { room_id: threadId, is_dm: true } })
    }
    await api.touchDmThread(threadId)
    await reload()
  }, [addMessage, addNotification, currentUser, reload])

  const addTask = useCallback(async (task) => {
    const row = {
      baslik: task.baslik,
      aciklama: task.aciklama || null,
      sorumlu_id: task.sorumlu_id || null,
      olusturan_id: task.olusturan_id || currentUser?.id,
      durum: task.durum || 'yapilacak',
      oncelik: task.oncelik || 'normal',
      bitis_tarihi: task.bitis_tarihi || null,
      room_id: task.room_id || null,
      kayit_tipi: task.kayit_tipi || null,
      kayit_id: task.kayit_id || null,
    }
    const saved = await api.insertTask(row)
    setLocal((prev) => ({ ...prev, tasks: [saved, ...prev.tasks] }))
    logAudit('task_create', `Görev oluşturuldu: ${saved.baslik}`, 'task', saved.id)
    if (saved.sorumlu_id && saved.sorumlu_id !== currentUser?.id) {
      await addNotification({ tip: 'gorev_atandi', user_id: saved.sorumlu_id, ref: { task_id: saved.id } })
    }
    return saved
  }, [currentUser, addNotification, setLocal, logAudit])

  const updateTask = useCallback(async (id, updates) => {
    const saved = await api.patchTask(id, updates)
    setLocal((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? saved : t)),
    }))
    if (updates.durum === 'tamamlandi') {
      logAudit('task_done', `Görev tamamlandı: ${saved.baslik}`, 'task', id)
    } else {
      logAudit('task_update', `Görev güncellendi: ${saved.baslik}`, 'task', id, updates)
    }
  }, [setLocal, logAudit])

  const deleteTask = useCallback(async (id) => {
    await api.removeTask(id)
    setLocal((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
  }, [setLocal])

  const upsertCompany = useCallback(async (company) => {
    const prev = dataRef.current.companies.find((c) => c.id === company.id)
    const saved = await api.upsertRecord('hq_companies', company)
    setLocal((prevState) => {
      const exists = prevState.companies.find((c) => c.id === saved.id)
      return {
        ...prevState,
        companies: exists
          ? prevState.companies.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...prevState.companies],
      }
    })
    if (!prev) {
      logAudit('company_create', `Firma eklendi: ${saved.ad}`, 'company', saved.id)
    } else if (prev.pipeline !== saved.pipeline) {
      logAudit('pipeline_change', `${saved.ad}: ${prev.pipeline} → ${saved.pipeline}`, 'company', saved.id)
      if (['demo', 'trial', 'musteri'].includes(saved.pipeline)) {
        await addTask({
          baslik: `Pipeline: ${saved.ad} — ${saved.pipeline}`,
          aciklama: `${saved.ad} firması ${saved.pipeline} aşamasına geçti`,
          sorumlu_id: saved.sorumlu_id || currentUser?.id,
          oncelik: 'normal',
          kayit_tipi: 'firma',
          kayit_id: saved.id,
        })
      }
    } else {
      logAudit('company_update', `Firma güncellendi: ${saved.ad}`, 'company', saved.id)
    }
  }, [setLocal, logAudit, addTask, currentUser])

  const deleteCompany = useCallback(async (id) => {
    await api.deleteFrom('hq_companies', id)
    setLocal((prev) => ({ ...prev, companies: prev.companies.filter((c) => c.id !== id) }))
  }, [setLocal])

  const upsertBug = useCallback(async (bug) => {
    const prev = dataRef.current.bugs.find((b) => b.id === bug.id)
    const isNew = !prev
    const row = {
      ...bug,
      bildiren_id: bug.bildiren_id || currentUser?.id,
      hub_durum: bug.hub_durum || (isNew ? 'triage' : prev?.hub_durum || 'triage'),
    }
    if (row.sorumlu_id && row.hub_durum === 'triage' && row.durum !== 'kapali') {
      row.hub_durum = 'sprint'
    }
    if (row.durum === 'kapali' && !row.kapanis_tarihi) {
      row.kapanis_tarihi = new Date().toISOString().split('T')[0]
    }
    const saved = await api.upsertRecord('hq_bugs', row)
    setLocal((prevState) => {
      const exists = prevState.bugs.find((b) => b.id === saved.id)
      return {
        ...prevState,
        bugs: exists ? prevState.bugs.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prevState.bugs],
      }
    })

    const users = await api.fetchUsers().catch(() => [])
    const urunRoom = dataRef.current.rooms.find((r) => r.slug === 'urun')
    const operasyonRoom = dataRef.current.rooms.find((r) => r.slug === 'operasyon')
    const company = saved.iliskili_firma_id
      ? dataRef.current.companies.find((c) => c.id === saved.iliskili_firma_id)
      : null

    if (isNew) {
      logAudit('bug_create', `Bug raporlandı: ${saved.baslik}`, 'bug', saved.id)
      const hasTask = dataRef.current.tasks.some((t) => t.kayit_tipi === 'bug' && t.kayit_id === saved.id)
      if (!hasTask) {
        await addTask({
          baslik: `Bug: ${saved.baslik}`,
          aciklama: saved.aciklama || '',
          sorumlu_id: saved.sorumlu_id || pickDevAssignee(users, null) || currentUser?.id,
          oncelik: bugPriorityToTask(saved.oncelik),
          room_id: urunRoom?.id || null,
          kayit_tipi: 'bug',
          kayit_id: saved.id,
          olusturan_id: currentUser?.id,
        })
      }
      if (urunRoom) {
        const firmaLabel = company?.ad ? ` (${company.ad})` : ''
        await addMessage({
          room_id: urunRoom.id,
          user_id: currentUser?.id,
          text: `🐛 Yeni bug: ${saved.baslik}${firmaLabel} · ${saved.oncelik}`,
          type: saved.oncelik === 'kritik' ? 'duyuru' : 'gorev',
          linked_record_type: 'bug',
          linked_record_id: saved.id,
        }, users)
      }
      const notifyIds = new Set(devUsers(users).map((u) => u.id))
      if (saved.sorumlu_id) notifyIds.add(saved.sorumlu_id)
      if (['kritik', 'yuksek'].includes(saved.oncelik)) {
        users.filter((u) => u.role === 'patron').forEach((p) => notifyIds.add(p.id))
      }
      notifyIds.delete(currentUser?.id)
      for (const uid of notifyIds) {
        await addNotification({ tip: 'bug_yeni', user_id: uid, ref: { bug_id: saved.id } })
      }
    } else if (prev?.durum !== saved.durum) {
      logAudit('bug_update', `Bug durumu: ${saved.baslik} → ${saved.durum}`, 'bug', saved.id)
      if (urunRoom) {
        await addMessage({
          room_id: urunRoom.id,
          user_id: currentUser?.id,
          text: `🐛 Bug güncellendi: ${saved.baslik} → ${saved.durum}`,
          type: 'normal',
          linked_record_type: 'bug',
          linked_record_id: saved.id,
        }, users)
      }
    }

    if (saved.durum === 'kapali' && prev?.durum !== 'kapali') {
      if (saved.feedback_id) {
        const fb = dataRef.current.feedback.find((f) => f.id === saved.feedback_id)
        if (fb && fb.durum !== 'cozuldu') {
          const fbSaved = await api.upsertRecord('hq_feedback', { ...fb, durum: 'cozuldu', bug_id: saved.id })
          setLocal((prevState) => ({
            ...prevState,
            feedback: prevState.feedback.map((f) => (f.id === fbSaved.id ? fbSaved : f)),
          }))
        }
      }
      const sekreterId = company?.sorumlu_id || saved.bildiren_id
      if (!saved.musteri_bildirildi && sekreterId && saved.iliskili_firma_id) {
        await addNotification({
          tip: 'bug_musteri_bildir',
          user_id: sekreterId,
          ref: { bug_id: saved.id, firma_id: saved.iliskili_firma_id },
        })
        const hasNotifyTask = dataRef.current.tasks.some(
          (t) => t.kayit_tipi === 'bug' && t.kayit_id === saved.id && t.baslik?.includes('Müşteriye bildir'),
        )
        if (!hasNotifyTask) {
          await addTask({
            baslik: `Müşteriye bildir: ${saved.baslik}`,
            aciklama: saved.cozum_notu || 'Bug kapandı — müşteriye geri dönüş yapın.',
            sorumlu_id: sekreterId,
            oncelik: 'normal',
            room_id: operasyonRoom?.id || null,
            kayit_tipi: 'bug',
            kayit_id: saved.id,
            olusturan_id: currentUser?.id,
          })
        }
      }
    }

    return saved
  }, [currentUser, setLocal, addTask, addMessage, addNotification, logAudit])

  const deleteBug = useCallback(async (id) => {
    await api.deleteFrom('hq_bugs', id)
    setLocal((prev) => ({ ...prev, bugs: prev.bugs.filter((b) => b.id !== id) }))
  }, [setLocal])

  const upsertCampaign = useCallback(async (campaign) => {
    const prev = dataRef.current.campaigns.find((c) => c.id === campaign.id)
    const saved = await api.upsertRecord('hq_campaigns', campaign)
    setLocal((prev) => {
      const exists = prev.campaigns.find((c) => c.id === saved.id)
      return {
        ...prev,
        campaigns: exists ? prev.campaigns.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev.campaigns],
      }
    })
    logAudit(
      prev ? 'campaign_update' : 'campaign_update',
      prev ? `Kampanya güncellendi: ${saved.ad}` : `Kampanya eklendi: ${saved.ad}`,
      'campaign',
      saved.id
    )
  }, [setLocal, logAudit])

  const deleteCampaign = useCallback(async (id) => {
    await api.deleteFrom('hq_campaigns', id)
    setLocal((prev) => ({ ...prev, campaigns: prev.campaigns.filter((c) => c.id !== id) }))
  }, [setLocal])

  const upsertContent = useCallback(async (content) => {
    const saved = await api.upsertRecord('hq_contents', content)
    setLocal((prev) => {
      const exists = prev.contents.find((c) => c.id === saved.id)
      return {
        ...prev,
        contents: exists ? prev.contents.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev.contents],
      }
    })
  }, [setLocal])

  const deleteContent = useCallback(async (id) => {
    await api.deleteFrom('hq_contents', id)
    setLocal((prev) => ({ ...prev, contents: prev.contents.filter((c) => c.id !== id) }))
  }, [setLocal])

  const upsertFinance = useCallback(async (entry) => {
    const item = {
      ...entry,
      giren_id: entry.giren_id || currentUser?.id,
      firma_id: entry.firma_id || null,
      kampanya_id: entry.kampanya_id || null,
    }
    if (item.tip === 'gider' && !isPatron(currentUser) && !canDo(currentUser, 'approveFinance') && !item.durum) {
      item.durum = 'bekliyor'
    }
    if ((isPatron(currentUser) || canDo(currentUser, 'approveFinance')) && item.durum === 'onaylandi' && !item.onaylayan_id) {
      item.onaylayan_id = currentUser.id
      item.onay_tarihi = new Date().toISOString()
    }
    const saved = await api.upsertRecord('hq_finance', item)
    setLocal((prev) => {
      const exists = prev.finance.find((f) => f.id === saved.id)
      return {
        ...prev,
        finance: exists ? prev.finance.map((f) => (f.id === saved.id ? saved : f)) : [saved, ...prev.finance],
      }
    })
    if (saved.durum === 'bekliyor') {
      logAudit('finance_create', `Gider talebi: ${saved.aciklama || saved.kategori} (${saved.tutar} TL)`, 'finance', saved.id)
    }
  }, [currentUser, setLocal, logAudit])

  const approveFinance = useCallback(async (id, note = '') => {
    const item = dataRef.current.finance.find((f) => f.id === id)
    const { data, error } = await supabase.from('hq_finance').update({
      durum: 'onaylandi',
      onaylayan_id: currentUser?.id,
      onay_tarihi: new Date().toISOString(),
      onay_notu: note?.trim() || null,
    }).eq('id', id).select().single()
    if (error) throw error
    setLocal((prev) => ({
      ...prev,
      finance: prev.finance.map((f) => (f.id === id ? data : f)),
    }))
    logAudit('finance_approve', `Gider onaylandı: ${item?.aciklama || item?.kategori || id}`, 'finance', id, { note })
  }, [currentUser, setLocal, logAudit])

  const rejectFinance = useCallback(async (id, note = '') => {
    const item = dataRef.current.finance.find((f) => f.id === id)
    const { data, error } = await supabase.from('hq_finance').update({
      durum: 'reddedildi',
      onaylayan_id: currentUser?.id,
      onay_tarihi: new Date().toISOString(),
      onay_notu: note?.trim() || null,
    }).eq('id', id).select().single()
    if (error) throw error
    setLocal((prev) => ({
      ...prev,
      finance: prev.finance.map((f) => (f.id === id ? data : f)),
    }))
    logAudit('finance_reject', `Gider reddedildi: ${item?.aciklama || item?.kategori || id}`, 'finance', id, { note })
  }, [currentUser, setLocal, logAudit])

  const deleteFinance = useCallback(async (id) => {
    await api.deleteFrom('hq_finance', id)
    setLocal((prev) => ({ ...prev, finance: prev.finance.filter((f) => f.id !== id) }))
  }, [setLocal])

  const upsertFeedback = useCallback(async (fb) => {
    const prev = dataRef.current.feedback.find((f) => f.id === fb.id)
    const isNew = !prev
    const saved = await api.upsertRecord('hq_feedback', { ...fb, user_id: fb.user_id || currentUser?.id })
    setLocal((prevState) => {
      const exists = prevState.feedback.find((f) => f.id === saved.id)
      return {
        ...prevState,
        feedback: exists ? prevState.feedback.map((f) => (f.id === saved.id ? saved : f)) : [saved, ...prevState.feedback],
      }
    })

    if (isNew) {
      logAudit('feedback_create', `Geri dönüş: ${saved.tip}`, 'feedback', saved.id)
      if (['sikayet', 'soru'].includes(saved.tip)) {
        const users = await api.fetchUsers().catch(() => [])
        for (const dev of devUsers(users)) {
          if (dev.id === currentUser?.id) continue
          await addNotification({ tip: 'feedback_yeni', user_id: dev.id, ref: { feedback_id: saved.id } })
        }
      }
    }
    return saved
  }, [currentUser, setLocal, logAudit, addNotification])

  const convertFeedbackToBug = useCallback(async (feedbackId) => {
    const fb = dataRef.current.feedback.find((f) => f.id === feedbackId)
    if (!fb) throw new Error('Geri dönüş bulunamadı')
    if (fb.bug_id) {
      const existing = dataRef.current.bugs.find((b) => b.id === fb.bug_id)
      if (existing) return existing
    }
    const draft = feedbackToBugDraft(fb, '')
    const bug = await upsertBug({
      ...draft,
      id: generateId(),
      bildiren_id: fb.user_id || currentUser?.id,
    })
    await upsertFeedback({ ...fb, durum: 'inceleniyor', bug_id: bug.id })
    logAudit('feedback_to_bug', `Geri dönüş bug'a çevrildi: ${bug.baslik}`, 'feedback', fb.id, { bug_id: bug.id })
    return bug
  }, [currentUser, upsertBug, upsertFeedback, logAudit])

  const deleteFeedback = useCallback(async (id) => {
    await api.deleteFrom('hq_feedback', id)
    setLocal((prev) => ({ ...prev, feedback: prev.feedback.filter((f) => f.id !== id) }))
  }, [setLocal])

  const upsertDailyMetric = useCallback(async (metric) => {
    const item = { ...metric, user_id: metric.user_id || currentUser?.id }
    const dup = dataRef.current.dailyMetrics.find((m) => m.tarih === item.tarih && m.user_id === item.user_id)
    const saved = await api.upsertRecord('hq_daily_metrics', dup ? { ...item, id: dup.id } : item)
    setLocal((prev) => {
      const exists = prev.dailyMetrics.find((m) => m.id === saved.id)
      return {
        ...prev,
        dailyMetrics: exists
          ? prev.dailyMetrics.map((m) => (m.id === saved.id ? saved : m))
          : [saved, ...prev.dailyMetrics],
      }
    })
    logAudit('metric_log', `Günlük metrik: ${saved.arama_sayisi} arama`, 'metric', saved.id)
  }, [currentUser, setLocal, logAudit])

  const addTaskComment = useCallback(async (taskId, text) => {
    const saved = await api.insertTaskComment({ task_id: taskId, user_id: currentUser.id, text })
    setLocal((prev) => ({ ...prev, taskComments: [...prev.taskComments, saved] }))
    logAudit('task_update', `Göreve yorum: ${text.slice(0, 40)}`, 'task', taskId)
    return saved
  }, [currentUser, setLocal, logAudit])

  const deleteDailyMetric = useCallback(async (id) => {
    await api.deleteFrom('hq_daily_metrics', id)
    setLocal((prev) => ({ ...prev, dailyMetrics: prev.dailyMetrics.filter((m) => m.id !== id) }))
  }, [setLocal])

  const updateSettings = useCallback(async (updates) => {
    const merged = await api.updateWorkspaceSettings(updates)
    setLocal((prev) => ({ ...prev, settings: merged }))
  }, [setLocal])

  const resetAllData = useCallback(() => {
    alert('Veri sıfırlama Supabase üzerinden yapılmalı. SQL Editor kullanın.')
  }, [])

  const loadSample = useCallback(async (patronId) => {
    const next = await api.insertSampleData(patronId, dataRef.current)
    setData(next)
  }, [])

  const addUser = useCallback(async (user) => {
    const id = await api.addMember({
      name: user.name,
      email: user.email,
      password: user.password,
      job_title: user.job_title,
      permissions: user.permissions,
    })
    return { id, ...user }
  }, [])

  const updateUser = useCallback(async (id, updates) => {
    if (updates.password) {
      await api.resetPassword(id, updates.password)
      const { password, ...rest } = updates
      if (Object.keys(rest).length) await api.updateUserRecord(id, rest)
    } else {
      await api.updateUserRecord(id, updates)
    }
  }, [])

  const deleteUser = useCallback(async (id) => {
    await api.deleteUserRecord(id)
  }, [])

  return (
    <DataContext.Provider
      value={{
        ...data,
        loading,
        reload,
        addMessage,
        updateMessage,
        deleteMessage,
        clearRoomMessages,
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
        convertFeedbackToBug,
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
        logAudit,
        addTaskComment,
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
