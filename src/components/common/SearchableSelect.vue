<script setup lang="ts">
/**
 * Selector con búsqueda, pintado por nosotros.
 *
 * El `<select>` nativo lo dibuja el sistema operativo: en Windows sale con otra
 * tipografía, otro alto y otro color de resaltado, así que un formulario que se
 * ve bien en Mac se ve roto ahí. Esto lo reemplaza sin perder lo que el nativo
 * sí hacía bien: teclado, escape, foco y lectura por teclas.
 */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

export interface OpcionSelect {
  valor: string | number | undefined
  etiqueta: string
  /** Segunda línea opcional, para desambiguar opciones parecidas. */
  detalle?: string
  icono?: string
  /** Color de estado. Se pinta como punto, que se lee de un vistazo. */
  tono?: 'success' | 'warning' | 'danger' | 'info' | 'gray'
}

const props = withDefaults(
  defineProps<{
    opciones: OpcionSelect[]
    placeholder?: string
    /** A partir de cuántas opciones aparece el buscador. Debajo, estorba. */
    umbralBusqueda?: number
    disabled?: boolean
    textoVacio?: string
  }>(),
  {
    placeholder: 'Selecciona…',
    umbralBusqueda: 7,
    disabled: false,
    textoVacio: 'Sin resultados',
  },
)

const modelo = defineModel<string | number | undefined>({ required: true })

const abierto = ref(false)
const busqueda = ref('')
const resaltada = ref(0)
const raiz = ref<HTMLElement | null>(null)
const campoBusqueda = ref<HTMLInputElement | null>(null)
const listaEl = ref<HTMLElement | null>(null)

const seleccionada = computed(() => props.opciones.find((o) => o.valor === modelo.value))
const conBuscador = computed(() => props.opciones.length >= props.umbralBusqueda)

const filtradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return props.opciones
  return props.opciones.filter((o) =>
    `${o.etiqueta} ${o.detalle ?? ''}`.toLowerCase().includes(q),
  )
})

function abrir() {
  if (props.disabled) return
  abierto.value = true
  busqueda.value = ''
  // Arranca sobre lo ya elegido: bajar una vez debe llevar al siguiente, no al primero.
  resaltada.value = Math.max(0, filtradas.value.findIndex((o) => o.valor === modelo.value))
  nextTick(() => campoBusqueda.value?.focus())
}

function cerrar() {
  abierto.value = false
}

function elegir(opcion: OpcionSelect) {
  modelo.value = opcion.valor
  cerrar()
  // El foco vuelve al botón: quien navega por teclado no queda en el limbo.
  nextTick(() => (raiz.value?.querySelector('button') as HTMLElement | null)?.focus())
}

function mover(paso: number) {
  if (!abierto.value) return abrir()
  const total = filtradas.value.length
  if (!total) return
  resaltada.value = (resaltada.value + paso + total) % total
  nextTick(() => {
    listaEl.value?.querySelector('[data-resaltada="true"]')?.scrollIntoView({ block: 'nearest' })
  })
}

function confirmar() {
  if (!abierto.value) return abrir()
  const opcion = filtradas.value[resaltada.value]
  if (opcion) elegir(opcion)
}

function alTeclear(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); mover(1); break
    case 'ArrowUp':   e.preventDefault(); mover(-1); break
    case 'Enter':     e.preventDefault(); confirmar(); break
    case 'Escape':    if (abierto.value) { e.preventDefault(); cerrar() } break
    case 'Tab':       cerrar(); break
  }
}

function alClicFuera(e: MouseEvent) {
  if (raiz.value && !raiz.value.contains(e.target as Node)) cerrar()
}

watch(abierto, (estaAbierto) => {
  if (estaAbierto) document.addEventListener('mousedown', alClicFuera)
  else document.removeEventListener('mousedown', alClicFuera)
})

watch(filtradas, () => (resaltada.value = 0))

onBeforeUnmount(() => document.removeEventListener('mousedown', alClicFuera))
</script>

<template>
  <div ref="raiz" class="ss" :class="{ 'ss--abierto': abierto, 'ss--disabled': disabled }">
    <button
      type="button"
      class="ss__trigger"
      :disabled="disabled"
      :aria-expanded="abierto"
      aria-haspopup="listbox"
      @click="abierto ? cerrar() : abrir()"
      @keydown="alTeclear"
    >
      <span class="ss__valor" :class="{ 'ss__valor--vacio': !seleccionada }">
        <span v-if="seleccionada?.tono" class="ss__punto" :class="`ss__punto--${seleccionada.tono}`" />
        <i v-if="seleccionada?.icono" :class="seleccionada.icono" />
        {{ seleccionada?.etiqueta ?? placeholder }}
      </span>
      <i class="fa-solid fa-chevron-down ss__flecha" />
    </button>

    <Transition name="ss-pop">
      <div v-if="abierto" class="ss__panel">
        <div v-if="conBuscador" class="ss__buscador">
          <i class="fa-solid fa-magnifying-glass" />
          <input
            ref="campoBusqueda"
            v-model="busqueda"
            type="text"
            placeholder="Buscar…"
            @keydown="alTeclear"
          />
        </div>

        <ul ref="listaEl" class="ss__lista" role="listbox">
          <li v-if="!filtradas.length" class="ss__vacio">{{ textoVacio }}</li>
          <li
            v-for="(o, i) in filtradas"
            :key="String(o.valor)"
            role="option"
            :aria-selected="o.valor === modelo"
            :data-resaltada="i === resaltada"
            class="ss__opcion"
            :class="{
              'ss__opcion--resaltada': i === resaltada,
              'ss__opcion--activa': o.valor === modelo,
            }"
            @mouseenter="resaltada = i"
            @click="elegir(o)"
          >
            <span v-if="o.tono" class="ss__punto" :class="`ss__punto--${o.tono}`" />
            <i v-if="o.icono" :class="o.icono" class="ss__opcion-icono" />
            <span class="ss__opcion-texto">
              <strong>{{ o.etiqueta }}</strong>
              <small v-if="o.detalle">{{ o.detalle }}</small>
            </span>
            <i v-if="o.valor === modelo" class="fa-solid fa-check ss__tick" />
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.ss {
  position: relative;
  width: 100%;

  &--disabled { opacity: 0.6; }
}

.ss__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  color: $primary-dark;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus-visible { outline: none; border-color: $primary; }
  &:disabled { background: rgba($text-secondary, 0.06); cursor: not-allowed; }

  .ss--abierto & { border-color: $primary; }
}

.ss__valor {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--vacio { color: rgba($text-secondary, 0.75); }
}

.ss__flecha {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.2s;

  .ss--abierto & { transform: rotate(180deg); }
}

.ss__panel {
  position: absolute;
  z-index: 40;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.ss__buscador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba($primary-dark, 0.07);

  i { font-size: 0.75rem; color: $text-secondary; }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 0.85rem;
    color: $primary-dark;
    background: transparent;
  }
}

.ss__lista {
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.ss__opcion {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;

  &--resaltada { background: rgba($primary, 0.07); }
  &--activa strong { color: $primary; }
}

.ss__opcion-icono { font-size: 0.8rem; color: $text-secondary; }

.ss__opcion-texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;

  strong { font-size: 0.87rem; font-weight: 600; color: $primary-dark; }
  small  { font-size: 0.74rem; color: $text-secondary; }
}

.ss__tick { font-size: 0.72rem; color: $primary; }

.ss__punto {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba($text-secondary, 0.45);

  &--success { background: #16a34a; }
  &--warning { background: #f59e0b; }
  &--danger  { background: #ef4444; }
  &--info    { background: #3b82f6; }
}

.ss__vacio {
  padding: 0.9rem 0.6rem;
  text-align: center;
  font-size: 0.82rem;
  color: $text-secondary;
}

.ss-pop-enter-active,
.ss-pop-leave-active { transition: opacity 0.14s ease, transform 0.14s ease; }
.ss-pop-enter-from,
.ss-pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
