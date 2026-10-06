<template>
  <section v-if="cargado && estado" class="fpc">
    <header class="fpc__hero" :class="{ 'is-on': activa }">
      <div class="fpc__hero-icon">
        <i :class="activa ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" />
      </div>
      <div class="fpc__hero-text">
        <h3>Quién ve tus ventas</h3>
        <p v-if="activa">
          Privada. Solo las personas marcadas ven la facturación, el ROAS y reciben los correos y mensajes de ventas.
        </p>
        <p v-else>Todas las personas de este entorno ven la facturación y el ROAS.</p>
      </div>
      <button
        v-if="estado.puedoEditar"
        type="button"
        role="switch"
        :aria-checked="activa"
        :aria-label="activa ? 'Hacer visible para todos' : 'Hacer privada'"
        :class="['fpc__switch', { 'is-on': activa }]"
        @click="activa = !activa"
      >
        <span class="fpc__switch-track"><span class="fpc__switch-knob" /></span>
        <span class="fpc__switch-label">{{ activa ? 'Privada' : 'Para todos' }}</span>
      </button>
    </header>

    <template v-if="estado.puedoEditar && activa">
      <p class="fpc__hint">Marca quién puede verlas. El equipo de Bakano las sigue viendo para manejar tu pauta.</p>
      <ul class="fpc__list">
        <li v-for="u in estado.usuarios" :key="u.id">
          <label class="fpc__person">
            <input v-model="seleccion" type="checkbox" :value="u.id" />
            <span class="fpc__person-name">{{ u.nombre }}</span>
            <span class="fpc__person-meta">{{ u.email }} · {{ u.rol === 'admin' ? 'Administrador' : 'Colaborador' }}</span>
          </label>
        </li>
      </ul>
    </template>

    <p v-if="!estado.puedoEditar && estado.activa" class="fpc__hint">
      <i class="fa-solid fa-circle-info" /> Solo un administrador que ve las ventas puede cambiar esto.
    </p>

    <div v-if="estado.puedoEditar && hayCambios" class="fpc__actions">
      <button type="button" class="fpc__save" :disabled="guardando || (activa && !seleccion.length)" @click="guardar">
        <i :class="guardando ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
        Guardar
      </button>
      <span v-if="activa && !seleccion.length" class="fpc__warn">Marca al menos una persona.</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { workspaceService, type FacturacionPrivada } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ workspaceId: string }>()
const toast = useToast()

const estado = ref<FacturacionPrivada | null>(null)
const cargado = ref(false)
const activa = ref(false)
const seleccion = ref<string[]>([])
const guardando = ref(false)

const hayCambios = computed(() => {
  if (!estado.value) return false
  const antes = [...(estado.value.visiblePara ?? [])].sort().join(',')
  return activa.value !== estado.value.activa || (activa.value && antes !== [...seleccion.value].sort().join(','))
})

async function cargar() {
  try {
    estado.value = await workspaceService.getFacturacionPrivada(props.workspaceId)
    activa.value = estado.value.activa
    seleccion.value = [...(estado.value.visiblePara ?? [])]
  } catch {
    estado.value = null
  } finally {
    cargado.value = true
  }
}

async function guardar() {
  guardando.value = true
  try {
    await workspaceService.putFacturacionPrivada(props.workspaceId, { activa: activa.value, visiblePara: seleccion.value })
    toast.success(activa.value ? 'Listo: tus ventas ahora son privadas.' : 'Listo: todo el entorno ve las ventas.')
    await cargar()
  } catch (e: any) {
    toast.error(e?.message || 'No se pudo guardar.')
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<style lang="scss" scoped>
.fpc {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__hero {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    background: #fafafa;
    border: 1px solid rgba($primary-dark, 0.06);
    flex-wrap: wrap;

    &.is-on {
      background: rgba(#16a34a, 0.05);
      border-color: rgba(#16a34a, 0.2);
    }
  }

  &__hero-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    color: #16a34a;
    background: rgba(#16a34a, 0.1);
  }

  &__hero-text {
    flex: 1;
    min-width: 200px;

    h3 { margin: 0 0 0.25rem; font-size: 1.05rem; color: $primary-dark; }
    p { margin: 0; color: $text-secondary; font-size: 0.9rem; }
  }

  &__switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: 0;
    cursor: pointer;
    padding: 0;
  }

  &__switch-track {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: rgba($primary-dark, 0.15);
    position: relative;
    transition: background 0.2s ease;
  }

  &__switch-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;
  }

  &__switch.is-on &__switch-track { background: #16a34a; }
  &__switch.is-on &__switch-knob { transform: translateX(20px); }

  &__switch-label { font-size: 0.85rem; font-weight: 600; color: $primary-dark; }

  &__hint {
    margin: 0;
    font-size: 0.88rem;
    color: $text-secondary;

    i { color: #2563eb; margin-right: 0.25rem; }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__person {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba($primary-dark, 0.08);
    cursor: pointer;

    input { grid-row: span 2; width: 18px; height: 18px; accent-color: #16a34a; }
  }

  &__person-name { font-weight: 600; color: $primary-dark; font-size: 0.92rem; }
  &__person-meta { font-size: 0.8rem; color: $text-secondary; overflow-wrap: anywhere; }

  &__actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

  &__save {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.1rem;
    border-radius: 10px;
    border: 0;
    background: $primary-dark;
    color: #fff;
    font-weight: 600;
    cursor: pointer;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__warn { font-size: 0.85rem; color: #b45309; }
}
</style>
