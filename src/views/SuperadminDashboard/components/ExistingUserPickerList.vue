<script setup lang="ts">
import type { WorkspaceUser } from '@/types'

/**
 * Lista visible y seleccionable de usuarios externos. Es una lista y no un
 * dropdown a proposito: el desplegable se recortaba contra el borde del modal
 * y solo dejaba ver dos o tres personas.
 */
defineProps<{ users: WorkspaceUser[] }>()

const selectedId = defineModel<string | undefined>('selectedId', { default: undefined })

/** Entornos actuales del usuario, para reconocerlo rapido (max 2 + resto). */
function entornosDe(u: WorkspaceUser): { visibles: string[]; resto: number } {
  const nombres = (u.workspaces ?? [])
    .map((w) => (typeof w.workspaceId === 'object' ? w.workspaceId?.name : ''))
    .filter(Boolean) as string[]
  return { visibles: nombres.slice(0, 2), resto: Math.max(0, nombres.length - 2) }
}

function inicial(u: WorkspaceUser): string {
  return (u.name || u.email).charAt(0).toUpperCase()
}

function toggle(id: string) {
  selectedId.value = selectedId.value === id ? undefined : id
}
</script>

<template>
  <p v-if="users.length === 0" class="eupl__empty">
    No hay usuarios externos que coincidan.
  </p>
  <ul v-else class="eupl">
    <li v-for="u in users" :key="u._id">
      <button
        type="button"
        class="eupl__row"
        :class="{ 'is-selected': selectedId === u._id }"
        @click="toggle(u._id)"
      >
        <span class="eupl__avatar">{{ inicial(u) }}</span>
        <span class="eupl__info">
          <span class="eupl__name">{{ u.name || u.email }}</span>
          <span class="eupl__email">{{ u.email }}</span>
        </span>
        <span class="eupl__wss">
          <span v-for="nombre in entornosDe(u).visibles" :key="nombre" class="eupl__ws">{{ nombre }}</span>
          <span v-if="entornosDe(u).resto > 0" class="eupl__ws eupl__ws--more">+{{ entornosDe(u).resto }}</span>
        </span>
        <i v-if="selectedId === u._id" class="fa-solid fa-circle-check eupl__check" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.eupl {
  list-style: none;
  margin: 0;
  padding: 0 0.2rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  // Scroll interno propio: nada que recortar contra el borde del modal.
  max-height: min(320px, 38vh);
  overflow-y: auto;
}

.eupl__empty {
  font-size: 0.82rem;
  color: $text-secondary;
  padding: 1rem 0.25rem;
  text-align: center;
}

.eupl__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 11px;
  background: $white;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;

  &:hover { border-color: rgba($primary-dark, 0.25); }

  &.is-selected {
    border-color: $primary;
    background: rgba($primary, 0.05);
  }
}

.eupl__avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba($secondary, 0.12);
  color: $secondary-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 800;
  flex-shrink: 0;
}

.eupl__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.eupl__name {
  font-size: 0.84rem;
  font-weight: 700;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eupl__email {
  font-size: 0.72rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// En que entornos ya esta: es como se reconoce al "Carlos" correcto.
.eupl__wss {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  max-width: 40%;
  overflow: hidden;
}

.eupl__ws {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.14rem 0.5rem;
  border-radius: 999px;
  background: rgba($primary, 0.08);
  color: $primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;

  &--more { background: rgba($primary-dark, 0.07); color: $text-secondary; }
}

.eupl__check {
  color: $primary;
  font-size: 0.95rem;
  flex-shrink: 0;
}
</style>
