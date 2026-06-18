<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Workspace } from '@/types'

// vClickOutside directive for workspace selection dropdown
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

const props = defineProps<{
  show: boolean
  filterWorkspaceId: string
  filterInternalRole: string
  workspaces: Workspace[]
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'update:filterWorkspaceId', val: string): void
  (e: 'update:filterInternalRole', val: string): void
  (e: 'clear'): void
}>()

const workspaceSearchText = ref('')
const isWorkspaceDropdownOpen = ref(false)

const localFilterWorkspaceId = computed({
  get: () => props.filterWorkspaceId,
  set: (val) => emit('update:filterWorkspaceId', val)
})

const localFilterInternalRole = computed({
  get: () => props.filterInternalRole,
  set: (val) => emit('update:filterInternalRole', val)
})

const filteredWorkspaces = computed(() => {
  if (!workspaceSearchText.value.trim()) return props.workspaces
  const query = workspaceSearchText.value.toLowerCase()
  return props.workspaces.filter(ws => ws.name.toLowerCase().includes(query))
})

const currentFilterWorkspaceName = computed(() => {
  const ws = props.workspaces.find(w => w._id === props.filterWorkspaceId)
  return ws ? ws.name : 'Todos los Entornos'
})

function clearAllFilters() {
  emit('clear')
  workspaceSearchText.value = ''
  isWorkspaceDropdownOpen.value = false
}
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="show" class="superadmin-dashboard__filter-drawer">
      <div class="superadmin-dashboard__filter-drawer-header">
        <h3>Filtros Avanzados</h3>
        <button @click="emit('update:show', false); workspaceSearchText = ''; isWorkspaceDropdownOpen = false">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
      <div class="superadmin-dashboard__filter-drawer-body">
        <div class="superadmin-dashboard__filter-item">
          <label>Filtrar por Entorno</label>
          <div class="superadmin-dashboard__searchable-select" v-click-outside="() => isWorkspaceDropdownOpen = false">
            <div 
              class="superadmin-dashboard__searchable-select-trigger" 
              @click="isWorkspaceDropdownOpen = !isWorkspaceDropdownOpen"
            >
              <span>{{ currentFilterWorkspaceName }}</span>
              <i class="fa-solid fa-chevron-down" :class="{ 'fa-rotate-180': isWorkspaceDropdownOpen }" />
            </div>
            
            <Transition name="fade-scale">
              <div v-if="isWorkspaceDropdownOpen" class="superadmin-dashboard__searchable-select-dropdown">
                <div class="superadmin-dashboard__dropdown-search" @click.stop>
                  <i class="fa-solid fa-magnifying-glass" />
                  <input 
                    v-model="workspaceSearchText" 
                    type="text" 
                    placeholder="Buscar entorno..." 
                  />
                </div>
                <ul class="superadmin-dashboard__dropdown-list">
                  <li 
                    :class="{ 'superadmin-dashboard__dropdown-item--active': filterWorkspaceId === '' }"
                    @click="localFilterWorkspaceId = ''; isWorkspaceDropdownOpen = false"
                  >
                    <i class="fa-solid fa-globe" />
                    Todos los Entornos
                  </li>
                  <li 
                    v-for="ws in filteredWorkspaces" 
                    :key="ws._id"
                    :class="{ 'superadmin-dashboard__dropdown-item--active': filterWorkspaceId === ws._id }"
                    @click="localFilterWorkspaceId = ws._id; isWorkspaceDropdownOpen = false"
                  >
                    <i class="fa-solid fa-building" />
                    {{ ws.name }}
                  </li>
                  <li v-if="filteredWorkspaces.length === 0" class="superadmin-dashboard__dropdown-item--empty">
                    No se encontraron entornos
                  </li>
                </ul>
              </div>
            </Transition>
          </div>
        </div>
        
        <div class="superadmin-dashboard__filter-item" style="margin-top: 16px;">
          <label>Filtrar por Rol Interno</label>
          <select
            v-model="localFilterInternalRole"
            class="superadmin-dashboard__filter-select"
          >
            <option value="">Todos los roles</option>
            <option value="trafficker">Trafficker</option>
            <option value="director">Director</option>
            <option value="estratega">Estratega</option>
            <option value="project_manager">Project Manager</option>
            <option value="content_manager">Content Manager</option>
            <option value="account_manager">Account Manager</option>
            <option value="community_manager">Community Manager</option>
            <option value="productor">Productor</option>
            <option value="asistente_produccion">Asistente de Producción</option>
            <option value="editor">Editor</option>
            <option value="disenador">Diseñador</option>
            <option value="copywriter">Copywriter</option>
            <option value="analista">Analista</option>
            <option value="desarrollador">Desarrollador</option>
          </select>
        </div>
      </div>
      <div class="superadmin-dashboard__filter-drawer-footer">
        <button class="superadmin-dashboard__btn-text" @click="clearAllFilters">
          <i class="fa-solid fa-trash-can" />
          Limpiar
        </button>
        <button class="superadmin-dashboard__btn-primary" @click="emit('update:show', false); workspaceSearchText = ''; isWorkspaceDropdownOpen = false">
          <i class="fa-solid fa-check" />
          Aplicar
        </button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__filter-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 350px;
  height: 100vh;
  background: $white;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  gap: 1.5rem;
}

.superadmin-dashboard__filter-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  padding-bottom: 1rem;

  h3 {
    font-size: 1.25rem;
    color: $primary-dark;
    margin: 0;
  }

  button {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: $text-secondary;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: $primary;
    }
  }
}

.superadmin-dashboard__filter-drawer-body {
  flex: 1;
  overflow-y: auto;
}

.superadmin-dashboard__filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $text-secondary;
  }
}

.superadmin-dashboard__searchable-select {
  position: relative;
  width: 100%;
}

.superadmin-dashboard__searchable-select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  font-size: 0.95rem;
  color: $primary-dark;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba($primary, 0.4);
    background: rgba($primary, 0.01);
  }

  i {
    font-size: 0.8rem;
    color: $text-secondary;
    transition: transform 0.3s;
  }
}

.superadmin-dashboard__searchable-select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: $white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba($primary-dark, 0.06);
  z-index: 1100;
  overflow: hidden;
}

.superadmin-dashboard__dropdown-search {
  position: relative;
  padding: 0.75rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  background: rgba($primary-dark, 0.02);

  i {
    position: absolute;
    left: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: $text-secondary;
    font-size: 0.85rem;
  }

  input {
    width: 100%;
    padding: 0.65rem 1rem 0.65rem 2.25rem;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: $primary;
      background: $white;
      box-shadow: 0 0 0 3px rgba($primary, 0.08);
    }
  }
}

.superadmin-dashboard__dropdown-list {
  list-style: none;
  padding: 0.5rem;
  margin: 0;
  max-height: 220px;
  overflow-y: auto;

  li {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.9rem;
    color: $text-secondary;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.2s;

    i {
      font-size: 0.9rem;
      opacity: 0.5;
    }

    &:hover {
      background: rgba($primary, 0.05);
      color: $primary;

      i {
        opacity: 1;
      }
    }

    &.superadmin-dashboard__dropdown-item--active {
      background: $primary;
      color: $white;
      font-weight: 600;

      i {
        color: $white;
        opacity: 1;
      }
    }

    &.superadmin-dashboard__dropdown-item--empty {
      justify-content: center;
      padding: 2rem 1rem;
      color: $text-secondary;
      font-style: italic;
      cursor: default;

      &:hover {
        background: none;
      }
    }
  }
}

.superadmin-dashboard__filter-select {
  width: 100%;
  border: 1.5px solid rgba($primary, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: $primary-dark;
  background: $white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $primary;
  }
}

.superadmin-dashboard__filter-drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba($primary-dark, 0.05);
}

.superadmin-dashboard__btn-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  color: $text-secondary;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba($alert-error, 0.05);
    color: $alert-error;
  }
}

.superadmin-dashboard__btn-primary {
  background: $primary;
  color: $white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: box-shadow 0.2s, opacity 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba($primary, 0.3);
    opacity: 0.95;
  }
}

// Transitions
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s, transform 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
