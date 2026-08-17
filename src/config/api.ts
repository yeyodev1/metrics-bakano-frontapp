/**
 * A qué backend le habla el frontend, según dónde se esté ejecutando.
 *
 * Antes era una sola variable de entorno. El problema práctico: el `.env` de
 * desarrollo apuntaba a staging, así que levantar el backend en local no
 * servía de nada — el navegador seguía yendo a staging — y para probar contra
 * local había que editar el `.env` y reiniciar Vite.
 *
 * Ahora decide el host desde el que se abrió la página.
 */

const LOCAL_API = 'http://localhost:8100/api'

/** Dominios conocidos, por si el despliegue se queda sin variable. */
const POR_DOMINIO: Record<string, string> = {
  'metrics.bakano.ec': 'https://ads-bakano-clients-backapp.vercel.app/api',
  // Dominio directo del proyecto en Vercel: mismo backend que produccion.
  // Sirve para verificar un deploy antes de mover el DNS del dominio real.
  'ads-bakano-clients-frontapp.vercel.app': 'https://ads-bakano-clients-backapp.vercel.app/api',
  'testing-storybrand-frontend.bakano.ec': 'https://testing-storybrand-backapp.bakano.ec/api',
}

/**
 * Túneles propios con dominio fijo (`dev-project-front.bakano.ec` y compañía).
 * El back siempre es el mismo host con `-front` cambiado por `-back`, así que
 * no hace falta ni variable de entorno ni tocar la tabla de arriba cuando se
 * levanta otro túnel con la misma convención.
 */
const TUNEL_PROPIO = /^(.*)-front\.bakano\.ec$/

function backDeTunelPropio(host: string): string | null {
  const m = TUNEL_PROPIO.exec(host)
  return m ? `https://${m[1]}-back.bakano.ec/api` : null
}

/** Sufijos de los túneles que usa el equipo para enseñar avances o probar en móvil. */
const TUNELES = [
  '.ngrok-free.app',
  '.ngrok.app',
  '.ngrok.io',
  '.trycloudflare.com',
  '.loca.lt',
  '.tunnelmole.net',
]

function normalizar(url: string): string {
  const limpia = url.trim().replace(/\/+$/, '')
  return /\/api(\/|$)/.test(limpia) ? limpia : `${limpia}/api`
}

function esLocal(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.local')
}

function esTunel(host: string): boolean {
  return TUNELES.some((sufijo) => host.endsWith(sufijo))
}

export interface ApiOrigen {
  baseUrl: string
  /** De dónde salió, para poder decirlo en consola sin adivinar. */
  entorno: 'local' | 'tunel' | 'desplegado'
  aviso?: string
}

export function resolveApiOrigin(host = window.location.hostname): ApiOrigen {
  const env = import.meta.env as Record<string, string | undefined>

  // En local manda local. Ignora VITE_API_BASE_URL a propósito: si no lo
  // hiciera, un `.env` que apunta a staging haría inútil levantar el backend.
  if (esLocal(host)) {
    return { baseUrl: LOCAL_API, entorno: 'local' }
  }

  // Antes que VITE_API_BASE_URL a propósito: el `.env` de desarrollo apunta a
  // staging, y si mandara la variable, abrir el túnel del front escribiría en
  // staging en vez de en el backend local que se está probando.
  const propio = backDeTunelPropio(host)
  if (propio) return { baseUrl: propio, entorno: 'tunel' }

  if (esTunel(host)) {
    const tunel = env['VITE_API_TUNNEL_URL']
    if (tunel) return { baseUrl: normalizar(tunel), entorno: 'tunel' }

    // Sin la URL del túnel del backend no hay forma de deducirla: la del front
    // y la del back son dos túneles distintos. Se cae a local en vez de a
    // producción, que sería escribir en la base real creyendo que se prueba.
    return {
      baseUrl: LOCAL_API,
      entorno: 'tunel',
      aviso:
        'Estás en un túnel pero falta VITE_API_TUNNEL_URL con el túnel del backend. ' +
        'Se usa localhost:8100, que no va a responder desde otro dispositivo.',
    }
  }

  // Dominio conocido manda sobre la variable. El deploy por CLI empaqueta el
  // directorio local, y el `.env` de desarrollo apunta a staging: con la
  // variable primero, producción entera quedó hablando con staging (pasó el
  // 17 de agosto de 2026 y los clientes no podían entrar).
  const porDominio = POR_DOMINIO[host]
  if (porDominio) return { baseUrl: porDominio, entorno: 'desplegado' }

  const explicita = env['VITE_API_BASE_URL']
  if (explicita) return { baseUrl: normalizar(explicita), entorno: 'desplegado' }

  return {
    baseUrl: LOCAL_API,
    entorno: 'desplegado',
    aviso: `Host desconocido (${host}) y sin VITE_API_BASE_URL. Se usa localhost:8100.`,
  }
}
