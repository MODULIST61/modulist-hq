import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

export function ChatHeader({
  title,
  subtitle,
  showBack,
  onBack,
  roomSearch,
  setRoomSearch,
  showSearch,
  setShowSearch,
  pinnedCount,
  onShowPins,
  onClear,
  clearing,
  clearLabel,
  onBroadcast,
  canBroadcast,
  canClear,
}) {
  return (
    <div className="shrink-0 bg-[#f0f2f5] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-3 py-2.5 flex items-center gap-2">
        {showBack && (
          <button type="button" onClick={onBack} className="md:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-200 rounded-lg">
            ←
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 dark:text-white truncate">{title}</h2>
          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600"
            title="Ara"
          >
            🔍
          </button>
          {pinnedCount > 0 && (
            <button type="button" onClick={onShowPins} className="p-2 rounded-lg hover:bg-slate-200 text-amber-600" title="Pinler">
              📌
            </button>
          )}
          {canClear && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs hidden sm:inline-flex" onClick={onClear} disabled={clearing}>
              {clearing ? '...' : clearLabel}
            </Button>
          )}
          {canBroadcast && (
            <Button size="sm" variant="accent" className="text-xs" onClick={onBroadcast}>
              Duyuru
            </Button>
          )}
        </div>
      </div>
      {showSearch && (
        <div className="px-3 pb-2">
          <input
            type="search"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            placeholder="Mesajlarda ara..."
            className="w-full px-3 py-2 text-sm rounded-lg border dark:bg-slate-800"
          />
        </div>
      )}
    </div>
  )
}

export function PinnedBar({ pins, onUnpin, expanded, onToggle }) {
  if (!pins.length) return null
  return (
    <div className="shrink-0 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 px-3 py-2">
      <button type="button" onClick={onToggle} className="flex items-center gap-2 text-xs font-semibold text-amber-800 w-full text-left">
        <span>📌 {pins.length} sabitlenmiş mesaj</span>
        <span className="text-amber-600 ml-auto">{expanded ? 'Gizle' : 'Göster'}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
          {pins.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-100 bg-white/50 dark:bg-slate-900/40 rounded-lg px-2 py-1.5">
              <span className="flex-1 line-clamp-2">{m.text}</span>
              {onUnpin && (
                <button type="button" onClick={() => onUnpin(m)} className="text-amber-700 shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
