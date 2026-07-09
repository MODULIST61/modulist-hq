import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { PipelineBadge, StatusBadge } from '../../components/ui/Badge'
import { PageHeader, Card, EmptyIllustration } from '../../components/ui/Page'
import { PIPELINE_STAGES, PIPELINE_LABELS } from '../../lib/constants'
import { formatDate, formatDateTime, formatCurrency, getUserName } from '../../lib/utils'
import { canAccessFinance } from '../../lib/permissions'

const TIMELINE_ICONS = {
  mesaj: '💬',
  not: '📝',
  gorev: '✅',
  geri_donus: '📣',
  finans: '💰',
  pipeline: '🔄',
}

export default function CompanyDetail() {
  const { id } = useParams()
  const { users, currentUser } = useAuth()
  const { companies, messages, tasks, feedback, finance, upsertCompany } = useData()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('timeline')

  const company = companies.find((c) => c.id === id)
  const patron = canAccessFinance(currentUser)

  const relatedMessages = useMemo(
    () => messages.filter((m) => m.linked_record_type === 'firma' && m.linked_record_id === id),
    [messages, id]
  )
  const relatedTasks = useMemo(
    () => tasks.filter((t) => t.kayit_tipi === 'firma' && t.kayit_id === id),
    [tasks, id]
  )
  const relatedFeedback = useMemo(
    () => feedback.filter((f) => f.firma_id === id),
    [feedback, id]
  )
  const relatedFinance = useMemo(
    () => finance.filter((f) => f.firma_id === id),
    [finance, id]
  )

  const timeline = useMemo(() => {
    const items = [
      ...relatedMessages.map((m) => ({
        type: 'mesaj',
        date: m.created_at,
        text: m.text,
        id: m.id,
        user: getUserName(users, m.user_id),
      })),
      ...relatedTasks.map((t) => ({
        type: 'gorev',
        date: t.created_at || t.bitis_tarihi,
        text: `${t.baslik} — ${t.durum}`,
        id: t.id,
        user: getUserName(users, t.sorumlu_id),
      })),
      ...relatedFeedback.map((f) => ({
        type: 'geri_donus',
        date: f.created_at,
        text: `[${f.tip}] ${f.metin}`,
        id: f.id,
        user: getUserName(users, f.user_id),
      })),
      ...(patron ? relatedFinance.map((f) => ({
        type: 'finans',
        date: f.tarih,
        text: `${f.aciklama || f.kategori} — ${formatCurrency(f.tutar)} (${f.onay_durumu || 'onaylandi'})`,
        id: f.id,
        user: getUserName(users, f.user_id),
      })) : []),
    ]
    if (company?.notlar) {
      items.push({ type: 'not', date: company.updated_at, text: company.notlar, id: 'note-main', user: 'Not' })
    }
    if (company?.created_at) {
      items.push({ type: 'pipeline', date: company.created_at, text: `Firma oluşturuldu — ${PIPELINE_LABELS[company.pipeline]}`, id: 'created', user: 'Sistem' })
    }
    return items.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [relatedMessages, relatedTasks, relatedFeedback, relatedFinance, company, users, patron])

  if (!company) {
    return (
      <EmptyIllustration
        emoji="🏢"
        title="Firma bulunamadı"
        description="Bu firma silinmiş veya mevcut değil."
        action={<Button onClick={() => navigate('/kayitlar/firmalar')}>Listeye dön</Button>}
      />
    )
  }

  const addNote = () => {
    if (!note.trim()) return
    upsertCompany({
      ...company,
      notlar: company.notlar
        ? `${company.notlar}\n[${new Date().toLocaleDateString('tr-TR')}] ${note}`
        : note,
      updated_at: new Date().toISOString(),
    })
    setNote('')
  }

  const tabs = [
    { id: 'timeline', label: 'Zaman Çizelgesi', count: timeline.length },
    { id: 'tasks', label: 'Görevler', count: relatedTasks.length },
    { id: 'feedback', label: 'Geri Dönüş', count: relatedFeedback.length },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        breadcrumb="Kayıtlar / Firmalar"
        title={company.ad}
        subtitle={`${company.yetkili || '—'} · ${company.telefon || '—'} · ${company.email || '—'}`}
        action={
          <>
            <PipelineBadge stage={company.pipeline} />
            <Button variant="outline" onClick={() => navigate('/mesajlar?oda=satis')}>Mesaj gönder</Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={company.pipeline} onChange={(e) => upsertCompany({ ...company, pipeline: e.target.value })} className="w-44">
              {PIPELINE_STAGES.map((p) => <option key={p} value={p}>{PIPELINE_LABELS[p]}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ['Sektör', company.sektor],
              ['Paket', company.paket],
              ['Demo', `${formatDate(company.demo_tarihi)} ${company.demo_saati || ''}`],
              ['Trial bitiş', formatDate(company.trial_bitis)],
              ['Aylık', formatCurrency(company.aylik_tutar)],
              ['Dekont', company.dekont_durumu],
              ['Sorumlu', getUserName(users, company.sorumlu_id)],
              ['Kaynak', company.kaynak || '—'],
            ].map(([label, val]) => (
              <div key={label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-slate-400 block mb-0.5">{label}</span>
                <p className="font-medium">{val || '—'}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3">Hızlı Özet</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Mesaj</span><span className="font-medium">{relatedMessages.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Görev</span><span className="font-medium">{relatedTasks.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Geri dönüş</span><span className="font-medium">{relatedFeedback.length}</span></div>
            {patron && <div className="flex justify-between"><span className="text-slate-500">Finans kaydı</span><span className="font-medium">{relatedFinance.length}</span></div>}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-4 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {t.label}
              {t.count > 0 && <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'timeline' && (
          <Card className="p-5">
            <div className="flex gap-2 mb-5">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not ekle..." className="flex-1" onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <Button onClick={addNote}>Ekle</Button>
            </div>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Henüz aktivite yok</p>
            ) : (
              <div className="space-y-0">
                {timeline.map((item, i) => (
                  <div key={item.id} className="flex gap-4 pb-5 relative">
                    {i < timeline.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />}
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0 z-10">
                      {TIMELINE_ICONS[item.type] || '•'}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span>{formatDateTime(item.date)}</span>
                        <span>·</span>
                        <span className="capitalize">{item.type.replace('_', ' ')}</span>
                        {item.user && <><span>·</span><span>{item.user}</span></>}
                      </div>
                      <p className="text-sm leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'tasks' && (
          <Card className="p-5">
            {relatedTasks.length === 0 ? (
              <EmptyIllustration emoji="✅" title="Görev yok" description="Bu firmaya bağlı görev bulunmuyor." />
            ) : (
              <div className="divide-y dark:divide-slate-800">
                {relatedTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <span className="font-medium">{t.baslik}</span>
                      <div className="text-xs text-slate-400 mt-0.5">{getUserName(users, t.sorumlu_id)} · {formatDate(t.bitis_tarihi)}</div>
                    </div>
                    <StatusBadge status={t.durum} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'feedback' && (
          <Card className="p-5">
            {relatedFeedback.length === 0 ? (
              <EmptyIllustration emoji="📣" title="Geri dönüş yok" description="Bu firmadan henüz geri bildirim kaydedilmedi." action={<Button variant="outline" onClick={() => navigate('/kayitlar/geri-donusler')}>Geri dönüş ekle</Button>} />
            ) : (
              <div className="space-y-4">
                {relatedFeedback.map((f) => (
                  <div key={f.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{f.tip}</span>
                      <span>·</span>
                      <span>{formatDateTime(f.created_at)}</span>
                    </div>
                    <p className="text-sm">{f.metin}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <button onClick={() => navigate('/kayitlar/firmalar')} className="mt-6 text-sm text-slate-500 hover:text-accent transition-colors">← Firmalar listesine dön</button>
    </div>
  )
}
