<template>
  <div class="srd">
    <p v-if="item.descripcion" class="srd__desc">{{ item.descripcion }}</p>

    <div v-if="parts.length" class="srd__script">
      <div v-for="part in parts" :key="part.label" class="srd__part">
        <span class="srd__part-label">{{ part.label }}</span>
        <p class="srd__part-text">{{ part.text }}</p>
      </div>
    </div>

    <div v-if="hasMetrics" class="srd__metrics">
      <div v-for="m in metrics" :key="m.label" class="srd__metric">
        <i :class="m.icon" />
        <strong>{{ formatNumber(m.value) }}</strong>
        <span>{{ m.label }}</span>
      </div>
    </div>

    <p v-else-if="item.igMediaId" class="srd__no-metrics">
      <i class="fa-solid fa-circle-info" />
      Sin métricas disponibles. La app de Meta no tiene el permiso
      <code>instagram_manage_insights</code>, así que Instagram no entrega
      vistas ni alcance.
    </p>

    <!-- fechaPublicacion is what ties a script to its calendar event -->
    <p v-if="!item.fechaPublicacion" class="srd__no-date">
      <i class="fa-regular fa-calendar-xmark" />
      Sin fecha de publicación: este guion no aparece en el calendario de
      planificación ni entra en el análisis por período. Ponle fecha desde "Editar".
    </p>

    <div class="srd__actions">
      <button v-if="item.igPermalink" type="button" class="srd__btn srd__btn--play" @click="$emit('preview')">
        <i class="fa-solid fa-play" /> Ver el video
      </button>
      <button class="srd__btn srd__btn--outline" @click="$emit('link-reel')">
        <i class="fa-solid fa-link" /> {{ item.igMediaId ? 'Cambiar vínculo' : 'Vincular reel' }}
      </button>
      <button class="srd__btn srd__btn--ghost" @click="$emit('edit-item')">
        <i class="fa-solid fa-pen-to-square" /> Editar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceVideoItem } from '@/types/videoPlanning'

defineProps<{
  item: WorkspaceVideoItem
  parts: Array<{ label: string; text: string }>
  hasMetrics: boolean
  metrics: Array<{ label: string; value: number; icon: string }>
}>()

defineEmits<{ (e: 'preview'): void; (e: 'link-reel'): void; (e: 'edit-item'): void }>()

const formatNumber = (n: number) => new Intl.NumberFormat('es-EC').format(n)
</script>

<style scoped lang="scss">
.srd {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.9rem 0.9rem;
  border-top: 1px solid rgba($primary-dark, 0.06);
}

.srd__detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.9rem 0.9rem;
  border-top: 1px solid rgba($primary-dark, 0.06);
}

.srd__desc {
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: $text-secondary;
}

.srd__script {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba($primary-dark, 0.02);
  border-left: 3px solid $secondary;
  border-radius: 8px;
}

.srd__part { display: flex; flex-direction: column; gap: 0.1rem; }

.srd__part-label {
  font-size: 0.64rem;
  font-weight: 800;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.srd__part-text {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.5;
  color: $primary-dark;
  white-space: pre-wrap;
}

.srd__metrics { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.srd__metric {
  display: flex;
  flex: 1 1 5rem;
  flex-direction: column;
  align-items: center;
  padding: 0.4rem;
  font-size: 0.68rem;
  background: rgba($primary-dark, 0.02);
  border-radius: 8px;

  i { color: $primary; }
  strong { font-size: 0.85rem; color: $primary-dark; }
  span { color: $text-secondary; }
}

.srd__no-metrics {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: $text-secondary;
  background: $alert-warning-bg;
  border-radius: 8px;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-warning; }

  code {
    padding: 0.05rem 0.25rem;
    font-size: 0.72rem;
    background: rgba($primary-dark, 0.07);
    border-radius: 4px;
  }
}

.srd__no-date {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: $text-secondary;
  background: rgba($alert-info, 0.06);
  border-radius: 8px;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-info; }
}

.srd__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.srd__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  border: 0;
  border-radius: 8px;
  cursor: pointer;

  &--outline {
    color: $primary;
    background: $white;
    border: 1.5px solid rgba($primary, 0.3);

    &:hover { background: rgba($primary, 0.06); }
  }

  &--ghost {
    color: $text-secondary;
    background: rgba($primary-dark, 0.04);

    &:hover { color: $primary-dark; }
  }

  &--play {
    color: $white;
    background: #e1306c;

    &:hover { filter: brightness(1.08); }
  }
}

</style>
