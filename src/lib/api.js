import { supabase } from './supabase'
import { migrateUser } from './access'
import { dmThreadId } from './dm'
import { loadSampleData } from './seed'

const USER_COLUMNS = 'id, name, email, role, job_title, permissions, status, created_at, updated_at'

function throwIfError(error) {
  if (error) throw error
}

export async function fetchWorkspace() {
  const { data, error } = await supabase.from('hq_workspace').select('*').eq('id', 1).single()
  throwIfError(error)
  return {
    initialized: data?.initialized ?? false,
    settings: data?.settings ?? {},
  }
}

export async function fetchUsers() {
  const { data, error } = await supabase.from('hq_users').select(USER_COLUMNS).order('created_at')
  throwIfError(error)
  return (data || []).map(migrateUser)
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.rpc('hq_login', {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  })
  throwIfError(error)
  if (!data?.length) return null
  return migrateUser(data[0])
}

export async function setupPatron({ name, email, password }) {
  const { data, error } = await supabase.rpc('hq_setup_patron', {
    p_name: name.trim(),
    p_email: email.trim().toLowerCase(),
    p_password: password,
  })
  throwIfError(error)
  return data
}

export async function addMember({ name, email, password, job_title, permissions }) {
  const { data, error } = await supabase.rpc('hq_add_member', {
    p_name: name.trim(),
    p_email: email.trim().toLowerCase(),
    p_password: password,
    p_job_title: job_title.trim(),
    p_permissions: permissions,
  })
  throwIfError(error)
  return data
}

export async function resetPassword(userId, newPassword) {
  const { error } = await supabase.rpc('hq_reset_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  })
  throwIfError(error)
}

export async function updateUserRecord(id, updates) {
  const { password, password_hash, ...safe } = updates
  const { error } = await supabase.from('hq_users').update(safe).eq('id', id)
  throwIfError(error)
}

export async function deleteUserRecord(id) {
  const { error } = await supabase.from('hq_users').delete().eq('id', id)
  throwIfError(error)
}

export async function updateWorkspaceSettings(settings) {
  const { data: current } = await supabase.from('hq_workspace').select('settings').eq('id', 1).single()
  const merged = { ...(current?.settings || {}), ...settings }
  const { error } = await supabase.from('hq_workspace').update({ settings: merged }).eq('id', 1)
  throwIfError(error)
  return merged
}

async function fetchOptional(builder) {
  const { data, error } = await builder
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('schema cache')) return []
    throw error
  }
  return data || []
}

export async function fetchAllData() {
  const [
    rooms, messages, tasks, companies, bugs, campaigns, contents,
    finance, feedback, dailyMetrics, dmThreads, notifications, workspace,
    auditLogs, taskComments, userActivity,
  ] = await Promise.all([
    supabase.from('hq_rooms').select('*').order('created_at'),
    supabase.from('hq_messages').select('*').order('created_at'),
    supabase.from('hq_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_companies').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_bugs').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_contents').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_finance').select('*').order('tarih', { ascending: false }),
    supabase.from('hq_feedback').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_daily_metrics').select('*').order('tarih', { ascending: false }),
    supabase.from('hq_dm_threads').select('*').order('last_message_at', { ascending: false }),
    supabase.from('hq_notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('hq_workspace').select('settings').eq('id', 1).single(),
    fetchOptional(supabase.from('hq_audit_log').select('*').order('created_at', { ascending: false }).limit(500)),
    fetchOptional(supabase.from('hq_task_comments').select('*').order('created_at')),
    fetchOptional(supabase.from('hq_user_activity').select('*')),
  ])

  const errors = [rooms, messages, tasks, companies, bugs, campaigns, contents, finance, feedback, dailyMetrics, dmThreads, notifications, workspace]
    .map((r) => r.error).filter(Boolean)
  if (errors.length) throw errors[0]

  return {
    rooms: rooms.data || [],
    messages: messages.data || [],
    tasks: tasks.data || [],
    companies: companies.data || [],
    bugs: bugs.data || [],
    campaigns: campaigns.data || [],
    contents: contents.data || [],
    finance: finance.data || [],
    feedback: feedback.data || [],
    dailyMetrics: dailyMetrics.data || [],
    dmThreads: dmThreads.data || [],
    notifications: notifications.data || [],
    auditLogs: auditLogs || [],
    taskComments: taskComments || [],
    userActivity: userActivity || [],
    settings: workspace.data?.settings || {},
  }
}

export async function insertMessage(message) {
  const { data, error } = await supabase.from('hq_messages').insert(message).select().single()
  throwIfError(error)
  return data
}

export async function patchMessage(id, updates) {
  const { data, error } = await supabase.from('hq_messages').update(updates).eq('id', id).select().single()
  throwIfError(error)
  return data
}

export async function removeMessage(id) {
  const { error } = await supabase.from('hq_messages').delete().eq('id', id)
  throwIfError(error)
}

export async function insertNotification(notif) {
  const { data, error } = await supabase.from('hq_notifications').insert(notif).select().single()
  throwIfError(error)
  return data
}

export async function patchNotification(id, updates) {
  const { error } = await supabase.from('hq_notifications').update(updates).eq('id', id)
  throwIfError(error)
}

export async function markAllNotificationsReadDb(userId) {
  const { error } = await supabase.from('hq_notifications').update({ okundu: true }).eq('user_id', userId).eq('okundu', false)
  throwIfError(error)
}

export async function upsertDmThread(thread) {
  const { data, error } = await supabase.from('hq_dm_threads').upsert(thread).select().single()
  throwIfError(error)
  return data
}

export async function touchDmThread(threadId) {
  const { error } = await supabase.from('hq_dm_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId)
  throwIfError(error)
}

export async function insertTask(task) {
  const { data, error } = await supabase.from('hq_tasks').insert(task).select().single()
  throwIfError(error)
  return data
}

export async function patchTask(id, updates) {
  const { data, error } = await supabase.from('hq_tasks').update(updates).eq('id', id).select().single()
  throwIfError(error)
  return data
}

export async function removeTask(id) {
  const { error } = await supabase.from('hq_tasks').delete().eq('id', id)
  throwIfError(error)
}

export async function upsertRecord(table, row, idField = 'id') {
  const id = row[idField]
  if (id) {
    const { data: existing } = await supabase.from(table).select('id').eq('id', id).maybeSingle()
    if (existing) {
      const { data, error } = await supabase.from(table).update(row).eq('id', id).select().single()
      throwIfError(error)
      return data
    }
  }
  const { id: _omit, ...insertRow } = row
  const { data, error } = await supabase.from(table).insert(insertRow).select().single()
  throwIfError(error)
  return data
}

export async function removeRecord(table, id) {
  const { error } = await supabase.from('hq_' + table).delete().eq('id', id)
  throwIfError(error)
}

export async function deleteFrom(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  throwIfError(error)
}

export async function getOrCreateDmThreadDb(userId, otherUserId) {
  const tid = dmThreadId(userId, otherUserId)
  const { data: existing } = await supabase.from('hq_dm_threads').select('*').eq('id', tid).maybeSingle()
  if (existing) return existing
  const thread = {
    id: tid,
    participants: [userId, otherUserId].sort(),
    created_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  }
  return upsertDmThread(thread)
}

export async function insertSampleData(patronId, currentData) {
  const sample = loadSampleData({ ...currentData, messages: currentData.messages }, patronId)
  const ops = []

  for (const c of sample.companies) {
    ops.push(supabase.from('hq_companies').insert({ ...c, sorumlu_id: c.sorumlu_id || patronId }))
  }
  for (const b of sample.bugs) {
    ops.push(supabase.from('hq_bugs').insert(b))
  }
  for (const camp of sample.campaigns) {
    ops.push(supabase.from('hq_campaigns').insert(camp))
  }
  for (const f of sample.feedback) {
    ops.push(supabase.from('hq_feedback').insert(f))
  }
  for (const d of sample.dailyMetrics) {
    ops.push(supabase.from('hq_daily_metrics').insert(d))
  }
  for (const fin of sample.finance) {
    ops.push(supabase.from('hq_finance').insert(fin))
  }
  const newMsgs = sample.messages.filter((m) => !currentData.messages.find((x) => x.id === m.id))
  for (const m of newMsgs) {
    ops.push(supabase.from('hq_messages').insert(m))
  }

  const results = await Promise.all(ops)
  const err = results.find((r) => r.error)?.error
  throwIfError(err)
  return fetchAllData()
}

export function subscribeToRealtime(onChange) {
  const channel = supabase
    .channel('hq-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hq_messages' }, () => onChange('messages'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hq_notifications' }, () => onChange('notifications'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hq_tasks' }, () => onChange('tasks'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hq_dm_threads' }, () => onChange('dmThreads'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hq_audit_log' }, () => onChange('audit'))
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function insertAuditLog(entry) {
  const { data, error } = await supabase.from('hq_audit_log').insert(entry).select().single()
  throwIfError(error)
  return data
}

export async function insertTaskComment(comment) {
  const { data, error } = await supabase.from('hq_task_comments').insert(comment).select().single()
  throwIfError(error)
  return data
}

export async function upsertUserActivity(userId, fields) {
  const now = new Date().toISOString()
  const row = { user_id: userId, updated_at: now, ...fields }
  const { data, error } = await supabase.from('hq_user_activity').upsert(row).select().single()
  throwIfError(error)
  return data
}
