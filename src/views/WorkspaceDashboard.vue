<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { useUserStore } from '@/stores/user'
import type { Workspace, ApiError } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

const workspace = ref<Workspace | null>(null)
const isLoading = ref(true)
const error = ref('')

async function fetchWorkspace() {
  isLoading.value = true
  error.value = ''
  try {
    const { workspace: data } = await workspaceService.getWorkspace(workspaceId)
    workspace.value = data
  } catch (err: unknown) {
    const e = err as ApiError
    error.value = e.message || 'Error al cargar el entorno.'
  } finally {
    isLoading.value = false
  }
}

function handleConnectMeta() {
  alert('Iniciando conexión con Meta Ads... (Simulación)')
}

onMounted(fetchWorkspace)
</script>

<template>
  <div class="workspace-dashboard">
    <!-- Header Context -->
    <header class="workspace-dashboard__header">
      <div class="workspace-dashboard__context">
        <div class="workspace-dashboard__ws-info">
          <i class="fa-solid fa-layer-group" />
          <h1 v-if="workspace">{{ workspace.name }}</h1>
          <span v-else-if="isLoading">Cargando...</span>
        </div>
        
        <div v-if="userStore.role === 'superadmin'" class="workspace-dashboard__super-badge">
          <i class="fa-solid fa-shield-halved" />
          <span>Navegando como <strong>Superadmin</strong></span>
        </div>
      </div>

      <button class="workspace-dashboard__back-btn" @click="router.push({ name: 'SuperadminDashboard' })">
        <i class="fa-solid fa-arrow-left" />
        Volver a Global
      </button>
    </header>

    <div v-if="isLoading" class="workspace-dashboard__loading">
      <div class="workspace-dashboard__spinner" />
      <p>Cargando datos del entorno...</p>
    </div>

    <div v-else-if="error" class="workspace-dashboard__error-state">
      <i class="fa-solid fa-circle-exclamation" />
      <p>{{ error }}</p>
      <button @click="router.push({ name: 'SuperadminDashboard' })">Volver al Dashboard</button>
    </div>

    <main v-else class="workspace-dashboard__content">
      <!-- Welcome Card -->
      <section class="workspace-dashboard__welcome-card">
        <div class="workspace-dashboard__welcome-text">
          <h2>¡Bienvenido al entorno operativo!</h2>
          <p>Desde aquí podrás gestionar tus campañas y conectar tus fuentes de datos.</p>
        </div>
        <div class="workspace-dashboard__illustrations">
          <i class="fa-solid fa-chart-line" />
        </div>
      </section>

      <!-- Connection Grid -->
      <div class="workspace-dashboard__grid">
        <div class="workspace-dashboard__card">
          <div class="workspace-dashboard__card-header">
            <div class="workspace-dashboard__icon-meta">
              <i class="fa-brands fa-facebook" />
            </div>
            <h3>Facebook & Instagram Ads</h3>
          </div>
          <p>Conecta tu Business Manager para empezar a optimizar tu ROAS.</p>
          <button class="workspace-dashboard__btn-meta" @click="handleConnectMeta">
            <i class="fa-solid fa-link" />
            Conectar Meta Ads
          </button>
        </div>

        <div class="workspace-dashboard__card workspace-dashboard__card--disabled">
          <div class="workspace-dashboard__card-header">
            <div class="workspace-dashboard__icon-google">
              <i class="fa-brands fa-google" />
            </div>
            <h3>Google Ads</h3>
          </div>
          <p>Próximamente: Integración directa con Google Ads Search y Display.</p>
          <button disabled>Próximamente</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.workspace-dashboard {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 1600px;
  margin: 0;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__context {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__ws-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    i {
      color: $primary;
      font-size: 1.5rem;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: $primary-dark;
    }
  }

  &__super-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: $text-secondary;
    padding: 0.25rem 0.75rem;
    background: rgba($alert-warning, 0.1);
    border-radius: 6px;
    width: fit-content;

    i {
      color: $alert-warning;
    }

    strong {
      color: $primary-dark;
    }
  }

  &__back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba($primary-dark, 0.1);
    background: $white;
    color: $text-secondary;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.03);
      color: $primary-dark;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__welcome-card {
    background: linear-gradient(135deg, $primary-dark 0%, #2a223c 100%);
    color: $white;
    padding: 2.5rem;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    p {
      margin: 0;
      opacity: 0.8;
    }
  }

  &__illustrations {
    font-size: 4rem;
    opacity: 0.2;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.5rem;
  }

  &__card {
    background: $white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);

    h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.9rem;
      line-height: 1.5;
      flex: 1;
    }

    &--disabled {
      opacity: 0.7;
      background: #fafafa;

      button {
        background: #ddd;
        color: #888;
        cursor: not-allowed;
        border: none;
        padding: 0.75rem;
        border-radius: 8px;
        width: 100%;
        font-weight: 600;
      }
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__icon-meta,
  &__icon-google {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  &__icon-meta {
    background: rgba(#1877f2, 0.1);
    color: #1877f2;
  }

  &__icon-google {
    background: rgba(#db4437, 0.1);
    color: #db4437;
  }

  &__btn-meta {
    background: $primary;
    color: $white;
    border: none;
    padding: 0.8rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($primary, 0.3);
    }
  }

  &__loading,
  &__error-state {
    padding: 5rem 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba($primary, 0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
