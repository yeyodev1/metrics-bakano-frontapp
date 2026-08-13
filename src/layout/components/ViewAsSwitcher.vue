<template>
  <div class="vas">
    <button type="button" class="vas__trigger" :class="{ 'is-on': viewAs.activo }" @click="abierto = !abierto">
      <i class="fa-solid fa-eye" aria-hidden="true" />
      <span class="vas__trigger-text">
        <small>Ver como</small>
        <strong>{{ viewAs.activo ? viewAs.etiqueta : 'Yo (Superadmin)' }}</strong>
      </span>
      <i class="fa-solid fa-chevron-down vas__chevron" :class="{ 'is-open': abierto }" aria-hidden="true" />
    </button>

    <div v-if="abierto" class="vas__panel">
      <button type="button" class="vas__option" :class="{ 'is-current': !viewAs.activo }" @click="salir">
        <i class="fa-solid fa-user-shield" aria-hidden="true" /> Yo (Superadmin)
      </button>

      <p class="vas__group">Por rol</p>
      <button
        v-for="rol in ROLES"
        :key="rol"
        type="button"
        class="vas__option"
        :class="{ 'is-current': viewAs.rol === rol && !viewAs.persona }"
        @click="elegirRol(rol)"
      >
        {{ ROLES_INTERNOS[rol] }}
      </button>

      <p class="vas__group">Por persona</p>
      <input v-model="busqueda" class="vas__search" type="search" placeholder="Buscar por nombre…" />
      <p v-if="cargando" class="vas__vacio">Cargando…</p>
      <p v-else-if="!personasFiltradas.length" class="vas__vacio">Sin resultados</p>
      <button
        v-for="p in personasFiltradas.slice(0, 8)"
        :key="p.id"
        type="button"
        class="vas__option"
        :class="{ 'is-current': viewAs.persona?.id === p.id }"
        @click="elegirPersona(p)"
      >
        {{ p.name }}
        <small v-if="p.internalRole">{{ ROLES_INTERNOS[p.internalRole] || p.internalRole }}</small>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useViewAsStore, ROLES_INTERNOS, type PersonaVista } from '@/stores/viewAs'
import { workspaceService } from '@/services/workspace.service'

const viewAs = useViewAsStore()

const abierto = ref(false)
const busqueda = ref('')
const personas = ref<PersonaVista[]>([])
const cargando = ref(false)
let cargado = false

/** Los roles que de verdad cambian lo que se ve en el menú. */
const ROLES = [
  'trafficker',
  'project_manager',
  'editor',
  'content_manager',
  'productor',
  'sales_executive',
]

const personasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return personas.value
  return personas.value.filter((p) => p.name.toLowerCase().includes(q))
})

// El equipo se carga solo al abrir el panel: no tiene sentido pedirlo en cada
// carga de la app para un desplegable que casi nunca se abre.
watch(abierto, async (estaAbierto) => {
  if (!estaAbierto || cargado) return
  cargando.value = true
  try {
    const { users } = await workspaceService.listAllCollaborators()
    personas.value = users
      .filter((u: any) => u.isInternal)
      .map((u: any) => ({
        id: u._id,
        name: u.name || u.email,
        internalRole: u.internalRole ?? null,
        isInternal: true,
        role: u.role ?? 'user',
      }))
    cargado = true
  } catch {
    personas.value = []
  } finally {
    cargando.value = false
  }
})

function elegirRol(rol: string) {
  viewAs.verComoRol(rol)
  abierto.value = false
}

function elegirPersona(p: PersonaVista) {
  viewAs.verComoPersona(p)
  abierto.value = false
}

function salir() {
  viewAs.salir()
  abierto.value = false
}
</script>

<style lang="scss" scoped>
.vas {
  position: relative;
}

.vas__trigger {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  color: rgba($white, 0.75);
  text-align: left;
  background: rgba($white, 0.05);
  border: 1px solid rgba($white, 0.1);
  border-radius: 10px;
  cursor: pointer;

  &:hover { background: rgba($white, 0.09); }

  // Encendido se nota: si no, es facilísimo olvidar que el menú está filtrado.
  &.is-on {
    color: $white;
    background: rgba(#d97706, 0.16);
    border-color: rgba(#d97706, 0.5);
  }
}

.vas__trigger-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  small { font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; }
  strong { font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.vas__chevron {
  font-size: 0.65rem;
  transition: transform 0.18s;

  &.is-open { transform: rotate(180deg); }
}

.vas__panel {
  position: absolute;
  z-index: 40;
  top: calc(100% + 0.35rem);
  right: 0;
  left: 0;
  max-height: 20rem;
  padding: 0.4rem;
  overflow-y: auto;
  background: #241d33;
  border: 1px solid rgba($white, 0.12);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.vas__group {
  margin: 0.5rem 0 0.25rem;
  padding: 0 0.5rem;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: rgba($white, 0.35);
  text-transform: uppercase;
}

.vas__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  font-family: inherit;
  font-size: 0.8rem;
  color: rgba($white, 0.8);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  small { margin-left: auto; font-size: 0.65rem; opacity: 0.55; }

  &:hover { background: rgba($white, 0.08); }
  &.is-current { color: $white; background: rgba($primary, 0.25); }
}

.vas__search {
  width: 100%;
  padding: 0.45rem 0.6rem;
  margin-bottom: 0.25rem;
  font-family: inherit;
  font-size: 0.78rem;
  color: $white;
  background: rgba($white, 0.06);
  border: 1px solid rgba($white, 0.12);
  border-radius: 8px;
  outline: none;

  &::placeholder { color: rgba($white, 0.35); }
}

.vas__vacio {
  padding: 0.5rem 0.6rem;
  margin: 0;
  font-size: 0.75rem;
  color: rgba($white, 0.4);
}
</style>
