import { ref, computed } from 'vue'
import { driveService } from '@/services/drive.service'

/**
 * Cola global de subidas de masters a Drive.
 *
 * Los masters pesan gigas: subirlos todos en paralelo no acelera nada (el
 * ancho de banda de subida es uno solo) y multiplica los fallos. La cola
 * corre MAXIMO 2 a la vez y el resto espera turno. Cada archivo viaja por
 * chunks de 8MB reanudables (driveService), asi que la memoria del navegador
 * se mantiene plana aunque el archivo pese 4GB, y un corte de red reintenta
 * el chunk, no el archivo entero.
 *
 * Es un singleton a nivel de modulo: las subidas siguen vivas mientras el
 * editor navega dentro de la app, y un beforeunload avisa si intenta cerrar
 * la pestana con subidas activas (eso SI las mataria).
 */

export type EstadoSubida = 'pendiente' | 'subiendo' | 'listo' | 'error'

export interface SubidaDrive {
  id: number
  itemId: string
  titulo: string
  fileName: string
  pct: number
  estado: EstadoSubida
  error?: string
  driveLink?: string
  driveMonthFolderLink?: string
}

const MAX_SIMULTANEAS = 2

const subidas = ref<SubidaDrive[]>([])
// Los File no van dentro del ref: son objetos enormes que no hay que
// volver reactivos. Viven aqui hasta que su subida termina.
const archivos = new Map<number, File>()
let siguienteId = 1
let activas = 0
let beforeUnloadArmado = false

const hayActivas = computed(() =>
  subidas.value.some((s) => s.estado === 'subiendo' || s.estado === 'pendiente'),
)

function avisarAntesDeCerrar(e: BeforeUnloadEvent) {
  if (!hayActivas.value) return
  e.preventDefault()
  // Chrome exige returnValue para mostrar el dialogo nativo.
  e.returnValue = ''
}

function armarBeforeUnload() {
  if (beforeUnloadArmado) return
  window.addEventListener('beforeunload', avisarAntesDeCerrar)
  beforeUnloadArmado = true
}

async function ejecutar(subida: SubidaDrive): Promise<void> {
  const file = archivos.get(subida.id)
  if (!file) {
    subida.estado = 'error'
    subida.error = 'Archivo perdido, vuelve a seleccionarlo.'
    return
  }
  subida.estado = 'subiendo'
  try {
    const session = await driveService.requestSession(subida.itemId, file)
    const fileId = await driveService.uploadFile(session.uploadUrl, file, (pct) => {
      subida.pct = pct
    })
    const result = await driveService.confirm(subida.itemId, fileId)
    subida.estado = 'listo'
    subida.pct = 100
    subida.driveLink = result.driveLink
    subida.driveMonthFolderLink = result.driveMonthFolderLink
    archivos.delete(subida.id)
  } catch (err: any) {
    subida.estado = 'error'
    subida.error = err?.data?.message || err?.message || 'Error al subir a Drive.'
  }
}

function procesar() {
  while (activas < MAX_SIMULTANEAS) {
    const siguiente = subidas.value.find((s) => s.estado === 'pendiente')
    if (!siguiente) break
    activas += 1
    ejecutar(siguiente).finally(() => {
      activas -= 1
      procesar()
    })
  }
}

export function useDriveUploads() {
  function encolar(item: { _id: string; numero?: number; tema?: string }, file: File, titulo?: string): number {
    armarBeforeUnload()
    // Re-encolar el mismo item reemplaza su subida anterior terminada.
    subidas.value = subidas.value.filter(
      (s) => !(s.itemId === item._id && (s.estado === 'listo' || s.estado === 'error')),
    )
    const id = siguienteId++
    archivos.set(id, file)
    subidas.value.push({
      id,
      itemId: item._id,
      titulo:
        titulo ||
        `${item.numero != null ? '#' + String(item.numero).padStart(2, '0') + ' ' : ''}${item.tema ?? file.name}`,
      fileName: file.name,
      pct: 0,
      estado: 'pendiente',
    })
    procesar()
    return id
  }

  function reintentar(id: number) {
    const s = subidas.value.find((x) => x.id === id)
    if (!s || s.estado !== 'error') return
    if (!archivos.has(id)) {
      s.error = 'Archivo perdido, vuelve a seleccionarlo.'
      return
    }
    s.estado = 'pendiente'
    s.pct = 0
    s.error = undefined
    procesar()
  }

  function limpiarTerminadas() {
    for (const s of subidas.value) {
      if (s.estado === 'listo' || s.estado === 'error') archivos.delete(s.id)
    }
    subidas.value = subidas.value.filter((s) => s.estado !== 'listo' && s.estado !== 'error')
  }

  function subidaDe(itemId: string): SubidaDrive | undefined {
    // La mas reciente del item manda (puede haberse re-subido).
    return [...subidas.value].reverse().find((s) => s.itemId === itemId)
  }

  return { subidas, hayActivas, encolar, reintentar, limpiarTerminadas, subidaDe }
}
