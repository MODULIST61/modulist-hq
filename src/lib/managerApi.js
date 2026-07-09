import { supabase } from './supabase'

export async function requestManagerReport(payload, period = 'week') {
  const { data, error } = await supabase.functions.invoke('manager-report', {
    body: { payload, period },
  })

  if (error) {
    throw new Error(error.message || 'Müdür raporu oluşturulamadı')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
