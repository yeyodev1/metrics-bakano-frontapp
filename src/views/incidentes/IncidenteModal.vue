<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { PersonaEquipo } from '@/services/incidente.service'

/**
 * Modal propio para cerrar o asignar un caso.
 *
 * Antes esto usaba window.prompt y window.confirm: además de verse como una
 * página de 2003, esas ventanas bloquean el hilo, no se pueden estilar y en
 * algunos navegadores el usuario puede desactivarlas sin darse cuenta.
 */
const props = defineProps<{
  modo: 'cerrar' | 'asignar'
  cliente: string
  equipo: PersonaEquipo[]
  trabajando?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'confirmar', datos: { nota?: string; userId?: string }): void
}>()

const nota = ref('')
const elegido = ref('')
const buscar = ref('')

const filtrados = computed(() => {
  const q = buscar.value.trim().toLowerCase()
  if (!q) return props.equipo
  return props.equipo.filter(
    (p) => (p.name || '').toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
  )
})

const puedeConfirmar = computed(() => (props.modo === 'asignar' ? Boolean(elegido.value) : true))

function confirmar(): void {
  if (!puedeConfirmar.value || props.trabajando) return
  emit('confirmar', { nota: nota.value.trim() || undefined, userId: elegido.value || undefined })
}

function alTeclado(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('cerrar')
}

watch(() => props.modo, () => { nota.value = ''; elegido.value = ''; buscar.value = '' })
onMounted(() => document.addEventListener('keydown', alTeclado))
onBeforeUnmount(() => document.removeEventListener('keydown', alTeclado))
</script>

<template>
  <div class="im" role="dialog" aria-modal="true" @click.self="emit('cerrar')">
    <div class="im__caja">
      <header class="im__head">
        <h2 class="im__title">
          <i :class="modo === 'cerrar' ? 'fa-solid fa-circle-check' : 'fa-solid fa-user-plus'" />
          {{ modo === 'cerrar' ? 'Cerrar el caso' : 'Asignar el caso' }}
        </h2>
        <button class="im__x" type="button" aria-label="Cerrar" @click="emit('cerrar')">
          <i class="fa-solid fa-xmark" />
        </button>
      </header>

      <p class="im__cliente">{{ cliente }}</p>

      <template v-if="modo === 'asignar'">
        <label class="im__label" for="im-buscar">A quién se lo asignas</label>
        <div class="im__buscador">
          <i class="fa-solid fa-magnifying-glass" />
          <input id="im-buscar" v-model="buscar" type="text" placeholder="Buscar por nombre o correo" />
        </div>
        <div class="im__lista">
          <button
            v-for="p in filtrados"
            :key="p._id"
            type="button"
            class="im__persona"
            :class="{ 'is-on': elegido === p._id }"
            @click="elegido = p._id"
          >
            <span class="im__persona-nombre">{{ p.name || p.email }}</span>
            <span class="im__persona-rol">{{ (p.internalRole || '').replace(/_/g, ' ') }}</span>
            <i v-if="elegido === p._id" class="fa-solid fa-check" />
          </button>
          <p v-if="!filtrados.length" class="im__sin">Nadie coincide con esa búsqueda.</p>
        </div>
      </template>

      <label class="im__label" for="im-nota">
        {{ modo === 'cerrar' ? 'Qué se hizo con este caso' : 'Nota para esa persona' }}
        <span class="im__opcional">opcional</span>
      </label>
      <textarea id="im-nota" v-model="nota" class="im__nota" rows="3" :placeholder="modo === 'cerrar' ? 'Llamé a la clienta y quedó resuelto…' : 'Por favor llámala hoy…'" />

      <footer class="im__pie">
        <button class="im__btn" type="button" @click="emit('cerrar')">Cancelar</button>
        <button
          class="im__btn im__btn--primario"
          type="button"
          :disabled="!puedeConfirmar || trabajando"
          @click="confirmar"
        >
          <i v-if="trabajando" class="fa-solid fa-spinner fa-spin" />
          {{ modo === 'cerrar' ? 'Cerrar el caso' : 'Asignar' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.im {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;

  &__caja {
    background: #fff;
    border-radius: 14px;
    width: min(520px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    padding: 1.25rem;
    box-shadow: 0 20px 45px rgba(17, 24, 39, 0.25);
  }

  &__head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  &__title { margin: 0; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; i { color: #2563eb; } }
  &__x { border: 0; background: transparent; font-size: 1rem; color: #6b7280; cursor: pointer; padding: 0.25rem; }
  &__cliente { margin: 0.35rem 0 1rem; color: #6b7280; font-size: 0.9rem; }

  &__label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.4rem;
  }

  &__opcional { font-weight: 400; color: #9ca3af; margin-left: 0.35rem; }

  &__buscador {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.45rem 0.7rem;
    margin-bottom: 0.5rem;
    color: #9ca3af;

    input { border: 0; outline: 0; flex: 1; font-size: 0.9rem; color: #111827; }
  }

  &__lista { max-height: 210px; overflow-y: auto; margin-bottom: 1rem; }

  &__persona {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 8px;
    padding: 0.5rem 0.6rem;
    cursor: pointer;
    text-align: left;

    &:hover { background: #f9fafb; }
    &.is-on { background: #eff6ff; border-color: #bfdbfe; }
    i { margin-left: auto; color: #2563eb; }
  }

  &__persona-nombre { font-size: 0.9rem; color: #111827; }
  &__persona-rol { font-size: 0.75rem; color: #9ca3af; }
  &__sin { color: #9ca3af; font-size: 0.85rem; padding: 0.5rem; }

  &__nota {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.6rem 0.7rem;
    font: inherit;
    font-size: 0.9rem;
    resize: vertical;
  }

  &__pie { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }

  &__btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.88rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &--primario { background: #111827; color: #fff; border-color: #111827; }
    &:disabled { opacity: 0.55; cursor: default; }
  }
}
</style>
