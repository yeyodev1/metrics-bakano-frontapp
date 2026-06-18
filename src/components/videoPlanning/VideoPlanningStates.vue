<script setup lang="ts">
const props = defineProps({
  backendMissing: {
    type: Boolean,
    required: true,
  },
  workspaceMismatch: {
    type: Boolean,
    required: true,
  },
  error: {
    type: [String, null],
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'go-home'): void
  (e: 'retry'): void
}>()
</script>

<template>
  <div v-if="props.backendMissing" class="vp-view__backend-banner">
    <div class="vp-view__backend-banner-icon">
      <i class="fa-solid fa-code" />
    </div>
    <div class="vp-view__backend-banner-body">
      <strong>El backend aún no tiene este endpoint</strong>
      <p>
        La ruta <code>POST /api/planning-entries/:entryId/video-planning</code> devuelve
        <code>404 Not Found</code>. El equipo de backend debe implementar las rutas de
        planificación de videos en <strong>ads-bakano-clients-backapp</strong> antes de
        poder usar esta sección.
      </p>
      <p class="vp-view__backend-banner-routes">
        Endpoints requeridos:
        <code>GET / POST / PUT /api/planning-entries/:entryId/video-planning</code> ·
        <code>PATCH /api/video-planning/:id/items/:itemId</code> ·
        <code>POST /api/video-planning/:id/client-approval</code>
      </p>
    </div>
  </div>

  <div v-else-if="props.workspaceMismatch" class="vp-view__mismatch">
    <div class="vp-view__mismatch-icon">
      <i class="fa-solid fa-link-slash" />
    </div>
    <h3>Enlace incorrecto</h3>
    <p>Esta planificación pertenece a otro entorno de trabajo. Verifica el enlace o selecciona la marca correcta.</p>
    <button class="vp-view__mismatch-btn" @click="emit('go-home')">
      <i class="fa-solid fa-house" /> Ir al Inicio
    </button>
  </div>

  <div v-else-if="props.error" class="vp-view__error">
    <i class="fa-solid fa-triangle-exclamation" />
    {{ props.error }}
    <button class="vp-view__error-retry" @click="emit('retry')">Reintentar</button>
  </div>
</template>

<style lang="scss" scoped>
.vp-view__backend-banner {
  display: flex; gap: 1.25rem; align-items: flex-start;
  background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px;
  padding: 1.25rem 1.5rem;
  @media (max-width: 640px) { flex-direction: column; }
}
.vp-view__backend-banner-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: #fef9c3; color: #a16207; font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.vp-view__backend-banner-body {
  flex: 1;
  strong { display: block; font-size: 0.95rem; color: #92400e; margin-bottom: 0.4rem; }
  p { margin: 0 0 0.35rem; font-size: 0.83rem; color: #78350f; line-height: 1.5; }
  code {
    background: rgba(#92400e, 0.1); color: #92400e; border-radius: 4px;
    padding: 0.1rem 0.35rem; font-size: 0.78rem; font-family: monospace;
  }
}
.vp-view__backend-banner-routes { font-size: 0.75rem !important; }

.vp-view__mismatch {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 5rem 2rem; gap: 0.75rem;
  background: $white; border-radius: 16px; border: 1.5px solid rgba(#ef4444, 0.15);
}
.vp-view__mismatch-icon {
  width: 72px; height: 72px; border-radius: 20px;
  background: rgba(#ef4444, 0.07); border: 2px dashed rgba(#ef4444, 0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; color: #ef4444; opacity: 0.8; margin-bottom: 0.5rem;
}
.vp-view__mismatch h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #7f1d1d; }
.vp-view__mismatch p  { margin: 0; font-size: 0.9rem; color: #991b1b; max-width: 400px; line-height: 1.5; }
.vp-view__mismatch-btn {
  margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.5rem;
  background: #ef4444; color: $white; border: none; padding: 0.6rem 1.25rem;
  border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
  &:hover { background: #dc2626; transform: translateY(-1px); }
}

.vp-view__error {
  display: flex; align-items: center; gap: 0.6rem;
  background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;
  border-radius: 12px; padding: 0.9rem 1.25rem; font-size: 0.88rem; font-weight: 600;
}
.vp-view__error-retry {
  margin-left: auto; background: transparent; border: 1.5px solid #fca5a5;
  color: #991b1b; padding: 0.3rem 0.75rem; border-radius: 8px;
  font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
  &:hover { background: #991b1b; color: #fff; }
}
</style>
