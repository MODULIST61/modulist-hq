import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { validateEmail } from '../lib/utils'

export default function Setup() {
  const { isInitialized, setupPatron } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (isInitialized) return <Navigate to="/giris" replace />

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Ad soyad zorunludur.'
    if (!form.email.trim()) e.email = 'E-posta zorunludur.'
    else if (!validateEmail(form.email)) e.email = 'Geçerli bir e-posta girin.'
    if (!form.password) e.password = 'Şifre zorunludur.'
    else if (form.password.length < 6) e.password = 'Şifre en az 6 karakter olmalı.'
    if (form.password !== form.confirm) e.confirm = 'Şifreler eşleşmiyor.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      setupPatron({ name: form.name, email: form.email, password: form.password })
      window.location.href = '/'
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary via-primary-light to-[#0d3a5c] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 relative animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
            <img src="/modulist-logo.png" alt="Modulist" className="h-8" />
          </div>
          <h1 className="text-2xl font-bold text-primary dark:text-white">Modulist HQ Kurulumu</h1>
          <p className="text-sm text-slate-500 mt-1">Patron hesabınızı oluşturun ve workspace'i başlatın</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="Adınız Soyadınız" />
          <Input label="E-posta" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="patron@modulist.net" />
          <Input label="Şifre" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
          <Input label="Şifre Tekrar" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Başlatılıyor...' : "HQ'yu Başlat"}
          </Button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-6">hq.modulist.net · İç yönetim platformu</p>
      </div>
    </div>
  )
}
