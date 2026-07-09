import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import {
  buildAccountingKpis,
  buildAdSpendVsExpense,
  buildDueToday,
  buildRecentMovements,
} from '../../lib/accounting'
import { StatCard, SectionCard } from '../dashboard/DashboardWidgets'
import { Button } from '../ui/Button'
import { formatCurrency, formatDate } from '../../lib/utils'
import { FINANCE_CATEGORY_LABELS } from '../../lib/constants'

export function AccountingToday({ onTabChange }) {
  const navigate = useNavigate()
  const { users } = useAuth()
  const { finance, companies, campaigns, settings } = useData()

  const kpis = useMemo(() => buildAccountingKpis(finance, companies, settings), [finance, companies, settings])
  const dueToday = useMemo(() => buildDueToday(companies, finance), [companies, finance])
  const recent = useMemo(() => buildRecentMovements(finance, users), [finance, users])
  const adCompare = useMemo(() => buildAdSpendVsExpense(campaigns, finance), [campaigns, finance])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Bu Ay Gelir" value={formatCurrency(kpis.gelir)} variant="success" onClick={() => onTabChange?.('hareketler')} />
        <StatCard label="Bu Ay Gider" value={formatCurrency(kpis.gider)} variant="danger" onClick={() => onTabChange?.('hareketler')} />
        <StatCard label="Net" value={formatCurrency(kpis.net)} variant={kpis.net >= 0 ? 'success' : 'danger'} />
        <StatCard label="Onay Bekleyen" value={kpis.pendingCount} sub={kpis.pendingCount ? formatCurrency(kpis.pendingTotal) : undefined} variant={kpis.pendingCount ? 'warning' : 'default'} onClick={() => navigate('/patron?tab=finans')} />
        <StatCard label="Bekleyen Havale" value={formatCurrency(kpis.bekleyenHavale)} variant={kpis.bekleyenHavale ? 'warning' : 'default'} onClick={() => onTabChange?.('tahsilat')} />
        <StatCard label="MRR" value={formatCurrency(kpis.mrr)} sub={`${kpis.customerCount} müşteri`} variant="accent" />
      </div>

      {dueToday.length > 0 && (
        <SectionCard title="Bugün / Yakın Vade" subtitle="Trial, dekont ve ödeme bekleyenler" action={<Button variant="ghost" size="sm" onClick={() => onTabChange?.('tahsilat')}>Tahsilat →</Button>}>
          <div className="space-y-2">
            {dueToday.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(`/sekreter/firmalar/${item.company.id}`)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-90 ${item.priority === 'danger' ? 'bg-red-50 text-red-800 dark:bg-red-900/20' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20'}`}
              >
                {item.label}
                {item.amount > 0 && <span className="ml-2 font-semibold">{formatCurrency(item.amount)}</span>}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="Son 7 Gün Hareketler" subtitle="Tüm finans kayıtları" action={<Button variant="ghost" size="sm" onClick={() => onTabChange?.('hareketler')}>Tümü →</Button>}>
          {recent.length ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recent.map((f) => (
                <div key={f.id} className="flex justify-between text-sm py-2 border-b dark:border-slate-800 last:border-0">
                  <div>
                    <span className={f.tip === 'gelir' ? 'text-emerald-600' : 'text-red-500'}>{f.tip}</span>
                    <span className="text-slate-500 ml-2">{FINANCE_CATEGORY_LABELS[f.kategori] || f.kategori}</span>
                    <p className="text-xs text-slate-400">{formatDate(f.tarih)} · {f.girenName}</p>
                  </div>
                  <span className="font-semibold">{formatCurrency(f.tutar)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Henüz hareket yok</p>
          )}
        </SectionCard>

        <SectionCard title="Reklam: Kampanya vs Gider" subtitle="Onaylı muhasebe kayıtları ile karşılaştırma">
          <div className="space-y-3 text-sm">
            <Row label="Kampanya harcaması" value={formatCurrency(adCompare.campaignSpend)} />
            <Row label="Onaylı reklam gideri" value={formatCurrency(adCompare.approvedAdExpense)} />
            <Row label="Onay bekleyen reklam" value={formatCurrency(adCompare.pendingAd)} />
            <div className={`p-3 rounded-lg ${adCompare.matched ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
              {adCompare.matched ? (
                <p className="text-emerald-700 dark:text-emerald-300">Kampanya ve gider kayıtları uyumlu ✓</p>
              ) : (
                <p className="text-amber-700 dark:text-amber-300">
                  Fark: {formatCurrency(Math.abs(adCompare.gap))} — {adCompare.gap > 0 ? 'gider kaydı eksik olabilir' : 'fazla kayıt var'}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => onTabChange?.('oneriler')}>Önerileri gör →</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
