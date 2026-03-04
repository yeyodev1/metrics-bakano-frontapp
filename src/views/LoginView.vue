<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import logoDark from '@/assets/logos/bakano-dark.png'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'
import type { ApiError } from '@/types'

const router = useRouter()
const userStore = useUserStore()

// --- State ---
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

// --- Computed ---
const isFormValid = computed(() => email.value.length > 0 && password.value.length >= 6)

// --- Actions ---
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

    // Select a workspace ID to redirect to
    const targetWorkspaceId = user.workspaceId || (user.workspaces?.[0]?.workspaceId ?? null)

    // Hydrate the user store (also persists to localStorage)
    userStore.setUser({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceId: targetWorkspaceId || undefined
    })

    // Role-based redirect
    if (user.role === 'superadmin') {
      router.push({ name: 'AdminWorkspaces' })
    } else if (targetWorkspaceId) {
      router.push({ name: 'AppDashboard', params: { workspaceId: targetWorkspaceId } })
    } else {
      router.push({ name: 'Home' })
    }
  } catch (err: unknown) {
    const apiError = err as ApiError
    if (apiError.status === 401) {
      errorMessage.value = 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.'
    } else {
      errorMessage.value = 'Ocurrió un error. Por favor intenta más tarde.'
    }
  } finally {
    isLoading.value = false
  }
}

function togglePassword(): void {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="login-view">
    <!-- Left decorative panel -->
    <aside class="login-view__panel" aria-hidden="true">
      <div class="login-view__panel-gfx">
        <div class="login-view__orb login-view__orb--1" />
        <div class="login-view__orb login-view__orb--2" />
        <div class="login-view__orb login-view__orb--3" />
      </div>
      <div class="login-view__panel-copy">
        <p class="login-view__panel-tag">Plataforma ROAS</p>
        <h2 class="login-view__panel-title">Gestiona tus campañas con inteligencia.</h2>
        <p class="login-view__panel-sub">Visibilidad total sobre tu inversión publicitaria, en tiempo real.</p>
      </div>
    </aside>

    <!-- Right form panel -->
    <main class="login-view__form-area">
      <div class="login-view__card">
        <!-- Header -->
        <div class="login-view__card-header">
          <img :src="logoDark" alt="Bakano" class="login-view__logo" width="120" height="30" />
          <h1 class="login-view__title">Bienvenido de vuelta</h1>
          <p class="login-view__subtitle">Inicia sesión en tu cuenta para continuar</p>
        </div>

        <!-- Form -->
        <form class="login-view__form" novalidate @submit.prevent="handleSubmit">
          <!-- Email -->
          <div class="login-view__field">
            <label class="login-view__label" for="email">Correo electrónico</label>
            <div class="login-view__input-wrap">
              <i class="fa-solid fa-envelope login-view__input-icon" aria-hidden="true" />
              <input
                id="email"
                v-model="email"
                class="login-view__input"
                type="email"
                placeholder="tu@empresa.com"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="login-view__field">
            <div class="login-view__label-row">
              <label class="login-view__label" for="password">Contraseña</label>
              <a class="login-view__forgot" href="#" tabindex="-1">¿Olvidaste tu contraseña?</a>
            </div>
            <div class="login-view__input-wrap">
              <i class="fa-solid fa-lock login-view__input-icon" aria-hidden="true" />
              <input
                id="password"
                v-model="password"
                class="login-view__input"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
              <button
                class="login-view__eye"
                type="button"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="togglePassword"
              >
                <i
                  :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <!-- Error -->
          <Transition name="fade-slide">
            <div v-if="errorMessage" class="login-view__error" role="alert">
              <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {{ errorMessage }}
            </div>
          </Transition>

          <!-- Submit -->
          <button
            id="btn-submit-login"
            class="login-view__submit"
            type="submit"
            :disabled="!isFormValid || isLoading"
          >
            <span v-if="!isLoading" class="login-view__submit-label">
              Iniciar sesión
              <i class="fa-solid fa-arrow-right" aria-hidden="true" />
            </span>
            <span v-else class="login-view__spinner" aria-label="Cargando" />
          </button>
        </form>

        <!-- Footer note -->
        <p class="login-view__footer-note">
          ¿Necesitas acceso?
          <a class="login-view__contact-link" href="mailto:hola@bakano.ec">Contacta con tu administrador</a>
        </p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
/* ============================================================
   LOGIN VIEW
   ============================================================ */
.login-view {
  display: flex;
  min-height: calc(100vh - 64px); // 64px = header height

  /* ── Left decorative panel ─────────────────────────────── */
  &__panel {
    display: none;
    position: relative;
    flex: 0 0 50%;
    overflow: hidden;
    background: linear-gradient(145deg, $primary-dark 0%, darken($primary-dark, 4%) 100%);

    @media (min-width: 1024px) {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 3.5rem;
    }
  }

  &__panel-gfx {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;

    &--1 {
      width: 380px;
      height: 380px;
      background: rgba($primary, 0.45);
      top: -80px;
      left: -100px;
      animation: float 8s ease-in-out infinite;
    }

    &--2 {
      width: 280px;
      height: 280px;
      background: rgba($secondary, 0.4);
      top: 40%;
      right: -60px;
      animation: float 11s ease-in-out infinite reverse;
    }

    &--3 {
      width: 200px;
      height: 200px;
      background: rgba($primary, 0.25);
      bottom: 60px;
      left: 30%;
      animation: float 14s ease-in-out infinite;
    }
  }

  &__panel-copy {
    position: relative;
    z-index: 1;
  }

  &__panel-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba($primary, 0.9);
    background-color: rgba($primary, 0.1);
    border: 1px solid rgba($primary, 0.25);
    border-radius: 100px;
    padding: 0.3rem 0.85rem;
    margin-bottom: 1.25rem;
  }

  &__panel-title {
    font-size: clamp(1.6rem, 2.5vw, 2.1rem);
    font-weight: 700;
    color: $white;
    line-height: 1.25;
    margin: 0 0 1rem;
    letter-spacing: -0.02em;
  }

  &__panel-sub {
    font-size: 1rem;
    color: rgba($text-light, 0.6);
    line-height: 1.6;
    margin: 0;
    max-width: 360px;
  }

  /* ── Right form area ───────────────────────────────────── */
  &__form-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.25rem;
    background-color: $white;

    @media (min-width: 768px) {
      padding: 3rem 2rem;
    }
  }

  &__card {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* ── Card header ───────────────────────────────────────── */
  &__card-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__logo {
    height: 100px;
    width: auto;
    display: block;
    margin-bottom: 0.5rem;
  }

  &__title {
    font-size: clamp(1.5rem, 3vw, 1.875rem);
    font-weight: 700;
    color: $primary-dark;
    letter-spacing: -0.025em;
    margin: 0;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: 0.9375rem;
    color: $text-secondary;
    margin: 0;
    line-height: 1.5;
  }

  /* ── Form ──────────────────────────────────────────────── */
  &__form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $primary-dark;
    letter-spacing: 0.005em;
  }

  &__forgot {
    font-size: 0.8rem;
    font-weight: 500;
    color: $primary;
    text-decoration: none;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.75;
    }
  }

  &__input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input-icon {
    position: absolute;
    left: 0.875rem;
    font-size: 0.9rem;
    color: $text-secondary;
    pointer-events: none;
    flex-shrink: 0;
    line-height: 1;
  }

  &__input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.12);
    background-color: rgba($primary-dark, 0.025);
    color: $primary-dark;
    font-family: $font-principal;
    font-size: 0.9375rem;
    outline: none;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;

    &::placeholder {
      color: rgba($text-secondary, 0.6);
    }

    &:focus {
      border-color: $primary;
      background-color: $white;
      box-shadow: 0 0 0 4px rgba($primary, 0.1);
    }
  }

  &__eye {
    position: absolute;
    right: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.15s ease;

    &:hover {
      color: $primary-dark;
    }
  }

  /* ── Error message ─────────────────────────────────────── */
  &__error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background-color: $alert-error-bg;
    border: 1px solid rgba($alert-error, 0.25);
    color: $alert-error;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* ── Submit button ─────────────────────────────────────── */
  &__submit {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.85rem 1.5rem;
    margin-top: 0.25rem;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 8%) 100%);
    color: $white;
    font-family: $font-principal;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba($primary, 0.4);
    transition:
      box-shadow 0.25s ease,
      transform 0.18s ease,
      opacity 0.2s ease;

    // Shimmer
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg,
          transparent 40%,
          rgba($white, 0.2) 50%,
          transparent 60%);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }

    &:not(:disabled):hover {
      box-shadow: 0 6px 24px rgba($primary, 0.55);
      transform: translateY(-2px);

      &::before {
        transform: translateX(100%);
      }
    }

    &:not(:disabled):active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba($primary, 0.35);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  &__submit-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;

    i {
      transition: transform 0.2s ease;
    }
  }

  &__submit:not(:disabled):hover &__submit-label i {
    transform: translateX(3px);
  }

  /* ── Spinner ───────────────────────────────────────────── */
  &__spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba($white, 0.3);
    border-top-color: $white;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }

  /* ── Footer note ───────────────────────────────────────── */
  &__footer-note {
    text-align: center;
    font-size: 0.85rem;
    color: $text-secondary;
    margin: 0;
  }

  &__contact-link {
    color: $primary;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.75;
    }
  }
}

/* ============================================================
   TRANSITIONS
   ============================================================ */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ============================================================
   KEYFRAMES
   ============================================================ */
@keyframes float {

  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-18px) scale(1.03);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
