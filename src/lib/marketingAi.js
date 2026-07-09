import { supabase } from './supabase'

async function parseInvokeError(error, fallback = 'AI isteği başarısız') {
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
    return 'Edge Function hatası — marketing-ai deploy edildi mi? JWT verify kapalı mı? Ayarlar\'da OpenAI key var mı?'
  }
  return msg
}

export async function requestMarketingAi(action, params = {}) {
  const { data, error } = await supabase.functions.invoke('marketing-ai', {
    body: { action, params },
  })

  if (error) throw new Error(await parseInvokeError(error))
  if (data?.error) {
    if (data.error === 'Geçersiz action') {
      throw new Error(
        'Prompt Stüdyosu action\'ı sunucuda yok — Supabase\'de marketing-ai Edge Function\'ı güncel index.ts ile yeniden deploy edin (JWT verify: OFF).',
      )
    }
    throw new Error(data.error)
  }
  return data
}
