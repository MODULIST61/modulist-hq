import { supabase } from './supabase'

async function parseInvokeError(error, fallback = 'Müdür raporu oluşturulamadı') {
  if (!error) return fallback
  try {
    if (error.context && typeof error.context.json === 'function') {
      const body = await error.context.json()
      if (body?.error) return body.error
    }
  } catch {
    /* response body okunamadı */
  }
  const msg = error.message || fallback
  if (msg.includes('non-2xx')) {
    return 'Edge Function hatası — manager-report deploy edildi mi? JWT verify kapalı mı? Ayarlar\'da OpenAI key var mı?'
  }
  return msg
}

export async function requestManagerReport(payload, period = 'week') {
  const { data, error } = await supabase.functions.invoke('manager-report', {
    body: { payload, period },
  })

  if (error) throw new Error(await parseInvokeError(error))
  if (data?.error) throw new Error(data.error)
  return data
}
