<template>
  <!-- Read-only view for clients: same data, no editing affordances. -->
  <div class="vp-item-view">
              <div class="vp-item-view">
        <!-- Basic Info Grid -->
        <div class="vp-item-view__info-grid">
          <div class="vp-item-view__info-item">
            <span class="label">TIPO</span>
            <span class="value">{{ form.tipo || '-' }}</span>
          </div>
          <div class="vp-item-view__info-item">
            <span class="label">LUGAR</span>
            <span class="value">{{ form.lugarGrabacion || '-' }}</span>
          </div>
          <div class="vp-item-view__info-item">
            <span class="label">RECURSOS</span>
            <span class="value">{{ form.recursos || '-' }}</span>
          </div>
        </div>

        <!-- Description & Script -->
        <div class="vp-item-view__section">
          <div class="vp-item-view__section-header">
            <i class="fa-solid fa-align-left" />
            <span>DESCRIPCIÓN</span>
          </div>
          <div class="vp-item-view__text-box">{{ form.descripcion || 'Sin descripción' }}</div>
        </div>

        <div class="vp-item-view__section">
          <div class="vp-item-view__section-header">
            <i class="fa-solid fa-scroll" />
            <span>GUIÓN</span>
          </div>
          <div class="vp-item-view__text-box is-script">{{ form.guion || 'Sin guión' }}</div>
        </div>

        <!-- Status Grid (Colorized) -->
        <div class="vp-item-view__status-grid">
          <div class="vp-item-view__status-item">
            <span class="label">IDEA</span>
            <span class="badge" :class="getIdeaColor(form.estadoIdea!)">{{ form.estadoIdea?.replace(/_/g, ' ') }}</span>
          </div>
          <div class="vp-item-view__status-item">
            <span class="label">PRODUCCIÓN</span>
            <span class="badge" :class="getProdColor(form.estadoProduccion!)">{{ form.estadoProduccion?.replace(/_/g, ' ') }}</span>
          </div>
          <div class="vp-item-view__status-item">
            <span class="label">EDICIÓN</span>
            <span class="badge" :class="getEditColor(form.edicion!)">{{ form.edicion?.replace(/_/g, ' ') }}</span>
          </div>
          <div class="vp-item-view__status-item">
            <span class="label">PUBLICACIÓN</span>
            <span class="badge" :class="getPubColor(form.estadoPublicacion!)">{{ form.estadoPublicacion?.replace(/_/g, ' ') }}</span>
          </div>
        </div>

        <!-- Links & Publish Date -->
        <div class="vp-item-view__links">
          <div v-if="form.linkEjemplo" class="vp-item-view__link-item">
            <span class="label">LINK DE VIDEO</span>
            <a :href="form.linkEjemplo" target="_blank" class="link-btn">
              <i class="fa-solid fa-link" />
              Abrir archivo
            </a>
          </div>
          <div v-if="form.linkVideo" class="vp-item-view__link-item">
            <span class="label">LINK DE PUBLICACIÓN</span>
            <a :href="form.linkVideo" target="_blank" class="link-btn is-final">
              <i class="fa-brands fa-instagram" />
              Ver publicación
            </a>
          </div>
          <div v-if="form.fechaPublicacion" class="vp-item-view__link-item">
            <span class="label">PUBLICACIÓN</span>
            <div class="date-chip">
              <i class="fa-solid fa-calendar-day" />
              {{ new Date(form.fechaPublicacion + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) }}
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import type { CreateVideoItemPayload } from '@/types/videoPlanning'

defineProps<{ form: CreateVideoItemPayload }>()
</script>

<style scoped lang="scss">

.vp-item-view {
  display: flex; flex-direction: column; gap: 1.75rem;

  &__info-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    background: white; padding: 1.25rem; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }

  &__info-item {
    display: flex; flex-direction: column; gap: 0.35rem;
    .label { font-size: 0.65rem; font-weight: 800; color: $text-secondary; letter-spacing: 0.1em; }
    .value { font-size: 0.95rem; font-weight: 700; color: $primary-dark; }
  }

  &__section {
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  &__section-header {
    display: flex; align-items: center; gap: 0.6rem;
    i { color: $primary; font-size: 0.9rem; }
    span { font-size: 0.8rem; font-weight: 900; color: $primary-dark; letter-spacing: 0.05em; }
  }

  &__text-box {
    background: white; border: 1px solid rgba($primary-dark, 0.06); border-radius: 16px;
    padding: 1rem 1.25rem; font-size: 0.95rem; line-height: 1.6; color: $primary-dark;
    white-space: pre-wrap;
    &.is-script { background: #fafafa; border-left: 4px solid $primary; font-size: 0.9rem; }
  }

  &__status-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
  }

  &__status-item {
    display: flex; flex-direction: column; gap: 0.6rem; align-items: center;
    .label { font-size: 0.6rem; font-weight: 900; color: $text-secondary; letter-spacing: 0.05em; text-align: center; }
    
    .badge {
      width: 100%; display: flex; align-items: center; justify-content: center;
      padding: 0.5rem 0.4rem; border-radius: 10px; font-size: 0.72rem; font-weight: 800;
      text-transform: uppercase; text-align: center; line-height: 1;

      &.is-success { background: #dcfce7; color: #166534; }
      &.is-warning { background: #fef3c7; color: #92400e; }
      &.is-danger { background: #fee2e2; color: #991b1b; }
      &.is-info { background: #e0f2fe; color: #075985; }
      &.is-gray { background: #f3f4f6; color: #374151; }
    }
  }

  &__links {
    display: flex; flex-wrap: wrap; gap: 1.5rem;
    padding-top: 1rem; border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__link-item {
    display: flex; flex-direction: column; gap: 0.6rem;
    .label { font-size: 0.65rem; font-weight: 900; color: $text-secondary; letter-spacing: 0.1em; }
  }

  .link-btn {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 1.25rem; border-radius: 12px; background: rgba($primary, 0.08);
    color: $primary; font-size: 0.85rem; font-weight: 700; transition: all 0.2s;
    text-decoration: none;
    i { font-size: 1rem; }
    &:hover { background: $primary; color: $white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba($primary, 0.2); }
    &.is-final { background: #f0fdf4; color: #16a34a; &:hover { background: #16a34a; color: white; } }
  }

  .date-chip {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.6rem 1rem; border-radius: 12px; background: #f8fafc;
    color: $primary-dark; font-size: 0.85rem; font-weight: 800;
    i { color: $primary; }
  }
}

</style>
