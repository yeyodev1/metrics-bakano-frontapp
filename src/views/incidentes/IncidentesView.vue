<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { incidenteService, type Incidente, type GravedadIncidente } from '@/services/incidente.service'

/**
 * Incidentes de clientes detectados por el bot en Telegram.
 *
 * Todo el equipo ve todo: lo suyo y lo de los demás. La idea es que nadie
 * dependa de haber leído un correo para enterarse de que un cliente la está
 * pasando mal, y que quede claro quién tomó cada caso.
 */
const incidentes = ref<Incidente[]>([])
const abiertos = ref(0)
const cargando = ref(true)
const error = ref('')
const filtro = ref<'abierto' | 'todos' | 'tomado' | 'cerrado'>('abierto')
const soloMios = ref(false)
const trabajando = ref<string | null>(null)

const ETIQUETA: Record<GravedadIncidente, string> = {
  molesto: 'Molesto',
  angustiado: 'Angustiado',
  en_peligro: 'En peligro de irse',
}

const listados = computed(() => incidentes.value)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const datos = await incidenteService.listar({ estado: filtro.value, mios: soloMios.value })
    incidentes.value = datos.incidentes
    abiertos.value = datos.abiertos
  } catch (e: any) {
    error.value = e?.message || 'No se pudieron cargar los incidentes.'
  } finally {
    cargando.value = false
  }
}

async function tomar(inc: Incidente) {
  trabajando.value = inc._id
  try {
    await incidenteService.tomar(inc._id)
    await cargar()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo tomar el caso.'
  } finally {
    trabajando.value = null
  }
}

async function cerrar(inc: Incidente) {
  const nota = window.prompt('Qué se hizo con este caso? (opcional)') ?? undefined
  trabajando.value = inc._id
  try {
    await incidenteService.cerrar(inc._id, nota)
    await cargar()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cerrar el caso.'
  } finally {
    trabajando.value = null
  }
}

function cuando(fecha: string): string {
  const d = new Date(fecha)
  const minutos = Math.round((Date.now() - d.getTime()) / 60000)
  if (minutos < 60) return `hace ${minutos} min`
  if (minutos < 1440) return `hace ${Math.round(minutos / 60)} h`
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(cargar)
</script>

<template>
  <div class="inc">
    <header class="inc__head">
      <div>
        <h1 class="inc__title">Incidentes de clientes</h1>
        <p class="inc__sub">
          Lo que el bot detecta en Telegram cuando un cliente la está pasando mal.
          <strong v-if="abiertos">{{ abiertos }} sin atender.</strong>
        </p>
      </div>
      <button class="inc__refresh" :disabled="cargando" @click="cargar">
        <i class="fa-solid fa-rotate" /> Actualizar
      </button>
    </header>

    <div class="inc__filtros">
      <button
        v-for="f in (['abierto', 'tomado', 'cerrado', 'todos'] as const)"
        :key="f"
        class="inc__chip"
        :class="{ 'is-on': filtro === f }"
        @click="filtro = f; cargar()"
      >
        {{ f === 'abierto' ? 'Sin atender' : f === 'tomado' ? 'Tomados' : f === 'cerrado' ? 'Cerrados' : 'Todos' }}
      </button>
      <label class="inc__mios">
        <input type="checkbox" v-model="soloMios" @change="cargar()" />
        Solo los míos
      </label>
    </div>

    <p v-if="error" class="inc__error">{{ error }}</p>
    <p v-if="cargando" class="inc__vacio">Cargando…</p>
    <p v-else-if="!listados.length" class="inc__vacio">
      No hay incidentes {{ filtro === 'abierto' ? 'sin atender' : 'con ese filtro' }} 🙌
    </p>

    <article v-for="inc in listados" :key="inc._id" class="inc__card" :class="`is-${inc.gravedad}`">
      <div class="inc__card-top">
        <div>
          <span class="inc__grav" :class="`is-${inc.gravedad}`">{{ ETIQUETA[inc.gravedad] }}</span>
          <span class="inc__origen"><i class="fa-brands fa-telegram" /> desde Telegram</span>
          <span v-if="inc.fueraDeHorario" class="inc__origen">🌙 fuera de horario</span>
        </div>
        <span class="inc__cuando">{{ cuando(inc.createdAt) }}</span>
      </div>

      <h2 class="inc__cliente">
        {{ inc.workspaceName }}
        <small v-if="inc.cliente?.nombre">· {{ inc.cliente.nombre }}</small>
      </h2>

      <blockquote class="inc__frase">“{{ inc.frase }}”</blockquote>
      <p v-if="inc.motivo" class="inc__dato"><strong>Motivo:</strong> {{ inc.motivo }}</p>
      <p v-if="inc.recomendacion" class="inc__reco">
        <i class="fa-solid fa-bolt" /> <strong>Recomendación:</strong> {{ inc.recomendacion }}
      </p>
      <p class="inc__dato">
        <strong>Le toca a:</strong> {{ inc.responsableNombre || '—' }}
        <span v-if="inc.responsableEmail">({{ inc.responsableEmail }})</span>
      </p>

      <div class="inc__pie">
        <span v-if="inc.estado === 'tomado'" class="inc__estado">
          ✋ Lo tomó {{ inc.tomadoPor?.nombre }}
        </span>
        <span v-else-if="inc.estado === 'cerrado'" class="inc__estado">
          ✅ Cerrado por {{ inc.cerradoPor?.nombre }}<span v-if="inc.nota"> · {{ inc.nota }}</span>
        </span>
        <div class="inc__acciones">
          <button
            v-if="inc.estado === 'abierto'"
            class="inc__btn inc__btn--primario"
            :disabled="trabajando === inc._id"
            @click="tomar(inc)"
          >
            Tomar el caso
          </button>
          <button
            v-if="inc.estado !== 'cerrado'"
            class="inc__btn"
            :disabled="trabajando === inc._id"
            @click="cerrar(inc)"
          >
            Cerrar
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
.inc {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__title { font-size: 1.5rem; font-weight: 700; margin: 0; }
  &__sub { color: #6b7280; margin: 0.25rem 0 0; font-size: 0.9rem; }

  &__refresh {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;
  }

  &__filtros {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  &__chip {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;

    &.is-on { background: #111827; color: #fff; border-color: #111827; }
  }

  &__mios { font-size: 0.85rem; color: #374151; display: flex; gap: 0.35rem; align-items: center; }
  &__error { color: #b91c1c; font-size: 0.9rem; }
  &__vacio { color: #6b7280; padding: 2rem 0; text-align: center; }

  &__card {
    border: 1px solid #e5e7eb;
    border-left: 4px solid #9ca3af;
    border-radius: 12px;
    padding: 1rem 1.15rem;
    margin-bottom: 0.85rem;
    background: #fff;

    &.is-angustiado, &.is-en_peligro { border-left-color: #dc2626; }
    &.is-molesto { border-left-color: #f59e0b; }
  }

  &__card-top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  &__grav {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    margin-right: 0.5rem;

    &.is-molesto { background: #fef3c7; color: #92400e; }
    &.is-angustiado, &.is-en_peligro { background: #fee2e2; color: #991b1b; }
  }

  &__origen { font-size: 0.75rem; color: #6b7280; margin-right: 0.5rem; }
  &__cuando { font-size: 0.75rem; color: #9ca3af; }
  &__cliente { font-size: 1.05rem; margin: 0.6rem 0 0.4rem; small { color: #6b7280; font-weight: 400; } }

  &__frase {
    margin: 0 0 0.6rem;
    padding: 0.6rem 0.8rem;
    background: #f9fafb;
    border-radius: 8px;
    font-style: italic;
    color: #111827;
  }

  &__dato { margin: 0.2rem 0; font-size: 0.87rem; color: #374151; }
  &__reco { margin: 0.4rem 0; font-size: 0.87rem; color: #1d4ed8; }

  &__pie {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.8rem;
    flex-wrap: wrap;
  }

  &__estado { font-size: 0.82rem; color: #6b7280; }
  &__acciones { display: flex; gap: 0.5rem; margin-left: auto; }

  &__btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;

    &--primario { background: #111827; color: #fff; border-color: #111827; }
    &:disabled { opacity: 0.5; cursor: default; }
  }
}
</style>
