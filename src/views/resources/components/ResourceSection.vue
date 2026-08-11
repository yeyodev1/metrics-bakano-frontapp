<template>
  <!-- Una categoría. El color de acento se inyecta con custom properties para
       que ícono, contador, dropzone y tarjetas queden en la misma familia sin
       repetir tres veces el mismo bloque de SCSS. -->
  <section :class="['rs', `rs--${categoria}`, { 'is-empty': !items.length }]">
    <span class="rs__bar" aria-hidden="true" />

    <header class="rs__head">
      <span class="rs__icon"><i :class="icon" /></span>

      <div class="rs__titles">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>

      <span class="rs__count">
        <template v-if="items.length">
          <i class="fa-solid fa-check" /> {{ items.length }}
        </template>
        <template v-else>Pendiente</template>
      </span>
    </header>

    <ResourceDropzone
      :title="dropTitle"
      :hint="hint"
      :accept="acceptFor(categoria)"
      :busy="busy"
      @file="$emit('file', $event)"
    />

    <p v-if="!items.length" class="rs__empty">
      <i class="fa-regular fa-folder-open" /> {{ emptyText }}
    </p>

    <!-- Alternativa propia de la categoría (el catálogo se puede escribir). -->
    <slot />

    <TransitionGroup v-if="items.length" name="rs-card" tag="div" class="rs__grid">
      <ResourceCard
        v-for="item in items"
        :key="item._id"
        :resource="item"
        @view="$emit('view', $event)"
        @remove="$emit('remove', $event)"
      />
    </TransitionGroup>
  </section>
</template>

<script setup lang="ts">
import ResourceDropzone from './ResourceDropzone.vue'
import ResourceCard from './ResourceCard.vue'
import { acceptFor, type ResourceCategory } from '@/utils/brandResources'
import type { Resource } from '@/types'

defineProps<{
  categoria: ResourceCategory
  title: string
  description: string
  icon: string
  dropTitle: string
  hint: string
  emptyText: string
  items: Resource[]
  busy: boolean
}>()

defineEmits<{
  (e: 'file', file: File): void
  (e: 'view', resource: Resource): void
  (e: 'remove', resource: Resource): void
}>()
</script>

<style scoped lang="scss">
.rs {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem;
  overflow: hidden;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba($primary-dark, 0.04);
  transition: box-shadow 0.25s, border-color 0.25s;

  &:hover {
    border-color: rgba($primary-dark, 0.1);
    box-shadow: 0 8px 24px -12px rgba($primary-dark, 0.18);
  }
}

// Un color por categoría, propagado con custom properties.
.rs--logo { --accent: #{$secondary}; --accent-soft: #{rgba($secondary, 0.1)}; }
.rs--linea_grafica { --accent: #{$primary}; --accent-soft: #{rgba($primary, 0.1)}; }
.rs--catalogo { --accent: #{$BAKANO-GREEN}; --accent-soft: #{rgba($BAKANO-GREEN, 0.1)}; }

// Franja lateral: identifica la sección aunque el encabezado quede fuera de vista.
.rs__bar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--accent);
  opacity: 0.85;
}

.rs__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rs__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 12px;
}

.rs__titles {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;

  h2 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.1rem 0 0; font-size: 0.76rem; line-height: 1.4; color: $text-secondary; }
}

.rs__count {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 20px;

  .is-empty & {
    color: $text-secondary;
    background: rgba($text-secondary, 0.09);
  }
}

.rs__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.9rem;
  font-size: 0.77rem;
  color: $text-secondary;
  background: rgba($primary-dark, 0.02);
  border-radius: 12px;

  i { color: rgba($text-secondary, 0.6); }
}

// Flexbox, nunca CSS Grid (AGENTS.md).
.rs__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  > * { flex: 1 1 100%; }
}

@media (min-width: 620px) {
  .rs { padding: 1.4rem; }
  .rs__grid > * { flex: 1 1 11rem; max-width: 15rem; }
}

// Entrada y salida de tarjetas al subir o borrar.
.rs-card-enter-active { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.rs-card-leave-active { position: absolute; transition: opacity 0.2s ease, transform 0.2s ease; }
.rs-card-enter-from { opacity: 0; transform: translateY(10px) scale(0.97); }
.rs-card-leave-to { opacity: 0; transform: scale(0.94); }
.rs-card-move { transition: transform 0.3s ease; }

@media (prefers-reduced-motion: reduce) {
  .rs,
  .rs-card-enter-active,
  .rs-card-leave-active,
  .rs-card-move { transition: none; }
}
</style>
