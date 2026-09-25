<script setup lang="ts">
/**
 * El recorrido del cliente, paso a paso, para marcarlo aquí mismo.
 *
 * Es la herramienta de Genesis: abre un cliente y ve los 15 pasos del proceso
 * con su estado real. Los que dejan rastro en los datos (las reuniones
 * agendadas, los guiones, la producción grabada) vienen resueltos solos; los
 * demás se marcan con un toque.
 *
 * Cualquiera se puede corregir a mano. El equipo ve cosas que los datos no
 * cuentan, así que su marca manda — pero si lo marcado no coincide con lo que
 * el sistema deduce, se dice, para que nadie trabaje sobre un estado que
 * miente.
 */
import { ref, onMounted, computed } from 'vue'
import { recorridoService, type EtapaCliente, type EstadoEtapa } from '@/services/recorrido.service'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ workspaceId: string }>()
const emit = defineEmits<{ (e: 'avanzo'): void }>()

const toast = useToast()
const etapas = ref<EtapaCliente[]>([])
const cargando = ref(true)
const guardando = ref<string | null>(null)

const listas = computed(() => etapas.value.filter((e) => e.estado === 'listo' || e.estado === 'no_aplica').length)
const porcentaje = computed(() => (etapas.value.length ? Math.round((listas.value / etapas.value.length) * 100) : 0))
const actual = computed(() => etapas.value.find((e) => e.estado === 'en_curso') || etapas.value.find((e) => e.estado === 'pendiente'))

const ESTADOS: { valor: EstadoEtapa; texto: string; emoji: string }[] = [
  { valor: 'pendiente', texto: 'Pendiente', emoji: '⬜' },
  { valor: 'en_curso', texto: 'En curso', emoji: '🔄' },
  { valor: 'listo', texto: 'Listo', emoji: '✅' },
  { valor: 'no_aplica', texto: 'No aplica', emoji: '➖' },
]

const EMOJI: Record<EstadoEtapa, string> = { pendiente: '⬜', en_curso: '🔄', listo: '✅', no_aplica: '➖' }
const TEXTO: Record<EstadoEtapa, string> = { pendiente: 'Pendiente', en_curso: 'En curso', listo: 'Listo', no_aplica: 'No aplica' }

async function cargar(): Promise<void> {
  cargando.value = true
  try {
    etapas.value = (await recorridoService.ver(props.workspaceId)).etapas
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
    etapas.value = (await recorridoService.marcar(props.workspaceId, etapa.etapa, { estado })).etapas
    toast.success(`${etapa.etiqueta}: ${TEXTO[estado].toLowerCase()}.`)
    emit('avanzo')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'No se pudo marcar la etapa.')
  } finally {
    guardando.value = null
  }
}

/** Un toque: lo que no está listo pasa a listo, y al revés. */
function alternar(etapa: EtapaCliente): void {
  marcar(etapa, etapa.estado === 'listo' ? 'pendiente' : 'listo')
}

function fecha(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric', month: 'short' })
}

/** Marcado a mano distinto de lo que ven los datos: hay que decirlo. */
function discrepa(e: EtapaCliente): boolean {
  return Boolean(e.segunElSistema && e.segunElSistema !== e.estado)
}

defineExpose({ cargar })
onMounted(cargar)
</script>

<template>
  <section class="rec">
    <header class="rec__head">
      <div class="rec__titulo-caja">
        <h3 class="rec__title">🚀 Recorrido del cliente</h3>
        <p class="rec__sub">
          <template v-if="cargando">Cargando…</template>
          <template v-else>
            {{ listas }} de {{ etapas.length }} pasos · lo mismo que ve el cliente en el bot
          </template>
        </p>
      </div>
      <button class="rec__refrescar" :disabled="cargando" title="Volver a cargar" @click="cargar">
        <i class="fa-solid fa-rotate" :class="{ 'rec__girando': cargando }" />
      </button>
    </header>

    <div v-if="!cargando" class="rec__avance">
      <div class="rec__barra"><span :style="{ width: `${porcentaje}%` }" /></div>
      <span class="rec__pct">{{ porcentaje }}%</span>
    </div>

    <p v-if="!cargando && actual" class="rec__ahora">
      👉 <b>Ahora:</b> {{ actual.etiqueta }}<template v-if="actual.responsable"> · {{ actual.responsable }}</template>
    </p>

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
        :class="[`rec__etapa--${etapa.estado}`, { 'rec__etapa--guardando': guardando === etapa.etapa }]"
      >
        <button
          class="rec__marca"
          :disabled="guardando === etapa.etapa"
          :title="etapa.estado === 'listo' ? 'Desmarcar' : 'Marcar como listo'"
          @click="alternar(etapa)"
        >
          {{ EMOJI[etapa.estado] }}
        </button>

        <div class="rec__cuerpo">
          <div class="rec__fila">
            <b class="rec__etiqueta">{{ etapa.orden }}. {{ etapa.etiqueta }}</b>
            <span v-if="etapa.deQuien === 'cliente'" class="rec__quien">Cliente</span>
            <span v-if="etapa.responsable" class="rec__resp">{{ etapa.responsable }}</span>
          </div>

          <p class="rec__que">{{ etapa.que }}</p>

          <p class="rec__meta">
            <span v-if="etapa.detalle"><i class="fa-solid fa-circle-info" /> {{ etapa.detalle }}</span>
            <span v-if="etapa.porNombre">
              <i class="fa-solid fa-pen" /> {{ etapa.porNombre }}<template v-if="etapa.en"> · {{ fecha(etapa.en) }}</template>
            </span>
          </p>

          <p v-if="discrepa(etapa)" class="rec__discrepa">
            ⚠️ Marcado a mano como <b>{{ TEXTO[etapa.estado].toLowerCase() }}</b>, pero los datos dicen
            <b>{{ TEXTO[etapa.segunElSistema!].toLowerCase() }}</b>.
          </p>

          <div class="rec__acciones">
            <button
              v-for="opcion in ESTADOS"
              :key="opcion.valor"
              class="rec__btn"
              :class="{ 'rec__btn--activo': etapa.estado === opcion.valor }"
              :disabled="guardando === etapa.etapa"
              @click="marcar(etapa, opcion.valor)"
            >
              {{ opcion.emoji }} {{ opcion.texto }}
            </button>
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>

<style lang="scss" scoped>
.rec {
  margin-top: 1.5rem;
  border-top: 1px solid rgba(107, 114, 128, 0.16);
  padding-top: 1.25rem;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__title { margin: 0; font-size: 1rem; font-weight: 700; }

  &__sub { margin: 0.15rem 0 0; font-size: 0.82rem; color: $text-secondary; }

  &__refrescar {
    border: 1px solid rgba(107, 114, 128, 0.2);
    background: $white;
    color: $text-secondary;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    flex-shrink: 0;

    &:disabled { opacity: 0.5; cursor: default; }
  }

  &__girando { animation: rec-girar 0.9s linear infinite; }

  &__avance {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.9rem;
  }

  &__barra {
    flex: 1;
    height: 8px;
    background: rgba(133, 82, 156, 0.14);
    border-radius: 999px;
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, $primary, $secondary);
      transition: width 0.4s ease;
    }
  }

  &__pct {
    font-size: 0.8rem;
    font-weight: 800;
    color: $secondary;
    font-variant-numeric: tabular-nums;
    min-width: 38px;
    text-align: right;
  }

  &__ahora {
    margin: 0.75rem 0 0;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    background: rgba(230, 40, 92, 0.07);
    border: 1px solid rgba(230, 40, 92, 0.2);
    font-size: 0.88rem;
    color: #8c2040;
  }

  &__lista {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
  }

  &__etapa {
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 0.8rem;
    padding: 0.8rem;
    border: 1px solid rgba(107, 114, 128, 0.14);
    border-radius: 12px;
    background: $white;
    transition: border-color 0.2s, opacity 0.2s;

    &--listo { border-color: rgba(47, 125, 93, 0.35); background: rgba(47, 125, 93, 0.04); }
    &--en_curso { border-color: rgba(180, 103, 26, 0.35); }
    &--no_aplica { opacity: 0.6; }
    &--guardando { opacity: 0.6; }
    &--esqueleto { align-items: center; }
  }

  &__hueso {
    background: linear-gradient(90deg, rgba(133, 82, 156, 0.08) 25%, rgba(133, 82, 156, 0.16) 50%, rgba(133, 82, 156, 0.08) 75%);
    background-size: 200% 100%;
    animation: rec-brillo 1.2s ease-in-out infinite;
    border-radius: 6px;

    &--punto { width: 28px; height: 28px; border-radius: 50%; }
    &--linea { height: 14px; }
  }

  /* Un toque en el emoji marca listo o lo deshace. */
  &__marca {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(107, 114, 128, 0.18);
    background: $white;
    font-size: 1.1rem;
    cursor: pointer;
    display: grid;
    place-items: center;

    &:hover:not(:disabled) { border-color: $secondary; }
    &:disabled { cursor: default; opacity: 0.6; }
  }

  &__fila {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__etiqueta { font-size: 0.93rem; }

  &__quien {
    font-size: 0.66rem;
    font-weight: 700;
    color: $primary;
    border: 1px solid rgba(230, 40, 92, 0.3);
    border-radius: 999px;
    padding: 0.08rem 0.5rem;
  }

  &__resp {
    font-size: 0.72rem;
    color: $text-secondary;
  }

  &__que {
    margin: 0.2rem 0 0;
    font-size: 0.82rem;
    color: $text-secondary;
    line-height: 1.5;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin: 0.3rem 0 0;
    font-size: 0.74rem;
    color: #8a8194;

    i { margin-right: 0.25rem; }
  }

  &__discrepa {
    margin: 0.4rem 0 0;
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
    background: rgba(180, 103, 26, 0.1);
    color: #8a5014;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  &__acciones {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  &__btn {
    border: 1px solid rgba(107, 114, 128, 0.18);
    background: $white;
    color: $text-secondary;
    border-radius: 8px;
    padding: 0.25rem 0.6rem;
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) { border-color: $secondary; color: $secondary; }
    &:disabled { opacity: 0.5; cursor: default; }

    &--activo {
      background: $secondary;
      border-color: $secondary;
      color: $white;
    }
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
