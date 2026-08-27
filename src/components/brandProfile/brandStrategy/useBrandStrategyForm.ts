import { ref, computed, watch, type Ref } from 'vue'
import type { BrandProfile, SegmentoMercado, CustomerJourneyCase } from '@/types'

export interface BrandStrategyPayload {
  propuestaValor: string
  segmentosMercado: SegmentoMercado[]
  canalesDetail: string[]
  actividadesClave: string[]
  customerJourneyCases: CustomerJourneyCase[]
}

function nuevoCaso(numero: number): CustomerJourneyCase {
  return {
    casoNumero: numero,
    nombreCaso: '',
    potencialCliente: '',
    efectoAnuncio: '',
    accionEsperada: '',
  }
}

/**
 * Estado del documento de estrategia. Una sola pantalla: todo se llena junto y
 * nada se guarda hasta que se confirma, así que aquí solo vive el borrador.
 */
export function useBrandStrategyForm(profile: Ref<BrandProfile>, show: Ref<boolean>) {
  const propuestaValor = ref('')
  const segmentos = ref<SegmentoMercado[]>([])
  const canales = ref<string[]>([])
  const actividades = ref<string[]>([])
  const casos = ref<CustomerJourneyCase[]>([])

  function reset() {
    const p = profile.value
    propuestaValor.value = p.propuestaValor || ''
    // Filas vacías, no respuestas pre-escritas: lo que quede aquí se guarda como
    // si lo hubiera escrito el equipo y luego la IA lo toma como verdad.
    segmentos.value = p.segmentosMercado?.length
      ? JSON.parse(JSON.stringify(p.segmentosMercado))
      : [{ nombre: '', descripcion: '' }]
    canales.value = p.canalesDetail?.length ? [...p.canalesDetail] : ['', '']
    actividades.value = p.actividadesClave?.length ? [...p.actividadesClave] : ['', '']
    casos.value = p.customerJourneyCases?.length
      ? JSON.parse(JSON.stringify(p.customerJourneyCases))
      : [nuevoCaso(1), nuevoCaso(2), nuevoCaso(3)]
  }

  watch(show, (val) => { if (val) reset() }, { immediate: true })

  // Lo que realmente se envía: sin filas vacías que se cuelen.
  const segmentosLimpios = computed(() =>
    segmentos.value.filter((s) => s.nombre.trim() || s.descripcion.trim())
  )
  const canalesLimpios = computed(() => canales.value.filter((c) => c.trim()))
  const actividadesLimpias = computed(() => actividades.value.filter((a) => a.trim()))
  const casosLimpios = computed(() =>
    casos.value.filter(
      (c) => c.potencialCliente.trim() || c.efectoAnuncio.trim() || c.accionEsperada.trim()
    )
  )

  /** Mínimo para que el perfil sirva de algo a la IA. */
  const puedeGuardar = computed(() => propuestaValor.value.trim().length > 0)

  function addSegmento() { segmentos.value.push({ nombre: '', descripcion: '' }) }
  function removeSegmento(idx: number) { segmentos.value.splice(idx, 1) }
  function addCanal() { canales.value.push('') }
  function removeCanal(idx: number) { canales.value.splice(idx, 1) }
  function addActividad() { actividades.value.push('') }
  function removeActividad(idx: number) { actividades.value.splice(idx, 1) }

  function addCaso() { casos.value.push(nuevoCaso(casos.value.length + 1)) }
  function removeCaso(idx: number) {
    casos.value.splice(idx, 1)
    casos.value.forEach((c, i) => { c.casoNumero = i + 1 })
  }

  function payload(): BrandStrategyPayload {
    return {
      propuestaValor: propuestaValor.value.trim(),
      segmentosMercado: segmentosLimpios.value,
      canalesDetail: canalesLimpios.value,
      actividadesClave: actividadesLimpias.value,
      customerJourneyCases: casosLimpios.value,
    }
  }

  return {
    propuestaValor, segmentos, canales, actividades, casos,
    segmentosLimpios, canalesLimpios, actividadesLimpias, casosLimpios,
    puedeGuardar,
    addSegmento, removeSegmento,
    addCanal, removeCanal,
    addActividad, removeActividad,
    addCaso, removeCaso,
    payload,
  }
}
