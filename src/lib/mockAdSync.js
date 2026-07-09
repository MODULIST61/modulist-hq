import { generateId } from './utils'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function mockSyncAdPlatform(platform, campaigns, upsertCampaign) {
  await new Promise((r) => setTimeout(r, 1500))

  const kanalMap = { meta: 'Meta', google: 'Google' }
  const kanal = kanalMap[platform] || platform
  const matching = campaigns.filter((c) => c.kanal?.toLowerCase() === kanal.toLowerCase())

  const updates = []
  if (matching.length === 0) {
    const newCamp = {
      id: generateId(),
      ad: `${kanal} Otomatik Sync — ${new Date().toLocaleDateString('tr-TR')}`,
      kanal,
      donem_baslangic: new Date().toISOString().split('T')[0],
      donem_bitis: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      butce_plan: rand(5000, 15000),
      butce_harcanan: rand(1000, 8000),
      tiklama: rand(500, 3000),
      kayit_sayisi: rand(5, 30),
      notlar: `[API Mock] ${platform} senkronizasyonu`,
      api_synced_at: new Date().toISOString(),
      api_source: platform,
    }
    upsertCampaign(newCamp)
    updates.push(newCamp)
  } else {
    matching.forEach((c) => {
      const updated = {
        ...c,
        butce_harcanan: (c.butce_harcanan || 0) + rand(200, 1500),
        tiklama: (c.tiklama || 0) + rand(50, 400),
        kayit_sayisi: (c.kayit_sayisi || 0) + rand(0, 5),
        api_synced_at: new Date().toISOString(),
        api_source: platform,
        notlar: (c.notlar || '') + `\n[${new Date().toLocaleString('tr-TR')}] ${platform} API sync`,
      }
      upsertCampaign(updated)
      updates.push(updated)
    })
  }

  return {
    platform,
    synced_at: new Date().toISOString(),
    updated_count: updates.length,
    message: `${kanal}: ${updates.length} kampanya güncellendi (mock API)`,
  }
}
