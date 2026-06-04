<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)

const workspace = ref<Workspace | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await workspaceService.getWorkspace(workspaceId.value)
    workspace.value = res.workspace
  } catch (error) {
    console.error('Error fetching workspace:', error)
  } finally {
    isLoading.value = false
  }
})

const contractPdfUrl = computed(() => {
  if (workspace.value?.contractData) {
    return `${import.meta.env.VITE_API_BASE_URL}/api/onboarding/${workspaceId.value}/contract.pdf`
  }
  return null
})

</script>

<template>
  <div class="legal-view">
    <div class="legal-header">
      <h1 class="legal-title">Legalidades y Contratos</h1>
      <p class="legal-subtitle">Aquí encontrarás tu contrato oficial de servicios, firmado y archivado.</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando documento...
    </div>
    
    <div v-else-if="contractPdfUrl" class="document-container">
      <div class="document-info">
        <div class="document-icon">
          <i class="fa-solid fa-file-contract"></i>
        </div>
        <div class="document-details">
          <h3>Contrato de Servicios</h3>
          <p>Este es el documento oficial generado durante tu Onboarding.</p>
        </div>
        <a :href="contractPdfUrl" target="_blank" rel="noopener noreferrer" class="btn-download">
          <i class="fa-solid fa-download"></i> Descargar PDF
        </a>
      </div>

      <div class="pdf-viewer">
        <iframe :src="`${contractPdfUrl}#view=FitH`" width="100%" height="600" frameborder="0"></iframe>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="fa-solid fa-file-circle-xmark"></i>
      <h3>No se encontró el contrato</h3>
      <p>Aún no tenemos un contrato en nuestros registros para tu entorno, o hubo un error al generarlo. Si crees que esto es un error, por favor comunícate con soporte.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.legal-view {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.legal-header {
  margin-bottom: 2rem;

  .legal-title {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .legal-subtitle {
    color: #6b7280;
    font-size: 1.1rem;
  }
}

.loading-state {
  text-align: center;
  padding: 4rem;
  color: $primary;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.document-container {
  background: $white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.document-info {
  display: flex;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  gap: 1.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
}

.document-icon {
  width: 50px;
  height: 50px;
  background: rgba($primary, 0.1);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.5rem;
}

.document-details {
  flex: 1;

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1.15rem;
    font-weight: 600;
    color: #111827;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.95rem;
  }
}

.btn-download {
  background: $primary;
  color: $white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: $primary-dark;
    transform: translateY(-1px);
  }
}

.pdf-viewer {
  width: 100%;
  background: #e5e7eb;
  
  iframe {
    display: block;
  }
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: $white;
  border-radius: 16px;
  border: 1px dashed #d1d5db;

  i {
    font-size: 3rem;
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  p {
    color: #6b7280;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.5;
  }
}
</style>
