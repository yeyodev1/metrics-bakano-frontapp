<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { useMetaAds } from '@/composables/useMetaAds'
import { useUserStore } from '@/stores/user'
import type { Workspace, ApiError } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

const workspace = ref<Workspace | null>(null)
const isLoading = ref(true)
const error = ref('')

// Meta Ads Composable
const {
  isLoggingIn,
  error: metaError,
  authStep,
  availablePages,
  initSDK,
  loginWithMeta,
  selectPageAndSave
} = useMetaAds()

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

async function handleConnectMeta() {
  try {
    await loginWithMeta()
  } catch (err) {
    console.error('Meta connection failed:', err)
  }
}

async function handlePageSelection(page: any) {
  try {
    await selectPageAndSave(workspaceId, page)
    await fetchWorkspace() // Refresh view
  } catch (err) {
    console.error('Page selection failed:', err)
  }
}

onMounted(() => {
  fetchWorkspace()
  initSDK()
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
        <!-- Meta Card -->
        <div class="workspace-dashboard__card" :class="{ 'workspace-dashboard__card--connected': workspace?.metaAds }">
          <div class="workspace-dashboard__card-header">
            <div class="workspace-dashboard__icon-meta">
              <i class="fa-brands fa-facebook" />
            </div>
            <div class="workspace-dashboard__card-titles">
              <h3>Facebook & Instagram Ads</h3>
              <span v-if="workspace?.metaAds" class="workspace-dashboard__status-tag">Conectado</span>
            </div>
          </div>

          <template v-if="workspace?.metaAds">
            <div class="workspace-dashboard__connected-info">
              <div class="workspace-dashboard__info-item">
                <i class="fa-solid fa-file-invoice" />
                <span>Página: <strong>{{ workspace.metaAds.pageName }}</strong></span>
              </div>
              <div v-if="workspace.metaAds.adAccountName" class="workspace-dashboard__info-item">
                <i class="fa-solid fa-rectangle-ad" />
                <span>Cuenta: <strong>{{ workspace.metaAds.adAccountName }}</strong></span>
              </div>
            </div>
            <button class="workspace-dashboard__btn-outline" @click="handleConnectMeta">
              <i class="fa-solid fa-rotate" />
              Recalibrar conexión
            </button>
          </template>

          <template v-else>
            <p>Conecta tu Business Manager para empezar a optimizar tu ROAS.</p>
            <button 
              class="workspace-dashboard__btn-meta" 
              :disabled="isLoggingIn"
              @click="handleConnectMeta"
            >
              <template v-if="isLoggingIn">
                <span class="workspace-dashboard__spinner workspace-dashboard__spinner--sm" />
                Conectando...
              </template>
              <template v-else>
                <i class="fa-solid fa-link" />
                Conectar Meta Ads
              </template>
            </button>
          </template>
          
          <p v-if="metaError" class="workspace-dashboard__error-msg">{{ metaError }}</p>
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

    <!-- Modal: Meta Page Picker -->
    <Transition name="modal">
      <div v-if="authStep === 'pick_page'" class="workspace-dashboard__overlay">
        <div class="workspace-dashboard__modal">
          <div class="workspace-dashboard__modal-header">
            <h3>Selecciona tu Página</h3>
            <p>Elige la página que deseas vincular a este entorno.</p>
          </div>
          
          <div class="workspace-dashboard__page-list">
            <div 
              v-for="page in availablePages" 
              :key="page.id" 
              class="workspace-dashboard__page-item"
              @click="handlePageSelection(page)"
            >
              <div class="workspace-dashboard__page-icon">
                <i class="fa-solid fa-building" />
              </div>
              <div class="workspace-dashboard__page-info">
                <span class="workspace-dashboard__page-name">{{ page.name }}</span>
                <span class="workspace-dashboard__page-id">ID: {{ page.id }}</span>
              </div>
              <i class="fa-solid fa-chevron-right" />
            </div>
          </div>

          <div v-if="availablePages.length === 0" class="workspace-dashboard__empty-pages">
            <i class="fa-solid fa-face-frown" />
            <p>No encontramos páginas asociadas a tu cuenta de Facebook.</p>
            <button class="workspace-dashboard__btn-ghost" @click="authStep = 'idle'">Cerrar</button>
          </div>
        </div>
      </div>
    </Transition>
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

  // ── Meta Ads Specific Styles ───────────────────────────
  &__card--connected {
    border-color: rgba($primary, 0.3);
    background: linear-gradient(to bottom right, $white, rgba($primary, 0.02));
  }

  &__card-titles {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    h3 {
      margin: 0;
    }
  }

  &__status-tag {
    font-size: 0.7rem;
    background: rgba($BAKANO-GREEN, 0.1);
    color: $BAKANO-GREEN;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-weight: 800;
    text-transform: uppercase;
  }

  &__connected-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba($primary-dark, 0.03);
    border-radius: 10px;
    margin: 0.5rem 0;
  }

  &__info-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: $text-secondary;

    i {
      color: $primary;
      width: 16px;
      text-align: center;
    }

    strong {
      color: $primary-dark;
    }
  }

  &__btn-outline {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: $text-secondary;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary, 0.05);
      border-color: $primary;
      color: $primary;
    }
  }

  &__error-msg {
    color: $alert-error;
    font-size: 0.85rem;
    margin: 0.5rem 0 0;
  }

  // ── Page Picker Modal ────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.8);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  &__modal {
    background: $white;
    width: 100%;
    max-width: 500px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
  }

  &__modal-header {
    padding: 2rem;
    background: rgba($primary, 0.03);
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.4rem;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.95rem;
    }
  }

  &__page-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__page-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid rgba($primary-dark, 0.05);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      background: rgba($primary, 0.02);
      transform: translateX(4px);
    }

    &>i {
      margin-left: auto;
      opacity: 0.3;
    }
  }

  &__page-icon {
    width: 44px;
    height: 44px;
    background: $primary-light;
    color: $primary;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  &__page-info {
    display: flex;
    flex-direction: column;

    .workspace-dashboard__page-name {
      font-weight: 700;
      color: $primary-dark;
    }

    .workspace-dashboard__page-id {
      font-size: 0.8rem;
      color: $text-secondary;
    }
  }

  &__empty-pages {
    padding: 3rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: $text-secondary;

    i {
      font-size: 2.5rem;
      opacity: 0.2;
    }
  }
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
