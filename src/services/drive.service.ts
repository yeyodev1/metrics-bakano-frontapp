import APIBase from './httpBase'
import type { VideoItem } from '@/types/videoPlanning'

/**
 * Subida de archivos maestros a Google Drive.
 *
 * El archivo NO pasa por nuestro backend (Vercel corta el body en ~4.5MB):
 * el backend solo crea la sesion resumable y el navegador sube directo a
 * googleapis.com por chunks, con progreso real y reintento por chunk.
 */

export interface DriveSession {
  uploadUrl: string
  replace: boolean
  fileId: string | null
  driveName: string
}

export interface DriveConfirmResult {
  driveFileId: string
  driveLink: string
  driveMonthFolderLink?: string
  item: VideoItem
}

// 8MB: multiplo de 256KB (requisito de Drive) y buen balance progreso/overhead.
const CHUNK_SIZE = 8 * 1024 * 1024
const CHUNK_RETRIES = 3

function putChunk(
  uploadUrl: string,
  chunk: Blob,
  start: number,
  total: number,
  onProgress: (bytesEnviados: number) => void,
): Promise<{ done: boolean; fileId?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Range', `bytes ${start}-${start + chunk.size - 1}/${total}`)
    xhr.upload.onprogress = (e) => onProgress(start + e.loaded)
    xhr.onload = () => {
      // 308 = chunk aceptado, sigue el siguiente; 200/201 = archivo completo.
      if (xhr.status === 308) return resolve({ done: false })
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const body = JSON.parse(xhr.responseText)
          return resolve({ done: true, fileId: body.id })
        } catch {
          return resolve({ done: true })
        }
      }
      reject(new Error(`Drive respondió ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Error de red subiendo a Drive'))
    xhr.send(chunk)
  })
}

class DriveService extends APIBase {
  async requestSession(itemId: string, file: File): Promise<DriveSession> {
    const res = await this.post<DriveSession>('drive/upload-session', {
      itemId,
      fileName: file.name,
      mimeType: file.type || 'video/mp4',
      size: file.size,
    })
    return res.data
  }

  /** Sube el archivo por chunks a la sesion resumable. Devuelve el fileId. */
  async uploadFile(
    uploadUrl: string,
    file: File,
    onProgress: (pct: number) => void,
  ): Promise<string> {
    let offset = 0
    let fileId: string | undefined

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE)
      let intento = 0
      // Reintento por chunk: una caida transitoria no obliga a empezar de cero.
      for (;;) {
        try {
          const result = await putChunk(uploadUrl, chunk, offset, file.size, (bytes) =>
            onProgress(Math.min(99, Math.round((bytes / file.size) * 100))),
          )
          if (result.done) {
            fileId = result.fileId
            offset = file.size
          } else {
            offset += chunk.size
          }
          break
        } catch (err) {
          intento += 1
          if (intento >= CHUNK_RETRIES) throw err
          await new Promise((r) => setTimeout(r, 1500 * intento))
        }
      }
    }

    if (!fileId) throw new Error('Drive no devolvió el ID del archivo')
    onProgress(100)
    return fileId
  }

  async confirm(itemId: string, fileId: string): Promise<DriveConfirmResult> {
    const res = await this.post<DriveConfirmResult>('drive/confirm', { itemId, fileId })
    return res.data
  }
}

export const driveService = new DriveService()
