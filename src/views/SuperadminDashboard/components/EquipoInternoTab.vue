<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'

/**
 * El equipo interno de Bakano: quién es, qué rol tiene y si sigue activo.
 *
 * Hasta ahora el rol solo se podía corregir tocando la base de datos, así que
 * alguien ascendido de asistente a editor seguía apareciendo con el rol viejo
 * en todo Metrics. Y dar de baja a alguien no tenía dónde hacerse.
 */
const confirm = useConfirm()
const toast = useToast()

const usuarios = ref<any[]>([])
const cargando = ref(false)
const guardando = ref<string | null>(null)

const ROLES = [
  'director', 'estratega', 'project_manager', 'content_manager', 'account_manager',
  'community_manager', 'productor', 'asistente_produccion', 'editor', 'disenador',
  'copywriter', 'analista', 'desarrollador', 'trafficker', 'sales_executive',
]

const activos = computed(() => usuarios.value.filter((u) => u.isActive !== false))
const inactivos = computed(() => usuarios.value.filter((u) => u.isActive === false))

async function cargar(): Promise<void> {
  cargando.value = true
  try {
    const { users } = await workspaceService.listInternalUsers()
    usuarios.value = users ?? []
  } catch {
    toast.error('No se pudo cargar el equipo.')
  } finally {
    cargando.value = false
  }
}

async function cambiarRol(user: any, rol: string): Promise<void> {
  guardando.value = user._id
  try {
    await workspaceService.updateInternalUser(user._id, { internalRole: rol })
    user.internalRole = rol
    toast.success(`${user.name || user.email} ahora es ${rol.replace(/_/g, ' ')}.`)
  } catch {
    toast.error('No se pudo cambiar el rol.')
  } finally {
    guardando.value = null
  }
}

/** Dar de baja conserva su historial; eliminar lo borra de verdad. */
async function alternarActivo(user: any): Promise<void> {
  const activar = user.isActive === false
  guardando.value = user._id
  try {
    await workspaceService.updateInternalUser(user._id, { isActive: activar })
    user.isActive = activar
    toast.success(activar ? 'Persona reactivada.' : 'Persona dada de baja. Su historial se conserva.')
  } catch {
    toast.error('No se pudo actualizar.')
  } finally {
    guardando.value = null
  }
}

async function eliminar(user: any): Promise<void> {
  const ok = await confirm.confirm({
    title: `¿Eliminar a ${user.name || user.email}?`,
    message:
      'Esto borra la cuenta de forma permanente y no se puede deshacer. ' +
      'Si aparece en planificaciones o notificaciones, esas referencias quedarán sin nombre. ' +
      'Si solo quieres que deje de tener acceso, usa "Dar de baja".',
    confirmText: 'Sí, eliminar para siempre',
    cancelText: 'Cancelar',
    requireHold: true,
  })
  if (!ok) return

  guardando.value = user._id
  try {
    await workspaceService.deleteInternalUser(user._id)
    usuarios.value = usuarios.value.filter((u) => u._id !== user._id)
    toast.success('Persona eliminada.')
  } catch {
    toast.error('No se pudo eliminar.')
  } finally {
    guardando.value = null
  }
}

onMounted(cargar)
</script>

<template>
  <section class="eq">
    <header class="eq__head">
      <div>
        <h2 class="eq__title">Equipo Bakano</h2>
        <p class="eq__sub">
          {{ activos.length }} activos<span v-if="inactivos.length"> · {{ inactivos.length }} dados de baja</span>.
          Cambia el rol con el selector; los superadmins pueden dar de baja o eliminar.
        </p>
      </div>
      <button class="eq__btn" :disabled="cargando" @click="cargar">
        <i class="fa-solid fa-rotate" /> Actualizar
      </button>
    </header>

    <p v-if="cargando" class="eq__vacio">Cargando…</p>
    <p v-else-if="!usuarios.length" class="eq__vacio">Todavía no hay nadie del equipo cargado.</p>

    <div v-for="u in usuarios" :key="u._id" class="eq__fila" :class="{ 'is-baja': u.isActive === false }">
      <div class="eq__persona">
        <strong>{{ u.name || '(sin nombre)' }}</strong>
        <span class="eq__correo">{{ u.email }}</span>
        <span v-if="u.isActive === false" class="eq__tag">dado de baja</span>
      </div>

      <select
        class="eq__select"
        :value="u.internalRole || ''"
        :disabled="guardando === u._id"
        @change="cambiarRol(u, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Sin rol</option>
        <option v-for="rol in ROLES" :key="rol" :value="rol">{{ rol.replace(/_/g, ' ') }}</option>
      </select>

      <div class="eq__acciones">
        <button class="eq__btn" :disabled="guardando === u._id" @click="alternarActivo(u)">
          {{ u.isActive === false ? 'Reactivar' : 'Dar de baja' }}
        </button>
        <button class="eq__btn eq__btn--peligro" :disabled="guardando === u._id" @click="eliminar(u)">
          Eliminar
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.eq {
  padding: 1rem 0;

  &__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  &__title { margin: 0; font-size: 1.15rem; font-weight: 700; }
  &__sub { margin: 0.2rem 0 0; color: #6b7280; font-size: 0.85rem; }
  &__vacio { color: #6b7280; padding: 1.5rem 0; }

  &__fila {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.7rem 0.9rem;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    margin-bottom: 0.5rem;
    background: #fff;

    &.is-baja { opacity: 0.6; }
  }

  &__persona { display: flex; flex-direction: column; min-width: 220px; flex: 1; }
  &__correo { color: #6b7280; font-size: 0.82rem; }
  &__tag { font-size: 0.7rem; color: #92400e; background: #fef3c7; border-radius: 999px; padding: 0.1rem 0.5rem; width: fit-content; margin-top: 0.2rem; }

  &__select {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    background: #fff;
  }

  &__acciones { display: flex; gap: 0.4rem; margin-left: auto; }

  &__btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    padding: 0.4rem 0.8rem;
    font-size: 0.82rem;
    cursor: pointer;

    &--peligro { color: #b91c1c; border-color: #fecaca; }
    &:disabled { opacity: 0.5; cursor: default; }
  }
}
</style>
