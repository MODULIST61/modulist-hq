import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { canLogDailyMetrics, isPatron } from '../../lib/permissions'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Modal, EmptyState } from '../../components/ui/Modal'
import { SectionCard, BarChart } from '../../components/dashboard/DashboardWidgets'
import { downloadCsv, metricsToCsv } from '../../lib/csv'
import { formatDate, generateId, getUserName, isToday } from '../../lib/utils'

export default function DailyMetrics() {
  const { users, currentUser } = useAuth()
  const { dailyMetrics, upsertDailyMetric, deleteDailyMetric } = useData()
  const canLog = canLogDailyMetrics(currentUser)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})

  const today = new Date().toISOString().split('T')[0]

  const todayTotals = useMemo(() => {
    const entries = dailyMetrics.filter((d) => isToday(d.tarih))
    return {
      arama: entries.reduce((s, d) => s + (d.arama_sayisi || 0), 0),
      ulasilan: entries.reduce((s, d) => s + (d.ulasilan || 0), 0),
      demo: entries.reduce((s, d) => s + (d.demo_ayarlanan || 0), 0),
    }
  }, [dailyMetrics])

  const byUser = useMemo(() => {
    const map = {}
    dailyMetrics.filter((d) => isToday(d.tarih)).forEach((d) => {
      const name = getUserName(users, d.user_id)
      map[name] = (map[name] || 0) + (d.arama_sayisi || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  }, [dailyMetrics, users])

  const openLog = () => {
    const existing = dailyMetrics.find((d) => d.tarih === today && d.user_id === currentUser.id)
    setForm(existing || { tarih: today, arama_sayisi: 0, ulasilan: 0, demo_ayarlanan: 0, takip_aramasi: 0, notlar: '' })
    setModal(true)
  }

  const save = () => {
    upsertDailyMetric({ ...form, id: form.id || generateId(), user_id: currentUser.id, tarih: form.tarih || today })
    setModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="grid grid-cols-3 gap-4 flex-1 max-w-lg">
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-accent">{todayTotals.arama}</div>
            <div className="text-xs text-slate-500">Bugün Arama</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{todayTotals.ulasilan}</div>
            <div className="text-xs text-slate-500">Ulaşılan</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{todayTotals.demo}</div>
            <div className="text-xs text-slate-500">Demo Ayarlanan</div>
          </div>
        </div>
        {canLog && <div className="flex gap-2"><Button onClick={openLog}>Bugünü Kaydet</Button><Button variant="outline" onClick={() => downloadCsv(`gunluk-metrik-${today}.csv`, metricsToCsv(dailyMetrics, users))}>CSV İndir</Button></div>}
      </div>

      {byUser.length > 0 && (
        <SectionCard title="Kişi Bazlı (Bugün)" subtitle="Arama dağılımı">
          <BarChart data={byUser} />
        </SectionCard>
      )}

      {dailyMetrics.length === 0 ? (
        <EmptyState icon="📞" title="Henüz metrik yok" description="Günlük arama ve demo sayılarını kaydedin." action={canLog && <Button onClick={openLog}>İlk kaydı gir</Button>} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Kişi</th>
                <th className="px-4 py-3">Arama</th>
                <th className="px-4 py-3">Ulaşılan</th>
                <th className="px-4 py-3">Demo</th>
                <th className="px-4 py-3">Takip</th>
                <th className="px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {dailyMetrics.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)).map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">{formatDate(d.tarih)}</td>
                  <td className="px-4 py-3 font-medium">{getUserName(users, d.user_id)}</td>
                  <td className="px-4 py-3">{d.arama_sayisi}</td>
                  <td className="px-4 py-3">{d.ulasilan}</td>
                  <td className="px-4 py-3">{d.demo_ayarlanan}</td>
                  <td className="px-4 py-3">{d.takip_aramasi}</td>
                  <td className="px-4 py-3">
                    {(d.user_id === currentUser.id || isPatron(currentUser)) && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setForm(d); setModal(true) }}>Düzenle</Button>
                        <Button variant="ghost" size="sm" className="text-danger" onClick={() => confirm('Sil?') && deleteDailyMetric(d.id)}>Sil</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Günlük Metrik">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tarih" type="date" value={form.tarih || today} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="col-span-2" />
          <Input label="Arama Sayısı" type="number" value={form.arama_sayisi || 0} onChange={(e) => setForm({ ...form, arama_sayisi: Number(e.target.value) })} />
          <Input label="Ulaşılan Kişi" type="number" value={form.ulasilan || 0} onChange={(e) => setForm({ ...form, ulasilan: Number(e.target.value) })} />
          <Input label="Demo Ayarlanan" type="number" value={form.demo_ayarlanan || 0} onChange={(e) => setForm({ ...form, demo_ayarlanan: Number(e.target.value) })} />
          <Input label="Takip Araması" type="number" value={form.takip_aramasi || 0} onChange={(e) => setForm({ ...form, takip_aramasi: Number(e.target.value) })} />
          <Textarea label="Notlar" value={form.notlar || ''} onChange={(e) => setForm({ ...form, notlar: e.target.value })} className="col-span-2" />
        </div>
        <Button onClick={save} className="w-full mt-4">Kaydet</Button>
      </Modal>
    </div>
  )
}
