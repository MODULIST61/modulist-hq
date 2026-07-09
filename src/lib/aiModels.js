/** OpenAI model list — Ayarlar'dan seçilir, tüm AI modülleri bunu kullanır */

export const AI_MODELS = [
  { id: 'gpt-5.2', label: 'GPT-5.2 (en yeni, en güçlü)', tier: 'flagship' },
  { id: 'gpt-5.1', label: 'GPT-5.1', tier: 'flagship' },
  { id: 'gpt-5', label: 'GPT-5', tier: 'flagship' },
  { id: 'gpt-4.1', label: 'GPT-4.1', tier: 'smart' },
  { id: 'gpt-4o', label: 'GPT-4o', tier: 'smart' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini (hızlı, ucuz)', tier: 'fast' },
  { id: 'o3-mini', label: 'o3-mini (derin analiz)', tier: 'reasoning' },
  { id: 'o1', label: 'o1 (reasoning)', tier: 'reasoning' },
]

export const DEFAULT_AI_MODEL = 'gpt-5.1'

export const AI_MODULE_DEFAULTS = {
  manager: 'gpt-5.1',
  marketing: 'gpt-5.1',
}

export function resolveModel(settings, module = 'manager') {
  const specific = settings?.[`openaiModel_${module}`]
  if (specific?.trim()) return specific.trim()
  if (settings?.openaiModelCustom?.trim()) return settings.openaiModelCustom.trim()
  if (settings?.openaiModel?.trim()) return settings.openaiModel.trim()
  return AI_MODULE_DEFAULTS[module] || DEFAULT_AI_MODEL
}

export function modelLabel(id) {
  return AI_MODELS.find((m) => m.id === id)?.label || id
}
