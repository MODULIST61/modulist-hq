import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { JobBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Kbd } from '../ui/Page'
import { relativeTime } from '../../lib/utils'

const NOTIF_LABELS = {
  mention: { title: '@mention', desc: 'Sizden bahsedildi' },
  gorev_atandi: { title: 'Görev atandı', desc: 'Yeni görev' },
  trial_bitiyor: { title: 'Trial bitiyor', desc: 'Trial süresi doluyor' },
  finans_onay: { title: 'Gider onayı', desc: 'Onay bekleyen gider' },
  patron_duyuru: { title: 'Patron duyurusu', desc: 'Genel duyuru' },
  dm: { title: 'Özel mesaj', desc: 'Yeni DM' },
}

export function TopBar({ onMenuClick, onSearchOpen }) {
  const { currentUser, logout } = useAuth()
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)

  const myNotifs = notifications.filter((n) => n.user_id === currentUser?.id)
  const unread = myNotifs.filter((n) => !n.okundu)

  const handleNotifClick = (n) => {
    markNotificationRead(n.id)
    if (n.tip === 'mention' && n.ref?.room_id) navigate(`/mesajlar?oda=${n.ref.room_id}`)
    if (n.tip === 'gorev_atandi') navigate('/isler')
    if (n.tip === 'finans_onay') navigate('/finans')
    if (n.tip === 'trial_bitiyor') navigate('/kayitlar/firmalar')
    if (n.tip === 'patron_duyuru') navigate('/mesajlar?oda=genel')
    if (n.tip === 'dm') navigate('/mesajlar?panel=dm')
    setShowNotifs(false)
  }

  return (
    <header className="h-14 border-b border-slate-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 flex-1 max-w-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-sm hover:border-accent/40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span className="flex-1 text-left">Ara...</span>
          <Kbd>⌘K</Kbd>
        </button>
        <button onClick={onSearchOpen} className="sm:hidden p-2 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {unread.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] rounded-full flex items-center justify-center px-1 font-medium">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-[70vh] overflow-hidden flex flex-col animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-sm">Bildirimler</span>
                  {unread.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead(currentUser?.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      Tümünü okundu işaretle
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {myNotifs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">Bildirim yok</div>
                  ) : (
                    myNotifs.slice(0, 30).map((n) => {
                      const meta = NOTIF_LABELS[n.tip] || { title: n.tip, desc: '' }
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.okundu ? 'bg-accent/5' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.okundu && <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                            <div className={!n.okundu ? '' : 'ml-4'}>
                              <div className="text-sm font-medium">{meta.title}</div>
                              {meta.desc && <div className="text-xs text-slate-500">{meta.desc}</div>}
                              <div className="text-[10px] text-slate-400 mt-1">{relativeTime(n.created_at)}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-accent/20 flex items-center justify-center text-xs font-bold text-primary dark:text-accent">
            {currentUser?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{currentUser?.name}</div>
            <JobBadge user={currentUser} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>Çıkış</Button>
      </div>
    </header>
  )
}
