<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videoPlanningService } from '@/services/videoPlanning.service'
import { EstadoEdicion } from '@/types/videoPlanning'
import type { VideoItem, VideoPlanning } from '@/types/videoPlanning'

const route = useRoute()
const router = useRouter()

const workspaceId = route.params['workspaceId'] as string
const entryId = route.params['entryId'] as string
const title = (route.query['title'] as string) || 'Producción'

const planning = ref<VideoPlanning | null>(null)
const loading = ref(true)
const expandedId = ref<string | null>(null)
const updatingId = ref<string | null>(null)

async function load() {
  try {
    const loaded = await videoPlanningService.getByEntry(entryId)
    if (loaded && loaded.workspaceId && loaded.workspaceId !== workspaceId) {
      throw new Error('Workspace mismatch')
    }
    planning.value = loaded
  } catch { /* silent */ } finally {
    loading.value = false
  }
}

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function advanceEdicion(item: VideoItem) {
  if (!planning.value || updatingId.value) return
  const next = item.edicion === EstadoEdicion.POR_EDITAR
    ? EstadoEdicion.EDITADO
    : item.edicion === EstadoEdicion.EDITADO
      ? EstadoEdicion.POR_EDITAR
      : EstadoEdicion.EDITADO
  updatingId.value = item._id
  try {
    planning.value = await videoPlanningService.updateItem(planning.value._id, item._id, { edicion: next })
  } catch { /* silent */ } finally {
    updatingId.value = null
  }
}

const items = computed(() => planning.value?.items.slice().sort((a, b) => a.order - b.order) ?? [])

const grabadasCount = computed(() => items.value.filter(i => i.estadoProduccion === 'GRABADO').length)
const editadasCount = computed(() => items.value.filter(i => i.edicion === EstadoEdicion.EDITADO).length)

const TIPO_STYLE: Record<string, { bg: string; color: string }> = {
  TOFU: { bg: '#ede9fe', color: '#7c3aed' },
  MOFU: { bg: '#fef3c7', color: '#b45309' },
  BOFU: { bg: '#fee2e2', color: '#dc2626' },
}

const EDICION_CONFIG: Record<string, { label: string; dot: string; cls: string }> = {
  [EstadoEdicion.POR_EDITAR]: { label: 'Por editar', dot: '#94a3b8', cls: 'state--pending' },
  [EstadoEdicion.EDITADO]:    { label: 'Editado',    dot: '#10b981', cls: 'state--done'    },
  RECHAZADO:                  { label: 'Rechazado',  dot: '#ef4444', cls: 'state--rejected' },
}

onMounted(load)
</script>

<template>
  <div class="evp">

    <!-- ── Header ──────────────────────────────────────── -->
    <header class="evp__header">
      <button class="evp__back" @click="router.push({ name: 'EditorDashboard' })">
        <i class="fa-solid fa-arrow-left" />
      </button>

      <div class="evp__header-info">
        <h1 class="evp__title">{{ title }}</h1>
        <div class="evp__meta">
          <span class="evp__meta-item">
            <i class="fa-solid fa-film" />
            {{ items.length }} videos
          </span>
          <span class="evp__meta-sep">·</span>
          <span class="evp__meta-item evp__meta-item--green">
            <i class="fa-solid fa-circle-check" />
            {{ grabadasCount }} grabados
          </span>
          <span class="evp__meta-sep">·</span>
          <span class="evp__meta-item evp__meta-item--indigo">
            <i class="fa-solid fa-wand-magic-sparkles" />
            {{ editadasCount }} / {{ items.length }} editados
          </span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="evp__progress-wrap">
        <div
          class="evp__progress-bar"
          :style="{ width: items.length ? (editadasCount / items.length * 100) + '%' : '0%' }"
        />
      </div>
    </header>

    <!-- ── Loading ─────────────────────────────────────── -->
    <div v-if="loading" class="evp__loading">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando videos…</span>
    </div>

    <!-- ── Empty ───────────────────────────────────────── -->
    <div v-else-if="!items.length" class="evp__empty">
      <i class="fa-solid fa-video-slash" />
      <span>Sin videos en esta producción</span>
    </div>

    <!-- ── List ────────────────────────────────────────── -->
    <div v-else class="evp__list">
      <div
        v-for="item in items"
        :key="item._id"
        class="evp__card"
        :class="{
          'evp__card--done': item.edicion === 'EDITADO',
          'evp__card--open': expandedId === item._id,
        }"
      >
        <!-- Card row -->
        <div class="evp__card-row" @click="toggle(item._id)">
          <!-- Number -->
          <span class="evp__num">#{{ item.numero }}</span>

          <!-- Title + tipo -->
          <div class="evp__card-main">
            <span class="evp__tema">{{ item.tema }}</span>
            <span v-if="item.tipo" class="evp__tipo-sub">{{ item.tipo }}</span>
          </div>

          <!-- Chips + edicion control -->
          <div class="evp__card-right">
            <!-- TOFU/MOFU/BOFU chip -->
            <span
              v-if="item.tipoGuion"
              class="evp__tipo-chip"
              :style="TIPO_STYLE[item.tipoGuion] ? { background: TIPO_STYLE[item.tipoGuion].bg, color: TIPO_STYLE[item.tipoGuion].color } : {}"
            >
              {{ item.tipoGuion }}
            </span>

            <!-- Edición state button -->
            <button
              class="evp__state-btn"
              :class="EDICION_CONFIG[item.edicion]?.cls"
              :disabled="!!updatingId"
              @click.stop="advanceEdicion(item)"
              :title="item.edicion === 'EDITADO' ? 'Click para revertir a Por editar' : 'Marcar como Editado'"
            >
              <i
                v-if="updatingId === item._id"
                class="fa-solid fa-circle-notch fa-spin"
              />
              <template v-else>
                <i v-if="item.edicion === 'EDITADO'" class="fa-solid fa-circle-check" />
                <i v-else class="fa-regular fa-circle" />
                <span>{{ EDICION_CONFIG[item.edicion]?.label ?? item.edicion }}</span>
              </template>
            </button>

            <!-- Expand chevron -->
            <i class="fa-solid fa-chevron-down evp__chevron" :class="{ 'evp__chevron--open': expandedId === item._id }" />
          </div>
        </div>

        <!-- ── Script panel ─────────────────────────── -->
        <Transition name="slide-down">
          <div v-if="expandedId === item._id" class="evp__script">

            <!-- AI script -->
            <template v-if="item.guionIA?.gancho">
              <div v-if="item.guionIA.conceptoVisual" class="evp__block evp__block--concept">
                <span class="evp__block-label">Concepto visual</span>
                <p>{{ item.guionIA.conceptoVisual }}</p>
              </div>
              <div class="evp__block evp__block--hook">
                <span class="evp__block-label">Gancho</span>
                <p>{{ item.guionIA.gancho }}</p>
              </div>
              <div v-if="item.guionIA.textoPantalla" class="evp__block">
                <span class="evp__block-label">Texto en pantalla</span>
                <p>{{ item.guionIA.textoPantalla }}</p>
              </div>
              <div class="evp__block">
                <span class="evp__block-label">Cuerpo</span>
                <p class="evp__pre">{{ item.guionIA.cuerpo }}</p>
              </div>
              <div class="evp__block evp__block--cta">
                <span class="evp__block-label">CTA</span>
                <p>{{ item.guionIA.cta }}</p>
              </div>
              <div v-if="item.guionIA.broll" class="evp__block evp__block--broll">
                <span class="evp__block-label">B-Roll / Referencias</span>
                <p>{{ item.guionIA.broll }}</p>
              </div>
            </template>

            <!-- Manual script -->
            <template v-else-if="item.guion?.trim()">
              <div class="evp__block">
                <span class="evp__block-label">Guión</span>
                <p class="evp__pre">{{ item.guion }}</p>
              </div>
            </template>

            <!-- No script -->
            <div v-else class="evp__no-script">
              <i class="fa-solid fa-file-pen" />
              Sin guión generado todavía
            </div>

            <!-- Extras -->
            <div v-if="item.descripcion" class="evp__block evp__block--muted">
              <span class="evp__block-label">Descripción</span>
              <p>{{ item.descripcion }}</p>
            </div>

            <a v-if="item.linkEjemplo" :href="item.linkEjemplo" target="_blank" rel="noopener" class="evp__ref-link">
              <i class="fa-solid fa-arrow-up-right-from-square" />
              Ver referencia
            </a>

            <!-- Bottom action -->
            <div class="evp__script-footer">
              <button
                class="evp__mark-btn"
                :class="{ 'evp__mark-btn--done': item.edicion === 'EDITADO' }"
                :disabled="!!updatingId"
                @click="advanceEdicion(item)"
              >
                <i v-if="updatingId === item._id" class="fa-solid fa-circle-notch fa-spin" />
                <template v-else>
                  <i v-if="item.edicion === 'EDITADO'" class="fa-solid fa-rotate-left" />
                  <i v-else class="fa-solid fa-check" />
                  {{ item.edicion === 'EDITADO' ? 'Revertir a Por editar' : 'Marcar como Editado' }}
                </template>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ── Transition ─────────────────────────────────────────────
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.28s ease, opacity 0.22s ease;
  max-height: 600px;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.evp {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f1f5f9;

  // ── Header ────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.5rem;
    background: $primary-dark;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(white, 0.07);
    position: relative;
  }

  &__back {
    width: 36px;
    height: 36px;
    border: 1px solid rgba(white, 0.15);
    border-radius: 10px;
    background: rgba(white, 0.06);
    color: rgba(white, 0.65);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
    transition: all 0.18s;

    &:hover { background: rgba(white, 0.13); color: white; border-color: rgba(white, 0.3); }
  }

  &__header-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    font-size: 1rem;
    font-weight: 800;
    color: white;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__meta-sep { color: rgba(white, 0.2); font-size: 0.75rem; }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(white, 0.45);

    i { font-size: 0.65rem; }
    &--green  { color: #6ee7b7; }
    &--indigo { color: #a5b4fc; }
  }

  &__progress-wrap {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(white, 0.08);
  }

  &__progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    transition: width 0.4s ease;
    border-radius: 0 2px 2px 0;
  }

  // ── Loading / Empty ───────────────────────────────────────
  &__loading,
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 600;
    i { font-size: 1.75rem; }
  }

  // ── List ──────────────────────────────────────────────────
  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  // ── Card ─────────────────────────────────────────────────
  &__card {
    background: white;
    border-radius: 14px;
    border: 1.5px solid #e2e8f0;
    overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;

    &:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(99,102,241,0.08); }

    &--done {
      border-color: #a7f3d0;
      background: linear-gradient(135deg, #f0fdf4 0%, white 40%);

      .evp__num { color: #10b981; }
    }

    &--open {
      border-color: #a5b4fc;
      box-shadow: 0 4px 20px rgba(99,102,241,0.12);
    }
  }

  &__card-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;

    &:hover { background: #f8fafc; }
  }

  &__num {
    font-size: 0.68rem;
    font-weight: 800;
    color: #94a3b8;
    min-width: 26px;
    text-align: right;
    letter-spacing: 0.04em;
    transition: color 0.2s;
  }

  &__card-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  &__tema {
    font-size: 0.875rem;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tipo-sub {
    font-size: 0.68rem;
    color: #64748b;
  }

  &__card-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  &__tipo-chip {
    font-size: 0.63rem;
    font-weight: 800;
    padding: 0.15rem 0.45rem;
    border-radius: 5px;
    letter-spacing: 0.05em;
  }

  // ── Edicion state button ──────────────────────────────────
  &__state-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.65rem;
    border-radius: 99px;
    border: 1.5px solid;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;

    &.state--pending {
      border-color: #e2e8f0;
      background: #f8fafc;
      color: #64748b;

      &:hover:not(:disabled) {
        border-color: #6366f1;
        background: #ede9fe;
        color: #4f46e5;
      }
    }

    &.state--done {
      border-color: #6ee7b7;
      background: #f0fdf4;
      color: #059669;

      &:hover:not(:disabled) {
        background: #d1fae5;
        border-color: #34d399;
      }
    }

    &.state--rejected {
      border-color: #fecaca;
      background: #fef2f2;
      color: #dc2626;
    }

    &:disabled { opacity: 0.6; cursor: not-allowed; }

    i { font-size: 0.7rem; }
  }

  &__chevron {
    font-size: 0.65rem;
    color: #94a3b8;
    transition: transform 0.22s ease;
    flex-shrink: 0;

    &--open { transform: rotate(180deg); }
  }

  // ── Script panel ──────────────────────────────────────────
  &__script {
    padding: 0 1rem 0.875rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background: #fafbff;
  }

  &__block {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.65rem 0.75rem;
    border-radius: 9px;
    background: white;
    border-left: 3px solid #e2e8f0;
    border: 1px solid #f1f5f9;
    border-left-width: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    margin-top: 0.6rem;

    &--concept { border-left-color: #6366f1; background: #f5f3ff; border-color: #ddd6fe; }
    &--hook    { border-left-color: #f59e0b; background: #fffbeb; border-color: #fde68a; }
    &--cta     { border-left-color: #10b981; background: #f0fdf4; border-color: #a7f3d0; }
    &--broll   { border-left-color: #64748b; background: #f8fafc; border-color: #e2e8f0; }
    &--muted   { border-left-color: #cbd5e1; background: #f8fafc; border-color: #e2e8f0; }

    p { margin: 0; font-size: 0.82rem; color: #334155; line-height: 1.6; }
  }

  &__block-label {
    font-size: 0.63rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 0.1rem;
  }

  &__pre { white-space: pre-wrap; }

  &__no-script {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 0.75rem;
    font-size: 0.78rem;
    color: #94a3b8;
    font-style: italic;
    margin-top: 0.6rem;
    i { font-size: 0.9rem; }
  }

  &__ref-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.73rem;
    font-weight: 600;
    color: #6366f1;
    text-decoration: none;
    padding: 0.25rem 0;

    &:hover { text-decoration: underline; }
    i { font-size: 0.65rem; }
  }

  &__script-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.5rem;
    border-top: 1px solid #f1f5f9;
    margin-top: 0.25rem;
  }

  &__mark-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.1rem;
    border-radius: 10px;
    border: none;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    background: #6366f1;
    color: white;

    &:hover:not(:disabled) {
      background: #4f46e5;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }

    &--done {
      background: #f1f5f9;
      color: #64748b;

      &:hover:not(:disabled) {
        background: #fee2e2;
        color: #dc2626;
        transform: none;
        box-shadow: none;
      }
    }

    &:disabled { opacity: 0.55; cursor: not-allowed; }
    i { font-size: 0.75rem; }
  }
}
</style>
