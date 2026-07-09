export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v) => {
    const s = String(v ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function financeToCsv(finance, users, campaigns) {
  const getName = (id) => users.find((u) => u.id === id)?.name || ''
  return finance.map((f) => ({
    tarih: f.tarih,
    tip: f.tip,
    kategori: f.kategori,
    tutar: f.tutar,
    durum: f.durum,
    aciklama: f.aciklama || '',
    giren: getName(f.giren_id),
    kampanya: campaigns.find((c) => c.id === f.kampanya_id)?.ad || '',
    firma: f.firma_adi || '',
  }))
}

export function metricsToCsv(dailyMetrics, users) {
  const getName = (id) => users.find((u) => u.id === id)?.name || ''
  return dailyMetrics.map((d) => ({
    tarih: d.tarih,
    kisi: getName(d.user_id),
    arama: d.arama_sayisi || 0,
    ulasilan: d.ulasilan || 0,
    demo_ayarlanan: d.demo_ayarlanan || 0,
    takip_aramasi: d.takip_aramasi || 0,
    notlar: d.notlar || '',
  }))
}
