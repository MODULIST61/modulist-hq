import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal, EmptyState } from '../components/ui/Modal'
import { PageHeader, Card } from '../components/ui/Page'
import { JobBadge } from '../components/ui/Badge'
import { PermissionEditor } from '../components/team/PermissionEditor'
import { createPermissionsFromPreset, JOB_PRESETS } from '../lib/access'
import { validateEmail } from '../lib/utils'

export default function Team() {
  const { currentUser, refreshUsers, users } = useAuth()
  const { addUser, updateUser, deleteUser } = useData()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', status: 'aktif',
    preset: 'sekreter', job_title: 'Sekreter', permissions: createPermissionsFromPreset('sekreter'),
  })
  const [errors, setErrors] = useState({})

  const openAdd = () => {
    setForm({
      name: '', email: '', password: '', status: 'aktif',
      preset: 'sekreter', job_title: 'Sekreter', permissions: createPermissionsFromPreset('sekreter'),
    })
    setErrors({})
    setModal('add')
  }

  const openEdit = (user) => {
    if (user.role === 'patron') return
    setForm({
      ...user,
      password: '',
      preset: user.permissions ? 'ozel' : 'sekreter',
      job_title: user.job_title || '',
      permissions: user.permissions || createPermissionsFromPreset('sekreter'),
    })
    setErrors({})
    setModal({ type: 'edit', user })
  }

  const openPermissions = (user) => {
    if (user.role === 'patron') return
    setForm({
      ...user,
      preset: 'ozel',
      job_title: user.job_title || '',
      permissions: user.permissions || createPermissionsFromPreset('sekreter'),
    })
    setModal({ type: 'permissions', user })
  }

  const openReset = (user) => {
    setForm({ password: '', confirm: '' })
    setErrors({})
    setModal({ type: 'reset', user })
  }

  const applyPreset = (key) => {
    const preset = JOB_PRESETS[key]
    setForm((f) => ({
      ...f,
      preset: key,
      job_title: preset?.job_title || f.job_title,
      permissions: key === 'ozel' ? f.permissions : createPermissionsFromPreset(key),
    }))
  }

  const validate = (isReset = false) => {
    const e = {}
    if (!isReset) {
      if (!form.name?.trim()) e.name = 'Ad zorunludur.'
      if (!form.email?.trim()) e.email = 'E-posta zorunludur.'
      else if (!validateEmail(form.email)) e.email = 'Geçerli e-posta girin.'
      else if (users.some((u) => u.email === form.email.toLowerCase() && u.id !== form.id)) e.email = 'Bu e-posta kullanılıyor.'
      if (!form.job_title?.trim()) e.job_title = 'Görev unvanı zorunludur.'
    }
    if (modal === 'add' || isReset) {
      if (!form.password) e.password = 'Şifre zorunludur.'
      else if (form.password.length < 6) e.password = 'En az 6 karakter.'
      if (isReset && form.password !== form.confirm) e.confirm = 'Şifreler eşleşmiyor.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const memberPayload = () => ({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    role: 'member',
    job_title: form.job_title.trim(),
    permissions: form.permissions,
    status: form.status || 'aktif',
  })

  const handleSave = () => {
    if (!validate()) return
    if (modal === 'add') {
      addUser({ ...memberPayload(), password: form.password })
    } else if (modal?.type === 'edit') {
      updateUser(modal.user.id, memberPayload())
    }
    refreshUsers()
    setModal(null)
  }

  const handlePermissionsSave = () => {
    if (!form.job_title?.trim()) {
      setErrors({ job_title: 'Görev unvanı zorunludur.' })
      return
    }
    updateUser(modal.user.id, {
      job_title: form.job_title.trim(),
      permissions: form.permissions,
    })
    refreshUsers()
    setModal(null)
  }

  const handleReset = () => {
    if (!validate(true)) return
    updateUser(modal.user.id, { password: form.password })
    refreshUsers()
    setModal(null)
  }

  const handleDelete = (user) => {
    if (user.id === currentUser.id || user.role === 'patron') return
    if (confirm(`${user.name} silinsin mi?`)) {
      deleteUser(user.id)
      refreshUsers()
    }
  }

  const toggleStatus = (user) => {
    if (user.role === 'patron') return
    updateUser(user.id, { status: user.status === 'aktif' ? 'pasif' : 'aktif' })
    refreshUsers()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Ekip"
        subtitle="Her kişinin görevini ve erişim yetkilerini siz belirlersiniz"
        action={<Button onClick={openAdd}>+ Üye Ekle</Button>}
      />

      {users.length <= 1 ? (
        <EmptyState
          icon="👥"
          title="Henüz ekip üyesi yok"
          description="Sekreter, muhasebeci, reklamcı, yazılımcı — herkese farklı erişim atayın."
          action={<Button onClick={openAdd}>İlk üyeyi ekle</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Ad</th>
                <th className="px-4 py-3 font-medium text-slate-600 hidden md:table-cell">E-posta</th>
                <th className="px-4 py-3 font-medium text-slate-600">Görev</th>
                <th className="px-4 py-3 font-medium text-slate-600">Durum</th>
                <th className="px-4 py-3 font-medium text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {u.id === currentUser.id && <span className="text-xs text-slate-400 ml-1">(siz)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3"><JobBadge user={u} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.status === 'aktif' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.role !== 'patron' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openPermissions(u)}>Erişim</Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Düzenle</Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openReset(u)}>Şifre</Button>
                      {u.id !== currentUser.id && u.role !== 'patron' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(u)}>{u.status === 'aktif' ? 'Pasif' : 'Aktif'}</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} className="text-danger">Sil</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={
          modal === 'add' ? 'Üye Ekle' :
          modal?.type === 'edit' ? 'Üye Düzenle' :
          modal?.type === 'permissions' ? `Erişim: ${modal.user?.name}` :
          'Şifre Sıfırla'
        }
        size={modal?.type === 'permissions' || modal === 'add' ? 'xl' : 'md'}
      >
        {modal?.type === 'reset' ? (
          <div className="space-y-4">
            <Input label="Yeni Şifre" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
            <Input label="Şifre Tekrar" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
            <Button onClick={handleReset} className="w-full">Kaydet</Button>
          </div>
        ) : modal?.type === 'permissions' ? (
          <div className="space-y-4">
            <PermissionEditor
              value={form.permissions}
              onChange={(p) => setForm({ ...form, permissions: p, preset: 'ozel' })}
              jobTitle={form.job_title}
              onJobTitleChange={(v) => setForm({ ...form, job_title: v })}
              preset={form.preset}
              onPresetChange={applyPreset}
            />
            {errors.job_title && <p className="text-sm text-danger">{errors.job_title}</p>}
            <Button onClick={handlePermissionsSave} className="w-full">Erişimi Kaydet</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Input label="E-posta" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            {modal === 'add' && <Input label="Şifre" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />}
            <PermissionEditor
              value={form.permissions}
              onChange={(p) => setForm({ ...form, permissions: p, preset: 'ozel' })}
              jobTitle={form.job_title}
              onJobTitleChange={(v) => setForm({ ...form, job_title: v })}
              preset={form.preset}
              onPresetChange={applyPreset}
            />
            {errors.job_title && <p className="text-sm text-danger">{errors.job_title}</p>}
            {modal?.type === 'edit' && (
              <Select label="Durum" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </Select>
            )}
            <Button onClick={handleSave} className="w-full">Kaydet</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
