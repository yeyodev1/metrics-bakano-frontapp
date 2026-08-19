<script setup lang="ts">
import { computed } from 'vue'
import type { EditorQueueItem } from '@/services/videoPlanning.service'

/**
 * Una tarjeta de la cola del editor. El modo decide el subtexto y la accion:
 * re-editar muestra el motivo del rechazo, por-subir empuja a Drive y listo
 * enlaza el master ya entregado.
 */
const props = defineProps<{
  item: EditorQueueItem
  modo: 're-editar' | 'por-editar' | 'por-subir' | 'listo'
  /** En las listas agrupadas el cliente ya esta en el encabezado del grupo. */
  mostrarWorkspace?: boolean
}>()

const emit = defineEmits<{ (e: 'abrir'): void }>()

const titulo = computed(() => {
  const num = `#${String(props.item.numero).padStart(2, '0')}`
  return props.mostrarWorkspace
    ? `${props.item.workspaceName} · ${num} ${props.item.tema}`
    : `${num} ${props.item.tema}`
})

/** "Publica HOY" / "Venció hace 2 d" / null si el video no tiene fecha. */
const fecha = computed<{ texto: string; urgente: boolean } | null>(() => {
  if (!props.item.fechaPublicacion) return null
  const dia = new Date(props.item.fechaPublicacion)
  dia.setHours(0, 0, 0, 0)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.round((dia.getTime() - hoy.getTime()) / 86_400_000)
  if (diff < 0) return { texto: `Venció hace ${-diff} d`, urgente: true }
  if (diff === 0) return { texto: 'Publica HOY', urgente: true }
  if (diff <= 3) return { texto: `Publica en ${diff} d`, urgente: true }
  const corta = new Date(props.item.fechaPublicacion).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
  })
  return { texto: `Publica el ${corta}`, urgente: false }
})
</script>

<template>
  <article class="eqc" :class="`eqc--${modo}`">
    <div class="eqc__row">
      <div class="eqc__info">
        <span class="eqc__tema">{{ titulo }}</span>
        <span v-if="modo === 're-editar' && item.motivoRechazo" class="eqc__motivo">
          <i class="fa-solid fa-circle-xmark" /> {{ item.motivoRechazo }}
        </span>
        <span v-else-if="modo === 'por-subir'" class="eqc__sub">
          <i class="fa-solid fa-circle-check" /> Editado · falta el archivo maestro del cliente
        </span>
        <span v-else-if="modo === 'listo'" class="eqc__sub">
          <i class="fa-solid fa-circle-check" /> Editado y entregado
        </span>
        <span v-else class="eqc__sub">Material grabado · guion listo</span>
      </div>

      <span v-if="fecha" class="eqc__fecha" :class="{ 'eqc__fecha--urgente': fecha.urgente }">
        <i class="fa-regular fa-clock" /> {{ fecha.texto }}
      </span>

      <template v-if="modo === 'listo'">
        <a
          v-if="item.driveLink"
          :href="item.driveLink"
          target="_blank"
          rel="noopener"
          class="eqc__link"
        >
          <i class="fa-brands fa-google-drive" /> Ver en Drive
        </a>
        <a
          v-if="item.driveMonthFolderLink"
          :href="item.driveMonthFolderLink"
          target="_blank"
          rel="noopener"
          class="eqc__link eqc__link--folder"
        >
          <i class="fa-regular fa-folder-open" /> Carpeta del mes
        </a>
      </template>
      <button
        v-else
        class="eqc__btn"
        :class="{ 'eqc__btn--drive': modo === 'por-subir' }"
        type="button"
        @click="emit('abrir')"
      >
        <i :class="modo === 'por-subir' ? 'fa-solid fa-cloud-arrow-up' : 'fa-solid fa-arrow-right'" />
        {{ modo === 'por-subir' ? 'Subir a Drive' : 'Abrir' }}
      </button>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.eqc {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 13px;
  padding: 0.7rem 0.85rem;

  &--re-editar { border-color: rgba($alert-error, 0.3); }
  &--por-subir { border-color: rgba(#d97706, 0.3); }
}

.eqc__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.eqc__info {
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.eqc__tema { font-size: 0.86rem; font-weight: 800; color: $primary-dark; }

.eqc__motivo {
  font-size: 0.76rem;
  font-weight: 600;
  color: $alert-error;
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;

  i { margin-top: 0.15rem; font-size: 0.7rem; }
}

.eqc__sub {
  font-size: 0.76rem;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 0.35rem;

  i { color: $alert-success; font-size: 0.7rem; }
}

.eqc__fecha {
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

.eqc__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #6366f1;
  color: $white;
  border: none;
  border-radius: 9px;
  padding: 0.5rem 0.9rem;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;

  i { font-size: 0.7rem; }

  &:hover { filter: brightness(1.08); }

  &--drive { background: #1ea362; }
}

.eqc__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1ea362;
  background: rgba(#1ea362, 0.08);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  flex-shrink: 0;

  i { font-size: 0.68rem; }

  &:hover { background: rgba(#1ea362, 0.15); color: #1ea362; }

  &--folder {
    color: $text-secondary;
    background: rgba($primary-dark, 0.05);

    &:hover { color: $primary-dark; background: rgba($primary-dark, 0.09); }
  }
}
</style>
