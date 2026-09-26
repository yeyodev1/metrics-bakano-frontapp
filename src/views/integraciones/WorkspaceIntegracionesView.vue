<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import integracionesService, { type IntegracionesVista } from '@/services/integraciones.service'
import CrmCard from './CrmCard.vue'
import BakanologyCard from './BakanologyCard.vue'

/**
 * Integraciones del workspace. La abre el dueño del negocio desde el link que
 * le manda el bot de Telegram (casi siempre en el celular) y también el equipo
 * de Bakano cuando conecta el CRM por el cliente. Una sola columna a propósito:
 * se lee de arriba abajo igual en el teléfono que en el escritorio.
 */
const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId))

const data = ref<IntegracionesVista | null>(null)
const loading = ref(true)
const loadError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    data.value = await integracionesService.getIntegraciones(workspaceId.value)
  } catch (error) {
    loadError.value = (error as { message?: string })?.message || 'No pudimos cargar tus integraciones.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="integ">
    <header class="integ__header">
      <h1><i class="fa-solid fa-plug" aria-hidden="true" /> Integraciones</h1>
      <p>
        Conecta tu CRM (GoHighLevel) para que Bakano revise cada día tus conversaciones de WhatsApp y tus
        oportunidades, y te avise de los clientes que estaban listos para comprar.
      </p>
    </header>

    <div v-if="loading && !data" class="integ__skeleton" aria-busy="true" aria-label="Cargando integraciones">
      <div class="integ__skeleton-block integ__skeleton-block--tall" />
      <div class="integ__skeleton-block" />
    </div>

    <div v-else-if="loadError && !data" class="integ__empty" role="alert">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <h3>No pudimos cargar tus integraciones</h3>
      <p>{{ loadError }}</p>
      <button type="button" class="integ__retry" @click="load">Reintentar</button>
    </div>

    <div v-else-if="data" class="integ__list">
      <CrmCard v-model:crm="data.crm" :workspace-id="workspaceId" />
      <BakanologyCard v-if="data.bakanologyUrl" :url="data.bakanologyUrl" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.integ {
  padding: 1.3rem 1.4rem 2.5rem;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 560px) { padding: 1rem 1rem 2rem; }
}

.integ__header {
  margin-bottom: 1.2rem;

  h1 {
    font-size: 1.35rem; font-weight: 800; color: $primary-dark; margin: 0;
    display: flex; align-items: center; gap: 0.55rem;
    i { color: #6366f1; font-size: 1.1rem; }
  }

  p { font-size: 0.88rem; line-height: 1.5; color: $text-secondary; margin: 0.4rem 0 0; max-width: 62ch; }
}

.integ__list { display: flex; flex-direction: column; gap: 1rem; }

.integ__skeleton { display: flex; flex-direction: column; gap: 1rem; }

.integ__skeleton-block {
  height: 130px; border-radius: 16px;
  background: linear-gradient(100deg, rgba($primary-dark, 0.05) 40%, rgba($primary-dark, 0.02) 50%, rgba($primary-dark, 0.05) 60%);
  background-size: 200% 100%;
  animation: integ-shimmer 1.3s infinite;

  &--tall { height: 320px; }
}

.integ__empty {
  background: $white; border: 1px solid rgba($primary-dark, 0.08); border-radius: 16px;
  padding: 2.5rem 1.5rem; text-align: center; color: $text-secondary;

  i { font-size: 1.6rem; margin-bottom: 0.6rem; display: block; color: #dc2626; }
  h3 { font-size: 0.95rem; color: $primary-dark; margin: 0 0 0.3rem; }
  p { font-size: 0.82rem; margin: 0; }
}

.integ__retry {
  margin-top: 0.9rem; min-height: 44px;
  background: #6366f1; color: $white; border: none; border-radius: 10px;
  padding: 0.55rem 1.2rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer;
}

@keyframes integ-shimmer { to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .integ__skeleton-block { animation: none; }
}
</style>
