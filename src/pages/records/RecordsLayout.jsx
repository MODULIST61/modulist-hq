import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/kayitlar/firmalar', label: 'Firmalar' },
  { to: '/kayitlar/buglar', label: "Bug'lar" },
  { to: '/kayitlar/kampanyalar', label: 'Kampanyalar' },
  { to: '/kayitlar/geri-donusler', label: 'Geri Dönüşler' },
  { to: '/kayitlar/gunluk-metrik', label: 'Günlük Metrik' },
]

export default function RecordsLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary dark:text-white">Kayıtlar</h1>
        <p className="text-sm text-slate-500">Firmalar, bug'lar, kampanyalar, geri dönüşler ve operasyon metrikleri</p>
      </div>
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
