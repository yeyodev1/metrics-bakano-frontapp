<script setup lang="ts">
/**
 * El recorrido del cliente, de la bienvenida a la salida a ventas.
 *
 * Ocho etapas se deducen solas de los datos (las reuniones agendadas, los
 * guiones cargados, la producción grabada). Las cuatro que no dejan rastro
 * —los avatares, las escenas, la aprobación de los videos y la salida a
 * ventas— se marcan aquí, y es lo único editable: si una etapa se mueve sola,
 * dejar que alguien la fuerce a mano solo sirve para que el estado mienta.
 */
import { ref, onMounted, computed } from 'vue'
import { recorridoService, type EtapaCliente, type EstadoEtapa } from '@/services/recorrido.service'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ workspaceId: string }>()

const toast = useToast()
const etapas = ref<EtapaCliente[]>([])
const cargando = ref(true)
const guardando = ref<string | null>(null)

const listas = computed(() => etapas.value.filter((e) => e.estado === 'listo' || e.estado === 'no_aplica').length)

const ESTADOS: { valor: EstadoEtapa; texto: string }[] = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'en_curso', texto: 'En curso' },
  { valor: 'listo', texto: 'Listo' },
  { valor: 'no_aplica', texto: 'No aplica' },
]

const TEXTO_ESTADO: Record<EstadoEtapa, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  listo: 'Listo',
  no_aplica: 'No aplica',
}

async function cargar(): Promise<void> {
  cargando.value = true
  try {
    const r = await recorridoService.ver(props.workspaceId)
    etapas.value = r.etapas
  } catch {
    toast.error('No se pudo cargar el recorrido.')
  } finally {
    cargando.value = false
  }
}

async function marcar(etapa: EtapaCliente, estado: EstadoEtapa): Promise<void> {
  if (etapa.estado === estado) return
  guardando.value = etapa.etapa
  try {
    const r = await recorridoService.marcar(props.workspaceId, etapa.etapa, { estado })
    etapas.value = r.etapas
    toast.success(`${etapa.etiqueta}: ${TEXTO_ESTADO[estado].toLowerCase()}.`)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'No se pudo marcar la etapa.')
  } finally {
    guardando.value = null
  }
}

function fecha(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric', month: 'short' })
}

onMounted(cargar)
</script>

<template>
  <section class="rec">
    <header class="rec__head">
      <div>
        <h3 class="rec__title">Recorrido del cliente</h3>
        <p class="rec__sub">
          <template v-if="cargando">Cargando…</template>
          <template v-else>{{ listas }} de {{ etapas.length }} pasos listos · el cliente ve esto igual en el bot</template>
        </p>
      </div>
      <button class="rec__refrescar" :disabled="cargando" title="Volver a cargar" @click="cargar">
        <i class="fa-solid fa-rotate" :class="{ 'rec__girando': cargando }" />
      </button>
    </header>

    <ol v-if="cargando" class="rec__lista">
      <li v-for="n in 6" :key="n" class="rec__etapa rec__etapa--esqueleto">
        <span class="rec__hueso rec__hueso--punto" />
        <span class="rec__hueso rec__hueso--linea" />
      </li>
    </ol>

    <ol v-else class="rec__lista">
      <li
        v-for="etapa in etapas"
        :key="etapa.etapa"
        class="rec__etapa"
        :class="[`rec__etapa--${etapa.estado}`, { 'rec__etapa--manual': etapa.seMarca === 'manual' }]"
      >
        <span class="rec__punto">
          <i v-if="etapa.estado === 'listo'" class="fa-solid fa-check" />
          <i v-else-if="etapa.estado === 'en_curso'" class="fa-solid fa-circle-half-stroke" />
          <i v-else-if="etapa.estado === 'no_aplica'" class="fa-solid fa-minus" />
          <span v-else class="rec__punto-vacio" />
        </span>

        <div class="rec__cuerpo">
          <div class="rec__fila">
            <b class="rec__etiqueta">{{ etapa.orden }}. {{ etapa.etiqueta }}</b>
            <span class="rec__chip" :class="`rec__chip--${etapa.estado}`">{{ TEXTO_ESTADO[etapa.estado] }}</span>
            <span v-if="etapa.deQuien === 'cliente'" class="rec__quien">Cliente</span>
          </div>

          <p class="rec__que">{{ etapa.que }}</p>

          <p class="rec__meta">
            <span v-if="etapa.responsable"><i class="fa-solid fa-user" /> {{ etapa.responsable }}</span>
            <span v-if="etapa.detalle"><i class="fa-solid fa-circle-info" /> {{ etapa.detalle }}</span>
            <span v-if="etapa.porNombre">
              <i class="fa-solid fa-pen" /> {{ etapa.porNombre }}<template v-if="etapa.en"> · {{ fecha(etapa.en) }}</template>
            </span>
          </p>

          <div v-if="etapa.seMarca === 'manual'" class="rec__acciones">
            <button
              v-for="opcion in ESTADOS"
              :key="opcion.valor"
              class="rec__btn"
              :class="{ 'rec__btn--activo': etapa.estado === opcion.valor }"
              :disabled="guardando === etapa.etapa"
              @click="marcar(etapa, opcion.valor)"
            >
              {{ opcion.texto }}
            </button>
          </div>
          <p v-else class="rec__auto"><i class="fa-solid fa-wand-magic-sparkles" /> Se mueve sola con los datos</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style lang="scss" scoped>
.rec {
  margin-top: 1.5rem;
  border-top: 1px solid var(--color-border, #e7e1ec);
  padding-top: 1.25rem;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }

  &__sub {
    margin: 0.15rem 0 0;
    font-size: 0.82rem;
    color: #6b6478;
  }

  &__refrescar {
    border: 1px solid #e7e1ec;
    background: #fff;
    color: #6b6478;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer;

    &:disabled { opacity: 0.5; cursor: default; }
  }

  &__girando { animation: rec-girar 0.9s linear infinite; }

  &__lista {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.25rem;
  }

  &__etapa {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 0.75rem;
    padding: 0.7rem 0;
    border-bottom: 1px dashed #efeaf3;
    position: relative;

    &:last-child { border-bottom: none; }

    &--esqueleto { align-items: center; }
  }

  &__hueso {
    background: linear-gradient(90deg, #f1edf5 25%, #e7e1ec 50%, #f1edf5 75%);
    background-size: 200% 100%;
    animation: rec-brillo 1.2s ease-in-out infinite;
    border-radius: 6px;

    &--punto { width: 22px; height: 22px; border-radius: 50%; }
    &--linea { height: 14px; }
  }

  &__punto {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 0.7rem;
    background: #f1edf5;
    color: #8a8194;
  }

  &__etapa--listo &__punto { background: rgba(47, 125, 93, 0.14); color: #2f7d5d; }
  &__etapa--en_curso &__punto { background: rgba(180, 103, 26, 0.14); color: #b4671a; }

  &__punto-vacio {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid #c8c0d2;
  }

  &__fila {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__etiqueta { font-size: 0.92rem; }

  &__chip {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: #f1edf5;
    color: #6b6478;

    &--listo { background: rgba(47, 125, 93, 0.14); color: #2f7d5d; }
    &--en_curso { background: rgba(180, 103, 26, 0.14); color: #b4671a; }
  }

  &__quien {
    font-size: 0.68rem;
    font-weight: 600;
    color: #85529c;
    border: 1px solid rgba(133, 82, 156, 0.3);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
  }

  &__que {
    margin: 0.2rem 0 0;
    font-size: 0.83rem;
    color: #6b6478;
    line-height: 1.5;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin: 0.35rem 0 0;
    font-size: 0.75rem;
    color: #8a8194;

    i { margin-right: 0.3rem; }
  }

  &__acciones {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  &__btn {
    border: 1px solid #e0d9e7;
    background: #fff;
    color: #5b5266;
    border-radius: 8px;
    padding: 0.28rem 0.65rem;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) { border-color: #85529c; color: #85529c; }
    &:disabled { opacity: 0.55; cursor: default; }

    &--activo {
      background: #85529c;
      border-color: #85529c;
      color: #fff;
    }
  }

  &__auto {
    margin: 0.4rem 0 0;
    font-size: 0.73rem;
    color: #a79eb2;

    i { margin-right: 0.3rem; }
  }
}

@keyframes rec-brillo {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes rec-girar {
  to { transform: rotate(360deg); }
}
</style>
