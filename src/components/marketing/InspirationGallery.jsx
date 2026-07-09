import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { buildContentImpact } from '../../lib/contentAnalytics'
import { INSPIRATION_CARDS } from '../../lib/marketingStudio'
import { CONTENT_TYPES } from '../../lib/constants'
import { requestMarketingAi } from '../../lib/marketingAi'
import { Button } from '../ui/Button'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { cn } from '../../lib/utils'

export function InspirationGallery({ canEdit }) {
  const navigate = useNavigate()
  const { contents, campaigns, companies, reload } = useData()
  const [remixing, setRemixing] = useState(null)

  const impact = useMemo(() => buildContentImpact(contents, campaigns, companies), [contents, campaigns, companies])
  const winners = impact.topContent.filter((c) => c.leads > 0 || c.score > 0).slice(0, 5)

  const goPrompt = (cardId) => {
    navigate(`/reklam?tab=prompt&inspire=${cardId}`)
  }

  const remix = async (item) => {
    if (!canEdit) return
    setRemixing(item.id)
    try {
      await requestMarketingAi('remix_winner', {
        baslik: item.baslik,
        hook: contents.find((c) => c.id === item.id)?.hook,
        tip: item.tip,
        platform: item.platform,
        leads: item.leads,
        goruntulenme: item.goruntulenme,
        yeni_format: item.tip === 'reels' ? 'carousel' : 'reels',
        yeni_platform: item.platform,
      })
      await reload()
      navigate('/reklam?tab=prompt')
    } catch (e) {
      alert(e.message || 'Remix başarısız')
    } finally {
      setRemixing(null)
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Modulist İlham Galerisi" subtitle="Şablon kartları — tıkla, Prompt Stüdyosu'na git">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {INSPIRATION_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => goPrompt(card.id)}
              className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-accent hover:shadow-md transition-all bg-white dark:bg-slate-900 group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-lg">{card.format === 'reels' ? '🎬' : card.format === 'carousel' ? '📸' : card.format === 'linkedin' ? '💼' : '📱'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {CONTENT_TYPES[card.format] || card.format}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-primary dark:text-white mb-1 group-hover:text-accent">{card.title}</h3>
              <p className="text-xs text-slate-500 italic mb-2 line-clamp-2">&ldquo;{card.hook}&rdquo;</p>
              <p className="text-[10px] text-slate-400 line-clamp-2">{card.why}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags?.map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {winners.length > 0 && (
        <SectionCard title="Kazanan İçerikler" subtitle="Lead getiren — remix ile yeni formata çevir">
          <div className="space-y-2">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border dark:border-slate-800 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{w.baslik}</p>
                  <p className="text-xs text-slate-400">
                    {CONTENT_TYPES[w.tip] || w.tip} · {w.leads} lead · {w.goruntulenme?.toLocaleString('tr-TR')} görüntülenme
                  </p>
                </div>
                {canEdit && (
                  <Button variant="outline" size="sm" disabled={remixing === w.id} onClick={() => remix(w)}>
                    {remixing === w.id ? '...' : '↻ Remix'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <p className="text-xs text-slate-400 text-center">
        İlham kartına tıklayınca Prompt Stüdyosu otomatik dolar. AI ile tam paket üretip Stüdyoya kaydedin.
      </p>
    </div>
  )
}
