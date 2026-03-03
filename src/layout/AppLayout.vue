<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'
import logoDark from '@/assets/logos/bakano-light.png'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const workspaces = ref<Workspace[]>([])
const isDropdownOpen = ref(false)

const currentWorkspaceId = computed(() => {
  return route.params.workspaceId as string || userStore.workspaceId || workspaces.value[0]?._id
})

const activeWorkspace = computed(() => {
  return workspaces.value.find(w => w._id === currentWorkspaceId.value)
})

async function fetchWorkspaces() {
  try {
    const res = await workspaceService.listWorkspaces()
    workspaces.value = res.workspaces
  } catch (e) {
    console.error('Error fetching workspaces for sidebar', e)
  }
}

onMounted(() => {
  fetchWorkspaces()
  document.addEventListener('click', closeDropdownOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnClickOutside)
})

function toggleDropdown(e: Event) {
  e.stopPropagation()
  isDropdownOpen.value = !isDropdownOpen.value
}

function selectWorkspace(ws: Workspace) {
  isDropdownOpen.value = false
  router.push({ name: 'WorkspaceDashboard', params: { workspaceId: ws._id } })
}

function closeDropdownOnClickOutside(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.app-layout__ws-selector')) {
    isDropdownOpen.value = false
  }
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    parent.classList.add('app-layout__ws-avatar--fallback')
  }
}

function logout(): void {
  userStore.clear()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="app-layout__brand">
        <img :src="logoDark" alt="Bakano" class="app-layout__logo" width="110" height="28" />
      </div>

      <!-- WORKSPACE SELECTOR -->
      <div v-if="activeWorkspace" class="app-layout__ws-selector">
        <button 
          class="app-layout__ws-button app-layout__ws-button--interactive"
          @click="toggleDropdown"
        >
          <div class="app-layout__ws-avatar">
            <img 
              v-if="activeWorkspace.metaAds?.pageId" 
              :src="`https://graph.facebook.com/${activeWorkspace.metaAds.pageId}/picture?type=normal`" 
              alt="Logo" 
              class="app-layout__ws-page-img"
              @error="handleImgError"
            />
            <span v-else>{{ activeWorkspace.name.substring(0, 2).toUpperCase() }}</span>
          </div>
          <div class="app-layout__ws-info">
            <span class="app-layout__ws-label">Entorno Actual</span>
            <span class="app-layout__ws-name">{{ activeWorkspace.name }}</span>
          </div>
          <i class="fa-solid fa-chevron-down app-layout__ws-chevron" :class="{ 'app-layout__ws-chevron--open': isDropdownOpen }" />
        </button>

        <Transition name="dropdown-fade">
          <div v-if="isDropdownOpen" class="app-layout__ws-dropdown">
            <button 
              v-for="ws in workspaces" 
              :key="ws._id" 
              class="app-layout__ws-option" 
              :class="{ 'app-layout__ws-option--active': ws._id === activeWorkspace._id }" 
              @click="selectWorkspace(ws)"
            >
               <div class="app-layout__ws-avatar app-layout__ws-avatar--sm">
                 <img 
                   v-if="ws.metaAds?.pageId" 
                   :src="`https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=small`" 
                   alt="Logo" 
                   class="app-layout__ws-page-img"
                   @error="handleImgError"
                 />
                 <span v-else>{{ ws.name.substring(0, 2).toUpperCase() }}</span>
               </div>
               <span class="app-layout__ws-option-name">{{ ws.name }}</span>
               <i v-if="ws._id === activeWorkspace._id" class="fa-solid fa-check" />
            </button>
          </div>
        </Transition>
      </div>

      <nav class="app-layout__nav">
        <RouterLink v-if="userStore.role === 'superadmin'" class="app-layout__nav-item" :to="{ name: 'SuperadminDashboard' }">
          <i class="fa-solid fa-grid-2" aria-hidden="true" />
          <span>Vista Global (Superadmin)</span>
        </RouterLink>
        
        <RouterLink v-if="activeWorkspace" class="app-layout__nav-item" :to="{ name: 'WorkspaceDashboard', params: { workspaceId: activeWorkspace._id } }">
          <i class="fa-solid fa-chart-line" aria-hidden="true" />
          <span>Dashboard Detallado</span>
        </RouterLink>

        <RouterLink v-if="activeWorkspace" class="app-layout__nav-item" :to="{ name: 'WorkspaceVisualDashboard', params: { workspaceId: activeWorkspace._id } }">
          <i class="fa-solid fa-chart-pie" aria-hidden="true" />
          <span>Analítica Visual</span>
        </RouterLink>

        <RouterLink v-if="activeWorkspace" class="app-layout__nav-item" :to="{ name: 'WorkspaceSettings', params: { workspaceId: activeWorkspace._id } }">
          <i class="fa-solid fa-gear" aria-hidden="true" />
          <span>Configuración</span>
        </RouterLink>
      </nav>

      <div class="app-layout__footer">
        <div class="app-layout__user">
          <div class="app-layout__user-avatar" aria-hidden="true">
            {{ userStore.name?.charAt(0).toUpperCase() || userStore.email?.charAt(0).toUpperCase() }}
          </div>
          <div class="app-layout__user-info">
            <span class="app-layout__user-email">{{ userStore.name || userStore.email }}</span>
            <span class="app-layout__user-role">{{ userStore.role === 'superadmin' ? 'Superadmin' : (userStore.role === 'admin' ? 'Admin / Owner' : 'Colaborador') }}</span>
          </div>
        </div>
        <button class="app-layout__logout" type="button" @click="logout" aria-label="Cerrar sesión" title="Cerrar sesión">
          <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
        </button>
      </div>
    </aside>

    <main class="app-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8f7f5;

  // ── Sidebar ────────────────────────────────────────────
  &__sidebar {
    display: none;
    flex-direction: column;
    width: 270px;
    flex-shrink: 0;
    background-color: $primary-dark;
    padding: 1.5rem 1rem;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;

    @media (min-width: 768px) {
      display: flex;
    }
  }

  &__brand {
    padding: 0.5rem 0.75rem 1.2rem;
    margin-bottom: 0.5rem;
  }

  &__logo {
    height: 26px;
    width: auto;
    display: block;
  }

  // ── Workspace Selector ─────────────────────────────────
  &__ws-selector {
    position: relative;
    margin-bottom: 1.5rem;
    padding: 0 0.5rem;
  }

  &__ws-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    background: rgba($white, 0.05);
    border: 1px solid rgba($white, 0.1);
    padding: 0.75rem;
    border-radius: 10px;
    text-align: left;
    color: $white;
    transition: all 0.2s;

    &--interactive {
      cursor: pointer;

      &:hover {
        background: rgba($white, 0.08);
        border-color: rgba($primary, 0.4);
      }
    }

    &:not(.app-layout__ws-button--interactive) {
      cursor: default;
    }
  }

  &__ws-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $white;
    overflow: hidden;
    flex-shrink: 0;

    &--sm {
      width: 28px;
      height: 28px;
      font-size: 0.75rem;
      border-radius: 6px;
    }

    &--fallback::after {
      content: attr(data-fallback);
    }
  }

  &__ws-page-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__ws-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__ws-label {
    font-size: 0.65rem;
    color: rgba($white, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.1rem;
  }

  &__ws-name {
    font-size: 0.9rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-chevron {
    font-size: 0.8rem;
    color: rgba($white, 0.4);
    transition: transform 0.2s;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__ws-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0.5rem;
    right: 0.5rem;
    background: $primary-dark;
    border: 1px solid rgba($white, 0.1);
    border-radius: 10px;
    padding: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 250px;
    overflow-y: auto;
  }

  &__ws-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.6rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba($white, 0.8);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;

    &:hover {
      background: rgba($white, 0.05);
      color: $white;
    }

    &--active {
      background: rgba($primary, 0.15);
      color: $primary-light;
      font-weight: 600;

      &:hover {
        background: rgba($primary, 0.2);
      }
    }

    .fa-check {
      margin-left: auto;
      color: $primary;
      font-size: 0.85rem;
    }
  }

  &__ws-option-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  // ── Nav ────────────────────────────────────────────────
  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    padding: 0 0.5rem;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: rgba($white, 0.6);
    font-size: 0.95rem;
    font-weight: 500;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    i {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    &:hover,
    &.router-link-active {
      background-color: rgba($white, 0.05);
      color: $white;
    }

    &.router-link-active {
      background-color: rgba($primary, 0.15);
      color: $primary-light;
      border-left: 3px solid $primary;
      border-radius: 0 8px 8px 0;
      padding-left: calc(1rem - 3px);
    }
  }

  // ── Footer / user info ─────────────────────────────────
  &__footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba($white, 0.08);
    margin-top: auto;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex: 1;
    min-width: 0;
  }

  &__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba($primary, 0.2);
    color: $primary;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__user-email {
    font-size: 0.75rem;
    color: $white;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-role {
    font-size: 0.7rem;
    color: rgba($white, 0.5);
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  &__logout {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba($text-light, 0.4);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    flex-shrink: 0;
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
      color: $alert-error;
      background-color: rgba($alert-error, 0.1);
    }
  }

  // ── Main ───────────────────────────────────────────────
  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
}

// Transitions
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
