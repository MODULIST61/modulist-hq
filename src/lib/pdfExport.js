import html2pdf from 'html2pdf.js'

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markdownToHtml(md) {
  const lines = md.split('\n')
  const parts = []
  let inList = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (inList) {
        parts.push('</ul>')
        inList = false
      }
      parts.push('<br/>')
      continue
    }
    if (trimmed.startsWith('### ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h3 style="margin:16px 0 8px;font-size:14px;color:#0a2540">${escapeHtml(trimmed.slice(4))}</h3>`)
    } else if (trimmed.startsWith('## ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h2 style="margin:20px 0 10px;font-size:16px;color:#0a2540;border-bottom:1px solid #e2e8f0;padding-bottom:6px">${escapeHtml(trimmed.slice(3))}</h2>`)
    } else if (trimmed.startsWith('# ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h1 style="margin:0 0 12px;font-size:20px;color:#0a2540">${escapeHtml(trimmed.slice(2))}</h1>`)
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        parts.push('<ul style="margin:8px 0;padding-left:20px">')
        inList = true
      }
      parts.push(`<li style="margin:4px 0;font-size:12px;line-height:1.6">${escapeHtml(trimmed.slice(2))}</li>`)
    } else {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<p style="margin:6px 0;font-size:12px;line-height:1.6;color:#334155">${escapeHtml(trimmed)}</p>`)
    }
  }
  if (inList) parts.push('</ul>')
  return parts.join('')
}

export function downloadTextPdf({ title, subtitle, body, filename }) {
  const html = `
    <div style="font-family:Inter,Segoe UI,sans-serif;padding:24px;color:#0a2540;max-width:800px">
      <div style="border-bottom:3px solid #635bff;padding-bottom:12px;margin-bottom:20px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Modulist HQ</div>
        <h1 style="margin:4px 0 0;font-size:22px">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="margin:6px 0 0;font-size:11px;color:#64748b">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <pre style="white-space:pre-wrap;font-family:Inter,Segoe UI,sans-serif;font-size:11px;line-height:1.7;color:#334155;margin:0">${escapeHtml(body)}</pre>
      <p style="margin-top:24px;font-size:9px;color:#94a3b8">hq.modulist.xyz · ${new Date().toLocaleString('tr-TR')}</p>
    </div>
  `
  return renderPdf(html, filename)
}

export function downloadMarkdownPdf({ title, subtitle, markdown, filename }) {
  const html = `
    <div style="font-family:Inter,Segoe UI,sans-serif;padding:24px;color:#0a2540;max-width:800px">
      <div style="border-bottom:3px solid #635bff;padding-bottom:12px;margin-bottom:20px">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Modulist HQ · Müdür Raporu</div>
        <h1 style="margin:4px 0 0;font-size:22px">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="margin:6px 0 0;font-size:11px;color:#64748b">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <div>${markdownToHtml(markdown)}</div>
      <p style="margin-top:24px;font-size:9px;color:#94a3b8">Yapay zeka destekli iç rapor · hq.modulist.xyz · ${new Date().toLocaleString('tr-TR')}</p>
    </div>
  `
  return renderPdf(html, filename)
}

function renderPdf(html, filename) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-9999px'
  wrapper.style.top = '0'
  wrapper.style.width = '800px'
  document.body.appendChild(wrapper)

  return html2pdf()
    .set({
      margin: [12, 12, 12, 12],
      filename: filename || 'rapor.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(wrapper)
    .save()
    .finally(() => {
      document.body.removeChild(wrapper)
    })
}
