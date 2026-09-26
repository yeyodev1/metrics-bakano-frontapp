<script setup lang="ts">
import { computed, ref } from 'vue'
import CrmTokenGuide from './CrmTokenGuide.vue'
import type { CrmCredenciales } from '@/services/integraciones.service'

/**
 * Formulario de credenciales del CRM. Sirve para conectar por primera vez y
 * para cambiar el token; el padre hace la llamada y le devuelve `saving`/`error`.
 */
const props = defineProps<{
  initialLocationId?: string
  saving: boolean
  error: string
  submitLabel: string
  cancelable?: boolean
}>()

const emit = defineEmits<{
  submit: [credenciales: CrmCredenciales]
  cancel: []
}>()

const locationId = ref(props.initialLocationId || '')
const token = ref('')
const showToken = ref(false)

const canSubmit = computed(() => locationId.value.trim().length > 0 && token.value.trim().length > 0 && !props.saving)

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', { locationId: locationId.value.trim(), token: token.value.trim() })
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="onSubmit">
    <CrmTokenGuide />

    <div class="form__field">
      <label for="crm-location-id">Location ID</label>
      <input
        id="crm-location-id"
        v-model="locationId"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Ej. a1B2c3D4e5F6g7H8i9J0"
        :disabled="saving"
      />
    </div>

    <div class="form__field">
      <label for="crm-token">Token de integración privada</label>
      <div class="form__secret">
        <input
          id="crm-token"
          v-model="token"
          :type="showToken ? 'text' : 'password'"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="pit-xxxxxxxx-xxxx-xxxx"
          :disabled="saving"
        />
        <button
          type="button"
          class="form__eye"
          :aria-label="showToken ? 'Ocultar token' : 'Mostrar token'"
          :aria-pressed="showToken"
          @click="showToken = !showToken"
        >
          <i :class="showToken ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" aria-hidden="true" />
        </button>
      </div>
      <p class="form__hint">
        <i class="fa-solid fa-shield-halved" aria-hidden="true" />
        Solo lo usamos para leer tu CRM. Después solo verás sus últimos dígitos.
      </p>
    </div>

    <p v-if="error" class="form__error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>

    <div class="form__actions">
      <button type="submit" class="form__submit" :disabled="!canSubmit">
        <i v-if="saving" class="fa-solid fa-spinner fa-spin" aria-hidden="true" />
        <i v-else class="fa-solid fa-plug" aria-hidden="true" />
        {{ saving ? 'Verificando con tu CRM…' : submitLabel }}
      </button>
      <button v-if="cancelable" type="button" class="form__cancel" :disabled="saving" @click="emit('cancel')">
        Cancelar
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.form { display: flex; flex-direction: column; gap: 0.95rem; }

.form__field {
  display: flex; flex-direction: column; gap: 0.35rem;

  label { font-size: 0.78rem; font-weight: 700; color: $primary-dark; }

  input {
    width: 100%; min-height: 46px;
    border: 1px solid rgba($primary-dark, 0.16); border-radius: 10px;
    padding: 0.6rem 0.8rem;
    // 16px evita que iOS haga zoom al enfocar el campo.
    font-family: inherit; font-size: 16px; color: $primary-dark;
    background: $white;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder { color: rgba($primary-dark, 0.35); }
    &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(#6366f1, 0.15); }
    &:disabled { background: rgba($primary-dark, 0.03); }
  }
}

.form__secret {
  position: relative;

  input { padding-right: 3rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
}

.form__eye {
  position: absolute; top: 0; right: 0;
  width: 46px; height: 46px;
  display: grid; place-items: center;
  background: none; border: none; border-radius: 0 10px 10px 0;
  color: $text-secondary; cursor: pointer; font-size: 0.95rem;
  &:hover { color: $primary-dark; }
  &:focus-visible { outline: 2px solid #6366f1; outline-offset: -2px; }
}

.form__hint {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.72rem; color: $text-secondary; margin: 0;
  i { color: #0d9668; }
}

.form__error {
  display: flex; align-items: flex-start; gap: 0.5rem;
  background: rgba(#ef4444, 0.07); border: 1px solid rgba(#ef4444, 0.25);
  border-radius: 10px; padding: 0.65rem 0.8rem; margin: 0;
  font-size: 0.8rem; line-height: 1.45; color: #b91c1c;
  i { margin-top: 0.15rem; }
}

.form__actions {
  display: flex; gap: 0.6rem; flex-wrap: wrap;

  @media (max-width: 560px) { flex-direction: column; }
}

.form__submit, .form__cancel {
  min-height: 46px; border-radius: 10px;
  padding: 0.6rem 1.2rem;
  font-family: inherit; font-size: 0.86rem; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  cursor: pointer;
  &:disabled { opacity: 0.55; cursor: not-allowed; }
}

.form__submit {
  background: #6366f1; color: $white; border: none;
  &:hover:not(:disabled) { background: #4f46e5; }
}

.form__cancel {
  background: none; color: $text-secondary; border: 1px solid rgba($primary-dark, 0.14);
  &:hover:not(:disabled) { color: $primary-dark; }
}
</style>
