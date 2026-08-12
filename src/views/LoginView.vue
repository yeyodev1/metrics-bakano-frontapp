<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthShell from './auth/AuthShell.vue'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'
import type { ApiError } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Quien llega desde un enlace de revisión de videos ve por qué se le pide entrar.
const isVideoReview = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.includes('video-planning')
)

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const isFormValid = computed(() => email.value.length > 0 && password.value.length >= 6)

async function handleSubmit(): Promise<void> {
  if (!isFormValid.value || isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { token, user } = await authService.login({
      email: email.value.trim(),
      password: password.value,
    })

    // Persist token for the request interceptor
    localStorage.setItem('access_token', token)

    // Decode JWT payload to get fields not present in the user object (e.g. isInternal)
    let jwtIsInternal: boolean = false
    let jwtInternalRole: string | undefined = undefined
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as {
        isInternal?: boolean
        internalRole?: string
      }
      jwtIsInternal = payload.isInternal === true
      jwtInternalRole = payload.internalRole
    } catch { /* use defaults */ }

    // Select a workspace ID to redirect to
    const targetWorkspaceId = user.workspaceId || (user.workspaces?.[0]?.workspaceId ?? null)

    // Hydrate the user store (also persists to localStorage)
    userStore.setUser({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      workspaces: user.workspaces as any,
      workspaceId: targetWorkspaceId || undefined,
      isInternal: user.isInternal ?? jwtIsInternal,
      internalRole: user.internalRole ?? jwtInternalRole,
    })

    // Honor redirect param (e.g. from shared video-planning link)
    if (route.query.redirect && typeof route.query.redirect === 'string') {
      await router.push(route.query.redirect)
      return
    }

    // Role-based redirect
    if (user.role === 'superadmin') {
      await router.push({ name: 'AdminWorkspaces' })
    } else if (targetWorkspaceId) {
      await router.push({ name: 'BillingRoas', params: { workspaceId: targetWorkspaceId } })
    } else {
      await router.push({ name: 'Home' })
    }
  } catch (err: unknown) {
    const apiError = err as ApiError
    if (apiError.status === 401) {
      // Se nombra la salida: quien se equivoca de contraseña suele no acordarse
      // de ninguna, y el siguiente paso útil es recuperarla, no reintentar a ciegas.
      errorMessage.value = 'Correo o contraseña incorrectos.'
      showRecoveryHint.value = true
    } else if (apiError.status === 0 || apiError.status === undefined) {
      errorMessage.value = 'No pudimos conectar con el servidor. Revisa tu conexión.'
    } else {
      errorMessage.value = 'Ocurrió un error. Intenta de nuevo en un momento.'
    }
  } finally {
    isLoading.value = false
  }
}

const showRecoveryHint = ref(false)
</script>

<template>
  <AuthShell
    title="Bienvenido de vuelta"
    subtitle="Inicia sesión en tu cuenta para continuar"
  >
    <template v-if="isVideoReview" #banner>
      <div class="lv__banner">
        <i class="fa-solid fa-film" aria-hidden="true" />
        <div>
          <strong>Tienes videos para revisar</strong>
          <p>Inicia sesión para ver y aprobar la planificación de videos de tu marca.</p>
        </div>
      </div>
    </template>

    <form class="auth-form" novalidate @submit.prevent="handleSubmit">
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
            :disabled="isLoading"
            required
          />
        </div>
      </div>

      <div class="auth-field">
        <div class="auth-label-row">
          <label class="auth-label" for="password">Contraseña</label>
          <RouterLink :to="{ name: 'AuthForgotPassword' }" class="auth-link">
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>
        <div class="auth-input-wrap">
          <i class="fa-solid fa-lock auth-input-icon" aria-hidden="true" />
          <input
            id="password"
            v-model="password"
            class="auth-input auth-input--has-eye"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="isLoading"
            required
          />
          <button
            class="auth-eye"
            type="button"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <i
              :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <Transition name="fade-slide">
        <div v-if="errorMessage" class="auth-alert auth-alert--error" role="alert">
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>
            {{ errorMessage }}
            <RouterLink
              v-if="showRecoveryHint"
              :to="{ name: 'AuthForgotPassword' }"
              class="lv__error-link"
            >
              Recuperar contraseña
            </RouterLink>
          </span>
        </div>
      </Transition>

      <button
        id="btn-submit-login"
        class="auth-submit"
        type="submit"
        :disabled="!isFormValid || isLoading"
      >
        <span v-if="!isLoading">
          Iniciar sesión
          <i class="fa-solid fa-arrow-right" aria-hidden="true" />
        </span>
        <span v-else class="auth-spinner" aria-label="Entrando" />
      </button>
    </form>

    <template #footer>
      ¿Necesitas acceso?
      <a class="auth-link" href="mailto:hola@bakano.ec">Contacta con tu administrador</a>
    </template>
  </AuthShell>
</template>

<style lang="scss" scoped>
.lv__banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: rgba($secondary, 0.07);
  border: 1.5px solid rgba($secondary, 0.2);
  border-radius: 12px;

  > i {
    margin-top: 0.15rem;
    font-size: 1.1rem;
    color: $secondary;
  }

  strong {
    display: block;
    font-size: 0.9rem;
    color: $primary-dark;
  }

  p {
    margin: 0.2rem 0 0;
    font-size: 0.82rem;
    line-height: 1.5;
    color: $text-secondary;
  }
}

.lv__error-link {
  display: inline-block;
  margin-top: 0.35rem;
  font-weight: 800;
  color: #991b1b;
  text-decoration: underline;
}

.fade-slide-enter-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
