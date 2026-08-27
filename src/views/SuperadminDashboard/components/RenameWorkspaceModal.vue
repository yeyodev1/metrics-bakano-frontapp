<template>
  <Teleport to="body">
    <Transition name="rwm-fade">
      <div v-if="show" class="rwm__overlay" @click.self="cerrar">
        <div class="rwm">
          <header class="rwm__head">
            <i class="fa-solid fa-pen-to-square" aria-hidden="true" />
            <div>
              <h3>Renombrar entorno</h3>
              <p>El nombre se ve en todo el panel y en los avisos al cliente.</p>
            </div>
          </header>

          <div class="rwm__body">
            <label class="rwm__campo">
              <span>Nombre actual</span>
              <input :value="nombre" type="text" disabled />
            </label>

            <label class="rwm__campo">
              <span>Nombre nuevo</span>
              <input
                ref="inputRef"
                v-model="nuevo"
                type="text"
                maxlength="80"
                placeholder="Ej: El Don"
                @keyup.enter="confirmar"
              />
            </label>

            <p v-if="error" class="rwm__error">{{ error }}</p>
          </div>

          <footer class="rwm__foot">
            <button type="button" class="rwm__btn" :disabled="guardando" @click="cerrar">
              Cancelar
            </button>
            <button
              type="button"
              class="rwm__btn rwm__btn--primary"
              :disabled="!puedeGuardar || guardando"
              @click="confirmar"
            >
              {{ guardando ? 'Guardando…' : 'Guardar nombre' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{ show: boolean; nombre: string; guardando: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmar', nombre: string): void
}>()

const nuevo = ref('')
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// Abrir con el nombre actual ya escrito y seleccionado: casi siempre es un
// retoque (una tilde, una mayuscula), no un nombre desde cero.
watch(
  () => props.show,
  async (abierto) => {
    if (!abierto) return
    nuevo.value = props.nombre
    error.value = ''
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  },
  { immediate: true }
)

const puedeGuardar = computed(() => {
  const v = nuevo.value.trim()
  return v.length >= 2 && v !== props.nombre.trim()
})

function cerrar() {
  if (props.guardando) return
  emit('close')
}

function confirmar() {
  const v = nuevo.value.trim()
  if (v.length < 2) {
    error.value = 'El nombre necesita al menos 2 caracteres.'
    return
  }
  if (v === props.nombre.trim()) {
    error.value = 'Es el mismo nombre.'
    return
  }
  error.value = ''
  emit('confirmar', v)
}

/** El padre la llama cuando el servidor rechaza (ej: nombre repetido). */
defineExpose({ mostrarError: (msg: string) => { error.value = msg } })
</script>

<style lang="scss" scoped>
.rwm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($primary-dark, 0.6);
}

.rwm {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  background: $white;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba($primary-dark, 0.28);
}

.rwm__head {
  display: flex;
  gap: 0.8rem;
  padding: 1.1rem 1.2rem 0.8rem;
  border-bottom: 1px solid rgba($primary-dark, 0.07);

  i { color: $primary; font-size: 1.1rem; margin-top: 0.15rem; }

  h3 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.2rem 0 0; font-size: 0.78rem; color: $text-secondary; }
}

.rwm__body { display: flex; flex-direction: column; gap: 0.8rem; padding: 1rem 1.2rem; }

.rwm__campo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  span { font-size: 0.74rem; font-weight: 700; color: $text-secondary; }

  input {
    border: 1.5px solid rgba($primary-dark, 0.14);
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    font-family: inherit;
    font-size: 0.88rem;
    color: $primary-dark;
    background: $white;

    &:focus { outline: none; border-color: $primary; }
    &:disabled { background: rgba($primary-dark, 0.04); color: $text-secondary; }
  }
}

.rwm__error { margin: 0; font-size: 0.76rem; font-weight: 600; color: $alert-error; }

.rwm__foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.9rem 1.2rem 1.1rem;
  border-top: 1px solid rgba($primary-dark, 0.07);
}

.rwm__btn {
  border: 1.5px solid rgba($primary-dark, 0.14);
  background: $white;
  color: $primary-dark;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba($primary-dark, 0.04); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: $primary;
    border-color: $primary;
    color: $white;

    &:hover:not(:disabled) { filter: brightness(1.05); background: $primary; }
  }
}

.rwm-fade-enter-active,
.rwm-fade-leave-active { transition: opacity 0.15s ease; }
.rwm-fade-enter-from,
.rwm-fade-leave-to { opacity: 0; }
</style>
