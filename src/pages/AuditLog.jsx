import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { PageHeader } from '../components/ui/Page'
import { Input, Select } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { formatDateTime, getUserName } from '../lib/utils'

const ACTION_LABELS = {
  login: 'Giriş',
  message_send: 'Mesaj',
  task_create: 'Görev oluşturma',
  task_update: 'Görev güncelleme',
  task_done: 'Görev tamamlandı',
  company_create: 'Firma eklendi',
  company_update: 'Firma güncellendi',
  pipeline_change: 'Pipeline değişimi',
  metric_log: 'Metrik girişi',
  campaign_update: 'Kampanya güncellendi',
  finance_approve: 'Gider onaylandı',
  finance_reject: 'Gider reddedildi',
  finance_create: 'Finans kaydı',
}

export default function AuditLog() {
  const { users } = useAuth()
  const { auditLogs } = useData()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')

  const actions = useMemo(() => {
    const set = new Set((auditLogs || []).map((a) => a.action))
    return [...set].sort()
  }, [auditLogs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (auditLogs || [])
      .filter((a) => {
        if (actionFilter && a.action !== actionFilter) return false
        if (userFilter && a.user_id !== userFilter) return false
        if (!q) return true
        const name = getUserName(users, a.user_id)?.toLowerCase() || ''
        return (
          name.includes(q)
          || a.summary?.toLowerCase().includes(q)
          || a.action?.toLowerCase().includes(q)
          || a.entity_type?.toLowerCase().includes(q)
        )
      })
      .slice(0, 300)
  }, [auditLogs, search, actionFilter, userFilter, users])

  const exportCsv = () => {
    const header = 'Tarih,Kullanıcı,Aksiyon,Özet,Varlık\n'
    const rows = filtered.map((a) => {
      const cols = [
        formatDateTime(a.created_at),
        getUserName(users, a.user_id) || '—',
        ACTION_LABELS[a.action] || a.action,
        (a.summary || '').replace(/"/g, '""'),
        a.entity_type || '',
      ]
      return cols.map((c) => `"${c}"`).join(',')
    })
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `denetim-gunlugu-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Denetim Günlüğü"
        subtitle="Kim ne yaptı — giriş, görev, firma, finans, metrik"
        action={<Button variant="outline" size="sm" onClick={exportCsv}>CSV İndir</Button>}
      />

      <div className="grid md:grid-cols-3 gap-3">
        <Input placeholder="Ara (özet, kişi, aksiyon)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">Tüm aksiyonlar</option>
          {actions.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
          ))}
        </Select>
        <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
          <option value="">Tüm kullanıcılar</option>
          {users.filter((u) => u.status === 'aktif').map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left sticky top-0">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Aksiyon</th>
                <th className="px-4 py-3">Özet</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDateTime(a.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {a.user_id ? (
                      <Link to={`/personel/${a.user_id}`} className="text-accent hover:underline">
                        {getUserName(users, a.user_id)}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {ACTION_LABELS[a.action] || a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="text-sm text-slate-400 py-12 text-center">Kayıt bulunamadı</p>
        )}
        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 px-4 py-2 border-t dark:border-slate-800">
            {filtered.length} kayıt gösteriliyor (son 500)
          </p>
        )}
      </div>
    </div>
  )
}
