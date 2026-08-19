<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReviewQueueItem } from '@/services/videoPlanning.service'

/**
 * Un video esperando visto bueno: preview reproducible, links al master y
 * a la planificacion, y el veredicto (aprobar / rechazar con motivo).
 */
const props = defineProps<{ item: ReviewQueueItem; busy: boolean }>()

defineEmits<{
  (e: 'aprobar'): void
  (e: 'rechazar'): void
}>()

const videoFallo = ref(false)

const esVideoReproducible = computed(
  () => !!props.item.linkVideo && !videoFallo.value,
)

const fechaLabel = computed(() => {
  if (!props.item.fechaPublicacion) return null
  return new Date(props.item.fechaPublicacion).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
  })
})
</script>

<template>
  <article class="rvc">
    <div class="rvc__media">
      <video
        v-if="esVideoReproducible"
        :src="item.linkVideo"
        controls
        preload="metadata"
        class="rvc__video"
        @error="videoFallo = true"
      />
      <div v-else class="rvc__no-video">
        <i class="fa-solid fa-film" />
        <span>Sin preview reproducible</span>
        <a v-if="item.driveLink" :href="item.driveLink" target="_blank" rel="noopener">Ver en Drive</a>
      </div>
    </div>

    <div class="rvc__body">
      <div class="rvc__head">
        <span class="rvc__tema">#{{ String(item.numero).padStart(2, '0') }} · {{ item.tema }}</span>
        <span v-if="fechaLabel" class="rvc__fecha">
          <i class="fa-regular fa-clock" /> Publica el {{ fechaLabel }}
        </span>
      </div>
      <span v-if="item.editorNombre" class="rvc__editor">
        <i class="fa-solid fa-user-pen" /> Editado por {{ item.editorNombre }}
      </span>

      <div class="rvc__links">
        <a v-if="item.driveLink" :href="item.driveLink" target="_blank" rel="noopener" class="rvc__link">
          <i class="fa-brands fa-google-drive" /> Master en Drive
        </a>
        <RouterLink
          :to="{ name: 'VideoPlanning', params: { workspaceId: item.workspaceId, entryId: item.entryId } }"
          class="rvc__link rvc__link--muted"
        >
          <i class="fa-solid fa-arrow-up-right-from-square" /> Abrir planificación
        </RouterLink>
      </div>

      <div class="rvc__actions">
        <button type="button" class="rvc__btn-reject" :disabled="busy" @click="$emit('rechazar')">
          <i class="fa-solid fa-xmark" /> Rechazar
        </button>
        <button type="button" class="rvc__btn-approve" :disabled="busy" @click="$emit('aprobar')">
          <span v-if="busy" class="rvc__spinner" />
          <i v-else class="fa-solid fa-check" /> Aprobar
        </button>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.rvc {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba($primary-dark, 0.04);
}

.rvc__media {
  background: $primary-dark;
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rvc__video { width: 100%; height: 100%; object-fit: contain; }

.rvc__no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: rgba($white, 0.55);
  font-size: 0.8rem;

  i { font-size: 1.4rem; }
  a { color: #6ee7b7; font-weight: 700; font-size: 0.78rem; }
}

.rvc__body {
  padding: 0.85rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rvc__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

.rvc__tema { font-size: 0.9rem; font-weight: 800; color: $primary-dark; }

.rvc__fecha {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.rvc__editor {
  font-size: 0.74rem;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 0.35rem;

  i { font-size: 0.68rem; }
}

.rvc__links { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

.rvc__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1ea362;
  background: rgba(#1ea362, 0.08);
  padding: 0.3rem 0.65rem;
  border-radius: 999px;

  i { font-size: 0.66rem; }

  &--muted { color: $text-secondary; background: rgba($primary-dark, 0.05); }
  &:hover { filter: brightness(0.95); }
}

.rvc__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.2rem;
}

.rvc__btn-approve {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: $alert-success;
  color: $white;
  border: none;
  border-radius: 10px;
  padding: 0.65rem 0;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { filter: brightness(1.05); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.rvc__btn-reject {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: $white;
  color: $alert-error;
  border: 1.5px solid rgba($alert-error, 0.35);
  border-radius: 10px;
  padding: 0.65rem 0;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { background: $alert-error-bg; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.rvc__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba($white, 0.4);
  border-top-color: $white;
  border-radius: 50%;
  animation: rvc-spin 0.8s linear infinite;
}

@keyframes rvc-spin { to { transform: rotate(360deg); } }
</style>
