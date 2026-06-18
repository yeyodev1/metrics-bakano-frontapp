import type { VideoItem } from '@/types/videoPlanning'

export function useScriptExport() {
  const printAllScripts = (items: VideoItem[], pageTitle: string) => {
    const scriptsWithContent = items.filter(i => i.guion?.trim())
    if (!scriptsWithContent.length) return

    const rows = scriptsWithContent.map((item, idx) => {
      const isLast = idx === scriptsWithContent.length - 1
      const refBlock = item.linkEjemplo
        ? `<div class="script-ref"><span class="script-ref-label">Referencia:</span> <a href="${item.linkEjemplo}" class="script-ref-link">${item.linkEjemplo}</a></div>`
        : ''
      return `
        <div class="script-page" style="${isLast ? '' : 'page-break-after: always;'}">
          <div class="script-header">
            <span class="script-num">#${item.numero}</span>
            <h2 class="script-title">${item.tema}</h2>
            ${item.tipo ? `<span class="script-tipo">${item.tipo}</span>` : ''}
          </div>
          ${item.descripcion ? `<p class="script-desc">${item.descripcion}</p>` : ''}
          ${refBlock}
          <hr class="script-divider" />
          <div class="script-body">${(item.guion ?? '').replace(/\\n/g, '<br>')}</div>
        </div>
      `
    }).join('')

    const html = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8"/>
    <title>Guiones — ${pageTitle}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; }
      .cover { display: flex; flex-direction: column; justify-content: flex-end; padding: 4rem 3rem; min-height: 100vh; page-break-after: always; border-bottom: 2px solid #e5e7eb; }
      .cover-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; margin-bottom: 0.75rem; }
      .cover-title { font-size: 2.5rem; font-weight: 700; line-height: 1.2; color: #111; margin-bottom: 0.5rem; }
      .cover-meta { font-size: 0.9rem; color: #6b7280; }
      .script-page { padding: 3rem; min-height: 100vh; display: flex; flex-direction: column; gap: 1.25rem; }
      .script-header { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
      .script-num { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
      .script-title { font-size: 1.5rem; font-weight: 700; color: #111; }
      .script-tipo { font-size: 0.75rem; font-weight: 600; color: #6366f1; background: #eef2ff; border-radius: 4px; padding: 0.15rem 0.5rem; }
      .script-desc { font-size: 0.9rem; color: #6b7280; font-style: italic; line-height: 1.6; }
      .script-ref { display: flex; align-items: flex-start; gap: 0.5rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 6px; padding: 0.6rem 0.9rem; }
      .script-ref-label { font-size: 0.75rem; font-weight: 700; color: #059669; white-space: nowrap; }
      .script-ref-link { font-size: 0.8rem; color: #0369a1; word-break: break-all; }
      .script-divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 0.25rem 0; }
      .script-body { font-size: 1rem; line-height: 1.85; color: #1a1a1a; white-space: pre-wrap; flex: 1; }
      @media print {
        @page { margin: 2cm 2.5cm; size: A4; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="cover">
      <p class="cover-label">Planificación de guiones</p>
      <h1 class="cover-title">${pageTitle}</h1>
      <p class="cover-meta">${scriptsWithContent.length} guion${scriptsWithContent.length !== 1 ? 'es' : ''} · ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    ${rows}
    <script>window.onload = function() { window.print(); }<\/script>
  </body>
  </html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const exportPdfScripts = (items: VideoItem[], pageTitle: string) => {
    const scriptsWithContent = items.filter(i => i.guion?.trim())
    if (!scriptsWithContent.length) return

    const rows = scriptsWithContent.map((item, idx) => {
      const isLast = idx === scriptsWithContent.length - 1
      const linkBlock = item.linkEjemplo
        ? `<div class="script-ref">
            <span class="script-ref-label">Referencia</span>
            <a href="${item.linkEjemplo}" class="script-ref-link">${item.linkEjemplo}</a>
          </div>`
        : ''
      const recursosBlock = item.recursos
        ? `<div class="script-meta-row"><span class="script-meta-key">Recursos:</span> <span class="script-meta-val">${item.recursos}</span></div>`
        : ''
      const lugarBlock = item.lugarGrabacion
        ? `<div class="script-meta-row"><span class="script-meta-key">Lugar de grabación:</span> <span class="script-meta-val">${item.lugarGrabacion}</span></div>`
        : ''
      const tipoGuionBlock = item.tipoGuion
        ? `<span class="script-tag script-tag--guion">${item.tipoGuion}</span>`
        : ''

      return `
        <div class="script-page" style="${isLast ? '' : 'page-break-after: always;'}">
          <div class="script-header">
            <div class="script-header-top">
              <span class="script-num">#${item.numero}</span>
              <div class="script-tags">
                ${item.tipo ? `<span class="script-tag">${item.tipo}</span>` : ''}
                ${tipoGuionBlock}
              </div>
            </div>
            <h2 class="script-title">${item.tema}</h2>
            ${item.descripcion ? `<p class="script-desc">${item.descripcion}</p>` : ''}
          </div>
          ${(recursosBlock || lugarBlock) ? `<div class="script-meta">${recursosBlock}${lugarBlock}</div>` : ''}
          ${linkBlock}
          <hr class="script-divider" />
          <div class="script-body">${(item.guion ?? '').replace(/\\n/g, '<br>')}</div>
        </div>
      `
    }).join('')

    const html = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8"/>
    <title>Guiones PDF — ${pageTitle}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; background: #fff; }
      .cover { display: flex; flex-direction: column; justify-content: flex-end; padding: 4rem 3.5rem; min-height: 100vh; page-break-after: always; border-bottom: 3px solid #0f1117; }
      .cover-brand { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9ca3af; margin-bottom: 2rem; }
      .cover-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 0.6rem; }
      .cover-title { font-size: 2.8rem; font-weight: 800; line-height: 1.15; color: #0f1117; margin-bottom: 0.6rem; letter-spacing: -0.03em; }
      .cover-meta { font-size: 0.9rem; color: #6b7280; margin-top: 1.5rem; }
      .cover-count { display: inline-block; background: #0f1117; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 20px; margin-right: 0.5rem; }
      .script-page { padding: 3rem 3.5rem; min-height: 100vh; display: flex; flex-direction: column; gap: 1.1rem; }
      .script-header { display: flex; flex-direction: column; gap: 0.5rem; }
      .script-header-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
      .script-num { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; }
      .script-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .script-tag { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6366f1; background: #eef2ff; border-radius: 4px; padding: 0.2rem 0.55rem; }
      .script-tag--guion { color: #0891b2; background: #e0f2fe; }
      .script-title { font-size: 1.6rem; font-weight: 800; color: #0f1117; line-height: 1.2; letter-spacing: -0.02em; }
      .script-desc { font-size: 0.875rem; color: #6b7280; font-style: italic; line-height: 1.65; }
      .script-meta { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 0.65rem 1rem; border-radius: 0 6px 6px 0; display: flex; flex-direction: column; gap: 0.3rem; }
      .script-meta-row { font-size: 0.8rem; color: #374151; }
      .script-meta-key { font-weight: 700; color: #64748b; }
      .script-meta-val { color: #374151; }
      .script-ref { display: flex; align-items: flex-start; gap: 0.75rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; padding: 0.75rem 1rem; }
      .script-ref-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #059669; white-space: nowrap; padding-top: 0.1rem; }
      .script-ref-link { font-size: 0.8rem; color: #0369a1; text-decoration: underline; word-break: break-all; line-height: 1.5; }
      .script-divider { border: none; border-top: 1.5px solid #e5e7eb; }
      .script-body { font-size: 0.975rem; line-height: 1.9; color: #1a1a1a; white-space: pre-wrap; flex: 1; }
      .page-footer { position: running(footer); font-size: 0.7rem; color: #9ca3af; text-align: right; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; }
      @media print {
        @page { margin: 1.8cm 2.2cm; size: A4; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .script-ref-link { color: #0369a1 !important; }
      }
    </style>
  </head>
  <body>
    <div class="cover">
      <p class="cover-brand">Bakano Ads</p>
      <p class="cover-label">Guiones de producción</p>
      <h1 class="cover-title">${pageTitle}</h1>
      <p class="cover-meta">
        <span class="cover-count">${scriptsWithContent.length} guion${scriptsWithContent.length !== 1 ? 'es' : ''}</span>
        Generado el ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
    ${rows}
  </body>
  </html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => { win.print() }, 400)
    }
  }

  return { printAllScripts, exportPdfScripts }
}
