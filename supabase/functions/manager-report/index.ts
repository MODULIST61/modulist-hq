import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Sen Modulist HQ operasyon müdürüsün. Patron için Türkçe, detaylı iç yönetim raporu yazarsın.

Görevin:
1. Verilen JSON verisini analiz et — sadece veride olan bilgilere dayan, uydurma
2. Her ekip üyesi için: ne yaptı, ne yapmadı, performans yorumu
3. Finans, reklam, pipeline, görevler, kararlar bölümlerini kapsa
4. Riskleri ve eksiklikleri açıkça belirt (geciken görev, metrik girmeyen, durgun firma)
5. Raporda mutlaka "## Patron için aksiyonlar" bölümü olsun — 3-5 somut madde
6. Ton: profesyonel, doğrudan, samimi — patrona hitap eder gibi

Format: Markdown (## başlıklar, - madde listeleri). Emoji kullanabilirsin ama abartma.`

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { payload, period = 'week' } = await req.json()
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Veri paketi eksik' }), {
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

    const apiKey = ws?.settings?.openaiApiKey
    if (!apiKey?.trim()) {
      return new Response(JSON.stringify({ error: 'OpenAI API key ayarlanmamış. Ayarlar sayfasından ekleyin.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = ws?.settings?.openaiModel_manager?.trim()
      || ws?.settings?.openaiModelCustom?.trim()
      || ws?.settings?.openaiModel?.trim()
      || 'gpt-5.1'
    const periodLabel = period === 'day' ? 'günlük' : 'haftalık'

    const userPrompt = `Aşağıdaki Modulist HQ ${periodLabel} verisini analiz et ve patron için detaylı müdür raporu yaz.

Dönem: ${payload.period?.label || periodLabel}
Başlangıç: ${payload.period?.start || '—'}
Bitiş: ${payload.period?.end || '—'}

VERİ (JSON):
${JSON.stringify(payload, null, 2)}

Rapor başlığı: "# Modulist HQ Müdür Raporu"` 

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildChatBody(model, [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], 0.4, 4000)),
    })

    const openaiData = await openaiRes.json()

    if (!openaiRes.ok) {
      const msg = openaiData?.error?.message || `OpenAI hatası (${openaiRes.status})`
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const report = openaiData.choices?.[0]?.message?.content?.trim()
    if (!report) {
      return new Response(JSON.stringify({ error: 'OpenAI boş yanıt döndü' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = {
      report,
      model,
      period,
      generated_at: new Date().toISOString(),
      tokens: openaiData.usage?.total_tokens,
    }

    const history = Array.isArray(ws?.settings?.managerReportHistory)
      ? ws.settings.managerReportHistory
      : []
    const mergedSettings = {
      ...(ws?.settings || {}),
      lastManagerReport: result,
      managerReportHistory: [result, ...history].slice(0, 10),
    }

    await supabase.from('hq_workspace').update({ settings: mergedSettings }).eq('id', 1)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Sunucu hatası' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
