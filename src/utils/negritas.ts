/**
 * Negritas en los guiones con la convención de WhatsApp: `**texto**`.
 *
 * El guion se escribe y se guarda como texto plano (el textarea no puede
 * pintar negritas), y las vistas de lectura lo pasan por aquí para mostrar
 * `<strong>` de verdad. Siempre se escapa el HTML primero: el texto viene de
 * un campo editable y va a parar a `v-html` y a ventanas de impresión.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function conNegritas(texto: string): string {
  return escaparHtml(texto).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
}
