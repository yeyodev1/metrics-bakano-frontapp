<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { incidenteService, type Incidente, type GravedadIncidente } from '@/services/incidente.service'

/**
 * Incidentes de clientes detectados por el bot en Telegram.
 *
 * Todo el equipo ve todo: lo suyo y lo de los demás. La idea es que nadie
 * dependa de haber leído un correo para enterarse de que un cliente la está
 * pasando mal, y que quede claro quién tomó cada caso.
 *
 * Al cargar y al cambiar de filtro se muestran esqueletos con la forma de las
 * tarjetas, no una pantalla en blanco: el salto de "vacío" a "lleno" se sentía
 * brusco y parecía que algo se había roto.
 */
const route = useRoute()

const incidentes = ref<Incidente[]>([])
const abiertos = ref(0)
const destacado = ref<Incidente | null>(null)
const cargando = ref(true)
const error = ref('')
const filtro = ref<'abierto' | 'tomado' | 'cerrado' | 'todos'>('abierto')
const soloMios = ref(false)
const trabajando = ref<string | null>(null)

const ETIQUETA: Record<GravedadIncidente, string> = {
  molesto: 'Molesto',
  angustiado: 'Angustiado',
  en_peligro: 'En peligro de irse',
}

const FILTROS = [
  { id: 'abierto', label: 'Sin atender' },
  { id: 'tomado', label: 'Tomados' },
  { id: 'cerrado', label: 'Cerrados' },
  { id: 'todos', label: 'Todos' },
] as const

const VACIO: Record<string, string> = {
  abierto: 'No hay incidentes sin atender 🙌',
  tomado: 'Nadie tiene un caso en curso ahora mismo.',
  cerrado: 'Todavía no se ha cerrado ningún caso.',
  todos: 'Aún no hay incidentes registrados.',
}

/** El destacado (el del link) va arriba y sin repetirse en la lista. */
const listados = computed(() => {
  const resto = incidentes.value.filter((i) => i._id !== destacado.value?._id)
  return destacado.value ? [destacado.value, ...resto] : resto
})

async function cargar(): Promise<void> {
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

/** Si se entró por el link del correo o del DM, ese incidente se ve sí o sí. */
async function abrirDelLink(): Promise<void> {
  const id = route.query.id as string | undefined
  if (!id) return
  try {
    destacado.value = await incidenteService.uno(id)
  } catch {
    // Si ya no existe, no se rompe la pantalla: se ve la lista normal.
    destacado.value = null
  }
}

function esDestacado(inc: Incidente): boolean {
  return destacado.value?._id === inc._id
}

async function tomar(inc: Incidente): Promise<void> {
  trabajando.value = inc._id
  try {
    const actualizado = await incidenteService.tomar(inc._id)
    aplicar(actualizado)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo tomar el caso.'
  } finally {
    trabajando.value = null
  }
}

async function cerrar(inc: Incidente): Promise<void> {
  const nota = window.prompt('Qué se hizo con este caso? (opcional)') ?? undefined
  trabajando.value = inc._id
  try {
    const actualizado = await incidenteService.cerrar(inc._id, nota)
    aplicar(actualizado)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cerrar el caso.'
  } finally {
    trabajando.value = null
  }
}

/**
 * Se actualiza la tarjeta en el sitio en vez de recargar la lista entera: así
 * no desaparece de golpe lo que la persona estaba mirando.
 */
function aplicar(actualizado: Incidente): void {
  const i = incidentes.value.findIndex((x) => x._id === actualizado._id)
  if (i >= 0) {
    if (filtro.value !== 'todos' && actualizado.estado !== filtro.value) incidentes.value.splice(i, 1)
    else incidentes.value[i] = actualizado
  }
  if (destacado.value?._id === actualizado._id) destacado.value = actualizado
  if (actualizado.estado !== 'abierto' && abiertos.value > 0) abiertos.value -= 1
}

function cuando(fecha: string): string {
  const d = new Date(fecha)
  const minutos = Math.round((Date.now() - d.getTime()) / 60000)
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  if (minutos < 1440) return `hace ${Math.round(minutos / 60)} h`
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await Promise.all([abrirDelLink(), cargar()])
})
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
      <button class="inc__btn" :disabled="cargando" @click="cargar">
        <i class="fa-solid" :class="cargando ? 'fa-spinner fa-spin' : 'fa-rotate'" />
        Actualizar
      </button>
    </header>

    <div class="inc__filtros">
      <button
        v-for="f in FILTROS"
        :key="f.id"
        class="inc__chip"
        :class="{ 'is-on': filtro === f.id }"
        :disabled="cargando"
        @click="filtro = f.id; cargar()"
      >
        {{ f.label }}
      </button>
      <label class="inc__mios">
        <input type="checkbox" v-model="soloMios" :disabled="cargando" @change="cargar()" />
        Solo los míos
      </label>
    </div>

    <p v-if="error" class="inc__error">{{ error }}</p>

    <!-- Esqueletos: misma forma que las tarjetas, para que no salte la página -->
    <template v-if="cargando">
      <div v-for="n in 3" :key="`sk-${n}`" class="inc__card inc__card--sk">
        <div class="sk sk--chip" />
        <div class="sk sk--titulo" />
        <div class="sk sk--frase" />
        <div class="sk sk--linea" />
        <div class="sk sk--linea sk--corta" />
      </div>
    </template>

    <p v-else-if="!listados.length" class="inc__vacio">{{ VACIO[filtro] }}</p>

    <article
      v-for="inc in listados"
      v-else
      :key="inc._id"
      class="inc__card"
      :class="[`is-${inc.gravedad}`, { 'is-destacado': esDestacado(inc) }]"
    >
      <p v-if="esDestacado(inc)" class="inc__pin">
        <i class="fa-solid fa-thumbtack" /> Este es el incidente del enlace que abriste
      </p>

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
        <span v-if="inc.responsableEmail" class="inc__correo">{{ inc.responsableEmail }}</span>
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
            <i v-if="trabajando === inc._id" class="fa-solid fa-spinner fa-spin" />
            Tomar el caso
          </button>
          <button
            v-if="inc.estado !== 'cerrado'"
            class="inc__btn"
            :disabled="trabajando === inc._id"
            @click="cerrar(inc)"
          >
            <i v-if="trabajando === inc._id" class="fa-solid fa-spinner fa-spin" />
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

  &__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  &__title { font-size: 1.5rem; font-weight: 700; margin: 0; }
  &__sub { color: #6b7280; margin: 0.25rem 0 0; font-size: 0.9rem; }

  &__filtros { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }

  &__chip {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.15s ease, color 0.15s ease;

    &.is-on { background: #111827; color: #fff; border-color: #111827; }
    &:disabled { opacity: 0.6; cursor: default; }
  }

  &__mios { font-size: 0.85rem; color: #374151; display: flex; gap: 0.35rem; align-items: center; }
  &__error { color: #b91c1c; font-size: 0.9rem; }
  &__vacio { color: #6b7280; padding: 2.5rem 0; text-align: center; }

  &__card {
    border: 1px solid #e5e7eb;
    border-left: 4px solid #9ca3af;
    border-radius: 12px;
    padding: 1rem 1.15rem;
    margin-bottom: 0.85rem;
    background: #fff;
    animation: aparecer 0.18s ease;

    &.is-angustiado, &.is-en_peligro { border-left-color: #dc2626; }
    &.is-molesto { border-left-color: #f59e0b; }
    &.is-destacado { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
    &--sk { animation: none; }
  }

  &__pin { margin: 0 0 0.6rem; font-size: 0.78rem; color: #1d4ed8; }
  &__card-top { display: flex; justify-content: space-between; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

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
  &__correo { color: #6b7280; margin-left: 0.35rem; }
  &__reco { margin: 0.4rem 0; font-size: 0.87rem; color: #1d4ed8; }
  &__pie { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-top: 0.8rem; flex-wrap: wrap; }
  &__estado { font-size: 0.82rem; color: #6b7280; }
  &__acciones { display: flex; gap: 0.5rem; margin-left: auto; }

  &__btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &--primario { background: #111827; color: #fff; border-color: #111827; }
    &:disabled { opacity: 0.6; cursor: default; }
  }
}

/* Esqueletos: gris que respira, sin texto falso que confunda. */
.sk {
  background: linear-gradient(90deg, #f3f4f6 25%, #e9eaed 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: brillo 1.3s ease infinite;
  border-radius: 6px;

  &--chip { width: 110px; height: 18px; margin-bottom: 0.7rem; }
  &--titulo { width: 45%; height: 20px; margin-bottom: 0.7rem; }
  &--frase { width: 100%; height: 44px; margin-bottom: 0.6rem; }
  &--linea { width: 70%; height: 12px; margin-bottom: 0.4rem; }
  &--corta { width: 40%; }
}

@keyframes brillo {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@keyframes aparecer {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
</style>
