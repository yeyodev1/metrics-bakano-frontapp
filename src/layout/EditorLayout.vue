<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'
import DriveUploadTray from '@/components/common/DriveUploadTray.vue'
import logoDark from '@/assets/logos/bakano-light.png'

const router = useRouter()
const userStore = useUserStore()
const confirm = useConfirm()

async function logout() {
  const ok = await confirm.confirm({
    title: '¿Cerrar sesión?',
    message: 'Tendrás que iniciar sesión nuevamente.',
    confirmText: 'Sí, salir',
    cancelText: 'Cancelar',
    requireHold: true,
  })
  if (ok) {
    userStore.clear()
    router.push({ name: 'AuthLogin' })
  }
}
</script>

<template>
  <div class="el-shell">
    <!-- Top bar solo movil: la sidebar fija de 260px aplastaba el contenido -->
    <header class="el-shell__topbar">
      <img :src="logoDark" alt="Bakano" width="88" />
      <span class="el-shell__topbar-role"><i class="fa-solid fa-film" /> Editor</span>
      <button class="el-shell__logout" @click="logout" title="Cerrar sesión">
        <i class="fa-solid fa-arrow-right-from-bracket" />
      </button>
    </header>

    <aside class="el-shell__sidebar">
      <div class="el-shell__logo">
        <img :src="logoDark" alt="Bakano" width="110" />
      </div>

      <div class="el-shell__role-badge">
        <i class="fa-solid fa-film" />
        <span>Editor de Contenido</span>
      </div>

      <nav class="el-shell__nav">
        <div class="el-shell__nav-item el-shell__nav-item--active">
          <i class="fa-solid fa-film" />
          <span>Panel Editor</span>
        </div>
      </nav>

      <div class="el-shell__footer">
        <div class="el-shell__user">
          <div class="el-shell__user-avatar">
            {{ userStore.name?.charAt(0).toUpperCase() || userStore.email?.charAt(0).toUpperCase() }}
          </div>
          <div class="el-shell__user-info">
            <span class="el-shell__user-name">{{ userStore.name || userStore.email }}</span>
            <span class="el-shell__user-role">Editor</span>
          </div>
        </div>
        <button class="el-shell__logout" @click="logout" title="Cerrar sesión">
          <i class="fa-solid fa-arrow-right-from-bracket" />
        </button>
      </div>
    </aside>

    <main class="el-shell__content">
      <RouterView />
    </main>

    <!-- Subidas a Drive: sobrevive a la navegacion dentro del area editor -->
    <DriveUploadTray />
  </div>
</template>

<style lang="scss" scoped>
// Mobile-first: top bar arriba y contenido a lo ancho; la sidebar aparece
// desde 768px.
.el-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;

  @media (min-width: 768px) { flex-direction: row; }

  &__topbar {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    background: $primary-dark;
    padding: 0.7rem 1rem;

    img { display: block; }

    @media (min-width: 768px) { display: none; }
  }

  &__topbar-role {
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #a5b4fc;

    i { color: #818cf8; }
  }

  &__sidebar {
    display: none;
    width: 260px;
    flex-shrink: 0;
    background: $primary-dark;
    flex-direction: column;
    padding: 1.5rem 1rem;
    gap: 0;

    @media (min-width: 768px) { display: flex; }
  }

  &__logo {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;

    img { max-width: 110px; }
  }

  &__role-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: rgba(#6366f1, 0.15);
    border: 1px solid rgba(#6366f1, 0.3);
    border-radius: 10px;
    color: #a5b4fc;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 1.5rem;

    i { color: #818cf8; }
  }

  &__nav {
    flex: 1;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(white, 0.5);
    transition: all 0.2s;

    &--active {
      background: rgba(#6366f1, 0.2);
      border: 1px solid rgba(#6366f1, 0.35);
      color: #c7d2fe;

      i { color: #818cf8; }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(white, 0.04);
    border-radius: 12px;
    border: 1px solid rgba(white, 0.07);
    margin-top: 1rem;
  }

  &__user {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  &__user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(#6366f1, 0.3);
    border: 1px solid rgba(#6366f1, 0.4);
    color: #a5b4fc;
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

  &__user-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-role {
    font-size: 0.68rem;
    color: rgba(white, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__logout {
    border: none;
    background: rgba(white, 0.07);
    color: rgba(white, 0.45);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: rgba(#ef4444, 0.2);
      color: #fca5a5;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    @media (min-width: 768px) { overflow: hidden; }
  }
}
</style>
