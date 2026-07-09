import { useState } from 'react'
import { answerPatronQuestion } from '../../lib/patronPulse'
import { SectionCard } from '../dashboard/DashboardWidgets'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

const QUICK = [
  'En çok kim arama yaptı?',
  'Kaç inbox talebi var?',
  'Onay bekleyen gider?',
  'Durgun firmalar?',
  'Kaç kritik bug?',
  'Bugün demo var mı?',
]

export function PatronInsights({ data, users }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const ask = (q) => {
    const text = q || question
    if (!text.trim()) return
    setAnswer(answerPatronQuestion(text, data, users))
    if (q) setQuestion(q)
  }

  return (
    <SectionCard title="Hızlı Soru" subtitle="Veriden anlık cevap — AI olmadan">
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Örn: Kaç müşteri var?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
        />
        <Button onClick={() => ask()}>Sor</Button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => ask(q)} className="text-xs px-2 py-1 rounded-full border hover:border-accent text-slate-500">
            {q}
          </button>
        ))}
      </div>
      {answer && (
        <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 whitespace-pre-line">
          {answer.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
        </div>
      )}
    </SectionCard>
  )
}
