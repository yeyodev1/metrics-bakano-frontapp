<template>
  <div
    :class="['roc', { 'is-selected': selected, 'is-suggested': suggested, 'is-taken': !!takenBy }]"
    role="button"
    tabindex="0"
    @click="$emit('select')"
    @keydown.enter="$emit('select')"
  >
    <div class="roc__thumb">
      <img v-if="reel.thumbnailUrl || reel.mediaUrl" :src="reel.thumbnailUrl || reel.mediaUrl" alt="" />
      <div v-else class="roc__thumb-fallback"><i class="fa-solid fa-play" /></div>

      <!-- Watching beats guessing from a 48px thumbnail -->
      <button
        type="button"
        class="roc__play"
        title="Ver el video"
        aria-label="Ver el video"
        @click.stop="$emit('preview')"
      >
        <i class="fa-solid fa-play" />
      </button>

      <!-- Only shown when the number is real. The picker does not fetch
           insights, so a 0 would read as "no views" instead of "unknown". -->
      <span v-if="reel.views > 0" class="roc__views">
        <i class="fa-solid fa-eye" /> {{ formatCount(reel.views) }}
      </span>

      <span v-if="takenBy" class="roc__taken" :title="`Ya vinculado al guion #${takenBy}`">
        <i class="fa-solid fa-link" /> Guion #{{ takenBy }}
      </span>
    </div>

    <div class="roc__info">
      <span v-if="suggested" class="roc__suggested">
        <i class="fa-solid fa-wand-magic-sparkles" /> Coincide con la fecha planificada
      </span>
      <p class="roc__caption">{{ reel.caption || 'Sin descripción' }}</p>
      <div class="roc__stats">
        <span><i class="fa-regular fa-calendar" /> {{ formatReelDate(reel) }}</span>
        <!-- Likes and comments come with the media, so a 0 here is a real 0. -->
        <span><i class="fa-regular fa-heart" /> {{ formatCount(reel.likes || 0) }}</span>
        <span><i class="fa-regular fa-comment" /> {{ formatCount(reel.comments || 0) }}</span>
      </div>
    </div>

    <i :class="selected ? 'fa-solid fa-circle-check roc__check' : 'fa-regular fa-circle roc__check'" />
  </div>
</template>

<script setup lang="ts">
import { formatCount, formatReelDate } from './useReelPicker'

defineProps<{
  reel: any
  selected: boolean
  suggested: boolean
  takenBy: number | null
}>()

defineEmits<{ (e: 'select'): void; (e: 'preview'): void }>()
</script>

<style scoped lang="scss">
.roc {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba(#e1306c, 0.02); border-color: rgba(#e1306c, 0.3); }

  &.is-selected {
    background: rgba(#e1306c, 0.06);
    border-color: #e1306c;

    .roc__check { color: #e1306c; }
  }

  // Date-based hint. Still requires a click — never auto-links.
  &.is-suggested { border-color: rgba($BAKANO-GREEN, 0.55); }

  // Already claimed by another script; selectable, but visibly flagged.
  &.is-taken { opacity: 0.62; }
}

.roc__thumb {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 64px;
  overflow: hidden;
  background: #000;
  border-radius: 8px;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.roc__thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.9rem;
  color: $white;
}

// Revealed on hover; always visible on touch, where there is no hover.
.roc__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: $white;
  background: rgba(0, 0, 0, 0.45);
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;

  .roc:hover &,
  &:focus-visible { opacity: 1; }

  @media (hover: none) {
    inset: auto 2px 2px auto;
    width: 18px;
    height: 18px;
    font-size: 0.55rem;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    opacity: 1;
  }
}

.roc__views {
  position: absolute;
  right: 2px;
  bottom: 2px;
  left: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.1rem 0.2rem;
  font-size: 0.6rem;
  font-weight: 700;
  color: $white;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
}

.roc__taken {
  position: absolute;
  top: 2px;
  right: 2px;
  left: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.1rem 0.15rem;
  font-size: 0.55rem;
  font-weight: 700;
  color: $white;
  background: rgba($alert-warning, 0.92);
  border-radius: 4px;
}

.roc__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.roc__suggested {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: $BAKANO-GREEN;
}

.roc__caption {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  font-size: 0.8rem;
  line-height: 1.35;
  color: $primary-dark;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.roc__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.7rem;
  color: $text-secondary;

  i { margin-right: 0.15rem; }
}

.roc__check {
  flex-shrink: 0;
  font-size: 1.05rem;
  color: rgba($primary-dark, 0.2);
}
</style>
