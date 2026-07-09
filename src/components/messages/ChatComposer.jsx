import { MESSAGE_TYPE_LABELS } from '../../lib/constants'
import { MSG_TYPE_STYLES } from '../../lib/messaging'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

const TYPE_KEYS = ['normal', 'duyuru', 'karar', 'gorev']

export function ChatComposer({
  text,
  setText,
  msgType,
  setMsgType,
  replyTo,
  clearReply,
  linkRecord,
  clearLink,
  onSend,
  disabled,
  isDm,
  mentionUsers,
  mentionQuery,
  onPickMention,
  hashSuggestions,
  onPickHash,
  onLinkPicker,
}) {
  return (
    <div className="shrink-0 bg-[#f0f2f5] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 md:p-3">
      {!isDm && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TYPE_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setMsgType(k)}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all',
                msgType === k
                  ? `${MSG_TYPE_STYLES[k]?.chip || MSG_TYPE_STYLES.normal.chip} border-transparent ring-2 ring-accent/30`
                  : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500',
              )}
            >
              {MESSAGE_TYPE_LABELS[k] || k}
            </button>
          ))}
          <button
            type="button"
            onClick={onLinkPicker}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 text-slate-500"
          >
            🔗 Kayıt bağla
          </button>
        </div>
      )}

      {replyTo && (
        <div className="mb-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-accent flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-accent">Yanıt</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{replyTo.text}</p>
          </div>
          <button type="button" onClick={clearReply} className="text-slate-400 hover:text-slate-600 shrink-0">✕</button>
        </div>
      )}

      {linkRecord && (
        <div className="mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between text-xs">
          <span>🔗 {linkRecord.label}</span>
          <button type="button" onClick={clearLink} className="text-slate-500">✕</button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isDm ? 'Mesaj yaz...' : 'Mesaj yaz... @mention #firma'}
            rows={1}
            className="w-full resize-none rounded-2xl border-0 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-accent/30 min-h-[44px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          {mentionQuery !== null && mentionUsers.length > 0 && (
            <SuggestionList
              items={mentionUsers.map((u) => ({ key: u.id, label: `@${u.name}`, sub: u.job_title }))}
              onPick={(item) => onPickMention(item.label.slice(1))}
            />
          )}
          {hashSuggestions?.length > 0 && (
            <SuggestionList
              items={hashSuggestions.map((h) => ({ key: h.id, label: `#${h.label}`, sub: h.type }))}
              onPick={(item) => onPickHash(item)}
            />
          )}
        </div>
        <Button
          onClick={onSend}
          disabled={disabled || !text.trim()}
          className="rounded-full w-11 h-11 p-0 flex items-center justify-center shrink-0 bg-[#008069] hover:bg-[#006e5a]"
        >
          ➤
        </Button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center">Enter gönder · Shift+Enter yeni satır</p>
    </div>
  )
}

function SuggestionList({ items, onPick }) {
  return (
    <div className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-white dark:bg-slate-800 border rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onPick(item)}
          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b last:border-0"
        >
          <span className="font-medium">{item.label}</span>
          {item.sub && <span className="text-xs text-slate-400 ml-2">{item.sub}</span>}
        </button>
      ))}
    </div>
  )
}
