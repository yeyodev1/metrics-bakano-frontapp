<template>
  <!-- Missing brand profile blocks generation entirely -->
  <div v-if="!hasBrandProfile" class="bpb__missing">
    <i class="fa-solid fa-circle-exclamation" />
    <div>
      <strong>Perfil de marca no configurado</strong>
      <p>Completa el perfil para que la IA genere guiones personalizados.</p>
      <div class="bpb__actions">
        <button type="button" class="bpb__btn" @click="$emit('edit')">
          <i class="fa-solid fa-pen-to-square" /> Configurar aquí
        </button>
        <button type="button" class="bpb__btn bpb__btn--ghost" @click="$emit('go-page')">
          <i class="fa-solid fa-arrow-up-right-from-square" /> Ir a la página
        </button>
      </div>
    </div>
  </div>

  <div v-else-if="summary" class="bpb">
    <div class="bpb__chips">
      <span v-for="chip in summary.chips" :key="chip" class="bpb__chip">{{ chip }}</span>
      <span v-if="summary.archivos > 0" class="bpb__chip bpb__chip--file">
        <i class="fa-solid fa-paperclip" />
        {{ summary.archivos }} archivo{{ summary.archivos > 1 ? 's' : '' }}
      </span>
    </div>
    <button type="button" class="bpb__edit" @click="$emit('edit')">
      <i class="fa-solid fa-pen" /> Editar perfil
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BrandProfile } from '@/types'

const props = defineProps<{
  hasBrandProfile: boolean
  brandProfile?: BrandProfile | null
}>()

defineEmits<{ (e: 'edit'): void; (e: 'go-page'): void }>()

const summary = computed(() => {
  const bp = props.brandProfile
  if (!bp) return null
  const chips = [bp.tipoNegocio, bp.vertical, bp.trafficDirection].filter(Boolean) as string[]
  return { chips, archivos: bp.archivos?.length ?? 0 }
})
</script>

<style scoped lang="scss">
.bpb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba($primary, 0.04);
  border: 1px solid rgba($primary, 0.1);
  border-radius: 8px;
}

.bpb__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.bpb__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.12rem 0.45rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: $alert-info;
  background: rgba($alert-info, 0.1);
  border-radius: 20px;

  &--file { color: $secondary-dark; background: $overlay-purple; }
}

.bpb__edit {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
  padding: 0.2rem 0.6rem;
  font-family: inherit;
  font-size: 0.65rem;
  font-weight: 700;
  color: $alert-info;
  background: rgba($alert-info, 0.06);
  border: 1px solid rgba($alert-info, 0.25);
  border-radius: 6px;
  cursor: pointer;

  &:hover { background: rgba($alert-info, 0.14); }
}

.bpb__missing {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: $primary-dark;
  background: $alert-warning-bg;
  border: 1px solid rgba($alert-warning, 0.3);
  border-radius: 10px;

  > i { flex-shrink: 0; margin-top: 0.1rem; color: $alert-warning; }

  strong { display: block; margin-bottom: 0.15rem; font-weight: 700; }
  p { margin: 0 0 0.6rem; color: $text-secondary; }
}

.bpb__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.bpb__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.85rem;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  color: $white;
  background: $alert-warning;
  border: 1.5px solid transparent;
  border-radius: 8px;
  cursor: pointer;

  &:hover { filter: brightness(1.08); }

  &--ghost {
    color: $alert-warning;
    background: transparent;
    border-color: rgba($alert-warning, 0.45);

    &:hover { background: rgba($alert-warning, 0.1); filter: none; }
  }
}
</style>
