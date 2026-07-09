import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function resolveModel(settings: Record<string, unknown>, module = 'marketing') {
  const specific = settings?.[`openaiModel_${module}`] as string | undefined
  if (specific?.trim()) return specific.trim()
  const custom = settings?.openaiModelCustom as string | undefined
  if (custom?.trim()) return custom.trim()
  const general = settings?.openaiModel as string | undefined
  if (general?.trim()) return general.trim()
  return 'gpt-5.1'
}

function usesMaxCompletionTokens(model: string) {
  return /gpt-5|^o[134]/i.test(model)
}

function usesReasoningParams(model: string) {
  return /^o[134]/i.test(model)
}

function buildChatBody(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  limit: number,
) {
  const body: Record<string, unknown> = { model, messages }
  if (!usesReasoningParams(model)) body.temperature = temperature
  if (usesMaxCompletionTokens(model)) body.max_completion_tokens = limit
  else body.max_tokens = limit
  return body
}

async function callOpenAI(apiKey: string, model: string, system: string, user: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildChatBody(model, [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], 0.7, 4500)),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI hatası (${res.status})`)
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('OpenAI boş yanıt döndü')
  return { text, tokens: data.usage?.total_tokens, model }
}

const PROMPTS: Record<string, string> = {
  generate_ideas: `Sen Modulist (B2B emlak SaaS) için Türkçe içerik stratejistisin.
Modulist: emlak ofisleri için CRM/ihale/yönetim yazılımı. Hedef: demo ve trial lead.

Görev: Verilen formata uygun, trend-aware, yüksek dönüşümlü içerik fikirleri üret.
Her fikir için: başlık, hook (ilk 3 saniye), 3 sahnelik senaryo, CTA, trend gerekçesi.
Markdown formatında yaz. En az 5 fikir ver.`,

  improve_hook: `Sen kısa video hook uzmanısın. Verilen hook'u güçlendir, 3 alternatif ver.
Türkçe, emlak SaaS B2B bağlamında. Markdown.`,

  weekly_plan: `Sen sosyal medya planlayıcısısın. Modulist HQ için haftalık içerik planı oluştur.
Reels, story, carousel dengesi kur. Her gün için: format, konu, hook taslağı.
Markdown tablo veya liste. Türkçe.`,

  analyze_impact: `Sen pazarlama analistisin. Verilen içerik performans verisini analiz et.
Hangi format/platform daha iyi lead getirdi? Ne artırılmalı, ne bırakılmalı?
Somut öneriler ver. Türkçe markdown.`,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json()
    const { action, params = {} } = body
    if (!action || !PROMPTS[action]) {
      return new Response(JSON.stringify({ error: 'Geçersiz action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: ws, error: wsErr } = await supabase
      .from('hq_workspace')
      .select('settings')
      .eq('id', 1)
      .single()
    if (wsErr) throw wsErr

    const settings = ws?.settings || {}
    const apiKey = settings.openaiApiKey
    if (!apiKey?.trim()) {
      return new Response(JSON.stringify({ error: 'OpenAI API key ayarlanmamış. Ayarlar → AI bölümünden ekleyin.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = resolveModel(settings, 'marketing')
    const userPrompt = buildUserPrompt(action, params)
    const result = await callOpenAI(apiKey, model, PROMPTS[action], userPrompt)

    const saved = {
      action,
      result: result.text,
      model: result.model,
      tokens: result.tokens,
      generated_at: new Date().toISOString(),
      params,
    }

    const history = Array.isArray(settings.marketingAiHistory) ? settings.marketingAiHistory : []
    await supabase.from('hq_workspace').update({
      settings: {
        ...settings,
        lastMarketingAi: saved,
        marketingAiHistory: [saved, ...history].slice(0, 20),
      },
    }).eq('id', 1)

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Sunucu hatası' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildUserPrompt(action: string, params: Record<string, unknown>) {
  switch (action) {
    case 'generate_ideas':
      return `Format: ${params.format || 'reels'}
Platform: ${params.platform || 'instagram'}
Hedef: ${params.hedef || 'demo lead'}
Sektör odağı: ${params.sektor || 'emlak ofisleri'}
Ek not: ${params.not || '—'}
Mevcut içerikler: ${JSON.stringify(params.existing || [], null, 2)}`
    case 'improve_hook':
      return `Hook: "${params.hook}"
Bağlam: ${params.context || 'Modulist emlak SaaS'}`
    case 'weekly_plan':
      return `Bu hafta planı oluştur.
Mevcut içerik pipeline: ${JSON.stringify(params.pipeline || [], null, 2)}
Aktif kampanyalar: ${JSON.stringify(params.campaigns || [], null, 2)}`
    case 'analyze_impact':
      return `Performans verisi:\n${JSON.stringify(params.impact || {}, null, 2)}`
    default:
      return JSON.stringify(params)
  }
}
