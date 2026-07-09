import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { RoleBadge } from '../components/ui/Badge'
import { PageHeader, Card } from '../components/ui/Page'
import { isPatron } from '../lib/permissions'

const DEFAULT_GOALS = { calls: 50, demos: 10, tasks: 15, score: 70 }

export default function Settings() {
  const { currentUser } = useAuth()
  const { settings, updateSettings, resetAllData, loadSample } = useData()
  const goals = { ...DEFAULT_GOALS, ...settings?.performanceGoals }

  const handleReset = () => {
    if (confirm('Tüm veriler silinecek. Emin misiniz?')) {
      resetAllData()
    }
  }

  const handleSample = () => {
    if (confirm('Örnek veri yüklensin mi? (3 firma, 5 mesaj, 2 bug)')) {
      loadSample(currentUser.id)
    }
  }

  const updateGoal = (key, value) => {
    const num = parseInt(value, 10) || 0
    updateSettings({ performanceGoals: { ...goals, [key]: num } })
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Ayarlar" subtitle="Profil ve uygulama tercihleri" />

      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Profil</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Ad</span>
              <span className="font-medium">{currentUser?.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">E-posta</span>
              <span>{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500">Rol</span>
              <RoleBadge role={currentUser?.role} />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Görünüm</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium">Koyu mod</span>
              <p className="text-xs text-slate-400">Gece çalışması için göz yormayan tema</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.darkMode || false}
              onChange={(e) => updateSettings({ darkMode: e.target.checked })}
              className="w-5 h-5 rounded accent-accent cursor-pointer"
            />
          </label>
        </Card>

        {isPatron(currentUser) && (
          <>
            <Card className="p-5">
              <h2 className="font-semibold mb-1">Performans Hedefleri</h2>
              <p className="text-xs text-slate-400 mb-4">30 günlük dönem için ekip hedefleri (Performans sayfasında gösterilir)</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Arama hedefi" type="number" value={goals.calls} onChange={(e) => updateGoal('calls', e.target.value)} />
                <Input label="Demo hedefi" type="number" value={goals.demos} onChange={(e) => updateGoal('demos', e.target.value)} />
                <Input label="Görev hedefi" type="number" value={goals.tasks} onChange={(e) => updateGoal('tasks', e.target.value)} />
                <Input label="Skor hedefi" type="number" value={goals.score} onChange={(e) => updateGoal('score', e.target.value)} />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold mb-2">Örnek Veri</h2>
              <p className="text-sm text-slate-500 mb-3">Demo için örnek firma, mesaj ve bug yükleyin.</p>
              <Button variant="outline" onClick={handleSample}>Örnek veri yükle</Button>
            </Card>
          </>
        )}

        <Card className="p-5 border-danger/30">
          <h2 className="font-semibold mb-2 text-danger">Tehlikeli Bölge</h2>
          <p className="text-sm text-slate-500 mb-3">Tüm Supabase verisi SQL Editor üzerinden sıfırlanmalıdır.</p>
          <Button variant="danger" onClick={handleReset}>Tüm veriyi sıfırla</Button>
        </Card>

        <div className="text-center text-xs text-slate-400 pt-2 pb-6">
          Modulist HQ v1.0 · hq.modulist.net
        </div>
      </div>
    </div>
  )
}
