import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/Modal'
import { REQUEST_TYPES, INTERACTION_RESULTS, interactionIcon } from '../../lib/interactions'
import { FEEDBACK_TYPES, FEEDBACK_STATUS } from '../../lib/constants'
import { formatDateTime } from '../../lib/utils'
import { InteractionInbox } from './InteractionLog'

export function SecretaryRequests() {
  const { interactions, feedback, companies, routeInteractionRequest, convertFeedbackToBug } = useData()
  const [busy, setBusy] = useState(null)

  const openRequests = useMemo(() => (
    interactions.filter(
      (i) => i.durum !== 'tamamlandi' && ['destek', 'fatura', 'is_birligi'].includes(i.talep_tipi),
    )
  ), [interactions])

  const newFeedback = feedback.filter((f) => f.durum === 'yeni')

  const route = async (id, target) => {
    setBusy(id)
    try { await routeInteractionRequest(id, target) } catch (e) { alert(e.message) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold mb-1">Inbox</h2>
        <p className="text-sm text-slate-500 mb-4">İşlenmemiş gelen iletişimler</p>
        <InteractionInbox />
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1">Açık Talepler</h2>
        <p className="text-sm text-slate-500 mb-4">Destek, fatura ve iş birliği — hub&apos;a yönlendir</p>
        {openRequests.length === 0 ? (
          <EmptyState icon="📋" title="Açık talep yok" />
        ) : (
          <div className="space-y-2">
            {openRequests.map((i) => {
              const firma = companies.find((c) => c.id === i.firma_id)
              return (
                <div key={i.id} className="p-4 rounded-xl border flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{interactionIcon(i.tip)} {REQUEST_TYPES[i.talep_tipi]} — {i.konu || i.ozet?.slice(0, 50)}</p>
                    <p className="text-xs text-slate-400">{firma?.ad || i.kisi_adi} · {INTERACTION_RESULTS[i.sonuc]}</p>
                  </div>
                  <div className="flex gap-1">
                    {i.talep_tipi === 'destek' && <Button size="sm" disabled={busy === i.id} onClick={() => route(i.id, 'bug')}>Yazılım</Button>}
                    {i.talep_tipi === 'fatura' && <Button size="sm" disabled={busy === i.id} onClick={() => route(i.id, 'finance')}>Muhasebe</Button>}
                    <Button size="sm" variant="outline" onClick={() => route(i.id, 'feedback')}>Geri dönüş</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1">Yeni Geri Dönüşler</h2>
        {newFeedback.length === 0 ? (
          <p className="text-sm text-slate-400">Yeni geri dönüş yok</p>
        ) : (
          <div className="space-y-2">
            {newFeedback.map((f) => {
              const firma = companies.find((c) => c.id === f.firma_id)
              return (
                <div key={f.id} className="p-4 rounded-xl border flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{FEEDBACK_TYPES[f.tip]} — {f.metin.slice(0, 80)}</p>
                    <p className="text-xs text-slate-400">{firma?.ad} · {formatDateTime(f.created_at)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!f.bug_id && ['sikayet', 'soru'].includes(f.tip) && (
                      <Button size="sm" onClick={() => convertFeedbackToBug(f.id)}>Bug&apos;a çevir</Button>
                    )}
                    <Link to="/yazilim?tab=geri-donusler"><Button size="sm" variant="outline">Yazılım</Button></Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
