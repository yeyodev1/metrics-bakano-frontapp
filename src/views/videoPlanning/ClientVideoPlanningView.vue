<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { VideoPlanning, VideoItem } from '@/types/videoPlanning'
import { ClienteAprobacion } from '@/types/videoPlanning'
import StatusBadge from '@/components/videoPlanning/StatusBadge.vue'
import VideoScriptModal from '@/components/videoPlanning/VideoScriptModal.vue'
import ClientApprovalPanel from '@/components/videoPlanning/ClientApprovalPanel.vue'

const route = useRoute()
const router = useRouter()

const entryId = route.params.entryId as string
const pageTitle = computed(() => (route.query.title as string) || 'Planificación')

const planning = ref<VideoPlanning | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const showScript = ref(false)
const scriptItem = ref<VideoItem | null>(null)

const approvals = reactive<Record<string, ClienteAprobacion>>({})
const rejections = reactive<Record<string, string>>({})

const locked = computed(() => planning.value?.clienteAprobado === true)
const items = computed(() => planning.value?.items ?? [])

const reviewed = computed(() =>
  items.value.filter(i => approvals[i._id] && approvals[i._id] !== ClienteAprobacion.PENDIENTE).length
)

async function loadPlanning() {
  loading.value = true
  try {
    planning.value = await videoPlanningService.getByEntry(entryId)
    if (planning.value) {
      for (const item of planning.value.items) {
        approvals[item._id] = item.clienteAprobacion
        if (item.motivoRechazo) rejections[item._id] = item.motivoRechazo
      }
    }
  } catch {
    error.value = 'Error al cargar los videos'
  } finally {
    loading.value = false
  }
}

function openScript(item: VideoItem) {
  scriptItem.value = item
  showScript.value = true
}

function updateApproval(itemId: string, value: ClienteAprobacion) {
  // Toggle: clicking the already-selected option resets to PENDIENTE
  if (approvals[itemId] === value) {
    approvals[itemId] = ClienteAprobacion.PENDIENTE
    delete rejections[itemId]
    return
  }
  approvals[itemId] = value
  if (value !== ClienteAprobacion.RECHAZADO) {
    delete rejections[itemId]
  }
}

function updateRejection(itemId: string, reason: string) {
  rejections[itemId] = reason
}

async function submitApproval() {
  if (!planning.value) return
  saving.value = true
  try {
    planning.value = await videoPlanningService.submitClientApproval(planning.value._id, {
      approvals: Object.entries(approvals).map(([itemId, clienteAprobacion]) => ({
        itemId,
        clienteAprobacion,
        motivoRechazo: rejections[itemId] || undefined,
      })),
    })
  } catch {
    error.value = 'Error al enviar la aprobación'
  } finally {
    saving.value = false
  }
}

onMounted(loadPlanning)
</script>

<template>
  <div class="cv">

    <!-- ── Hero ──────────────────────────────────────────────── -->
    <div class="cv__hero">
      <div class="cv__hero-inner">
        <div class="cv__hero-left">
          <button class="cv__back-btn" @click="router.back()">
            <i class="fa-solid fa-arrow-left" />
          </button>
          <div>
            <p class="cv__eyebrow">
              <i class="fa-solid fa-film" />
              Videos para revisar y aprobar
            </p>
            <h1 class="cv__title">{{ pageTitle }}</h1>
            <p class="cv__subtitle" v-if="!loading && planning">
              {{ reviewed }} / {{ items.length }} revisados
              <span v-if="locked" class="cv__locked-pill">
                <i class="fa-solid fa-lock" /> Aprobación enviada
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────── -->
    <div v-if="loading" class="cv__loading">
      <div class="cv__spinner" />
      <span>Cargando planificación...</span>
    </div>

    <!-- ── Error ──────────────────────────────────────────────── -->
    <div v-else-if="error" class="cv__error">
      <i class="fa-solid fa-triangle-exclamation" />
      {{ error }}
    </div>

    <!-- ── Empty ──────────────────────────────────────────────── -->
    <div v-else-if="!planning || !items.length" class="cv__empty">
      <div class="cv__empty-icon"><i class="fa-solid fa-film" /></div>
      <h3>Sin videos disponibles</h3>
      <p>Aún no hay videos para revisar en esta planificación.</p>
    </div>

    <!-- ── Content: two-column on desktop ─────────────────────── -->
    <div v-else class="cv__body">

      <!-- Left: video list -->
      <div class="cv__list">
        <div
          v-for="item in items"
          :key="item._id"
          class="cv-item"
          :class="{
            'cv-item--approved': approvals[item._id] === ClienteAprobacion.APROBADO,
            'cv-item--rejected': approvals[item._id] === ClienteAprobacion.RECHAZADO,
          }"
        >
          <!-- Number -->
          <div class="cv-item__num">{{ item.numero }}</div>

          <!-- Main content -->
          <div class="cv-item__content">
            <!-- Top row: title + tipo + badges -->
            <div class="cv-item__top">
              <div class="cv-item__meta">
                <h3 class="cv-item__title">{{ item.tema }}</h3>
                <span v-if="item.tipo" class="cv-item__tipo">{{ item.tipo }}</span>
              </div>
              <div class="cv-item__badges">
                <StatusBadge :status="item.estadoProduccion" type="produccion" />
                <StatusBadge :status="item.edicion" type="edicion" />
                <StatusBadge :status="item.estadoPublicacion" type="publicacion" />
              </div>
            </div>

            <!-- Description -->
            <p v-if="item.descripcion" class="cv-item__desc">{{ item.descripcion }}</p>

            <!-- Actions row -->
            <div class="cv-item__actions">
              <button class="cv-item__btn cv-item__btn--script" @click="openScript(item)">
                <i class="fa-solid fa-scroll" />
                Ver Guión
              </button>
              <a
                v-if="item.linkEjemplo"
                :href="item.linkEjemplo"
                target="_blank"
                rel="noopener noreferrer"
                class="cv-item__btn cv-item__btn--ref"
              >
                <i class="fa-brands fa-instagram" />
                Ver referencia
              </a>

              <!-- Approval (active) -->
              <div v-if="!locked" class="cv-item__approval">
                <label class="cv-item__radio cv-item__radio--approve">
                  <input
                    type="radio"
                    :name="`approval-${item._id}`"
                    :value="ClienteAprobacion.APROBADO"
                    :checked="approvals[item._id] === ClienteAprobacion.APROBADO"
                    @click="updateApproval(item._id, ClienteAprobacion.APROBADO)"
                  />
                  <i class="fa-solid fa-circle-check" />
                  Aprobar
                </label>
                <label class="cv-item__radio cv-item__radio--reject">
                  <input
                    type="radio"
                    :name="`approval-${item._id}`"
                    :value="ClienteAprobacion.RECHAZADO"
                    :checked="approvals[item._id] === ClienteAprobacion.RECHAZADO"
                    @click="updateApproval(item._id, ClienteAprobacion.RECHAZADO)"
                  />
                  <i class="fa-solid fa-circle-xmark" />
                  Rechazar
                </label>
              </div>

              <!-- Locked badge -->
              <StatusBadge v-else :status="item.clienteAprobacion" type="aprobacion" />
            </div>

            <!-- Rejection reason textarea -->
            <div
              v-if="!locked && approvals[item._id] === ClienteAprobacion.RECHAZADO"
              class="cv-item__rejection"
            >
              <i class="fa-solid fa-comment-dots cv-item__rejection-icon" />
              <textarea
                :value="rejections[item._id] || ''"
                @input="updateRejection(item._id, ($event.target as HTMLTextAreaElement).value)"
                placeholder="¿Por qué rechazas este video? (opcional, pero ayuda al equipo)"
                rows="2"
                class="cv-item__rejection-textarea"
              />
            </div>

            <!-- Locked rejection note -->
            <p v-if="locked && item.motivoRechazo" class="cv-item__rejection-note">
              <i class="fa-solid fa-comment" />
              {{ item.motivoRechazo }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right: sticky approval panel -->
      <aside class="cv__sidebar">
        <ClientApprovalPanel
          :items="items"
          :approvals="approvals"
          :rejections="rejections"
          :locked="locked"
          :isSaving="saving"
          @update-approval="updateApproval"
          @update-rejection="updateRejection"
          @submit="submitApproval"
        />
      </aside>
    </div>

    <VideoScriptModal
      :show="showScript"
      :item="scriptItem"
      @close="showScript = false"
    />
  </div>
</template>

<style lang="scss" scoped>
// ── Shell ──────────────────────────────────────────────────────
.cv {
  min-height: 100vh;
  background: #f8f7f5;
  display: flex;
  flex-direction: column;

  // ── Hero ─────────────────────────────────────────────────────
  &__hero {
    background: $primary-dark;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 24px 24px;
      pointer-events: none;
    }
    &::after {
      content: '';
      position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, $primary, transparent);
    }
  }

  &__hero-inner {
    position: relative; z-index: 1;
    padding: 2rem 2.5rem;
    @media (max-width: 768px) { padding: 1.5rem 1.25rem; }
  }

  &__hero-left { display: flex; align-items: center; gap: 1.25rem; }

  &__back-btn {
    width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
    border: 1px solid rgba($white, 0.12); background: rgba($white, 0.06);
    color: rgba($white, 0.7); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
    transition: all 0.2s;
    &:hover { background: rgba($white, 0.12); color: $white; }
  }

  &__eyebrow {
    margin: 0 0 0.35rem; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: rgba($white, 0.45);
    display: flex; align-items: center; gap: 0.4rem; i { font-size: 0.6rem; }
  }

  &__title { margin: 0 0 0.35rem; font-size: 1.75rem; font-weight: 800; color: $white; letter-spacing: -0.02em; }

  &__subtitle {
    margin: 0; font-size: 0.82rem; color: rgba($white, 0.5);
    display: flex; align-items: center; gap: 0.75rem;
  }

  &__locked-pill {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: rgba(#fef9c3, 0.15); color: #fde68a;
    border: 1px solid rgba(#fde68a, 0.3); border-radius: 20px;
    padding: 0.2rem 0.65rem; font-size: 0.72rem; font-weight: 700;
  }

  // ── States ───────────────────────────────────────────────────
  &__loading {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 1rem; padding: 5rem 1rem;
    color: $text-secondary; font-size: 0.9rem; font-weight: 600; opacity: 0.6;
  }
  &__spinner {
    width: 36px; height: 36px; border: 3px solid rgba($primary, 0.15);
    border-top-color: $primary; border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  &__error {
    margin: 1.5rem 2.5rem; display: flex; align-items: center; gap: 0.6rem;
    background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;
    border-radius: 12px; padding: 0.9rem 1.25rem; font-size: 0.88rem; font-weight: 600;
  }
  &__empty {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; padding: 5rem 2rem; gap: 0.75rem;
  }
  &__empty-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: rgba($primary, 0.07); border: 2px dashed rgba($primary, 0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.75rem; color: $primary; opacity: 0.7; margin-bottom: 0.5rem;
  }
  &__empty h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
  &__empty p  { margin: 0; font-size: 0.85rem; color: $text-secondary; }

  // ── Body: two-column ─────────────────────────────────────────
  &__body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
    padding: 1.75rem 2.5rem;
    align-items: start;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      padding: 1.25rem;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__sidebar {
    position: sticky;
    top: 1.5rem;

    @media (max-width: 1024px) {
      position: static;
    }
  }
}

// ── Video item row ────────────────────────────────────────────
.cv-item {
  background: $white;
  border-radius: 16px;
  border: 1.5px solid rgba($primary-dark, 0.07);
  padding: 1.25rem 1.25rem 1.25rem 0;
  display: flex;
  gap: 0;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover { box-shadow: 0 4px 16px rgba($primary-dark, 0.06); }

  &--approved { border-color: #86efac; background: #f0fdf4; }
  &--rejected { border-color: #fca5a5; background: #fff5f5; }

  // ── Number column ─────────────────────────────────────────
  &__num {
    width: 56px; min-width: 56px;
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 0.1rem;
    font-size: 1.4rem; font-weight: 900; color: rgba($primary-dark, 0.12);
    line-height: 1;
  }

  // ── Content column ────────────────────────────────────────
  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__meta { display: flex; flex-direction: column; gap: 0.2rem; }
  &__title { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; line-height: 1.3; }
  &__tipo {
    font-size: 0.72rem; font-weight: 700; color: $primary;
    background: rgba($primary, 0.08); border-radius: 6px;
    padding: 0.15rem 0.5rem; display: inline-block; align-self: flex-start;
  }

  &__badges { display: flex; gap: 0.3rem; flex-wrap: wrap; align-items: center; flex-shrink: 0; }

  &__desc {
    margin: 0; font-size: 0.84rem; color: $text-secondary; line-height: 1.55;
    max-width: 600px;
  }

  // ── Actions row ───────────────────────────────────────────
  &__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-top: 0.15rem;
  }

  &__btn {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.78rem; font-weight: 700; border-radius: 8px;
    padding: 0.35rem 0.8rem; cursor: pointer; transition: all 0.2s;
    text-decoration: none; border: 1px solid transparent;

    &--script {
      color: $primary; background: rgba($primary, 0.08); border: none;
      &:hover { background: $primary; color: $white; }
    }
    &--ref {
      color: #e1306c; background: rgba(#e1306c, 0.07); border-color: rgba(#e1306c, 0.15);
      &:hover { background: #e1306c; color: $white; border-color: #e1306c; }
    }
  }

  &__approval {
    display: flex; gap: 0.4rem; margin-left: auto;
    @media (max-width: 640px) { margin-left: 0; }
  }

  &__radio {
    display: flex; align-items: center; gap: 0.35rem; cursor: pointer;
    font-size: 0.78rem; font-weight: 700; padding: 0.35rem 0.75rem;
    border-radius: 9px; border: 1.5px solid rgba($primary-dark, 0.1); transition: all 0.2s;
    user-select: none;
    i { font-size: 0.9rem; }
    input { margin: 0; display: none; }

    &--approve {
      color: #166534;
      &:has(input:checked) { background: #dcfce7; border-color: #86efac; }
    }
    &--reject {
      color: #991b1b;
      &:has(input:checked) { background: #fee2e2; border-color: #fca5a5; }
    }
  }

  // ── Rejection textarea ────────────────────────────────────
  &__rejection {
    display: flex; align-items: flex-start; gap: 0.5rem;
  }
  &__rejection-icon { color: #fca5a5; margin-top: 0.45rem; flex-shrink: 0; }
  &__rejection-textarea {
    flex: 1; resize: none;
    border: 1.5px solid #fca5a5; border-radius: 8px;
    padding: 0.5rem 0.65rem; font-size: 0.8rem; color: #991b1b;
    background: #fff5f5; font-family: inherit; outline: none;
    transition: border-color 0.15s;
    &::placeholder { color: #fca5a5; }
    &:focus { border-color: #f87171; }
  }

  &__rejection-note {
    margin: 0; font-size: 0.78rem; color: #991b1b; font-style: italic;
    display: flex; align-items: flex-start; gap: 0.4rem;
    i { flex-shrink: 0; margin-top: 0.1rem; }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
