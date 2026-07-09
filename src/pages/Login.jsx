import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const { isInitialized, login, currentUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isInitialized) return <Navigate to="/kurulum" replace />
  if (currentUser) return <Navigate to="/" replace />

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('E-posta ve şifre zorunludur.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const result = login(email, password)
      if (!result.ok) setError(result.error)
      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary via-primary-light to-[#0d3a5c] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 relative animate-slide-up border border-white/10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/5 dark:bg-accent/10 flex items-center justify-center">
            <img src="/modulist-logo.png" alt="Modulist" className="h-8" />
          </div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">Modulist HQ</h1>
          <p className="text-sm text-slate-500 mt-1">hq.modulist.net · İç yönetim paneli</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@modulist.net" autoComplete="email" />
          <Input label="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && (
            <div className="text-sm text-danger bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-lg border border-red-100 dark:border-red-900/30 animate-fade-in">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Giriş yapılıyor...
              </span>
            ) : 'Giriş Yap'}
          </Button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6">Modulist ekibi için · Müşteri paneli değil</p>
      </div>
    </div>
  )
}
