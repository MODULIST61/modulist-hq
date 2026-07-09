import { useState, useEffect } from 'react'
import {
  PAGE_KEYS,
  ACTION_KEYS,
  ROOM_SLUGS,
  JOB_PRESETS,
  createPermissionsFromPreset,
} from '../../lib/access'
import { ROOMS } from '../../lib/constants'
import { Input, Select } from '../ui/Input'
import { cn } from '../../lib/utils'

const ROOM_LABELS = Object.fromEntries(ROOMS.map((r) => [r.slug, r.name]))

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded accent-accent shrink-0"
      />
      <div>
        <span className="text-sm font-medium group-hover:text-accent transition-colors">{label}</span>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

function RoomAccessSelect({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800"
      >
        <option value="none">Erişim yok</option>
        <option value="read">Sadece oku</option>
        <option value="write">Yazabilir</option>
      </select>
    </div>
  )
}

export function PermissionEditor({ value, onChange, jobTitle, onJobTitleChange, preset, onPresetChange }) {
  const [tab, setTab] = useState('sayfalar')
  const perms = value || createPermissionsFromPreset('sekreter')

  const setPage = (key, v) => onChange({ ...perms, pages: { ...perms.pages, [key]: v } })
  const setAction = (key, v) => onChange({ ...perms, actions: { ...perms.actions, [key]: v } })
  const setRoom = (key, v) => onChange({ ...perms, rooms: { ...perms.rooms, [key]: v } })

  const tabs = [
    { id: 'sayfalar', label: 'Sayfalar' },
    { id: 'odalar', label: 'Mesaj Odaları' },
    { id: 'yetkiler', label: 'Yetkiler' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Select
          label="Görev şablonu"
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
        >
          {Object.entries(JOB_PRESETS).map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
        </Select>
        <Input
          label="Görev unvanı"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          placeholder="Sekreter, Muhasebeci, Reklamcı..."
        />
      </div>
      <p className="text-xs text-slate-400 -mt-1">
        Şablon seçince varsayılan erişimler yüklenir — sonra tek tek değiştirebilirsiniz.
      </p>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-64 overflow-y-auto pr-1">
        {tab === 'sayfalar' && (
          <div className="grid sm:grid-cols-2 gap-x-4">
            {Object.entries(PAGE_KEYS).map(([key, label]) => (
              <Toggle
                key={key}
                checked={!!perms.pages?.[key]}
                onChange={(v) => setPage(key, v)}
                label={label}
              />
            ))}
          </div>
        )}
        {tab === 'odalar' && (
          <div className="space-y-1">
            {ROOM_SLUGS.map((slug) => (
              <RoomAccessSelect
                key={slug}
                label={ROOM_LABELS[slug] || slug}
                value={perms.rooms?.[slug] || 'none'}
                onChange={(v) => setRoom(slug, v)}
              />
            ))}
          </div>
        )}
        {tab === 'yetkiler' && (
          <div className="space-y-0">
            {Object.entries(ACTION_KEYS).map(([key, label]) => (
              <Toggle
                key={key}
                checked={!!perms.actions?.[key]}
                onChange={(v) => setAction(key, v)}
                label={label}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function usePermissionForm(initial = {}) {
  const [preset, setPreset] = useState(initial.preset || 'sekreter')
  const [jobTitle, setJobTitle] = useState(initial.job_title || JOB_PRESETS.sekreter.job_title)
  const [permissions, setPermissions] = useState(
    initial.permissions || createPermissionsFromPreset('sekreter')
  )

  const applyPreset = (key) => {
    const p = JOB_PRESETS[key]
    if (p?.permissions) {
      setPermissions(createPermissionsFromPreset(key))
      if (p.job_title) setJobTitle(p.job_title)
    }
    setPreset(key)
  }

  useEffect(() => {
    if (initial.permissions && initial.job_title) {
      setPermissions(initial.permissions)
      setJobTitle(initial.job_title)
      setPreset('ozel')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { preset, setPreset: applyPreset, jobTitle, setJobTitle, permissions, setPermissions }
}
