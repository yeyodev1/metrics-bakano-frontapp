<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { videoPlanningService } from '@/services/videoPlanning.service'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile } from '@/types'
import type { VideoPlanning, VideoItem, CreateVideoItemPayload } from '@/types/videoPlanning'
import VideoPlanningStats from '@/components/videoPlanning/VideoPlanningStats.vue'
import VideoPlanningTable from '@/components/videoPlanning/VideoPlanningTable.vue'
import VideoPlanningItemModal from '@/components/videoPlanning/VideoPlanningItemModal.vue'
import VideoScriptModal from '@/components/videoPlanning/VideoScriptModal.vue'
import VideoCompletedModal from '@/components/videoPlanning/VideoCompletedModal.vue'
import ScriptDistributionWidget from '@/components/videoPlanning/ScriptDistributionWidget.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const entryId = route.params.entryId as string
const workspaceId = route.params.workspaceId as string

const planning = ref<VideoPlanning | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const backendMissing = ref(false)
const hasBrandProfile = ref(false)
const brandProfile = ref<BrandProfile | null>(null)

const showItemModal = ref(false)
const editingItem = ref<VideoItem | null>(null)
const showScriptModal = ref(false)
const scriptItem = ref<VideoItem | null>(null)
const showCompletedModal = ref(false)
const completedItem = ref<VideoItem | null>(null)
const savingLink = ref(false)

const isEditor = computed(() =>
  userStore.isInternal && userStore.internalRole === 'editor'
)
const canManageFull = computed(() =>
  userStore.role === 'superadmin' || (userStore.isInternal && !isEditor.value)
)
const canEditProduction = computed(() =>
  userStore.role === 'superadmin' || userStore.isInternal
)

const locked = computed(() => planning.value?.clienteAprobado === true)
const items = computed(() => planning.value?.items ?? [])
const pageTitle = computed(() => (route.query.title as string) || 'Producción')

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
    // Warn on workspace mismatch (backend bug: may store wrong workspaceId from JWT)
    if (loaded && loaded.workspaceId && loaded.workspaceId !== workspaceId) {
      console.warn(`[VideoPlanningView] workspaceId mismatch: loaded=${loaded.workspaceId}, route=${workspaceId}`)
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
      planning.value = await videoPlanningService.updateItem(
        planning.value._id,
        editingItem.value._id,
        payload,
      )
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
    planning.value = await videoPlanningService.updateItem(planning.value._id, itemId, {
      [field]: value,
    })
    // Show "video completed" modal when edicion → EDITADO
    if (field === 'edicion' && value === 'EDITADO') {
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

async function handleSaveLinkVideo(itemId: string, payload: { linkVideo: string; fechaPublicacion: string; copyPublicacion: string; estadoPublicacion?: string }) {
  if (!planning.value) return
  savingLink.value = true
  try {
    planning.value = await videoPlanningService.updateItem(planning.value._id, itemId, payload)
    // Update completedItem with fresh data
    const updated = planning.value.items.find(i => i._id === itemId) ?? null
    if (updated) completedItem.value = updated
    showCompletedModal.value = false
  } catch (err) {
    handleApiError(err, 'No se pudo guardar el link')
  } finally {
    savingLink.value = false
  }
}

const copiedLink = ref(false)
const reopening = ref(false)

const hasRejected = computed(() =>
  items.value.some(i => i.clienteAprobacion === 'RECHAZADO')
)

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

function printAllScripts() {
  const scriptsWithContent = items.value.filter(i => i.guion?.trim())
  if (!scriptsWithContent.length) return

  const rows = scriptsWithContent.map((item, idx) => {
    const isLast = idx === scriptsWithContent.length - 1
    const refBlock = item.linkEjemplo
      ? `<div class="script-ref"><span class="script-ref-label">Referencia:</span> <a href="${item.linkEjemplo}" class="script-ref-link">${item.linkEjemplo}</a></div>`
      : ''
    return `
      <div class="script-page" style="${isLast ? '' : 'page-break-after: always;'}">
        <div class="script-header">
          <span class="script-num">#${item.numero}</span>
          <h2 class="script-title">${item.tema}</h2>
          ${item.tipo ? `<span class="script-tipo">${item.tipo}</span>` : ''}
        </div>
        ${item.descripcion ? `<p class="script-desc">${item.descripcion}</p>` : ''}
        ${refBlock}
        <hr class="script-divider" />
        <div class="script-body">${(item.guion ?? '').replace(/\n/g, '<br>')}</div>
      </div>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Guiones — ${pageTitle.value}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; }
    .cover { display: flex; flex-direction: column; justify-content: flex-end; padding: 4rem 3rem; min-height: 100vh; page-break-after: always; border-bottom: 2px solid #e5e7eb; }
    .cover-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; margin-bottom: 0.75rem; }
    .cover-title { font-size: 2.5rem; font-weight: 700; line-height: 1.2; color: #111; margin-bottom: 0.5rem; }
    .cover-meta { font-size: 0.9rem; color: #6b7280; }
    .script-page { padding: 3rem; min-height: 100vh; display: flex; flex-direction: column; gap: 1.25rem; }
    .script-header { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
    .script-num { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
    .script-title { font-size: 1.5rem; font-weight: 700; color: #111; }
    .script-tipo { font-size: 0.75rem; font-weight: 600; color: #6366f1; background: #eef2ff; border-radius: 4px; padding: 0.15rem 0.5rem; }
    .script-desc { font-size: 0.9rem; color: #6b7280; font-style: italic; line-height: 1.6; }
    .script-ref { display: flex; align-items: flex-start; gap: 0.5rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 6px; padding: 0.6rem 0.9rem; }
    .script-ref-label { font-size: 0.75rem; font-weight: 700; color: #059669; white-space: nowrap; }
    .script-ref-link { font-size: 0.8rem; color: #0369a1; word-break: break-all; }
    .script-divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 0.25rem 0; }
    .script-body { font-size: 1rem; line-height: 1.85; color: #1a1a1a; white-space: pre-wrap; flex: 1; }
    @media print {
      @page { margin: 2cm 2.5cm; size: A4; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <p class="cover-label">Planificación de guiones</p>
    <h1 class="cover-title">${pageTitle.value}</h1>
    <p class="cover-meta">${scriptsWithContent.length} guion${scriptsWithContent.length !== 1 ? 'es' : ''} · ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  ${rows}
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function exportPdfScripts() {
  const scriptsWithContent = items.value.filter(i => i.guion?.trim())
  if (!scriptsWithContent.length) return

  const rows = scriptsWithContent.map((item, idx) => {
    const isLast = idx === scriptsWithContent.length - 1
    const linkBlock = item.linkEjemplo
      ? `<div class="script-ref">
           <span class="script-ref-label">Referencia</span>
           <a href="${item.linkEjemplo}" class="script-ref-link">${item.linkEjemplo}</a>
         </div>`
      : ''
    const recursosBlock = item.recursos
      ? `<div class="script-meta-row"><span class="script-meta-key">Recursos:</span> <span class="script-meta-val">${item.recursos}</span></div>`
      : ''
    const lugarBlock = item.lugarGrabacion
      ? `<div class="script-meta-row"><span class="script-meta-key">Lugar de grabación:</span> <span class="script-meta-val">${item.lugarGrabacion}</span></div>`
      : ''
    const tipoGuionBlock = item.tipoGuion
      ? `<span class="script-tag script-tag--guion">${item.tipoGuion}</span>`
      : ''

    return `
      <div class="script-page" style="${isLast ? '' : 'page-break-after: always;'}">
        <div class="script-header">
          <div class="script-header-top">
            <span class="script-num">#${item.numero}</span>
            <div class="script-tags">
              ${item.tipo ? `<span class="script-tag">${item.tipo}</span>` : ''}
              ${tipoGuionBlock}
            </div>
          </div>
          <h2 class="script-title">${item.tema}</h2>
          ${item.descripcion ? `<p class="script-desc">${item.descripcion}</p>` : ''}
        </div>
        ${(recursosBlock || lugarBlock) ? `<div class="script-meta">${recursosBlock}${lugarBlock}</div>` : ''}
        ${linkBlock}
        <hr class="script-divider" />
        <div class="script-body">${(item.guion ?? '').replace(/\n/g, '<br>')}</div>
      </div>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Guiones PDF — ${pageTitle.value}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; background: #fff; }

    /* Cover */
    .cover { display: flex; flex-direction: column; justify-content: flex-end; padding: 4rem 3.5rem; min-height: 100vh; page-break-after: always; border-bottom: 3px solid #0f1117; }
    .cover-brand { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9ca3af; margin-bottom: 2rem; }
    .cover-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 0.6rem; }
    .cover-title { font-size: 2.8rem; font-weight: 800; line-height: 1.15; color: #0f1117; margin-bottom: 0.6rem; letter-spacing: -0.03em; }
    .cover-meta { font-size: 0.9rem; color: #6b7280; margin-top: 1.5rem; }
    .cover-count { display: inline-block; background: #0f1117; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 20px; margin-right: 0.5rem; }

    /* Script page */
    .script-page { padding: 3rem 3.5rem; min-height: 100vh; display: flex; flex-direction: column; gap: 1.1rem; }

    /* Header */
    .script-header { display: flex; flex-direction: column; gap: 0.5rem; }
    .script-header-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.2rem; }
    .script-num { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; }
    .script-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .script-tag { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6366f1; background: #eef2ff; border-radius: 4px; padding: 0.2rem 0.55rem; }
    .script-tag--guion { color: #0891b2; background: #e0f2fe; }
    .script-title { font-size: 1.6rem; font-weight: 800; color: #0f1117; line-height: 1.2; letter-spacing: -0.02em; }
    .script-desc { font-size: 0.875rem; color: #6b7280; font-style: italic; line-height: 1.65; }

    /* Meta */
    .script-meta { background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 0.65rem 1rem; border-radius: 0 6px 6px 0; display: flex; flex-direction: column; gap: 0.3rem; }
    .script-meta-row { font-size: 0.8rem; color: #374151; }
    .script-meta-key { font-weight: 700; color: #64748b; }
    .script-meta-val { color: #374151; }

    /* Reference link */
    .script-ref { display: flex; align-items: flex-start; gap: 0.75rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; padding: 0.75rem 1rem; }
    .script-ref-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #059669; white-space: nowrap; padding-top: 0.1rem; }
    .script-ref-link { font-size: 0.8rem; color: #0369a1; text-decoration: underline; word-break: break-all; line-height: 1.5; }

    /* Body */
    .script-divider { border: none; border-top: 1.5px solid #e5e7eb; }
    .script-body { font-size: 0.975rem; line-height: 1.9; color: #1a1a1a; white-space: pre-wrap; flex: 1; }

    /* Footer */
    .page-footer { position: running(footer); font-size: 0.7rem; color: #9ca3af; text-align: right; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; }

    @media print {
      @page { margin: 1.8cm 2.2cm; size: A4; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .script-ref-link { color: #0369a1 !important; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <p class="cover-brand">Bakano Ads</p>
    <p class="cover-label">Guiones de producción</p>
    <h1 class="cover-title">${pageTitle.value}</h1>
    <p class="cover-meta">
      <span class="cover-count">${scriptsWithContent.length} guion${scriptsWithContent.length !== 1 ? 'es' : ''}</span>
      Generado el ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
  </div>
  ${rows}
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    // Small delay to ensure styles render before print dialog
    setTimeout(() => { win.print() }, 400)
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
  // Redirect workspace clients to the client approval view
  if (!userStore.isInternal && userStore.role !== 'superadmin') {
    router.replace({
      name: 'VideoPlanningClient',
      params: { workspaceId, entryId },
      query: route.query,
    })
    return
  }
  loadPlanning()
  // Load brand profile status for script generator
  const bp = await brandProfileService.getProfile(workspaceId)
  brandProfile.value = bp
  hasBrandProfile.value = !!(
    bp?.descripcion?.trim() ||
    bp?.publicoObjetivo?.trim() ||
    bp?.propuestaValor?.trim() ||
    bp?.productosServicios?.trim() ||
    bp?.tipoNegocio
  )
})
</script>

<template>
  <div class="vp-view">

    <!-- ── Hero ─────────────────────────────────────────── -->
    <div class="vp-view__hero">
      <div class="vp-view__hero-inner">
        <div class="vp-view__hero-left">
          <button class="vp-view__back-btn" @click="router.back()">
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
            <h1 class="vp-view__title">{{ pageTitle }}</h1>
            <p class="vp-view__subtitle">
              {{ items.length }} video{{ items.length !== 1 ? 's' : '' }} en planificación
              <span v-if="locked" class="vp-view__locked-pill">
                <i class="fa-solid fa-lock" /> Bloqueado por cliente
              </span>
            </p>
          </div>
        </div>
        <div class="vp-view__hero-right">
          <button
            v-if="items.some(i => i.guion?.trim())"
            class="vp-view__print-btn"
            @click="printAllScripts"
          >
            <i class="fa-solid fa-print" />
            Imprimir guiones
          </button>
          <button
            v-if="items.some(i => i.guion?.trim())"
            class="vp-view__pdf-btn"
            @click="exportPdfScripts"
          >
            <i class="fa-solid fa-file-pdf" />
            Exportar PDF
          </button>
          <button
            v-if="canManageFull && locked && hasRejected"
            class="vp-view__reopen-btn"
            :disabled="reopening"
            @click="handleReopen"
          >
            <i :class="reopening ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate-right'" />
            {{ reopening ? 'Re-abriendo...' : 'Re-abrir rechazados' }}
          </button>
          <button
            v-if="canManageFull && planning"
            class="vp-view__share-btn"
            :class="{ 'vp-view__share-btn--copied': copiedLink }"
            @click="copyClientLink"
          >
            <i :class="copiedLink ? 'fa-solid fa-check' : 'fa-solid fa-link'" />
            {{ copiedLink ? 'Enlace copiado' : 'Compartir con cliente' }}
          </button>
          <button
            v-if="canManageFull && !backendMissing"
            class="vp-view__add-btn"
            @click="openAddModal"
          >
            <i class="fa-solid fa-plus" />
            Agregar video
          </button>
        </div>
      </div>
    </div>

    <!-- ── Loading ──────────────────────────────────────── -->
    <div v-if="loading" class="vp-view__loading">
      <div class="vp-view__spinner" />
      <span>Cargando planificación...</span>
    </div>

    <!-- ── Content ──────────────────────────────────────── -->
    <div v-else class="vp-view__content">

      <!-- Banner: backend no implementado -->
      <div v-if="backendMissing" class="vp-view__backend-banner">
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

      <!-- Error genérico -->
      <div v-else-if="error" class="vp-view__error">
        <i class="fa-solid fa-triangle-exclamation" />
        {{ error }}
        <button class="vp-view__error-retry" @click="loadPlanning">Reintentar</button>
      </div>

      <!-- Estado vacío — no hay planning todavía -->
      <div v-else-if="!planning" class="vp-view__empty">
        <div class="vp-view__empty-icon">
          <i class="fa-solid fa-film" />
        </div>
        <h3>Sin planificación todavía</h3>
        <p>Agrega el primer video para comenzar a organizar la producción de REELs.</p>
        <button v-if="canManageFull" class="vp-view__start-btn" @click="openAddModal">
          <i class="fa-solid fa-circle-plus" />
          Crear primera planificación
        </button>
      </div>

      <!-- Planning cargada -->
      <template v-else>
        <VideoPlanningStats :items="items" />
        <ScriptDistributionWidget v-if="items.some(i => i.tipoGuion)" :items="items" />

        <div class="vp-view__table-section">
          <div class="vp-view__table-header">
            <div class="vp-view__table-title-area">
              <h2 class="vp-view__table-title">
                <i class="fa-solid fa-table-list" />
                Tabla de videos
              </h2>
              <span class="vp-view__table-count">{{ items.length }} registros</span>
            </div>
            <button
              v-if="canManageFull"
              class="vp-view__table-add-btn"
              @click="openAddModal"
            >
              <i class="fa-solid fa-plus" />
              Agregar video
            </button>
          </div>

          <VideoPlanningTable
            :items="items"
            :canManageFull="canManageFull"
            :canEditProduction="canEditProduction"
            :locked="locked"
            @update-field="handleFieldUpdate"
            @open-script="openScript"
            @edit-item="openEditModal"
            @delete-item="handleDeleteItem"
          />
        </div>
      </template>
    </div>

    <!-- ── Modals ────────────────────────────────────────── -->
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

    <VideoScriptModal
      :show="showScriptModal"
      :item="scriptItem"
      @close="showScriptModal = false"
    />

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

  // ── Hero ─────────────────────────────────────────────────
  &__hero {
    background: $primary-dark;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 24px 24px;
      pointer-events: none;
    }
    &::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, $primary, transparent);
    }
  }

  &__hero-inner {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between;
    gap: 1.5rem; padding: 2rem 2.5rem; flex-wrap: wrap;

    @media (max-width: 768px) { padding: 1.5rem 1.25rem; flex-direction: column; align-items: flex-start; }
  }

  &__hero-left { display: flex; align-items: center; gap: 1.25rem; }

  &__back-btn {
    width: 42px; height: 42px; border-radius: 12px;
    border: 1px solid rgba($white, 0.12); background: rgba($white, 0.06);
    color: rgba($white, 0.7); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
    transition: all 0.2s; flex-shrink: 0;
    &:hover { background: rgba($white, 0.12); color: $white; border-color: rgba($white, 0.2); }
  }

  &__breadcrumb {
    margin: 0 0 0.4rem; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: rgba($white, 0.4);
    display: flex; align-items: center; gap: 0.4rem;
    i { font-size: 0.6rem; }
  }
  &__breadcrumb-sep { font-size: 0.48rem !important; opacity: 0.35; }

  &__title {
    margin: 0 0 0.4rem; font-size: 1.75rem; font-weight: 800; color: $white;
    letter-spacing: -0.02em; line-height: 1.2;
    @media (max-width: 768px) { font-size: 1.35rem; }
  }

  &__subtitle {
    margin: 0; font-size: 0.82rem; color: rgba($white, 0.5);
    display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  }

  &__locked-pill {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: rgba(#fef9c3, 0.15); color: #fde68a;
    border: 1px solid rgba(#fde68a, 0.3); border-radius: 20px;
    padding: 0.2rem 0.65rem; font-size: 0.72rem; font-weight: 700;
  }

  &__hero-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; flex-wrap: wrap; }

  &__print-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba($white, 0.06); color: rgba($white, 0.65);
    border: 1px solid rgba($white, 0.12); padding: 0.65rem 1.2rem;
    border-radius: 12px; font-weight: 700; font-size: 0.82rem; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba($white, 0.12); color: $white; border-color: rgba($white, 0.22); }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  &__pdf-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba(#ef4444, 0.12); color: #fca5a5;
    border: 1px solid rgba(#ef4444, 0.25); padding: 0.65rem 1.2rem;
    border-radius: 12px; font-weight: 700; font-size: 0.82rem; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba(#ef4444, 0.22); color: #fecaca; border-color: rgba(#ef4444, 0.4); }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  &__reopen-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba(#fde68a, 0.15); color: #fde68a;
    border: 1px solid rgba(#fde68a, 0.3); padding: 0.65rem 1.2rem;
    border-radius: 12px; font-weight: 700; font-size: 0.82rem; cursor: pointer;
    transition: all 0.2s;
    &:hover:not(:disabled) { background: rgba(#fde68a, 0.25); border-color: rgba(#fde68a, 0.5); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  &__share-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba($white, 0.08); color: rgba($white, 0.75);
    border: 1px solid rgba($white, 0.15); padding: 0.65rem 1.2rem;
    border-radius: 12px; font-weight: 700; font-size: 0.82rem; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba($white, 0.14); color: $white; border-color: rgba($white, 0.25); }
    &--copied { background: rgba(#86efac, 0.15); color: #86efac; border-color: rgba(#86efac, 0.3); }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  &__add-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: $primary; color: $white; border: none;
    padding: 0.75rem 1.5rem; border-radius: 12px;
    font-weight: 700; font-size: 0.88rem; cursor: pointer;
    box-shadow: 0 4px 16px rgba($primary, 0.4); transition: all 0.2s;
    &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba($primary, 0.5); }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  // ── Loading ───────────────────────────────────────────────
  &__loading {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 1rem; padding: 5rem 1rem;
    color: $text-secondary; font-size: 0.9rem; font-weight: 600; opacity: 0.6;
  }
  &__spinner {
    width: 36px; height: 36px; border: 3px solid rgba($primary, 0.15);
    border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite;
  }

  // ── Content ───────────────────────────────────────────────
  &__content {
    flex: 1; padding: 2rem 2.5rem;
    display: flex; flex-direction: column; gap: 1.5rem;
    @media (max-width: 768px) { padding: 1.25rem; gap: 1rem; }
  }

  // ── Backend missing banner ────────────────────────────────
  &__backend-banner {
    display: flex; gap: 1.25rem; align-items: flex-start;
    background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px;
    padding: 1.25rem 1.5rem;

    @media (max-width: 640px) { flex-direction: column; }
  }
  &__backend-banner-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: #fef9c3; color: #a16207; font-size: 1.1rem;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  &__backend-banner-body {
    flex: 1;
    strong { display: block; font-size: 0.95rem; color: #92400e; margin-bottom: 0.4rem; }
    p { margin: 0 0 0.35rem; font-size: 0.83rem; color: #78350f; line-height: 1.5; }
    code {
      background: rgba(#92400e, 0.1); color: #92400e; border-radius: 4px;
      padding: 0.1rem 0.35rem; font-size: 0.78rem; font-family: monospace;
    }
  }
  &__backend-banner-routes { font-size: 0.75rem !important; }

  // ── Error genérico ────────────────────────────────────────
  &__error {
    display: flex; align-items: center; gap: 0.6rem;
    background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;
    border-radius: 12px; padding: 0.9rem 1.25rem;
    font-size: 0.88rem; font-weight: 600;
  }
  &__error-retry {
    margin-left: auto; background: transparent; border: 1.5px solid #fca5a5;
    color: #991b1b; padding: 0.3rem 0.75rem; border-radius: 8px;
    font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s;
    &:hover { background: #991b1b; color: #fff; }
  }

  // ── Empty state ───────────────────────────────────────────
  &__empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 5rem 2rem; gap: 0.75rem;
  }
  &__empty-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: rgba($primary, 0.07); border: 2px dashed rgba($primary, 0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.75rem; color: $primary; opacity: 0.7; margin-bottom: 0.5rem;
  }
  &__empty h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
  &__empty p  { margin: 0; font-size: 0.85rem; color: $text-secondary; max-width: 320px; }

  &__start-btn {
    display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;
    background: $primary; color: $white; border: none;
    padding: 0.8rem 1.75rem; border-radius: 12px; font-weight: 700; font-size: 0.88rem;
    cursor: pointer; box-shadow: 0 4px 14px rgba($primary, 0.3); transition: all 0.2s;
    &:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba($primary, 0.4); }
  }

  // ── Table section ─────────────────────────────────────────
  &__table-section {
    background: $white; border-radius: 18px;
    border: 1px solid rgba($primary-dark, 0.07);
    box-shadow: 0 2px 12px rgba($primary-dark, 0.04); overflow: hidden;
  }
  &__table-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.1rem 1.5rem; border-bottom: 1px solid rgba($primary-dark, 0.06);
    background: rgba($primary-dark, 0.015);
  }
  &__table-title-area { display: flex; align-items: center; gap: 0.75rem; }
  &__table-title {
    margin: 0; font-size: 0.9rem; font-weight: 800; color: $primary-dark;
    display: flex; align-items: center; gap: 0.5rem;
    i { color: $primary; font-size: 0.82rem; }
  }
  &__table-count {
    background: rgba($primary, 0.08); color: $primary; border-radius: 20px;
    padding: 0.12rem 0.6rem; font-size: 0.68rem; font-weight: 800;
  }
  &__table-add-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba($primary, 0.07); color: $primary;
    border: 1.5px solid rgba($primary, 0.2); padding: 0.5rem 1rem;
    border-radius: 10px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
    &:hover { background: $primary; color: $white; border-color: $primary; }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
