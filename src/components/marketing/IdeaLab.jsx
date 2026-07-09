import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { requestMarketingAi } from '../../lib/marketingAi'
import { formatContentSummaryForAi, buildContentImpact } from '../../lib/contentAnalytics'
import { downloadMarkdownPdf } from '../../lib/pdfExport'
import { resolveModel } from '../../lib/aiModels'
import { generateId, formatDateTime } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { SectionCard } from '../dashboard/DashboardWidgets'

function MarkdownView({ text }) {
  if (!text) return null
  return (
    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
      {text}
    </div>
  )
}

export function IdeaLab({ canEdit }) {
  const data = useData()
  const { contents, campaigns, settings, upsertContent, reload } = data
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(settings?.lastMarketingAi || null)

  const [ideaForm, setIdeaForm] = useState({ format: 'reels', platform: 'instagram', hedef: 'demo lead', sektor: 'emlak', not: '' })
  const [hookInput, setHookInput] = useState('')

  const run = async (action, params) => {
    setLoading(action)
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

  const generateIdeas = () => run('generate_ideas', {
    ...ideaForm,
    existing: formatContentSummaryForAi(contents, campaigns),
  })

  const improveHook = () => run('improve_hook', { hook: hookInput, context: 'Modulist emlak SaaS B2B' })

  const weeklyPlan = () => run('weekly_plan', {
    pipeline: formatContentSummaryForAi(contents, campaigns),
    campaigns: campaigns.map((c) => ({ ad: c.ad, kanal: c.kanal, lead: c.kayit_sayisi })),
  })

  const analyzeImpact = () => {
    const impact = buildContentImpact(contents, campaigns, data.companies)
    return run('analyze_impact', { impact })
  }

  const saveFirstIdeaAsContent = () => {
    if (!result?.result) return
    const firstLine = result.result.split('\n').find((l) => l.trim().length > 10) || 'AI Fikir'
    upsertContent({
      id: generateId(),
      baslik: firstLine.replace(/^#+\s*/, '').slice(0, 80),
      hook: hookInput || firstLine.slice(0, 120),
      senaryo: result.result.slice(0, 2000),
      tip: ideaForm.format,
      platform: ideaForm.platform,
      durum: 'fikir',
      sektor: ideaForm.sektor,
      ai_uretim: true,
      notlar: 'Fikir Lab AI',
    })
    alert('İlk fikir İçerik Stüdyosu → Fikir kolonuna eklendi.')
  }

  const model = resolveModel(settings, 'marketing')

  return (
    <div className="space-y-6">
      <SectionCard title="Fikir Üretici" subtitle={`Model: ${model} · ChatGPT`}>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Select label="Format" value={ideaForm.format} onChange={(e) => setIdeaForm({ ...ideaForm, format: e.target.value })}>
            <option value="reels">Reels</option>
            <option value="story">Story</option>
            <option value="carousel">Carousel</option>
            <option value="post">Gönderi</option>
            <option value="linkedin">LinkedIn</option>
          </Select>
          <Select label="Platform" value={ideaForm.platform} onChange={(e) => setIdeaForm({ ...ideaForm, platform: e.target.value })}>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
          </Select>
          <Input label="Hedef" value={ideaForm.hedef} onChange={(e) => setIdeaForm({ ...ideaForm, hedef: e.target.value })} />
          <Input label="Sektör" value={ideaForm.sektor} onChange={(e) => setIdeaForm({ ...ideaForm, sektor: e.target.value })} />
          <Textarea label="Ek not / trend ipucu" value={ideaForm.not} onChange={(e) => setIdeaForm({ ...ideaForm, not: e.target.value })} className="md:col-span-2" placeholder="Örn: Rakipler karşılaştırma videosu yapıyor..." />
        </div>
        {canEdit && (
          <Button onClick={generateIdeas} disabled={!!loading} className="w-full sm:w-auto">
            {loading === 'generate_ideas' ? 'Üretiliyor...' : '10 İçerik Fikri Üret'}
          </Button>
        )}
      </SectionCard>

      <SectionCard title="Hook Güçlendirici">
        <Textarea label="Mevcut hook" value={hookInput} onChange={(e) => setHookInput(e.target.value)} placeholder="Emlakçılar hâlâ Excel mi kullanıyor?" />
        {canEdit && (
          <Button variant="outline" onClick={improveHook} disabled={!!loading || !hookInput.trim()} className="mt-3">
            {loading === 'improve_hook' ? '...' : 'Hook İyileştir'}
          </Button>
        )}
      </SectionCard>

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            <Button variant="outline" onClick={weeklyPlan} disabled={!!loading}>
              {loading === 'weekly_plan' ? '...' : 'Haftalık Plan Öner'}
            </Button>
            <Button variant="outline" onClick={analyzeImpact} disabled={!!loading}>
              {loading === 'analyze_impact' ? '...' : 'Etki Analizi (AI)'}
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {result?.result && (
        <SectionCard
          title="AI Çıktısı"
          subtitle={result.generated_at ? formatDateTime(result.generated_at) : ''}
          action={
            <div className="flex gap-2">
              {canEdit && <Button variant="ghost" size="sm" onClick={saveFirstIdeaAsContent}>Stüdyoya Ekle</Button>}
              <Button variant="ghost" size="sm" onClick={() => downloadMarkdownPdf({
                title: 'Fikir Lab',
                subtitle: result.action,
                markdown: result.result,
                filename: `modulist-fikir-${Date.now()}.pdf`,
              })}>PDF</Button>
            </div>
          }
        >
          <MarkdownView text={result.result} />
          {result.tokens && <p className="text-xs text-slate-400 mt-2">{result.model} · {result.tokens} token</p>}
        </SectionCard>
      )}
    </div>
  )
}
