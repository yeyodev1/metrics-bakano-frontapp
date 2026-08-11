<template>
  <Teleport to="body">
    <Transition name="jcm-fade">
      <div v-if="show" class="jcm__overlay" @click.self="$emit('close')">
        <div class="jcm" role="dialog" aria-modal="true" aria-labelledby="jcm-title">
          <header class="jcm__header">
            <div>
              <h3 id="jcm-title">{{ isEditing ? `Editar Caso ${form.casoNumero}` : 'Nuevo caso de Customer Journey' }}</h3>
              <p>Un caso es un tipo de cliente. Responde tres preguntas sobre él.</p>
            </div>
            <button type="button" class="jcm__close" aria-label="Cerrar" @click="$emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div class="jcm__body">
            <label class="jcm__field">
              <span class="jcm__q"><i class="fa-solid fa-user" /> ¿Quién es?</span>
              <span class="jcm__hint">A quién le hablamos. Cargo, edad, situación.</span>
              <textarea
                ref="firstField"
                v-model="form.potencialCliente"
                rows="2"
                placeholder="Ej: Jefe de compras de una empresa grande que necesita señalética para varias sucursales."
              />
            </label>

            <label class="jcm__field">
              <span class="jcm__q"><i class="fa-solid fa-face-flushed" /> ¿Cómo se siente hoy?</span>
              <span class="jcm__hint">Su dolor o frustración antes de conocernos. De aquí sale el gancho del guión.</span>
              <textarea
                v-model="form.efectoAnuncio"
                rows="2"
                placeholder="Ej: Inseguro porque sus proveedores nunca cumplen los tiempos de entrega."
              />
            </label>

            <label class="jcm__field">
              <span class="jcm__q"><i class="fa-solid fa-bullseye" /> ¿Qué obtiene con nosotros?</span>
              <span class="jcm__hint">El resultado que se lleva. De aquí sale el cierre del guión.</span>
              <textarea
                v-model="form.accionEsperada"
                rows="2"
                placeholder="Ej: Certeza y garantía de cumplimiento, con planta propia y 19 años de experiencia."
              />
            </label>

            <label class="jcm__field">
              <span class="jcm__q jcm__q--optional">
                <i class="fa-solid fa-tag" /> Nombre corto <em>(opcional)</em>
              </span>
              <input v-model="form.nombreCaso" type="text" :placeholder="suggestedName" />
            </label>

            <p v-if="error" class="jcm__error">
              <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
            </p>
          </div>

          <footer class="jcm__footer">
            <button
              v-if="isEditing"
              type="button"
              class="jcm__btn jcm__btn--danger"
              :disabled="saving"
              @click="$emit('delete', form.casoNumero)"
            >
              <i class="fa-solid fa-trash" /> Eliminar
            </button>
            <span class="jcm__spacer" />
            <button type="button" class="jcm__btn" :disabled="saving" @click="$emit('close')">
              Cancelar
            </button>
            <button type="button" class="jcm__btn jcm__btn--primary" :disabled="saving || !isValid" @click="submit">
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
              {{ saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Agregar caso' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { CustomerJourneyCase } from '@/types'

const props = defineProps<{
  show: boolean
  /** Present when editing; absent when adding. */
  caso?: CustomerJourneyCase | null
  /** Used to number a new case. */
  nextNumber: number
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', caso: CustomerJourneyCase): void
  (e: 'delete', casoNumero: number): void
}>()

const firstField = ref<HTMLTextAreaElement | null>(null)
const error = ref('')

function emptyForm(): CustomerJourneyCase {
  return {
    casoNumero: props.nextNumber,
    nombreCaso: '',
    potencialCliente: '',
    efectoAnuncio: '',
    accionEsperada: '',
  }
}

const form = ref<CustomerJourneyCase>(emptyForm())

const isEditing = computed(() => !!props.caso)

const suggestedName = computed(() => {
  const who = form.value.potencialCliente.trim()
  return who ? who.split(/[,.]/)[0].slice(0, 40) : `Caso ${form.value.casoNumero}`
})

// The three answers are what the script generator actually reads.
const isValid = computed(
  () =>
    !!form.value.potencialCliente.trim() &&
    !!form.value.efectoAnuncio.trim() &&
    !!form.value.accionEsperada.trim()
)

watch(
  () => props.show,
  async (open) => {
    if (!open) return
    error.value = ''
    form.value = props.caso ? { ...props.caso } : emptyForm()
    await nextTick()
    firstField.value?.focus()
  },
  { immediate: true }
)

function submit() {
  if (!isValid.value) {
    error.value = 'Completa las tres preguntas: quién es, cómo se siente y qué obtiene.'
    return
  }
  emit('save', {
    ...form.value,
    nombreCaso: form.value.nombreCaso?.trim() || suggestedName.value,
    potencialCliente: form.value.potencialCliente.trim(),
    efectoAnuncio: form.value.efectoAnuncio.trim(),
    accionEsperada: form.value.accionEsperada.trim(),
  })
}
</script>

<style lang="scss" scoped>
.jcm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  background: rgba($primary-dark, 0.55);
}

.jcm {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow: hidden;
  background: $white;
  border-radius: 16px 16px 0 0;
}

.jcm__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid rgba($text-secondary, 0.15);

  h3 {
    margin: 0 0 0.2rem;
    font-size: 1.05rem;
    color: $primary-dark;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: $text-secondary;
  }
}

.jcm__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: $text-secondary;
  background: rgba($text-secondary, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover { background: rgba($text-secondary, 0.2); }
}

.jcm__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.25rem;
  overflow-y: auto;
}

.jcm__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  textarea,
  input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    font-family: inherit;
    font-size: 0.88rem;
    color: $primary-dark;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 9px;
    resize: vertical;
    transition: border-color 0.15s;

    &:focus { outline: none; border-color: $secondary; }
    &::placeholder { color: rgba($primary-dark, 0.35); }
  }
}

.jcm__q {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: $primary-dark;

  i { font-size: 0.8rem; color: $secondary; }

  &--optional {
    font-weight: 600;
    color: $text-secondary;

    em { font-style: normal; font-weight: 400; }
  }
}

.jcm__hint {
  font-size: 0.76rem;
  line-height: 1.4;
  color: $text-secondary;
}

.jcm__error {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  color: $alert-error;
  background: $alert-error-bg;
  border-radius: 8px;
}

.jcm__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid rgba($text-secondary, 0.15);
}

.jcm__spacer { flex: 1; }

.jcm__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-secondary;
  background: $white;
  border: 1.5px solid rgba($text-secondary, 0.25);
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) { color: $primary-dark; border-color: rgba($primary-dark, 0.35); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }

  &--primary {
    color: $white;
    background: $primary;
    border-color: $primary;

    &:hover:not(:disabled) { color: $white; filter: brightness(1.08); }
  }

  &--danger {
    color: $alert-error;
    border-color: rgba($alert-error, 0.35);

    &:hover:not(:disabled) { color: $alert-error; background: $alert-error-bg; }
  }
}

.jcm-fade-enter-active,
.jcm-fade-leave-active { transition: opacity 0.2s; }
.jcm-fade-enter-from,
.jcm-fade-leave-to { opacity: 0; }

@media (min-width: 600px) {
  .jcm__overlay {
    align-items: center;
    padding: 1.5rem;
  }

  .jcm { border-radius: 16px; }
}
</style>
