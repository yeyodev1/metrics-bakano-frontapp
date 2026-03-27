<script setup lang="ts">
import type { VideoCalendarItem } from '@/types/videoPlanning'

const props = defineProps<{
  show: boolean
  item: VideoCalendarItem | null
  workspaceName?: string
  workspaceLogoUrl?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show && item" class="vip">
      <div class="vip__overlay" @click="emit('close')" />
      <div class="vip__container">
        <!-- Header -->
        <div class="vip__header">
          <div class="vip__header-left">
            <i class="fa-brands fa-instagram vip__header-icon" />
            <span class="vip__header-title">Vista previa de publicación</span>
          </div>
          <button class="vip__close" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="vip__body">

        <!-- DEMO banner -->
        <div class="vip__demo-banner">
          <i class="fa-solid fa-wand-magic-sparkles" />
          <div class="vip__demo-banner-text">
            <span class="vip__demo-badge">VISTA PREVIA SIMULADA</span>
            <span>Esta pantalla es una <strong>referencia visual orientativa</strong>. El diseño, formato y portada final serán definidos por tu equipo de contenido.</span>
          </div>
        </div>

        <!-- Instagram card mock -->
        <div class="vip__ig-card">
          <!-- IG top bar -->
          <div class="vip__ig-topbar">
            <div class="vip__ig-avatar">
              <img v-if="workspaceLogoUrl" :src="workspaceLogoUrl" :alt="workspaceName" class="vip__ig-avatar-img" />
              <span v-else>{{ (workspaceName || 'C').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="vip__ig-account">
              <span class="vip__ig-name">{{ workspaceName || 'Tu cuenta' }}</span>
              <span class="vip__ig-sub">Publicación programada</span>
            </div>
            <i class="fa-solid fa-ellipsis vip__ig-more" />
          </div>

          <!-- IG media placeholder -->
          <div class="vip__ig-media">
            <div class="vip__ig-media-inner">
              <i class="fa-solid fa-film" />
              <span class="vip__ig-tipo">{{ item.tipo || 'Reel' }}</span>
              <span class="vip__ig-tema">{{ item.tema }}</span>
            </div>
          </div>

          <!-- IG actions -->
          <div class="vip__ig-actions">
            <div class="vip__ig-actions-left">
              <i class="fa-regular fa-heart" />
              <i class="fa-regular fa-comment" />
              <i class="fa-regular fa-paper-plane" />
            </div>
            <i class="fa-regular fa-bookmark" />
          </div>

          <!-- IG caption -->
          <div class="vip__ig-caption">
            <template v-if="item.copyPublicacion">
              <span class="vip__ig-caption-user">{{ workspaceName || 'Tu cuenta' }}</span>
              <span class="vip__ig-caption-text">{{ item.copyPublicacion }}</span>
            </template>
            <span v-else class="vip__ig-caption-empty">
              <i class="fa-solid fa-pen-to-square" /> Sin copy todavía
            </span>
          </div>

          <!-- IG date -->
          <div class="vip__ig-date">{{ formatDate(item.fechaPublicacion) }}</div>
        </div>

        <!-- Footer details -->
        <div class="vip__details">
          <div class="vip__detail-row">
            <span class="vip__detail-label"><i class="fa-regular fa-calendar" /> Fecha planificada</span>
            <span class="vip__detail-value">{{ formatDate(item.fechaPublicacion) }}</span>
          </div>
          <div v-if="item.linkVideo" class="vip__detail-row">
            <span class="vip__detail-label"><i class="fa-solid fa-link" /> Video final</span>
            <a :href="item.linkVideo" target="_blank" rel="noopener" class="vip__detail-link">
              Ver video <i class="fa-solid fa-arrow-up-right-from-square" />
            </a>
          </div>
        </div>

        </div><!-- end vip__body -->
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.vip {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  z-index: 1300; padding: 1.5rem;

  &__overlay {
    position: absolute; inset: 0;
    background: rgba($primary-dark, 0.6); backdrop-filter: blur(12px);
  }

  &__container {
    position: relative; background: $white; width: 100%; max-width: 400px;
    border-radius: 20px; box-shadow: 0 30px 60px -10px rgba(0,0,0,0.35);
    overflow: hidden; animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; flex-direction: column;
    max-height: calc(100dvh - 3rem);
  }

  &__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    flex-shrink: 0;
  }

  &__header-left { display: flex; align-items: center; gap: 0.6rem; }

  &__header-icon {
    font-size: 1.3rem;
    background: linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  &__header-title { font-weight: 800; font-size: 0.95rem; color: $primary-dark; }

  &__close {
    width: 30px; height: 30px; border-radius: 50%; border: none;
    background: rgba($primary-dark, 0.06); color: $text-secondary; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
    transition: all 0.2s;
    &:hover { background: rgba($primary-dark, 0.12); }
  }

  &__body {
    overflow-y: auto; flex: 1; min-height: 0;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  &__demo-banner {
    display: flex; align-items: flex-start; gap: 0.65rem;
    margin: 0.6rem 1.25rem 0.75rem;
    background: linear-gradient(135deg, rgba(#f59e0b, 0.1), rgba(#ef4444, 0.07));
    border: 1.5px solid rgba(#f59e0b, 0.35);
    border-radius: 10px; padding: 0.65rem 0.9rem;
    font-size: 0.74rem; color: #92400e; line-height: 1.45;
    > i { flex-shrink: 0; margin-top: 0.15rem; font-size: 0.9rem; color: #d97706; }
    strong { font-weight: 700; }
  }

  &__demo-banner-text {
    display: flex; flex-direction: column; gap: 0.25rem;
  }

  &__demo-badge {
    display: inline-flex; align-items: center;
    font-size: 0.62rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    background: linear-gradient(90deg, #f59e0b, #ef4444);
    color: #fff; padding: 0.15rem 0.5rem; border-radius: 20px;
    width: fit-content;
  }

  // ── Instagram card ───────────────────────────────────────
  &__ig-card {
    margin: 0 1.25rem 0.75rem;
    border: 1px solid rgba($primary-dark, 0.1); border-radius: 14px; overflow: hidden;
    background: #fff;
  }

  &__ig-topbar {
    display: flex; align-items: center; gap: 0.65rem;
    padding: 0.65rem 0.85rem;
  }

  &__ig-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 800; color: #fff; flex-shrink: 0;
    overflow: hidden;
  }

  &__ig-avatar-img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
  }

  &__ig-account { flex: 1; display: flex; flex-direction: column; }
  &__ig-name { font-size: 0.8rem; font-weight: 700; color: #111; }
  &__ig-sub { font-size: 0.68rem; color: #888; }
  &__ig-more { color: #555; font-size: 0.9rem; }

  &__ig-media {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  }

  &__ig-media-inner {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center; padding: 1rem;
    i { font-size: 2.5rem; color: rgba(#fff, 0.25); }
  }

  &__ig-tipo {
    font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    background: rgba(#fff, 0.12); color: rgba(#fff, 0.7); padding: 0.2rem 0.5rem; border-radius: 20px;
  }

  &__ig-tema {
    font-size: 0.95rem; font-weight: 700; color: rgba(#fff, 0.9);
    max-width: 220px; line-height: 1.3;
  }

  &__ig-actions {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.6rem 0.85rem;
    i { font-size: 1.35rem; cursor: pointer; color: #111; transition: color 0.15s; }
  }

  &__ig-actions-left { display: flex; gap: 0.85rem; }

  &__ig-caption {
    padding: 0 0.85rem 0.5rem; font-size: 0.82rem; line-height: 1.45;
  }

  &__ig-caption-user { font-weight: 700; color: #111; margin-right: 0.4rem; }
  &__ig-caption-text { color: #333; white-space: pre-wrap; word-break: break-word; }
  &__ig-caption-empty { color: #aaa; font-style: italic; font-size: 0.78rem; }

  &__ig-date {
    padding: 0.2rem 0.85rem 0.75rem; font-size: 0.7rem; color: #aaa; text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  // ── Footer details ───────────────────────────────────────
  &__details {
    padding: 0.75rem 1.25rem 1.25rem;
    border-top: 1px solid rgba($primary-dark, 0.06);
    display: flex; flex-direction: column; gap: 0.5rem;
  }

  &__detail-row {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 0.8rem;
  }

  &__detail-label { color: $text-secondary; display: flex; align-items: center; gap: 0.4rem; }
  &__detail-value { font-weight: 600; color: $primary-dark; }
  &__detail-link {
    color: $primary; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 0.35rem;
    &:hover { text-decoration: underline; }
    i { font-size: 0.7rem; }
  }
}

@keyframes popIn {
  from { transform: scale(0.88) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
