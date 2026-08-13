<template>
  <Teleport to="body">
    <Transition name="dwm-fade">
      <div v-if="show" class="dwm__overlay" @click.self="emit('close')">
        <div class="dwm">
          <header class="dwm__head">
            <i class="fa-solid fa-circle-pause" aria-hidden="true" />
            <div>
              <h3>Desactivar “{{ nombre }}”</h3>
              <p>Los usuarios de este entorno dejarán de poder entrar.</p>
            </div>
          </header>

          <div class="dwm__body">
            <p class="dwm__label">¿Por qué se desactiva?</p>

            <label v-for="m in MOTIVOS" :key="m.id" class="dwm__opcion" :class="{ 'is-on': motivo === m.id }">
              <input v-model="motivo" type="radio" :value="m.id" name="motivo" />
              <span class="dwm__opcion-texto">
                <strong>{{ m.label }}</strong>
                <small>{{ m.pista }}</small>
              </span>
            </label>

            <label class="dwm__nota">
              <span>Detalle (opcional)</span>
              <textarea
                v-model="nota"
                rows="2"
                placeholder="Ej: pendiente la factura de julio; se reactiva al pagar."
              />
            </label>
          </div>

          <footer class="dwm__foot">
            <button type="button" class="dwm__btn" :disabled="guardando" @click="emit('close')">
              Cancelar
            </button>
            <button
              type="button"
              class="dwm__btn dwm__btn--peligro"
              :disabled="!motivo || guardando"
              @click="confirmar"
            >
              {{ guardando ? 'Desactivando…' : 'Desactivar entorno' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

defineProps<{ show: boolean; nombre: string; guardando: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmar', datos: { motivo: string; nota?: string }): void
}>()

/**
 * Motivos cerrados, no texto libre: así se puede contar cuántos entornos
 * están caídos por falta de pago, que es la pregunta que de verdad se hace.
 * La nota queda para el matiz.
 */
const MOTIVOS = [
  { id: 'falta_de_pago', label: 'Falta de pago', pista: 'Se reactiva cuando el cliente se ponga al día.' },
  { id: 'fin_de_contrato', label: 'Fin de contrato', pista: 'La relación terminó.' },
  { id: 'pausa_acordada', label: 'Pausa acordada', pista: 'El cliente pidió parar por un tiempo.' },
  { id: 'otro', label: 'Otro', pista: 'Explícalo en el detalle.' },
]

const motivo = ref('')
const nota = ref('')

watch(
  () => motivo.value,
  () => {},
)

function confirmar() {
  if (!motivo.value) return
  emit('confirmar', { motivo: motivo.value, nota: nota.value.trim() || undefined })
}

defineExpose({
  limpiar: () => {
    motivo.value = ''
    nota.value = ''
  },
})
</script>

<style lang="scss" scoped>
.dwm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($primary-dark, 0.6);
}

.dwm {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 30rem;
  max-height: 92dvh;
  overflow: hidden;
  background: $white;
  border-radius: 16px;
}

.dwm__head {
  display: flex;
  gap: 0.85rem;
  padding: 1.1rem 1.25rem;
  background: rgba(#d97706, 0.07);
  border-bottom: 1px solid rgba($primary-dark, 0.08);

  > i { margin-top: 0.15rem; font-size: 1.3rem; color: #d97706; }
  h3 { margin: 0 0 0.15rem; font-size: 1rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.8rem; color: $text-secondary; }
}

.dwm__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.1rem 1.25rem;
  overflow-y: auto;
}

.dwm__label {
  margin: 0 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: $primary-dark;
}

.dwm__opcion {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover { border-color: rgba($primary, 0.35); }
  &.is-on { background: rgba($primary, 0.04); border-color: $primary; }

  input { margin-top: 0.2rem; accent-color: $primary; }
}

.dwm__opcion-texto {
  display: flex;
  flex-direction: column;

  strong { font-size: 0.85rem; color: $primary-dark; }
  small { font-size: 0.73rem; color: $text-secondary; }
}

.dwm__nota {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.35rem;

  span { font-size: 0.75rem; font-weight: 700; color: $text-secondary; }

  textarea {
    padding: 0.6rem 0.75rem;
    font-family: inherit;
    font-size: 0.85rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    outline: none;
    resize: vertical;

    &:focus { border-color: $primary; }
  }
}

.dwm__foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid rgba($primary-dark, 0.08);
}

.dwm__btn {
  padding: 0.6rem 1.1rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  border: none;
  border-radius: 9px;
  cursor: pointer;

  &:hover:not(:disabled) { color: $primary-dark; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--peligro {
    color: $white;
    background: #d97706;

    &:hover:not(:disabled) { color: $white; filter: brightness(1.06); }
  }
}

.dwm-fade-enter-active,
.dwm-fade-leave-active { transition: opacity 0.2s; }
.dwm-fade-enter-from,
.dwm-fade-leave-to { opacity: 0; }
</style>
