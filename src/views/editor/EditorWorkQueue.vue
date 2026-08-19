<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { EditorQueue, EditorQueueItem } from '@/services/videoPlanning.service'

/**
 * La cola de trabajo del editor: que re-editar (con el motivo a la vista),
 * que editar y que master falta subir a Drive. Ordenada por lo que publica
 * antes, porque esa es la presion real del dia.
 */
const props = defineProps<{ queue: EditorQueue | null; loading: boolean }>()

const router = useRouter()

interface Seccion {
  id: string
  titulo: string
  tono: 'danger' | 'primary' | 'warn'
  items: EditorQueueItem[]
  vacio: string
}

const secciones = computed<Seccion[]>(() => [
  {
    id: 're-editar',
    titulo: 'Re-editar',
    tono: 'danger',
    items: props.queue?.reEditar ?? [],
    vacio: 'Nada rechazado. Sigue así.',
  },
  {
    id: 'por-editar',
    titulo: 'Por editar',
    tono: 'primary',
    items: props.queue?.porEditar ?? [],
    vacio: 'Sin material grabado esperando edición.',
  },
  {
    id: 'por-subir',
    titulo: 'Por subir master a Drive',
    tono: 'warn',
    items: props.queue?.porSubirMaster ?? [],
    vacio: 'Todos los editados tienen su master en Drive.',
  },
])

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

/** "Publica en 2 días" / "Publica el 28 ago" / null si no hay fecha. */
function etiquetaFecha(item: EditorQueueItem): { texto: string; urgente: boolean } | null {
  if (!item.fechaPublicacion) return null
  const fecha = new Date(item.fechaPublicacion)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dia = new Date(fecha)
  dia.setHours(0, 0, 0, 0)
  const diff = Math.round((dia.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { texto: `Venció hace ${-diff} d`, urgente: true }
  if (diff === 0) return { texto: 'Publica HOY', urgente: true }
  if (diff <= 3) return { texto: `Publica en ${diff} d`, urgente: true }
  const corta = fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
  return { texto: `Publica el ${corta}`, urgente: false }
}

function abrir(item: EditorQueueItem) {
  router.push({
    name: 'EditorVideoPlanning',
    params: { workspaceId: item.workspaceId, entryId: item.entryId },
  })
}
</script>

<template>
  <div class="ewq">
    <div v-if="loading" class="ewq__loading"><span class="ewq__spinner" /></div>

    <template v-else>
      <section v-for="seccion in secciones" :key="seccion.id" class="ewq__section">
        <div class="ewq__section-head">
          <span class="ewq__dot" :class="`ewq__dot--${seccion.tono}`" />
          <h2 class="ewq__section-title">{{ seccion.titulo }}</h2>
          <span class="ewq__count" :class="`ewq__count--${seccion.tono}`">{{ seccion.items.length }}</span>
        </div>

        <p v-if="seccion.items.length === 0" class="ewq__vacio">
          <i class="fa-solid fa-circle-check" /> {{ seccion.vacio }}
        </p>

        <div v-else class="ewq__cards">
          <article
            v-for="item in seccion.items"
            :key="item.itemId"
            class="ewq__card"
            :class="`ewq__card--${seccion.tono}`"
          >
            <div class="ewq__card-top">
              <div class="ewq__avatar">{{ iniciales(item.workspaceName) }}</div>
              <div class="ewq__info">
                <span class="ewq__tema">{{ item.workspaceName }} · #{{ String(item.numero).padStart(2, '0') }} {{ item.tema }}</span>
                <span v-if="seccion.id === 're-editar' && item.motivoRechazo" class="ewq__motivo">
                  <i class="fa-solid fa-circle-xmark" /> {{ item.motivoRechazo }}
                </span>
                <span v-else-if="seccion.id === 'por-subir'" class="ewq__sub">
                  <i class="fa-solid fa-circle-check" /> Editado · falta el archivo maestro del cliente
                </span>
                <span v-else class="ewq__sub">Material grabado · guion listo</span>
              </div>
              <span
                v-if="etiquetaFecha(item)"
                class="ewq__fecha"
                :class="{ 'ewq__fecha--urgente': etiquetaFecha(item)!.urgente }"
              >
                <i class="fa-regular fa-clock" /> {{ etiquetaFecha(item)!.texto }}
              </span>
              <button
                class="ewq__btn"
                :class="seccion.id === 'por-subir' ? 'ewq__btn--drive' : ''"
                type="button"
                @click="abrir(item)"
              >
                <i :class="seccion.id === 'por-subir' ? 'fa-solid fa-cloud-arrow-up' : 'fa-solid fa-arrow-right'" />
                {{ seccion.id === 'por-subir' ? 'Subir a Drive' : 'Abrir' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <div class="ewq__listos">
        <span class="ewq__dot ewq__dot--ok" />
        <span class="ewq__listos-label">Listos este mes</span>
        <span class="ewq__count ewq__count--ok">{{ queue?.listosCount ?? 0 }}</span>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// Mobile-first: todo apilado; los botones crecen a fila en pantallas anchas.
.ewq {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.ewq__loading { display: flex; justify-content: center; padding: 3rem 0; }

.ewq__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(#6366f1, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: ewq-spin 0.8s linear infinite;
}

.ewq__section { display: flex; flex-direction: column; gap: 0.55rem; }

.ewq__section-head { display: flex; align-items: center; gap: 0.5rem; }

.ewq__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &--danger { background: $alert-error; }
  &--primary { background: #6366f1; }
  &--warn { background: #d97706; }
  &--ok { background: $alert-success; }
}

.ewq__section-title {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: $primary-dark;
}

.ewq__count {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;

  &--danger { background: $alert-error-bg; color: $alert-error; }
  &--primary { background: rgba(#6366f1, 0.1); color: #6366f1; }
  &--warn { background: rgba(#d97706, 0.1); color: #b45309; }
  &--ok { background: rgba($alert-success, 0.1); color: darken($alert-success, 8%); }
}

.ewq__vacio {
  font-size: 0.82rem;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-left: 0.2rem;

  i { color: $alert-success; font-size: 0.78rem; }
}

.ewq__cards { display: flex; flex-direction: column; gap: 0.55rem; }

.ewq__card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 13px;
  padding: 0.8rem 0.9rem;

  &--danger { border-color: rgba($alert-error, 0.3); }
  &--warn { border-color: rgba(#d97706, 0.3); }
}

.ewq__card-top {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.ewq__avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(#6366f1, 0.1);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
}

.ewq__info {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ewq__tema { font-size: 0.88rem; font-weight: 800; color: $primary-dark; }

.ewq__motivo {
  font-size: 0.76rem;
  font-weight: 600;
  color: $alert-error;
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;

  i { margin-top: 0.15rem; font-size: 0.7rem; }
}

.ewq__sub {
  font-size: 0.76rem;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 0.35rem;

  i { color: $alert-success; font-size: 0.7rem; }
}

.ewq__fecha {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  flex-shrink: 0;

  &--urgente { color: #b45309; background: rgba(#d97706, 0.1); }
}

.ewq__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #6366f1;
  color: $white;
  border: none;
  border-radius: 9px;
  padding: 0.55rem 0.95rem;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;

  i { font-size: 0.7rem; }

  &:hover { filter: brightness(1.08); }

  &--drive { background: #1ea362; }
}

.ewq__listos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.2rem 0.5rem;
}

.ewq__listos-label {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: $text-secondary;
}

@keyframes ewq-spin { to { transform: rotate(360deg); } }
</style>
