<template>
  <!-- Los no-imagen (PDF, texto) también son clicables: antes solo las imágenes
       tenían vista previa y un catálogo en PDF no se podía abrir sin salir. -->
  <article class="rc">
    <button type="button" class="rc__thumb" @click="$emit('view', resource)">
      <img v-if="isImage(resource)" :src="resource.url" :alt="resource.nombre" loading="lazy" />

      <span v-else class="rc__file">
        <i :class="fileIcon(resource)" />
      </span>

      <span class="rc__ext">{{ extensionOf(resource.nombre) }}</span>

      <span class="rc__overlay">
        <span class="rc__overlay-btn"><i class="fa-solid fa-eye" /> Ver</span>
      </span>
    </button>

    <div class="rc__foot">
      <div class="rc__info">
        <span class="rc__name" :title="resource.nombre">{{ resource.nombre }}</span>
        <span class="rc__date">{{ formatDate(resource.createdAt) }}</span>
      </div>

      <button
        type="button"
        class="rc__del"
        aria-label="Eliminar recurso"
        @click="$emit('remove', resource)"
      >
        <i class="fa-solid fa-trash-can" />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { fileIcon, extensionOf, formatDate, isImage } from '@/utils/brandResources'
import type { Resource } from '@/types'

defineProps<{ resource: Resource }>()

defineEmits<{
  (e: 'view', resource: Resource): void
  (e: 'remove', resource: Resource): void
}>()
</script>

<style scoped lang="scss">
.rc {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s;

  &:hover {
    border-color: var(--accent, #{$secondary});
    box-shadow: 0 12px 26px -14px rgba($primary-dark, 0.35);
    transform: translateY(-3px);

    .rc__overlay { opacity: 1; }
    .rc__thumb img { transform: scale(1.06); }
  }
}

.rc__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 9rem;
  padding: 0;
  overflow: hidden;
  // Tablero sutil: distingue el fondo del PNG transparente del de la tarjeta.
  background:
    linear-gradient(45deg, rgba($primary-dark, 0.035) 25%, transparent 25%) 0 0 / 14px 14px,
    linear-gradient(-45deg, rgba($primary-dark, 0.035) 25%, transparent 25%) 0 7px / 14px 14px,
    $primary-light;
  border: 0;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.rc__file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  height: 3.4rem;
  font-size: 1.5rem;
  color: var(--accent, #{$secondary});
  background: $white;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba($primary-dark, 0.1);
}

.rc__ext {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.1rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: $white;
  background: rgba($primary-dark, 0.55);
  border-radius: 5px;
  backdrop-filter: blur(2px);
}

.rc__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to top, rgba($primary-dark, 0.72), rgba($primary-dark, 0.3));
  opacity: 0;
  transition: opacity 0.22s;
}

.rc__overlay-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: $primary-dark;
  background: $white;
  border-radius: 20px;
}

.rc__foot {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.7rem;
}

.rc__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.rc__name {
  overflow: hidden;
  font-size: 0.78rem;
  font-weight: 600;
  color: $primary-dark;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rc__date { font-size: 0.68rem; color: $text-secondary; }

.rc__del {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.72rem;
  color: $text-secondary;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;

  &:hover { color: $alert-error; background: $alert-error-bg; }
}

@media (prefers-reduced-motion: reduce) {
  .rc, .rc__overlay, .rc__thumb img, .rc__del { transition: none; }
  .rc:hover { transform: none; }
  .rc:hover .rc__thumb img { transform: none; }
}
</style>
