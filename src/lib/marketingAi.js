import { supabase } from './supabase'

export async function requestMarketingAi(action, params = {}) {
  const { data, error } = await supabase.functions.invoke('marketing-ai', {
    body: { action, ...params },
  })

  if (error) throw new Error(error.message || 'Pazarlama AI hatası')
  if (data?.error) throw new Error(data.error)
  return data
}
