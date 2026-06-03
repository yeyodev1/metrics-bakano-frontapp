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

onMounted(() => {
  fetchWorkspace()
})
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
        
        <div v-if="userStore.role === 'superadmin'" class="workspace-dashboard__superadmin-badge">
          <i class="fa-solid fa-shield-check" /> Superadmin Mode
        </div>
      </div>

      <div class="workspace-dashboard__nav-actions">
        <button class="workspace-dashboard__btn-ghost" @click="router.push({ name: 'AppSettings', params: { workspaceId } })" title="Configurar Entorno">
          <i class="fa-solid fa-gear" />
          <span class="workspace-dashboard__nav-text">Ajustes</span>
        </button>  
        <button v-if="userStore.role === 'superadmin'" class="workspace-dashboard__back-btn" @click="router.push({ name: 'AdminWorkspaces' })">
          <i class="fa-solid fa-arrow-left" />
          <span class="workspace-dashboard__nav-text">Volver a Global</span>
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="workspace-dashboard__skeleton">
      <div class="workspace-dashboard__skeleton-row skeleton-shimmer" style="height: 180px; border-radius: 20px;" />
    </div>

    <div v-else-if="error" class="workspace-dashboard__error-state">
      <i class="fa-solid fa-circle-exclamation" />
      <p>{{ error }}</p>
      <button @click="router.push({ name: 'AdminWorkspaces' })">Volver al Dashboard</button>
    </div>

    <main v-else class="workspace-dashboard__content">
      <!-- SURVEY BANNER FOR CLIENTS -->
      <section v-if="!userStore.isInternal && userStore.pendingSurveysCount > 0" class="workspace-dashboard__survey-banner">
        <div class="workspace-dashboard__survey-banner-content">
          <div class="workspace-dashboard__survey-banner-icon">
            <i class="fa-solid fa-clipboard-question" />
          </div>
          <div class="workspace-dashboard__survey-banner-text">
            <h3>Tienes encuestas pendientes</h3>
            <p>Tu opinión es fundamental para mejorar nuestra estrategia. Por favor, tómate un momento para responderlas.</p>
          </div>
        </div>
        <button class="workspace-dashboard__survey-banner-btn" @click="router.push({ name: 'MySurveys', params: { workspaceId } })">
          <span>Ver encuestas</span>
          <i class="fa-solid fa-arrow-right" />
        </button>
      </section>

      <!-- AVISO CRM HERO -->
      <section class="crm-hero">
        <div class="crm-hero__icon">
          <i class="fa-solid fa-chart-line" />
        </div>
        <h2 class="crm-hero__title">Analítica mudada al CRM</h2>
        <p class="crm-hero__text">
          El dashboard detallado de Meta Ads y las analíticas orgánicas han sido movidos a nuestra nueva plataforma integral.
          Ahora podrás encontrar todos tus embudos, reportes consolidados y herramientas avanzadas directamente en el CRM.
        </p>
        <div class="crm-hero__actions">
          <a href="https://crm.bakano.ec" target="_blank" rel="noopener noreferrer" class="crm-hero__btn crm-hero__btn--primary">
            Ir a crm.bakano.ec <i class="fa-solid fa-arrow-up-right-from-square" />
          </a>
          <a href="https://api.leadconnectorhq.com/widget/bookings/soporte-tecnico-crm" target="_blank" rel="noopener noreferrer" class="crm-hero__btn crm-hero__btn--secondary">
            <i class="fa-solid fa-calendar-plus" /> Agendar Soporte Técnico
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.workspace-dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background: $white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    z-index: 10;
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
      font-size: 1.25rem;
      color: $primary;
      background: rgba($primary, 0.1);
      padding: 0.5rem;
      border-radius: 8px;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: $primary-dark;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    span {
      font-size: 1.1rem;
      color: $text-secondary;
      font-weight: 500;
    }
  }

  &__superadmin-badge {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(#E91E63, 0.1);
    color: #C2185B;
    padding: 0.25rem 0.6rem;
    border-radius: 100px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(#E91E63, 0.2);
  }

  &__nav-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__btn-ghost {
    background: none;
    border: none;
    color: $text-secondary;
    padding: 0.6rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;

    &:hover {
      background: #f3f4f6;
      color: $primary;
    }
  }

  &__back-btn {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: $white;
    color: #374151;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f3f4f6;
      color: $primary;
      border-color: rgba($primary, 0.3);
    }
  }

  &__nav-text {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__error-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem;
    text-align: center;
    background: #f9fafb;

    i {
      font-size: 3rem;
      color: $alert-error;
    }

    p {
      font-size: 1.1rem;
      color: #374151;
      max-width: 400px;
      margin: 0;
    }

    button {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      background: $primary;
      color: $white;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: lighten($primary, 10%);
      }
    }
  }

  &__skeleton {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
}

// SURVEY BANNER
.workspace-dashboard__survey-banner {
  background: linear-gradient(135deg, $primary 0%, lighten($primary, 15%) 100%);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  color: $white;
  box-shadow: 0 10px 30px rgba($primary, 0.2);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }

  &-content {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
  }

  &-icon {
    font-size: 2rem;
    background: rgba(255, 255, 255, 0.2);
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    flex-shrink: 0;
  }

  &-text {
    h3 {
      margin: 0 0 0.25rem;
      font-size: 1.2rem;
      font-weight: 800;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.9;
      line-height: 1.4;
      max-width: 500px;
    }
  }

  &-btn {
    background: $white;
    color: $primary;
    border: none;
    padding: 0.85rem 1.5rem;
    border-radius: 100px;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
  }
}

// CRM HERO SECTION
.crm-hero {
  background: $white;
  border-radius: 24px;
  padding: 4.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.03);
  max-width: 800px;
  margin: 3rem auto;

  &__icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.02) 100%);
    color: $primary;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid rgba($primary, 0.2);
  }

  &__title {
    font-size: 2.2rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 1rem;
    letter-spacing: -0.5px;
  }

  &__text {
    font-size: 1.15rem;
    color: #374151;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 0 2.5rem;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;

    @media (max-width: 560px) {
      flex-direction: column;
      width: 100%;
    }
  }

  &__btn {
    padding: 0.9rem 1.75rem;
    border-radius: 12px;
    font-size: 1.05rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    transition: all 0.2s;

    @media (max-width: 560px) {
      width: 100%;
      justify-content: center;
    }

    &--primary {
      background: $primary;
      color: $white;
      box-shadow: 0 6px 20px rgba($primary, 0.25);

      &:hover {
        background: lighten($primary, 5%);
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba($primary, 0.3);
      }
    }

    &--secondary {
      background: #f3f4f6;
      color: $primary-dark;
      border: 1px solid #e5e7eb;

      &:hover {
        background: #e5e7eb;
        transform: translateY(-2px);
      }
    }
  }
}

.skeleton-shimmer {
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
