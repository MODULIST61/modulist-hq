import { Link } from 'react-router-dom'
import { MessageTypeBadge, JobBadge } from '../ui/Badge'
import { MessageText } from './MessageText'
import { MSG_TYPE_STYLES, formatMessageTime, recordLink } from '../../lib/messaging'
import { isPatron } from '../../lib/permissions'
import { cn } from '../../lib/utils'

export function ChatBubble({
  message,
  users,
  currentUserId,
  companies,
  bugs,
  isDm,
  onReply,
  onPin,
  onCreateTask,
  onDelete,
  onCopy,
  onToggleThread,
  replyCount = 0,
  threadExpanded = false,
  compact = false,
  showAvatar = true,
}) {
  const sender = users.find((u) => u.id === message.user_id)
  const isOwn = message.user_id === currentUserId
  const patronMsg = isPatron(sender)
  const typeStyle = MSG_TYPE_STYLES[message.type] || MSG_TYPE_STYLES.normal

  const linkedRecord = message.linked_record_type && message.linked_record_id
    ? {
      type: message.linked_record_type,
      id: message.linked_record_id,
      label: message.linked_record_type === 'firma'
        ? companies.find((c) => c.id === message.linked_record_id)?.ad
        : bugs.find((b) => b.id === message.linked_record_id)?.baslik,
    }
    : null

  const bubble = (
    <div
      className={cn(
        'relative max-w-[min(100%,520px)] px-3 py-2 shadow-sm',
        isOwn
          ? 'bg-[#dcf8c6] dark:bg-emerald-900/50 text-slate-900 dark:text-slate-100 rounded-2xl rounded-br-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl rounded-bl-sm',
        typeStyle.bubble,
        patronMsg && !isOwn && 'ring-1 ring-amber-400/50',
        compact && 'text-sm py-1.5',
      )}
    >
      {!isOwn && !compact && (
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-xs font-bold text-primary dark:text-white">{sender?.name}</span>
          {sender && <JobBadge user={sender} className="scale-90 origin-left" />}
          <MessageTypeBadge type={message.type} />
          {message.pinned && <span className="text-[10px] text-amber-600">📌</span>}
        </div>
      )}
      {isOwn && message.type !== 'normal' && (
        <div className="mb-1"><MessageTypeBadge type={message.type} /></div>
      )}
      <p className={cn('text-sm whitespace-pre-wrap leading-relaxed', compact && 'text-xs')}>
        <MessageText
          text={message.text}
          users={users}
          linkedRecord={linkedRecord}
          companies={companies}
          bugs={bugs}
        />
      </p>
      <div className={cn('flex items-center justify-end gap-1 mt-1', isOwn ? 'text-emerald-900/60' : 'text-slate-400')}>
        <span className="text-[10px]">{formatMessageTime(message.created_at)}</span>
        {isOwn && <span className="text-[10px]">✓✓</span>}
      </div>
    </div>
  )

  return (
    <div className={cn('group px-3 py-1', compact && 'py-0.5')}>
      <div className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {!isOwn && showAvatar && !compact && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-auto mb-1">
            {sender?.name?.[0] || '?'}
          </div>
        )}
        {!isOwn && !showAvatar && !compact && <div className="w-8 shrink-0" />}
        <div className={cn('flex flex-col min-w-0', isOwn ? 'items-end' : 'items-start')}>
          {bubble}
          {!compact && (
            <div className="flex flex-wrap gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity px-1">
              {onReply && !isDm && (
                <ActionBtn label="Yanıtla" onClick={() => onReply(message)} />
              )}
              {onToggleThread && replyCount > 0 && (
                <ActionBtn
                  label={threadExpanded ? 'Yanıtları gizle' : `${replyCount} yanıt`}
                  onClick={() => onToggleThread(message.id)}
                />
              )}
              {onPin && (
                <ActionBtn label={message.pinned ? 'Pin kaldır' : 'Pinle'} onClick={() => onPin(message)} />
              )}
              {onCreateTask && (
                <ActionBtn label="Görev" onClick={() => onCreateTask(message)} />
              )}
              {onCopy && <ActionBtn label="Kopyala" onClick={() => onCopy(message.text)} />}
              {onDelete && <ActionBtn label="Sil" danger onClick={() => onDelete(message)} />}
              {linkedRecord && recordLink(linkedRecord.type, linkedRecord.id) && (
                <Link to={recordLink(linkedRecord.type, linkedRecord.id)} className="text-[10px] text-accent px-1.5 py-0.5 rounded hover:bg-slate-100">
                  Kayda git
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-[10px] px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700',
        danger ? 'text-red-600' : 'text-slate-500',
      )}
    >
      {label}
    </button>
  )
}
