import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { buildSearchIndex, searchItems } from '../../lib/search'
import { cn } from '../../lib/utils'

export function GlobalSearch({ open, onClose }) {
  const { users } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const index = useMemo(() => buildSearchIndex(data, users), [data, users])
  const results = useMemo(() => searchItems(index, query), [index, query])

  useEffect(() => {
    if (!open) { setQuery(''); setActive(0) }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const go = useCallback((item) => {
    if (item.type === 'kisi') {
      navigate('/mesajlar?panel=dm')
    } else {
      navigate(item.path)
    }
    onClose()
  }, [navigate, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
      if (e.key === 'Enter' && results[active]) go(results[active])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, active, go, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Firma, görev, mesaj, kişi ara..."
            className="flex-1 py-4 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Sonuç bulunamadı</p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => go(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  i === active ? 'bg-accent/10 text-accent' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-slate-400 shrink-0">{item.typeLabel}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex gap-4">
          <span>↑↓ gezin</span>
          <span>↵ seç</span>
          <span>⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  )
}

export function useGlobalSearchShortcut(setOpen) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setOpen])
}
