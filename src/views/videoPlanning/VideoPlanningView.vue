<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { videoPlanningService } from '@/services/videoPlanning.service'
import { brandProfileService } from '@/services/brandProfile.service'
import { useScriptExport } from '@/composables/useScriptExport'
import type { BrandProfile } from '@/types'
import type { VideoPlanning, VideoItem, CreateVideoItemPayload, EstadoPublicacion } from '@/types/videoPlanning'
import VideoPlanningStats from '@/components/videoPlanning/VideoPlanningStats.vue'
import VideoPlanningTable from '@/components/videoPlanning/VideoPlanningTable.vue'
import VideoPlanningItemModal from '@/components/videoPlanning/VideoPlanningItemModal.vue'
import VideoScriptModal from '@/components/videoPlanning/VideoScriptModal.vue'
import VideoCompletedModal from '@/components/videoPlanning/VideoCompletedModal.vue'
import ScriptDistributionWidget from '@/components/videoPlanning/ScriptDistributionWidget.vue'
import VideoPlanningHero from '@/components/videoPlanning/VideoPlanningHero.vue'
import VideoPlanningStates from '@/components/videoPlanning/VideoPlanningStates.vue'
import VideoPlanningEmpty from '@/components/videoPlanning/VideoPlanningEmpty.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { printAllScripts, exportPdfScripts } = useScriptExport()

const entryId = route.params.entryId as string
const workspaceId = route.params.workspaceId as string

const planning = ref<VideoPlanning | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const backendMissing = ref(false)
const workspaceMismatch = ref(false)
const hasBrandProfile = ref(false)
const brandProfile = ref<BrandProfile | null>(null)

const showItemModal = ref(false)
const editingItem = ref<VideoItem | null>(null)
const showScriptModal = ref(false)
const scriptItem = ref<VideoItem | null>(null)
const showCompletedModal = ref(false)
const completedItem = ref<VideoItem | null>(null)
const savingLink = ref(false)
const copiedLink = ref(false)
const reopening = ref(false)

const isEditor = computed(() => userStore.isInternal && userStore.internalRole === 'editor')
const canManageFull = computed(() => userStore.role === 'superadmin' || (userStore.isInternal && !isEditor.value))
const canEditProduction = computed(() => userStore.role === 'superadmin' || userStore.isInternal)
const canMarkEditado = computed(() => userStore.role === 'superadmin')

const locked = computed(() => planning.value?.clienteAprobado === true)
const items = computed(() => planning.value?.items ?? [])
const pageTitle = computed(() => (route.query.title as string) || 'Producción')
const hasRejected = computed(() => items.value.some(i => i.clienteAprobacion === 'RECHAZADO'))
const hasScriptsContent = computed(() => items.value.some(i => i.guion?.trim()))

function handleApiError(err: unknown, fallbackMsg: string) {
  const e = err as { status?: number; message?: string }
  if (e?.status === 404) {
    backendMissing.value = true
    error.value = null
  } else {
    error.value = e?.message ? `${fallbackMsg}: ${e.message}` : fallbackMsg
  }
}

async function loadPlanning() {
  loading.value = true
  backendMissing.value = false
  try {
    const loaded = await videoPlanningService.getByEntry(entryId)
    if (loaded && loaded.workspaceId && loaded.workspaceId !== workspaceId) {
      console.warn(`[VideoPlanningView] workspaceId mismatch: loaded=${loaded.workspaceId}, route=${workspaceId}`)
      workspaceMismatch.value = true
      return
    }
    planning.value = loaded
  } catch (err) {
    handleApiError(err, 'Error al cargar la planificación')
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingItem.value = null
  showItemModal.value = true
}

function openEditModal(item: VideoItem) {
  editingItem.value = item
  showItemModal.value = true
}

function openScript(item: VideoItem) {
  scriptItem.value = item
  showScriptModal.value = true
}

async function handleSaveItem(payload: CreateVideoItemPayload) {
  saving.value = true
  error.value = null
  try {
    if (editingItem.value && planning.value) {
      planning.value = await videoPlanningService.updateItem(planning.value._id, editingItem.value._id, payload)
    } else if (!planning.value) {
      planning.value = await videoPlanningService.create(entryId, workspaceId, [payload])
    } else {
      const newItems: Partial<VideoItem>[] = [
        ...items.value,
        { ...payload, numero: items.value.length + 1, order: items.value.length },
      ]
      planning.value = await videoPlanningService.updateItems(entryId, workspaceId, newItems)
    }
    showItemModal.value = false
  } catch (err) {
    handleApiError(err, 'No se pudo guardar el video')
  } finally {
    saving.value = false
  }
}

async function handleDeleteItem(itemId: string) {
  if (!planning.value) return
  const filtered = items.value.filter(i => i._id !== itemId)
  error.value = null
  try {
    planning.value = await videoPlanningService.updateItems(entryId, workspaceId, filtered)
  } catch (err) {
    handleApiError(err, 'No se pudo eliminar el video')
  }
}

async function handleFieldUpdate(itemId: string, field: string, value: string) {
  if (!planning.value) return
  error.value = null
  try {
    planning.value = await videoPlanningService.updateItem(planning.value._id, itemId, { [field]: value })
    const shouldOpenModal = (field === 'edicion' && value === 'EDITADO') || (field === 'estadoPublicacion' && value === 'PROGRAMADO')
    if (shouldOpenModal) {
      const updated = planning.value.items.find(i => i._id === itemId) ?? null
      if (updated) {
        completedItem.value = updated
        showCompletedModal.value = true
      }
    }
  } catch (err) {
    handleApiError(err, 'No se pudo actualizar el campo')
  }
}

async function handleSaveLinkVideo(itemId: string, payload: { linkVideo: string; fechaPublicacion: string; copyPublicacion: string; estadoPublicacion?: EstadoPublicacion; publishToInstagram?: boolean; publishToFacebook?: boolean }) {
  if (!planning.value) return
  savingLink.value = true
  try {
    planning.value = await videoPlanningService.updateItem(planning.value._id, itemId, payload)
    const updated = planning.value.items.find(i => i._id === itemId) ?? null
    if (updated) completedItem.value = updated
    showCompletedModal.value = false
  } catch (err) {
    handleApiError(err, 'No se pudo guardar el link')
  } finally {
    savingLink.value = false
  }
}

async function handleReopen() {
  if (!planning.value) return
  reopening.value = true
  error.value = null
  try {
    planning.value = await videoPlanningService.reopen(planning.value._id)
  } catch (err) {
    handleApiError(err, 'No se pudo re-abrir la planificación')
  } finally {
    reopening.value = false
  }
}

function goBack() {
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    router.push({ name: 'AppPlanning', params: { workspaceId } })
  }
}

function copyClientLink() {
  const clientUrl = router.resolve({
    name: 'VideoPlanningClient',
    params: { workspaceId, entryId },
    query: { title: pageTitle.value },
  }).href
  const full = `${window.location.origin}${clientUrl}`
  navigator.clipboard.writeText(full).then(() => {
    copiedLink.value = true
    setTimeout(() => { copiedLink.value = false }, 2500)
  })
}

onMounted(async () => {
  if (!userStore.isInternal && userStore.role !== 'superadmin') {
    router.replace({ name: 'VideoPlanningClient', params: { workspaceId, entryId }, query: route.query })
    return
  }
  loadPlanning()
  const bp = await brandProfileService.getProfile(workspaceId)
  brandProfile.value = bp
  hasBrandProfile.value = !!(
    bp?.descripcion?.trim() || bp?.publicoObjetivo?.trim() ||
    bp?.propuestaValor?.trim() || bp?.productosServicios?.trim() || bp?.tipoNegocio
  )
})
</script>

<template>
  <div class="vp-view">
    <VideoPlanningHero
      :title="pageTitle"
      :items-count="items.length"
      :locked="locked"
      :has-scripts="hasScriptsContent"
      :can-manage-full="canManageFull"
      :has-rejected="hasRejected"
      :reopening="reopening"
      :copied-link="copiedLink"
      :backend-missing="backendMissing"
      @go-back="goBack"
      @print="() => printAllScripts(items, pageTitle)"
      @export-pdf="() => exportPdfScripts(items, pageTitle)"
      @reopen="handleReopen"
      @share="copyClientLink"
      @add="openAddModal"
    />

    <div v-if="loading" class="vp-view__loading">
      <div class="vp-view__spinner" />
      <span>Cargando planificación...</span>
    </div>

    <div v-else class="vp-view__content">
      <VideoPlanningStates
        v-if="backendMissing || workspaceMismatch || error"
        :backend-missing="backendMissing"
        :workspace-mismatch="workspaceMismatch"
        :error="error"
        @go-home="router.push('/')"
        @retry="loadPlanning"
      />
      
      <VideoPlanningEmpty
        v-else-if="!planning"
        :can-manage-full="canManageFull"
        @add="openAddModal"
      />

      <template v-else>
        <VideoPlanningStats :items="items" />
        <ScriptDistributionWidget v-if="items.some(i => i.tipoGuion)" :items="items" />

        <div class="vp-view__table-section">
          <div class="vp-view__table-header">
            <div class="vp-view__table-title-area">
              <h2 class="vp-view__table-title">
                <i class="fa-solid fa-table-list" /> Tabla de videos
              </h2>
              <span class="vp-view__table-count">{{ items.length }} registros</span>
            </div>
            <button v-if="canManageFull" class="vp-view__table-add-btn" @click="openAddModal">
              <i class="fa-solid fa-plus" /> Agregar video
            </button>
          </div>

          <VideoPlanningTable
            :items="items"
            :canManageFull="canManageFull"
            :canEditProduction="canEditProduction"
            :canMarkEditado="canMarkEditado"
            :locked="locked"
            @update-field="handleFieldUpdate"
            @open-script="openScript"
            @edit-item="openEditModal"
            @delete-item="handleDeleteItem"
          />
        </div>
      </template>
    </div>

    <VideoPlanningItemModal
      :show="showItemModal"
      :item="editingItem"
      :isSaving="saving"
      :locked="locked"
      :workspace-id="workspaceId"
      :has-brand-profile="hasBrandProfile"
      :brand-profile="brandProfile"
      :all-items="items"
      @close="showItemModal = false"
      @save="handleSaveItem"
      @brand-profile-updated="(bp) => {
        brandProfile = bp
        hasBrandProfile = !!(bp?.descripcion?.trim() || bp?.publicoObjetivo?.trim() || bp?.propuestaValor?.trim() || bp?.productosServicios?.trim() || bp?.tipoNegocio)
      }"
    />
    <VideoScriptModal :show="showScriptModal" :item="scriptItem" @close="showScriptModal = false" />
    <VideoCompletedModal
      :show="showCompletedModal"
      :item="completedItem"
      :isSaving="savingLink"
      @close="showCompletedModal = false"
      @save-link="handleSaveLinkVideo"
    />
  </div>
</template>

<style lang="scss" scoped>
.vp-view {
  min-height: 100vh;
  background: #f8f7f5;
  display: flex;
  flex-direction: column;
}

.vp-view__loading {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem; padding: 5rem 1rem;
  color: $text-secondary; font-size: 0.9rem; font-weight: 600; opacity: 0.6;
}

.vp-view__spinner {
  width: 36px; height: 36px; border: 3px solid rgba($primary, 0.15);
  border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite;
}

.vp-view__content {
  flex: 1; padding: 2rem 2.5rem; display: flex; flex-direction: column; gap: 1.5rem;
  @media (max-width: 768px) { padding: 1.25rem; gap: 1rem; }
}

.vp-view__table-section {
  background: $white; border-radius: 18px; border: 1px solid rgba($primary-dark, 0.07);
  box-shadow: 0 2px 12px rgba($primary-dark, 0.04); overflow: hidden;
}

.vp-view__table-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.5rem; border-bottom: 1px solid rgba($primary-dark, 0.06);
  background: rgba($primary-dark, 0.015);
}

.vp-view__table-title-area { display: flex; align-items: center; gap: 0.75rem; }

.vp-view__table-title {
  margin: 0; font-size: 0.9rem; font-weight: 800; color: $primary-dark;
  display: flex; align-items: center; gap: 0.5rem;
  i { color: $primary; font-size: 0.82rem; }
}

.vp-view__table-count {
  background: rgba($primary, 0.08); color: $primary; border-radius: 20px;
  padding: 0.12rem 0.6rem; font-size: 0.68rem; font-weight: 800;
}

.vp-view__table-add-btn {
  display: inline-flex; align-items: center; gap: 0.4rem; background: rgba($primary, 0.07);
  color: $primary; border: 1.5px solid rgba($primary, 0.2); padding: 0.5rem 1rem;
  border-radius: 10px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
  &:hover { background: $primary; color: $white; border-color: $primary; }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
