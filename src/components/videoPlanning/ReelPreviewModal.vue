<template>
  <Teleport to="body">
    <Transition name="rpv-fade">
      <div v-if="show" class="rpv__overlay" @click.self="$emit('close')">
        <div class="rpv" role="dialog" aria-modal="true" aria-label="Vista previa del reel">
          <header class="rpv__header">
            <div class="rpv__title">
              <i class="fa-brands fa-instagram" />
              <span>Vista previa</span>
              <span v-if="dateLabel" class="rpv__date">{{ dateLabel }}</span>
            </div>
            <button type="button" class="rpv__close" aria-label="Cerrar" @click="$emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div class="rpv__body">
            <!-- Instagram's own embed: it plays the real reel and never needs
                 credentials, unlike the expiring CDN media_url. -->
            <div v-if="embedUrl" class="rpv__frame">
              <iframe
                :key="embedUrl"
                :src="embedUrl"
                title="Reel de Instagram"
                frameborder="0"
                scrolling="no"
                allowtransparency="true"
                allowfullscreen
              />
            </div>

            <p v-else class="rpv__no-embed">
              <i class="fa-solid fa-circle-info" />
              Este reel no tiene enlace público, así que no se puede previsualizar aquí.
            </p>

            <div v-if="reel?.caption" class="rpv__caption">
              <span class="rpv__caption-label">Caption</span>
              <p>{{ reel.caption }}</p>
            </div>

            <div class="rpv__stats">
              <span><i class="fa-regular fa-heart" /> {{ count(reel?.likes) }} likes</span>
              <span><i class="fa-regular fa-comment" /> {{ count(reel?.comments) }} comentarios</span>
              <span v-if="(reel?.views ?? 0) > 0"><i class="fa-solid fa-eye" /> {{ count(reel?.views) }} vistas</span>
            </div>
          </div>

          <footer class="rpv__footer">
            <a
              v-if="reel?.permalink"
              :href="reel.permalink"
              target="_blank"
              rel="noopener noreferrer"
              class="rpv__btn rpv__btn--ghost"
            >
              <i class="fa-solid fa-arrow-up-right-from-square" /> Abrir en Instagram
            </a>
            <span class="rpv__spacer" />
            <button type="button" class="rpv__btn rpv__btn--ghost" @click="$emit('close')">
              Cerrar
            </button>
            <button type="button" class="rpv__btn rpv__btn--primary" @click="$emit('select')">
              <i class="fa-solid fa-check" /> Usar este reel
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ show: boolean; reel: any | null }>()

defineEmits<{ (e: 'close'): void; (e: 'select'): void }>()

/**
 * Instagram serves an embeddable player at `<permalink>embed`.
 *
 * The CDN `media_url` is not used: those links expire and are not meant to be
 * embedded, so a preview built on them breaks silently days later.
 */
const embedUrl = computed(() => {
  const permalink = props.reel?.permalink
  if (!permalink || typeof permalink !== 'string') return ''

  try {
    const url = new URL(permalink)
    const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
    return `https://www.instagram.com${path}embed/captioned`
  } catch {
    return ''
  }
})

const dateLabel = computed(() => {
  const raw = props.reel?.timestamp
  if (!raw) return ''
  const date = new Date(raw)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })
})

const count = (n?: number) => new Intl.NumberFormat('es-EC').format(n ?? 0)
</script>

<style scoped lang="scss">
.rpv__overlay {
  position: fixed;
  inset: 0;
  // Above the linking modal, which this opens on top of.
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($primary-dark, 0.65);
}

.rpv {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px;
  max-height: 92vh;
  overflow: hidden;
  background: $white;
  border-radius: 16px;
}

.rpv__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid rgba($text-secondary, 0.15);
}

.rpv__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: $primary-dark;

  i { color: #e1306c; }
}

.rpv__date {
  font-size: 0.75rem;
  font-weight: 500;
  color: $text-secondary;
}

.rpv__close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: $text-secondary;
  background: rgba($text-secondary, 0.1);
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover { background: rgba($text-secondary, 0.2); }
}

.rpv__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  overflow-y: auto;
}

.rpv__frame {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background: $primary-dark;
  border-radius: 12px;

  iframe {
    display: block;
    width: 100%;
    // Reels are 9:16; this leaves room for Instagram's own chrome.
    height: 620px;
    border: 0;
  }
}

.rpv__no-embed {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem;
  font-size: 0.82rem;
  line-height: 1.45;
  color: $primary-dark;
  background: $alert-info-bg;
  border-radius: 10px;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-info; }
}

.rpv__caption {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rpv__caption-label {
  font-size: 0.66rem;
  font-weight: 800;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rpv__caption p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: $primary-dark;
  white-space: pre-wrap;
}

.rpv__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  font-size: 0.78rem;
  color: $text-secondary;

  i { margin-right: 0.2rem; }
}

.rpv__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.1rem;
  border-top: 1px solid rgba($text-secondary, 0.15);
}

.rpv__spacer { flex: 1; }

.rpv__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  border: none;
  border-radius: 9px;
  cursor: pointer;

  &--ghost {
    color: $text-secondary;
    background: rgba($primary-dark, 0.05);

    &:hover { color: $primary-dark; }
  }

  &--primary {
    color: $white;
    background: #e1306c;

    &:hover { filter: brightness(1.08); }
  }
}

.rpv-fade-enter-active,
.rpv-fade-leave-active { transition: opacity 0.2s; }
.rpv-fade-enter-from,
.rpv-fade-leave-to { opacity: 0; }
</style>
