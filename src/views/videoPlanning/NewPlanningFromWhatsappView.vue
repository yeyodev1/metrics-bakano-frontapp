<script setup lang="ts">
/**
 * Aterrizaje del enlace de WhatsApp.
 *
 * La plantilla aprobada por Meta lleva una URL fija, sin ids
 * (`/app/workspaces/new-planning-from-whatsapp`), así que el enlace no puede
 * decir a qué planificación va. Esta pantalla lo resuelve: pregunta al backend
 * qué tiene pendiente de aprobar cada entorno del usuario y lo manda ahí.
 *
 * Si el usuario llega sin sesión, el guard del router lo lleva a login con
 * `?redirect=` y vuelve aquí solo.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { PlanificacionPendiente } from '@/types/videoPlanning'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const errorMsg = ref('')
const opciones = ref<PlanificacionPendiente[]>([])

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function etiquetaMes(p: PlanificacionPendiente): string {
  if (p.mes && p.anio) return `${MESES[p.mes - 1]} de ${p.anio}`
  return new Date(p.creadaEn).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
}

/** Todos los entornos del usuario, sin repetidos. El activo primero. */
function entornosDelUsuario(): string[] {
  const ids = new Set<string>()
  if (userStore.workspaceId) ids.add(userStore.workspaceId)
  for (const w of userStore.workspaces ?? []) {
    if (w.workspaceId) ids.add(w.workspaceId)
  }
  return [...ids]
}

function irA(p: PlanificacionPendiente) {
  router.replace({
    name: 'VideoPlanningClient',
    params: { workspaceId: p.workspaceId, entryId: p.planningEntryId },
  })
}

async function resolver() {
  loading.value = true
  errorMsg.value = ''
  opciones.value = []

  const entornos = entornosDelUsuario()
  if (!entornos.length) {
    loading.value = false
    errorMsg.value = 'No encontramos tu entorno. Vuelve a iniciar sesión e intenta de nuevo.'
    return
  }

  try {
    // Un entorno caído no debe tumbar los demás: cada consulta cae a null sola.
    const resultados = await Promise.all(
      entornos.map((id) => videoPlanningService.getPlanificacionPendiente(id).catch(() => null)),
    )
    const pendientes = resultados.filter((p): p is PlanificacionPendiente => !!p)

    // El caso normal: una sola planificación esperando. No se le muestra un
    // menú de un solo elemento, se le abre directo.
    if (pendientes.length === 1) {
      irA(pendientes[0])
      return
    }
    opciones.value = pendientes
  } catch {
    errorMsg.value = 'No pudimos abrir tu planificación. Intenta de nuevo en un momento.'
  } finally {
    loading.value = false
  }
}

function irAlInicio() {
  // `BillingRoas` es el tablero real del entorno: `workspaces/:workspaceId`
  // no es una vista, es un redirect hacia ahí.
  const id = userStore.workspaceId
  if (id) router.replace({ name: 'BillingRoas', params: { workspaceId: id } })
  else router.replace({ name: 'AdminWorkspaces' })
}

onMounted(resolver)
</script>

<template>
  <div class="wa-landing">
    <!-- Resolviendo -->
    <div v-if="loading" class="wa-landing__state">
      <div class="wa-landing__spinner" />
      <h3>Buscando tu planificación</h3>
      <p>Un momento, estamos abriendo los videos que tienes por aprobar.</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="wa-landing__state">
      <div class="wa-landing__icon wa-landing__icon--error">
        <i class="fa-solid fa-triangle-exclamation" />
      </div>
      <h3>Algo salió mal</h3>
      <p>{{ errorMsg }}</p>
      <div class="wa-landing__actions">
        <button class="wa-landing__btn" @click="resolver">
          <i class="fa-solid fa-rotate-right" /> Reintentar
        </button>
        <button class="wa-landing__btn wa-landing__btn--ghost" @click="irAlInicio">
          Ir a mi tablero
        </button>
      </div>
    </div>

    <!-- Nada pendiente -->
    <div v-else-if="!opciones.length" class="wa-landing__state">
      <div class="wa-landing__icon"><i class="fa-solid fa-circle-check" /></div>
      <h3>No tienes videos por aprobar</h3>
      <p>Ya revisaste todo lo que te enviamos. Te avisamos cuando llegue la próxima planificación.</p>
      <div class="wa-landing__actions">
        <button class="wa-landing__btn" @click="irAlInicio">Ir a mi tablero</button>
      </div>
    </div>

    <!-- Más de un entorno con planificación esperando -->
    <div v-else class="wa-landing__picker">
      <div class="wa-landing__icon"><i class="fa-solid fa-film" /></div>
      <h3>¿Cuál quieres revisar?</h3>
      <p>Tienes {{ opciones.length }} planificaciones esperando tu aprobación.</p>

      <ul class="wa-landing__list">
        <li v-for="p in opciones" :key="p.planningId">
          <button class="wa-landing__card" @click="irA(p)">
            <div class="wa-landing__card-text">
              <strong>Planificación de {{ etiquetaMes(p) }}</strong>
              <span>{{ p.pendientes }} de {{ p.totalVideos }} videos por aprobar</span>
            </div>
            <i class="fa-solid fa-arrow-right" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wa-landing {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;

  &__state,
  &__picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    max-width: 460px;
    width: 100%;
  }

  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: $primary-dark;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: $text-secondary;
    line-height: 1.5;
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba($primary, 0.15);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 0.5rem;
  }

  &__icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: rgba($primary, 0.07);
    border: 2px dashed rgba($primary, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    color: $primary;
    opacity: 0.8;
    margin-bottom: 0.5rem;

    &--error {
      background: rgba(#ef4444, 0.07);
      border-color: rgba(#ef4444, 0.25);
      color: #ef4444;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 0.75rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: $primary;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 0.7rem 1.25rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover { opacity: 0.88; }

    &--ghost {
      background: transparent;
      color: $text-secondary;
      border: 1px solid rgba($text-secondary, 0.25);
    }
  }

  &__list {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__card {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    text-align: left;
    background: #fff;
    border: 1px solid rgba($primary, 0.15);
    border-radius: 14px;
    padding: 0.9rem 1.1rem;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease;

    &:hover {
      border-color: $primary;
      transform: translateY(-1px);
    }

    i { color: $primary; font-size: 0.85rem; }
  }

  &__card-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    strong { font-size: 0.9rem; font-weight: 800; color: $primary-dark; }
    span   { font-size: 0.78rem; color: $text-secondary; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
