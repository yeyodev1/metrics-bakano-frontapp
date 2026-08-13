<script setup lang="ts">
export type SuperadminTab =
  | 'workspaces'
  | 'account-admins'
  | 'superadmins'
  | 'planning'

defineProps<{ activeTab: SuperadminTab }>()
const emit = defineEmits<{ (e: 'switchTab', tab: SuperadminTab): void }>()

/**
 * Las cuatro pestañas, en una lista.
 *
 * Antes eran seis botones casi idénticos escritos a mano, cada uno con su
 * propio color de activo: rosa, rojo, ámbar... Seis acentos distintos no son
 * un sistema, son ruido. Ahora el activo se marca igual en todas y el color de
 * marca queda libre para significar algo.
 *
 * Ojo con los iconos: el proyecto carga Font Awesome **free**, y aquí había dos
 * nombres de la versión Pro. No se renderizaban: esas pestañas salían sin icono
 * y la fila quedaba dispareja.
 */
const TABS: Array<{ id: SuperadminTab; label: string; icon: string }> = [
  { id: 'workspaces', label: 'Entornos', icon: 'fa-solid fa-layer-group' },
  { id: 'account-admins', label: 'Admins de cuenta', icon: 'fa-solid fa-users-gear' },
  { id: 'superadmins', label: 'Superadmins', icon: 'fa-solid fa-user-shield' },
  { id: 'planning', label: 'Planificación', icon: 'fa-solid fa-calendar-days' },
]
</script>

<template>
  <nav class="sdt" aria-label="Secciones del panel">
    <button
      v-for="tab in TABS"
      :key="tab.id"
      type="button"
      class="sdt__tab"
      :class="{ 'is-active': activeTab === tab.id }"
      :aria-current="activeTab === tab.id ? 'page' : undefined"
      @click="emit('switchTab', tab.id)"
    >
      <i :class="tab.icon" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.sdt {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid rgba($primary-dark, 0.08);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.sdt__tab {
  position: relative;
  bottom: -2px;
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.9rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-secondary;
  white-space: nowrap;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;

  i {
    width: 1em;
    font-size: 0.9rem;
    text-align: center;
    opacity: 0.75;
  }

  &:hover {
    color: $primary-dark;
    background: rgba($primary-dark, 0.03);
  }

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: -2px;
  }

  &.is-active {
    font-weight: 700;
    color: $primary;
    border-bottom-color: $primary;

    i { opacity: 1; }
  }
}


@media (min-width: 640px) {
  .sdt__tab { padding: 0.75rem 1.1rem; font-size: 0.9rem; }
}
</style>
