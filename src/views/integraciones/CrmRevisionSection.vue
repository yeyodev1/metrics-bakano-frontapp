<script setup lang="ts">
import type { CrmVista } from '@/services/integraciones.service'
import CrmRevisionConfig from './CrmRevisionConfig.vue'
import CrmRevisionManual from './CrmRevisionManual.vue'

/**
 * Revisión del CRM, solo para el equipo de Bakano: cómo se revisa cada día y
 * un botón para revisar ahora un rango de fechas. La vista decide si se ve
 * (equipo + CRM conectado); aquí ya se da por hecho.
 */
defineProps<{ workspaceId: string; crm: CrmVista }>()
const emit = defineEmits<{ 'update:crm': [crm: CrmVista] }>()
</script>

<template>
  <section class="rev" aria-labelledby="crm-revision-title">
    <header class="rev__head">
      <div class="rev__logo" aria-hidden="true"><i class="fa-solid fa-magnifying-glass-chart" /></div>
      <div class="rev__title">
        <h2 id="crm-revision-title">Revisión del CRM (equipo Bakano)</h2>
        <p>El cliente no ve esta sección.</p>
      </div>
      <span class="rev__badge"><i class="fa-solid fa-lock" aria-hidden="true" /> Solo equipo</span>
    </header>

    <CrmRevisionConfig :workspace-id="workspaceId" :crm="crm" @update:crm="emit('update:crm', $event)" />

    <div class="rev__divider" aria-hidden="true" />

    <CrmRevisionManual :workspace-id="workspaceId" />
  </section>
</template>

<style lang="scss" scoped>
.rev {
  background: $white;
  border: 1px dashed rgba($secondary, 0.45);
  border-radius: 16px;
  padding: 1rem;
  display: flex; flex-direction: column; gap: 1.1rem;
  box-shadow: 0 1px 2px rgba($primary-dark, 0.04);

  @media (min-width: 561px) { padding: 1.2rem 1.25rem; }
}

.rev__head { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.rev__logo {
  width: 42px; height: 42px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; border-radius: 12px;
  background: $overlay-purple; color: $secondary; font-size: 1.05rem;
}

.rev__title {
  flex: 1; min-width: 0;
  h2 { font-size: 1rem; font-weight: 800; color: $primary-dark; margin: 0; }
  p { font-size: 0.76rem; color: $text-secondary; margin: 0.1rem 0 0; }
}

.rev__badge {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.28rem 0.7rem; border-radius: 999px;
  font-size: 0.72rem; font-weight: 800; white-space: nowrap;
  background: $overlay-purple; color: $secondary-dark;
}

.rev__divider { border-top: 1px dashed rgba($primary-dark, 0.12); }
</style>
