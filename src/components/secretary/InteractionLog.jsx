import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import { EmptyState } from '../ui/Modal'
import {
  INTERACTION_TYPES, INTERACTION_RESULTS, INTERACTION_STATUS, interactionIcon,
} from '../../lib/interactions'
import { formatDateTime, getUserName, cn } from '../../lib/utils'
import { QuickLogModal } from './QuickLogModal'

export function InteractionLog({ embedded = false }) {
  const { users } = useAuth()
  const { interactions, companies, deleteInteraction } = useData()
  const [filter, setFilter] = useState({ tip: '', sonuc: '', firma: '' })
  const [logOpen, setLogOpen] = useState(false)

  const filtered = useMemo(() => {
    return interactions.filter((i) => {
      if (filter.tip && i.tip !== filter.tip) return false
      if (filter.sonuc && i.sonuc !== filter.sonuc) return false
      if (filter.firma && i.firma_id !== filter.firma) return false
      return true
    })
  }, [interactions, filter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select value={filter.tip} onChange={(e) => setFilter({ ...filter, tip: e.target.value })} className="w-40 text-sm">
            <option value="">Tüm tipler</option>
            {Object.entries(INTERACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={filter.sonuc} onChange={(e) => setFilter({ ...filter, sonuc: e.target.value })} className="w-36 text-sm">
            <option value="">Tüm sonuçlar</option>
            {Object.entries(INTERACTION_RESULTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={filter.firma} onChange={(e) => setFilter({ ...filter, firma: e.target.value })} className="w-44 text-sm">
            <option value="">Tüm firmalar</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}
          </Select>
        </div>
        <Button onClick={() => setLogOpen(true)}>+ Hızlı Log</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📞" title="İletişim kaydı yok" description="Telefon, yüz yüze veya WhatsApp görüşmelerini loglayın." action={<Button onClick={() => setLogOpen(true)}>İlk kaydı ekle</Button>} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border divide-y dark:divide-slate-800">
          {filtered.map((i) => {
            const firma = companies.find((c) => c.id === i.firma_id)
            return (
              <div key={i.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <span className="text-xl shrink-0">{interactionIcon(i.tip)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{i.konu || INTERACTION_TYPES[i.tip]}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{INTERACTION_RESULTS[i.sonuc] || i.sonuc}</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full', i.durum === 'inbox' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}>
                          {INTERACTION_STATUS[i.durum]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{i.ozet}</p>
                      <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2">
                        {firma ? <Link to={`/sekreter/firmalar/${firma.id}`} className="text-accent hover:underline">{firma.ad}</Link> : <span>{i.kisi_adi || 'Lead'}</span>}
                        <span>· {getUserName(users, i.user_id)}</span>
                        <span>· {formatDateTime(i.created_at)}</span>
                        {i.takip_tarihi && <span className="text-amber-600">↻ {formatDateTime(i.takip_tarihi)}</span>}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => confirm('Sil?') && deleteInteraction(i.id)}>Sil</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <QuickLogModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}

export function InteractionInbox() {
  const { users, currentUser } = useAuth()
  const { interactions, companies, upsertInteraction, routeInteractionRequest } = useData()
  const [logOpen, setLogOpen] = useState(false)
  const [processing, setProcessing] = useState(null)

  const inbox = interactions.filter((i) => i.durum === 'inbox')

  const assignFirma = async (item, firmaId) => {
    await upsertInteraction({ ...item, firma_id: firmaId, durum: 'islemde' })
  }

  const route = async (id, target) => {
    setProcessing(id)
    try {
      await routeInteractionRequest(id, target)
    } catch (e) {
      alert(e.message)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{inbox.length} işlenmemiş gelen talep</p>
        <Button variant="outline" onClick={() => setLogOpen(true)}>+ Gelen kayıt</Button>
      </div>

      {inbox.length === 0 ? (
        <EmptyState icon="📥" title="Inbox boş" description="Gelen arama, WhatsApp veya e-posta talepleri burada birikir." action={<Button onClick={() => setLogOpen(true)}>Gelen kayıt ekle</Button>} />
      ) : (
        <div className="space-y-3">
          {inbox.map((i) => (
            <div key={i.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-sm">{interactionIcon(i.tip)} {i.konu || i.kisi_adi || 'Gelen talep'}</p>
                  <p className="text-sm text-slate-600 mt-1">{i.ozet}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(i.created_at)} · {i.telefon}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" disabled={processing === i.id} onClick={() => route(i.id, 'bug')}>→ Yazılım</Button>
                  <Button size="sm" variant="outline" disabled={processing === i.id} onClick={() => route(i.id, 'feedback')}>→ Geri dönüş</Button>
                  <Button size="sm" variant="outline" disabled={processing === i.id} onClick={() => route(i.id, 'finance')}>→ Muhasebe</Button>
                </div>
              </div>
              {!i.firma_id && (
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-500">Firmaya bağla:</span>
                  {companies.slice(0, 8).map((c) => (
                    <button key={c.id} type="button" onClick={() => assignFirma(i, c.id)} className="text-xs px-2 py-1 rounded-full bg-white border hover:border-accent">{c.ad}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <QuickLogModal open={logOpen} onClose={() => setLogOpen(false)} defaultYon="gelen" defaultType="telefon_gelen" />
    </div>
  )
}
