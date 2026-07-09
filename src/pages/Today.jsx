import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { canViewCommandCenter, canAccessFinance } from '../lib/permissions'
import {
  buildActivityFeed,
  buildTeamWorkload,
  buildRoomPulse,
  buildMarketingStats,
  todayCallTotals,
  pipelineFunnel,
} from '../lib/analytics'
import { buildAlerts, buildTeamDailySummary } from '../lib/personAnalytics'
import {
  StatCard,
  ActivityFeed,
  TeamWorkloadTable,
  BarChart,
  PipelineFunnel,
  SectionCard,
} from '../components/dashboard/DashboardWidgets'
import { Button } from '../components/ui/Button'
import { formatCurrency, isToday, daysUntil, isOverdue, isThisMonth } from '../lib/utils'

export default function Today() {
  const { currentUser, users } = useAuth()
  const navigate = useNavigate()
  const data = useData()
  const patron = canViewCommandCenter(currentUser)

  const activity = useMemo(() => buildActivityFeed({ ...data, rooms: data.rooms }, users, 25), [data, users])
  const workload = useMemo(() => buildTeamWorkload(data.tasks, users), [data.tasks, users])
  const roomPulse = useMemo(() => buildRoomPulse(data.messages, data.rooms, users), [data.messages, data.rooms, users])
  const marketing = useMemo(() => buildMarketingStats(data.campaigns, data.companies), [data.campaigns, data.companies])
  const calls = useMemo(() => todayCallTotals(data.dailyMetrics), [data.dailyMetrics])
  const funnel = useMemo(() => pipelineFunnel(data.companies), [data.companies])
  const alerts = useMemo(() => buildAlerts(data, users), [data, users])
  const teamDaily = useMemo(() => (patron ? buildTeamDailySummary(users, data) : []), [patron, users, data])

  const pendingFinance = data.finance.filter((f) => f.durum === 'bekliyor')
  const openFeedback = data.feedback.filter((f) => f.durum !== 'cozuldu')
  const criticalBugs = data.bugs.filter((b) => b.oncelik === 'kritik' && b.durum !== 'kapali')
  const testBugs = data.bugs.filter((b) => b.durum === 'test')
  const trialEnding = data.companies.filter((c) => {
    const d = daysUntil(c.trial_bitis)
    return d !== null && d >= 0 && d <= 3 && c.pipeline === 'trial'
  })
  const todayDemos = data.companies.filter((c) => isToday(c.demo_tarihi))
  const myTasks = data.tasks.filter((t) => t.sorumlu_id === currentUser?.id && !['tamamlandi', 'iptal'].includes(t.durum))

  const monthApproved = data.finance.filter((f) => isThisMonth(f.tarih) && f.durum === 'onaylandi')
  const monthGelir = monthApproved.filter((f) => f.tip === 'gelir').reduce((s, f) => s + f.tutar, 0)
  const monthGider = monthApproved.filter((f) => f.tip === 'gider').reduce((s, f) => s + f.tutar, 0)

  const channelData = Object.entries(marketing.byChannel).map(([label, v]) => ({
    label,
    value: v.harcanan,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            {patron ? 'Komuta Merkezi' : 'Bugün'}
          </h1>
          <p className="text-sm text-slate-500">
            Merhaba {currentUser?.name} — {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
        {patron && pendingFinance.length > 0 && (
          <Button onClick={() => navigate('/finans')} variant="accent">
            {pendingFinance.length} gider onayı bekliyor
          </Button>
        )}
        {patron && (
          <Button variant="outline" onClick={() => navigate('/haftalik-ozet')}>Haftalık Özet →</Button>
        )}
        {patron && (
          <Button variant="outline" onClick={() => navigate('/personel')}>Personeller →</Button>
        )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="Bugün Arama" value={calls.arama} sub={`${calls.entries} kişi giriş yaptı`} variant="accent" onClick={() => navigate('/kayitlar/gunluk-metrik')} />
        <StatCard label="Açık Görevlerim" value={myTasks.length} sub={`${myTasks.filter((t) => isOverdue(t.bitis_tarihi)).length} geciken`} variant={myTasks.some((t) => isOverdue(t.bitis_tarihi)) ? 'danger' : 'default'} onClick={() => navigate('/isler')} />
        <StatCard label="Bugün Demo" value={todayDemos.length} sub={todayDemos.map((c) => c.ad).join(', ') || 'Yok'} variant={todayDemos.length ? 'success' : 'default'} onClick={() => navigate('/kayitlar/firmalar')} />
        <StatCard label="Trial Bitiyor" value={trialEnding.length} variant={trialEnding.length ? 'warning' : 'default'} onClick={() => navigate('/kayitlar/firmalar')} />
        <StatCard label="Kritik Bug" value={criticalBugs.length} sub={testBugs.length ? `${testBugs.length} testte` : undefined} variant={criticalBugs.length ? 'danger' : 'default'} onClick={() => navigate('/kayitlar/buglar')} />
        <StatCard label="Açık Geri Dönüş" value={openFeedback.length} variant={openFeedback.length ? 'warning' : 'default'} onClick={() => navigate('/kayitlar/geri-donusler')} />
        {patron && (
          <>
            <StatCard label="Bu Ay Net" value={formatCurrency(monthGelir - monthGider)} sub={`${formatCurrency(monthGelir)} / ${formatCurrency(monthGider)}`} onClick={() => navigate('/finans')} />
            <StatCard label="Reklam Harcama" value={formatCurrency(marketing.harcanan)} sub={`CPA ₺${marketing.cpa}`} trend={marketing.spendDelta} onClick={() => navigate('/reklam')} />
          </>
        )}
      </div>

      {patron && alerts.length > 0 && (
        <SectionCard title="Uyarılar" subtitle="Geciken işler, trial, demo, onay bekleyen">
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.link)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-90 ${
                  a.level === 'danger' ? 'bg-red-50 text-red-800 dark:bg-red-900/20' :
                  a.level === 'warning' ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20' :
                  'bg-blue-50 text-blue-800 dark:bg-blue-900/20'
                }`}
              >
                {a.text}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {patron && teamDaily.length > 0 && (
        <SectionCard title="Ekip Bugün" subtitle="Günlük aktivite özeti" action={<Button variant="ghost" size="sm" onClick={() => navigate('/personel')}>Tüm personel →</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Kişi</th>
                  <th>Arama</th>
                  <th>Demo</th>
                  <th>Açık iş</th>
                  <th>Geciken</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {teamDaily.map((row) => (
                  <tr key={row.user.id} className="border-t dark:border-slate-800">
                    <td className="py-2">
                      <button className="text-accent hover:underline font-medium" onClick={() => navigate(`/personel/${row.user.id}`)}>
                        {row.user.name}
                      </button>
                    </td>
                    <td>{row.arama}</td>
                    <td>{row.demo}</td>
                    <td>{row.openTasks}</td>
                    <td className={row.overdue ? 'text-danger font-medium' : ''}>{row.overdue}</td>
                    <td>{row.activeToday ? <span className="text-emerald-600 text-xs">Aktif</span> : <span className="text-slate-400 text-xs">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Canlı Aktivite" subtitle="Son işlemler ve konuşmalar">
            <ActivityFeed items={activity} onItemClick={(item) => navigate(item.link)} />
          </SectionCard>
        </div>

        <div className="space-y-6">
          {patron ? (
            <SectionCard title="Ekip Yükü" subtitle="Açık görevler">
              <TeamWorkloadTable workload={workload} />
            </SectionCard>
          ) : (
            <SectionCard title="Yaklaşan Görevler">
              {myTasks.slice(0, 5).map((t) => (
                <div key={t.id} className={`text-sm py-2 border-b dark:border-slate-800 flex justify-between ${isOverdue(t.bitis_tarihi) ? 'text-danger' : ''}`}>
                  <span>{t.baslik}</span>
                  <span className="text-slate-400">{t.bitis_tarihi || '—'}</span>
                </div>
              ))}
              {!myTasks.length && <p className="text-sm text-slate-400">Görev yok</p>}
            </SectionCard>
          )}

          <SectionCard title="Oda Nabzı" subtitle="Son 24 saat">
            {roomPulse.length ? roomPulse.map((r) => (
              <div key={r.room.id} className="flex justify-between text-sm py-2 border-b dark:border-slate-800 last:border-0">
                <span className="font-medium">#{r.room.name}</span>
                <span className="text-slate-500">{r.count} mesaj · {r.authors.join(', ')}</span>
              </div>
            )) : <p className="text-sm text-slate-400">Henüz aktivite yok</p>}
          </SectionCard>
        </div>
      </div>

      {patron && (
        <div className="grid md:grid-cols-2 gap-6">
          <SectionCard title="Satış Hunisi" subtitle="Pipeline dağılımı">
            <PipelineFunnel stages={funnel} />
          </SectionCard>
          <SectionCard title="Reklam Kanalları" subtitle="Harcama dağılımı" action={<Button variant="ghost" size="sm" onClick={() => navigate('/reklam')}>Detay →</Button>}>
            {channelData.length ? (
              <BarChart data={channelData} format={(v) => formatCurrency(v)} />
            ) : (
              <p className="text-sm text-slate-400">Kampanya ekleyin</p>
            )}
          </SectionCard>
        </div>
      )}

      {patron && pendingFinance.length > 0 && (
        <SectionCard title="Onay Bekleyen Giderler" subtitle="Pazarlama ve operasyon talepleri">
          <div className="space-y-2">
            {pendingFinance.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <div>
                  <span className="font-medium">{formatCurrency(f.tutar)}</span>
                  <span className="text-slate-500 ml-2">{f.aciklama || f.kategori}</span>
                </div>
                <Button size="sm" onClick={() => navigate('/finans')}>Onayla →</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
