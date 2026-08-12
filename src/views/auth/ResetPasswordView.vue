<template>
  <AuthShell
    :title="titulo"
    :subtitle="subtitulo"
    panel-tag="Acceso"
    panel-title="Elige tu contraseña nueva"
    panel-sub="Después de guardarla, este enlace deja de servir."
  >
    <!-- Comprobando el enlace: no se pide nada todavía. -->
    <div v-if="estado === 'verificando'" class="rp__center">
      <span class="auth-spinner rp__spinner-dark" aria-label="Verificando enlace" />
      <p class="auth-hint">Comprobando el enlace…</p>
    </div>

    <!-- Enlace muerto: el camino de salida es pedir otro, no reintentar. -->
    <div v-else-if="estado === 'invalido'" class="rp__stack">
      <p class="auth-alert auth-alert--error">
        <i class="fa-solid fa-link-slash" aria-hidden="true" />
        <span>Este enlace ya venció o se usó. Los enlaces duran 60 minutos y sirven una sola vez.</span>
      </p>
      <RouterLink :to="{ name: 'AuthForgotPassword' }" class="auth-submit rp__btn-link">
        Pedir un enlace nuevo
      </RouterLink>
      <RouterLink :to="{ name: 'AuthLogin' }" class="rp__back">Volver al inicio de sesión</RouterLink>
    </div>

    <div v-else-if="estado === 'listo'" class="rp__stack">
      <p class="auth-alert auth-alert--ok">
        <i class="fa-solid fa-circle-check" aria-hidden="true" />
        <span>Tu contraseña quedó cambiada.</span>
      </p>
      <RouterLink :to="{ name: 'AuthLogin' }" class="auth-submit rp__btn-link">
        Iniciar sesión
      </RouterLink>
    </div>

    <form v-else class="auth-form" novalidate @submit.prevent="guardar">
      <div class="auth-field">
        <label class="auth-label" for="clave-nueva">Contraseña nueva</label>
        <div class="auth-input-wrap">
          <i class="fa-solid fa-lock auth-input-icon" aria-hidden="true" />
          <input
            id="clave-nueva"
            v-model="password"
            class="auth-input auth-input--has-eye"
            :type="verPassword ? 'text' : 'password'"
            placeholder="Mínimo 8 caracteres"
            autocomplete="new-password"
            :disabled="guardando"
            required
          />
          <button
            type="button"
            class="auth-eye"
            :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="verPassword = !verPassword"
          >
            <i :class="verPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true" />
          </button>
        </div>
        <!-- Se muestra siempre, no solo al fallar: así se sabe la regla antes. -->
        <p class="auth-hint" :class="{ 'rp__hint-ok': largoOk }">
          <i :class="largoOk ? 'fa-solid fa-check' : 'fa-regular fa-circle'" aria-hidden="true" />
          Al menos 8 caracteres
        </p>
      </div>

      <div class="auth-field">
        <label class="auth-label" for="clave-repetida">Repite la contraseña</label>
        <div class="auth-input-wrap">
          <i class="fa-solid fa-lock auth-input-icon" aria-hidden="true" />
          <input
            id="clave-repetida"
            v-model="password2"
            class="auth-input"
            :type="verPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :disabled="guardando"
            required
          />
        </div>
        <p v-if="password2 && !coinciden" class="auth-hint rp__hint-mal">
          <i class="fa-solid fa-xmark" aria-hidden="true" /> Las dos contraseñas no son iguales
        </p>
      </div>

      <p v-if="error" class="auth-alert auth-alert--error" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>

      <button class="auth-submit" type="submit" :disabled="!puedeGuardar || guardando">
        <span v-if="!guardando">Guardar contraseña</span>
        <span v-else class="auth-spinner" aria-label="Guardando" />
      </button>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthShell from './AuthShell.vue'
import { authService } from '@/services/auth.service'

type Estado = 'verificando' | 'invalido' | 'formulario' | 'listo'

const route = useRoute()
const token = String(route.params.token || '')

const estado = ref<Estado>('verificando')
const cuenta = ref('')

const password = ref('')
const password2 = ref('')
const verPassword = ref(false)
const guardando = ref(false)
const error = ref('')

const largoOk = computed(() => password.value.length >= 8)
const coinciden = computed(() => password.value === password2.value)
const puedeGuardar = computed(() => largoOk.value && coinciden.value && !!password2.value)

const titulo = computed(() => {
  if (estado.value === 'invalido') return 'Enlace vencido'
  if (estado.value === 'listo') return 'Contraseña cambiada'
  return 'Elige tu contraseña nueva'
})

const subtitulo = computed(() => {
  if (estado.value === 'verificando') return 'Un momento.'
  if (estado.value === 'invalido') return 'Pide uno nuevo y vuelve a intentarlo.'
  if (estado.value === 'listo') return 'Ya puedes entrar con la contraseña nueva.'
  return cuenta.value ? `Estás cambiando la contraseña de ${cuenta.value}.` : 'Escríbela dos veces para confirmar.'
})

// Se comprueba el enlace antes de mostrar el formulario: pedirle a alguien que
// escriba una contraseña dos veces y recién ahí decirle que el enlace venció
// es la peor forma de dar esa noticia.
onMounted(async () => {
  if (!token) {
    estado.value = 'invalido'
    return
  }
  try {
    const res = await authService.verifyResetToken(token)
    if (res.valid) {
      cuenta.value = res.email || ''
      estado.value = 'formulario'
    } else {
      estado.value = 'invalido'
    }
  } catch {
    estado.value = 'invalido'
  }
})

async function guardar() {
  if (!puedeGuardar.value || guardando.value) return

  guardando.value = true
  error.value = ''
  try {
    await authService.resetPassword(token, password.value)
    estado.value = 'listo'
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e?.message || 'No pudimos cambiar la contraseña. Intenta de nuevo.'
  } finally {
    guardando.value = false
  }
}
</script>

<style lang="scss" scoped>
.rp__stack {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.rp__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 0;
}

.rp__spinner-dark {
  border-color: rgba($primary-dark, 0.15);
  border-top-color: $primary;
}

.rp__btn-link {
  text-decoration: none;
}

.rp__back {
  align-self: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: $text-secondary;
  text-decoration: none;

  &:hover { color: $primary-dark; }
}

.rp__hint-ok { color: $alert-success; }
.rp__hint-mal { color: $alert-error; }
</style>
