<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  itemsCount: {
    type: Number,
    required: true,
  },
  locked: {
    type: Boolean,
    required: true,
  },
  hasScripts: {
    type: Boolean,
    required: true,
  },
  canManageFull: {
    type: Boolean,
    required: true,
  },
  hasRejected: {
    type: Boolean,
    required: true,
  },
  reopening: {
    type: Boolean,
    required: true,
  },
  copiedLink: {
    type: Boolean,
    required: true,
  },
  backendMissing: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'print'): void
  (e: 'export-pdf'): void
  (e: 'reopen'): void
  (e: 'share'): void
  (e: 'add'): void
}>()
</script>

<template>
  <div class="vp-view__hero">
    <div class="vp-view__hero-inner">
      <div class="vp-view__hero-left">
        <button class="vp-view__back-btn" @click="emit('go-back')">
          <i class="fa-solid fa-arrow-left" />
        </button>
        <div class="vp-view__hero-text">
          <p class="vp-view__breadcrumb">
            <i class="fa-solid fa-calendar-days" />
            Planificación
            <i class="fa-solid fa-chevron-right vp-view__breadcrumb-sep" />
            <i class="fa-solid fa-film" />
            Videos
          </p>
          <h1 class="vp-view__title">{{ props.title }}</h1>
          <p class="vp-view__subtitle">
            {{ props.itemsCount }} video{{ props.itemsCount !== 1 ? 's' : '' }} en planificación
            <span v-if="props.locked" class="vp-view__locked-pill">
              <i class="fa-solid fa-lock" /> Bloqueado por cliente
            </span>
          </p>
        </div>
      </div>
      <div class="vp-view__hero-right">
        <button
          v-if="props.hasScripts"
          class="vp-view__print-btn"
          @click="emit('print')"
        >
          <i class="fa-solid fa-print" /> Imprimir guiones
        </button>
        <button
          v-if="props.hasScripts"
          class="vp-view__pdf-btn"
          @click="emit('export-pdf')"
        >
          <i class="fa-solid fa-file-pdf" /> Exportar PDF
        </button>
        <button
          v-if="props.canManageFull && props.locked && props.hasRejected"
          class="vp-view__reopen-btn"
          :disabled="props.reopening"
          @click="emit('reopen')"
        >
          <i :class="props.reopening ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-right'" />
          {{ props.reopening ? 'Re-abriendo...' : 'Re-abrir rechazados' }}
        </button>
        <button
          v-if="props.canManageFull && !props.backendMissing"
          class="vp-view__share-btn"
          :class="{ 'vp-view__share-btn--copied': props.copiedLink }"
          @click="emit('share')"
        >
          <i :class="props.copiedLink ? 'fa-solid fa-check' : 'fa-solid fa-link'" />
          {{ props.copiedLink ? 'Enlace copiado' : 'Compartir con cliente' }}
        </button>
        <button
          v-if="props.canManageFull && !props.backendMissing"
          class="vp-view__add-btn"
          @click="emit('add')"
        >
          <i class="fa-solid fa-plus" /> Agregar video
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vp-view__hero {
  background: $primary-dark;
  position: relative;
  overflow: hidden;

  &::before {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 24px 24px; pointer-events: none;
  }
  &::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, $primary, transparent);
  }
}

.vp-view__hero-inner {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  gap: 1.5rem; padding: 2rem 2.5rem; flex-wrap: wrap;
  @media (max-width: 768px) { padding: 1.5rem 1.25rem; flex-direction: column; align-items: flex-start; }
}

.vp-view__hero-left { display: flex; align-items: center; gap: 1.25rem; }

.vp-view__back-btn {
  width: 42px; height: 42px; border-radius: 12px;
  border: 1px solid rgba($white, 0.12); background: rgba($white, 0.06);
  color: rgba($white, 0.7); cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; transition: all 0.2s; flex-shrink: 0;
  &:hover { background: rgba($white, 0.12); color: $white; border-color: rgba($white, 0.2); }
}

.vp-view__breadcrumb {
  margin: 0 0 0.4rem; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: rgba($white, 0.4); display: flex; align-items: center; gap: 0.4rem;
  i { font-size: 0.6rem; }
}
.vp-view__breadcrumb-sep { font-size: 0.48rem !important; opacity: 0.35; }

.vp-view__title {
  margin: 0 0 0.4rem; font-size: 1.75rem; font-weight: 800; color: $white; letter-spacing: -0.02em; line-height: 1.2;
  @media (max-width: 768px) { font-size: 1.35rem; }
}

.vp-view__subtitle { margin: 0; font-size: 0.82rem; color: rgba($white, 0.5); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.vp-view__locked-pill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: rgba(#fef9c3, 0.15); color: #fde68a;
  border: 1px solid rgba(#fde68a, 0.3); border-radius: 20px;
  padding: 0.2rem 0.65rem; font-size: 0.72rem; font-weight: 700;
}

.vp-view__hero-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; flex-wrap: wrap; }

.vp-view__print-btn, .vp-view__pdf-btn, .vp-view__reopen-btn, .vp-view__share-btn, .vp-view__add-btn {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.2rem;
  border-radius: 12px; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
  @media (max-width: 768px) { width: 100%; justify-content: center; }
}

.vp-view__print-btn {
  background: rgba($white, 0.06); color: rgba($white, 0.65); border: 1px solid rgba($white, 0.12);
  &:hover { background: rgba($white, 0.12); color: $white; border-color: rgba($white, 0.22); }
}

.vp-view__pdf-btn {
  background: rgba(#ef4444, 0.12); color: #fca5a5; border: 1px solid rgba(#ef4444, 0.25);
  &:hover { background: rgba(#ef4444, 0.22); color: #fecaca; border-color: rgba(#ef4444, 0.4); }
}

.vp-view__reopen-btn {
  background: rgba(#fde68a, 0.15); color: #fde68a; border: 1px solid rgba(#fde68a, 0.3);
  &:hover:not(:disabled) { background: rgba(#fde68a, 0.25); border-color: rgba(#fde68a, 0.5); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.vp-view__share-btn {
  background: rgba($white, 0.08); color: rgba($white, 0.75); border: 1px solid rgba($white, 0.15);
  &:hover { background: rgba($white, 0.14); color: $white; border-color: rgba($white, 0.25); }
  &--copied { background: rgba(#86efac, 0.15); color: #86efac; border-color: rgba(#86efac, 0.3); }
}

.vp-view__add-btn {
  background: $primary; color: $white; border: none; padding: 0.75rem 1.5rem;
  box-shadow: 0 4px 16px rgba($primary, 0.4);
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba($primary, 0.5); }
}
</style>
