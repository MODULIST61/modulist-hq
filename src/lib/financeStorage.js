import { supabase, isSupabaseConfigured } from './supabase'

export async function uploadDekont(file, prefix = 'finance') {
  if (!isSupabaseConfigured || !file) return null
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('hq-dekontlar').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('hq-dekontlar').getPublicUrl(path)
  return data.publicUrl
}
