import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { GlobalSearch, useGlobalSearchShortcut } from '../search/GlobalSearch'
import { useData } from '../../context/DataContext'

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { settings } = useData()

  useGlobalSearchShortcut(setSearchOpen)

  useEffect(() => {
    const root = document.documentElement
    if (settings?.darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings?.darkMode])

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 dark:bg-slate-950 safe-area-pb">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileOpen(true)} onSearchOpen={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 animate-slide-up">
          <Outlet />
        </main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
