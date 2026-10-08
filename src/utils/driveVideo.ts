/**
 * Links de video que se pueden reproducir dentro de metrics, sin mandar a
 * nadie a Drive.
 *
 * - Archivo directo (Cloudinary, .mp4, .mov, .webm): <video> nativo.
 * - Archivo de Drive: el reproductor embebido de Drive (/preview). Funciona
 *   sin sesión porque la carpeta del cliente es "cualquiera con el enlace".
 */

const DRIVE_ID = [
  /drive\.google\.com\/file\/d\/([\w-]{10,})/i,
  /drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]{10,})/i,
  /docs\.google\.com\/(?:.*\/)?d\/([\w-]{10,})/i,
]

export function driveFileId(url?: string | null): string | null {
  if (!url) return null
  for (const re of DRIVE_ID) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

export function drivePreviewUrl(url?: string | null): string | null {
  const id = driveFileId(url)
  return id ? `https://drive.google.com/file/d/${id}/preview` : null
}

export function esVideoDirecto(url?: string | null): boolean {
  if (!url) return false
  return /res\.cloudinary\.com\/.+\/video\//i.test(url) || /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url)
}
