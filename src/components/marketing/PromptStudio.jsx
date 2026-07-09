import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { requestMarketingAi } from '../../lib/marketingAi'
import { formatContentSummaryForAi } from '../../lib/contentAnalytics'
import { resolveModel } from '../../lib/aiModels'
import { downloadMarkdownPdf } from '../../lib/pdfExport'
import {
  PROMPT_TONES, PROMPT_GOALS, INSPIRATION_CARDS, cardToPromptParams, parsePromptSections,
} from '../../lib/marketingStudio'
import { CONTENT_TYPES, CONTENT_PLATFORMS } from '../../lib/constants'
import { generateId, formatDateTime, cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { SectionCard } from '../dashboard/DashboardWidgets'

function CopyBtn({ text, label = 'Kopyala' }) {
  const [ok, setOk] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text)
    setOk(true)
    setTimeout(() => setOk(false), 1500)
  }
  if (!text) return null
  return (
    <button type="button" onClick={copy} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-accent/10 hover:text-accent">
      {ok ? '✓' : label}
    </button>
  )
}

export function PromptStudio({ canEdit }) {
  const { contents, campaigns, settings, upsertContent, reload } = useData()
  const [searchParams] = useSearchParams()
  const inspireId = searchParams.get('inspire')

  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(settings?.lastMarketingAi?.action === 'generate_full_prompt' ? settings.lastMarketingAi : null)

  const [form, setForm] = useState({
    format: 'reels', platform: 'instagram', ton: 'egitici', hedef: 'demo',
    konu: '', hook: '', sektor: 'emlak ofisleri', not: '',
  })

  useEffect(() => {
    if (!inspireId) return
    const card = INSPIRATION_CARDS.find((c) => c.id === inspireId)
    if (card) setForm((f) => ({ ...f, ...cardToPromptParams(card) }))
  }, [inspireId])

  const run = async (action, params, key = action) => {
    setLoading(key)
    setError(null)
    try {
      const res = await requestMarketingAi(action, params)
      setResult(res)
      await reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  const generateFull = () => run('generate_full_prompt', {
    ...form,
    existing: formatContentSummaryForAi(contents, campaigns),
  }, 'full')

  const generateAds = () => run('generate_ad_copy', {
    kampanya: campaigns[0]?.ad,
    hedef: PROMPT_GOALS[form.hedef] || form.hedef,
    mesaj: form.hook || form.konu,
    hook: form.hook,
    format: form.format,
  }, 'ads')

  const generateScript = () => run('script_30s', {
    konu: form.konu,
    baslik: form.konu,
    hook: form.hook,
    ton: form.ton,
    platform: form.platform,
    hedef: form.hedef,
  }, 'script')

  const sections = result?.result ? parsePromptSections(result.result) : {}
  const model = resolveModel(settings, 'marketing')

  const saveToStudio = () => {
    if (!result?.result) return
    const title = form.konu || form.hook?.slice(0, 60) || 'AI Prompt Paketi'
    upsertContent({
      id: generateId(),
      baslik: title.slice(0, 80),
      hook: sections.hook || form.hook || title.slice(0, 120),
      senaryo: sections.senaryo || result.result.slice(0, 3000),
      ai_prompt: sections.gorsel || '',
      ai_video_prompt: sections.video || '',
      ai_caption: sections.caption || '',
      ai_ad_copy: sections.adcopy || '',
      brief: result.result,
      tip: form.format,
      platform: form.platform,
      ton: form.ton,
      durum: 'senaryo',
      sektor: 'emlak',
      ai_uretim: true,
      kampanya_id: campaigns[0]?.id || null,
      notlar: 'Prompt Stüdyosu AI',
    })
    alert('İçerik Stüdyosu → Senaryo kolonuna kaydedildi.')
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Prompt Stüdyosu" subtitle={`${model} · Görsel + video + caption + reklam metni paketi`}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input label="Konu / Başlık" value={form.konu} onChange={(e) => setForm({ ...form, konu: e.target.value })} placeholder="Excel vs Modulist" className="md:col-span-2 lg:col-span-1" />
          <Input label="Hook fikri" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} placeholder="Emlakçılar hâlâ Excel mi..." className="md:col-span-2" />
          <Select label="Format" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            {Object.entries(CONTENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
            {Object.entries(CONTENT_PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Ton" value={form.ton} onChange={(e) => setForm({ ...form, ton: e.target.value })}>
            {Object.entries(PROMPT_TONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select label="Hedef" value={form.hedef} onChange={(e) => setForm({ ...form, hedef: e.target.value })}>
            {Object.entries(PROMPT_GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Textarea label="Referans / trend / rakip notu" value={form.not} onChange={(e) => setForm({ ...form, not: e.target.value })} className="md:col-span-2 lg:col-span-3" rows={2} placeholder="Rakipler karşılaştırma videosu yapıyor..." />
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateFull} disabled={!!loading}>
              {loading === 'full' ? 'Üretiliyor...' : '✨ Tam Prompt Paketi'}
            </Button>
            <Button variant="outline" onClick={generateScript} disabled={!!loading || !form.konu}>
              {loading === 'script' ? '...' : '🎬 30sn Senaryo'}
            </Button>
            <Button variant="outline" onClick={generateAds} disabled={!!loading}>
              {loading === 'ads' ? '...' : '📢 Reklam Metni'}
            </Button>
          </div>
        )}
      </SectionCard>

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700">{error}</div>}

      {result?.result && (
        <>
          <SectionCard
            title="AI Çıktısı"
            subtitle={result.generated_at ? formatDateTime(result.generated_at) : ''}
            action={
              <div className="flex gap-2 flex-wrap">
                <CopyBtn text={result.result} label="Tümünü kopyala" />
                {canEdit && <Button variant="ghost" size="sm" onClick={saveToStudio}>Stüdyoya Kaydet</Button>}
                <Button variant="ghost" size="sm" onClick={() => downloadMarkdownPdf({
                  title: 'Modulist Creative Brief',
                  subtitle: form.konu || form.hook,
                  markdown: result.result,
                  filename: `modulist-brief-${Date.now()}.pdf`,
                })}>PDF Brief</Button>
              </div>
            }
          >
            <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto text-slate-700 dark:text-slate-300">
              {result.result}
            </div>
          </SectionCard>

          {Object.keys(sections).length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: 'hook', label: '🎣 Hook', color: 'border-amber-200 bg-amber-50/50' },
                { key: 'gorsel', label: '🖼 Görsel Prompt (EN)', color: 'border-purple-200 bg-purple-50/50' },
                { key: 'video', label: '🎥 Video Prompt (EN)', color: 'border-blue-200 bg-blue-50/50' },
                { key: 'caption', label: '📱 Caption + Hashtag', color: 'border-emerald-200 bg-emerald-50/50' },
                { key: 'adcopy', label: '📢 Reklam Metni', color: 'border-pink-200 bg-pink-50/50' },
                { key: 'checklist', label: '✅ Checklist', color: 'border-slate-200' },
              ].map(({ key, label, color }) => sections[key] && (
                <div key={key} className={cn('rounded-xl border p-4 dark:bg-slate-900/50', color)}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600">{label}</span>
                    <CopyBtn text={sections[key]} />
                  </div>
                  <p className="text-xs whitespace-pre-wrap text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">{sections[key]}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
