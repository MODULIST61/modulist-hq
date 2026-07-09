export function printHtml(title, bodyHtml) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; padding: 40px; color: #0a2540; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.6; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>${title}</h1>
<div class="sub">Modulist HQ · hq.modulist.net · ${new Date().toLocaleString('tr-TR')}</div>
${bodyHtml}
</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

export function printWeeklyReport(text) {
  printHtml('Haftalık Özet Raporu', `<pre>${text.replace(/</g, '&lt;')}</pre>`)
}

export function printPersonReport(text, personName) {
  printHtml(`${personName} — Personel Raporu`, `<pre>${text.replace(/</g, '&lt;')}</pre>`)
}
