import { Link } from 'react-router-dom'
import { recordLink } from '../../lib/messaging'

export function MessageText({ text, users, linkedRecord, companies, bugs }) {
  const parts = text.split(/(@\S+|#\S+)/g)

  const resolveHash = (token) => {
    const q = token.slice(1).toLowerCase()
    const firma = companies?.find((c) => c.ad?.toLowerCase().includes(q))
    if (firma) return { type: 'firma', id: firma.id, label: firma.ad }
    const bug = bugs?.find((b) => b.baslik?.toLowerCase().includes(q))
    if (bug) return { type: 'bug', id: bug.id, label: bug.baslik }
    return null
  }

  return (
    <span className="break-words">
      {parts.map((part, i) => {
        const mention = users.find((u) => part === `@${u.name}`)
        if (mention) {
          return (
            <span key={i} className="font-semibold text-accent bg-blue-50 dark:bg-blue-900/40 px-1 rounded">
              {part}
            </span>
          )
        }
        if (part.startsWith('#')) {
          const rec = resolveHash(part)
          if (rec) {
            const href = recordLink(rec.type, rec.id)
            return href ? (
              <Link key={i} to={href} className="font-medium text-accent underline underline-offset-2">
                {part}
              </Link>
            ) : <span key={i}>{part}</span>
          }
        }
        return <span key={i}>{part}</span>
      })}
      {linkedRecord?.type && linkedRecord?.id && (
        <Link
          to={recordLink(linkedRecord.type, linkedRecord.id) || '#'}
          className="mt-2 block text-xs font-medium text-accent bg-white/60 dark:bg-slate-800/60 rounded-lg px-2 py-1.5 border border-accent/20"
        >
          🔗 {linkedRecord.label || linkedRecord.type}
        </Link>
      )}
    </span>
  )
}
