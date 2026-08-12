<template>
  <AuthShell
    :title="enviado ? 'Revisa tu correo' : 'Recuperar contraseña'"
    :subtitle="
      enviado
        ? `Si ${email} tiene una cuenta, ahí está el enlace para elegir una contraseña nueva.`
        : 'Te enviamos un enlace para elegir una nueva. Necesitas acceso al correo de tu cuenta.'
    "
    panel-tag="Acceso"
    panel-title="¿Perdiste la contraseña?"
    panel-sub="Recupérala tú mismo, sin esperar a que alguien del equipo te la cambie."
  >
    <!-- Enviado: nada que volver a llenar, solo qué hacer ahora. -->
    <div v-if="enviado" class="fp__done">
      <p class="auth-alert auth-alert--ok">
        <i class="fa-solid fa-paper-plane" aria-hidden="true" />
        <span>Correo enviado. El enlace vence en 60 minutos y sirve una sola vez.</span>
      </p>

      <p class="auth-hint">
        ¿No llega? Revisa la carpeta de spam, y confirma que
        <strong>{{ email }}</strong> es el correo con el que entras a Bakano.
      </p>

      <button type="button" class="auth-submit" @click="reintentar">
        Usar otro correo
      </button>

      <RouterLink :to="{ name: 'AuthLogin' }" class="fp__back">
        <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver al inicio de sesión
      </RouterLink>
    </div>

    <form v-else class="auth-form" novalidate @submit.prevent="enviar">
      <div class="auth-field">
        <label class="auth-label" for="email">Correo electrónico</label>
        <div class="auth-input-wrap">
          <i class="fa-solid fa-envelope auth-input-icon" aria-hidden="true" />
          <input
            id="email"
            v-model="email"
            class="auth-input"
            type="email"
            placeholder="tu@empresa.com"
            autocomplete="email"
            :disabled="cargando"
            required
          />
        </div>
      </div>

      <p v-if="error" class="auth-alert auth-alert--error" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>

      <button class="auth-submit" type="submit" :disabled="!emailValido || cargando">
        <span v-if="!cargando">Enviarme el enlace</span>
        <span v-else class="auth-spinner" aria-label="Enviando" />
      </button>

      <RouterLink :to="{ name: 'AuthLogin' }" class="fp__back">
        <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Volver al inicio de sesión
      </RouterLink>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthShell from './AuthShell.vue'
import { authService } from '@/services/auth.service'

const email = ref('')
const cargando = ref(false)
const enviado = ref(false)
const error = ref('')

const emailValido = computed(() => /.+@.+\..+/.test(email.value.trim()))

async function enviar() {
  if (!emailValido.value || cargando.value) return

  cargando.value = true
  error.value = ''
  try {
    await authService.forgotPassword(email.value.trim())
    // El backend responde igual exista o no la cuenta, así que la pantalla de
    // éxito tampoco confirma si ese correo está registrado.
    enviado.value = true
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e?.message || 'No pudimos enviar el correo. Intenta de nuevo en un momento.'
  } finally {
    cargando.value = false
  }
}

function reintentar() {
  enviado.value = false
  email.value = ''
}
</script>

<style lang="scss" scoped>
.fp__done {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.fp__back {
  align-self: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: $text-secondary;
  text-decoration: none;

  &:hover { color: $primary-dark; }
}
</style>
