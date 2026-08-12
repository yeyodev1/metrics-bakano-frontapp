import type { RouteLocationNormalized } from 'vue-router'

const SITIO = 'https://metrics.bakano.ec'

/**
 * Metadatos por ruta.
 *
 * En una SPA el `index.html` es el mismo para todas las URLs: sin esto, la
 * pantalla de login se indexaría con la descripción de la portada, y las de
 * recuperación de contraseña se indexarían a secas. Aquí se corrige en cada
 * navegación.
 */
export interface RouteSeo {
  description?: string
  /** Fuera de los índices. Todo lo privado y todo lo que lleve un token. */
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

export function applySeo(to: RouteLocationNormalized) {
  const title = to.meta?.title as string | undefined
  document.title = title || 'metrics.bakano.ec — Plataforma de clientes de Bakano'

  const seo = (to.meta?.seo as RouteSeo | undefined) ?? {}
  // Lo privado es todo lo que exige sesión, más lo que marque la ruta.
  const privado = seo.noindex || to.matched.some((r) => r.meta?.requiresAuth)

  setMeta(
    'name',
    'robots',
    privado ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
  )

  if (seo.description) {
    setMeta('name', 'description', seo.description)
    setMeta('property', 'og:description', seo.description)
  }

  // El canónico de una pantalla privada no debe apuntar a sí misma: si algún
  // enlace con token se llegara a compartir, la referencia queda en la portada.
  setCanonical(privado ? `${SITIO}/` : `${SITIO}${to.path === '/' ? '/' : to.path}`)
  setMeta('property', 'og:url', privado ? `${SITIO}/` : `${SITIO}${to.path}`)
  setMeta('property', 'og:title', document.title)
}
