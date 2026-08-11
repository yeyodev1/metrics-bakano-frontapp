<template>
  <div :class="['sr', { 'is-open': open, 'is-linked': !!link }]">
    <button type="button" class="sr__main" :aria-expanded="open" @click="open = !open">
      <span class="sr__num">#{{ item.numero }}</span>

      <span class="sr__body">
        <span class="sr__title">{{ item.tema }}</span>
        <span v-if="script.preview" class="sr__hook">{{ script.preview }}</span>
        <span v-else class="sr__hook sr__hook--empty">Sin guión escrito</span>
      </span>

      <span class="sr__tags">
        <span :class="['sr__funnel', `is-${(item.tipoGuion || 'tofu').toLowerCase()}`]">
          {{ item.tipoGuion || 'TOFU' }}
        </span>
        <span v-if="item.scriptMeta?.objetivo" class="sr__tag">
          {{ item.scriptMeta.objetivo === 'anuncio' ? 'Anuncio' : 'Feed' }}
        </span>
        <span v-if="item.casoUsoRef" class="sr__tag">Caso {{ item.casoUsoRef }}</span>
      </span>

      <!-- El origen se ve sin abrir la fila: orgánico, pautado o ambos.
           Antes todo lo vinculado mostraba el ícono de Instagram, así que un
           video que solo era anuncio parecía un reel. -->
      <span :class="['sr__link-state', link && `is-${link.tone}`]">
        <template v-if="!link">
          <i class="fa-solid fa-link-slash" />
          <span class="sr__link-label">Sin vincular</span>
        </template>
        <template v-else>
          <i :class="link.icon" />
          <!-- Con gasto pero sin vistas, el número relevante es el gasto. -->
          <template v-if="hasMetrics">
            <strong>{{ formatNumber(item.metrics?.views || 0) }}</strong>
            <span class="sr__link-label">vistas</span>
          </template>
          <template v-else-if="adSpend">
            <strong>${{ formatNumber(adSpend) }}</strong>
            <span class="sr__link-label">gasto</span>
          </template>
          <!-- Vinculado sin métricas: decir "0 vistas" se leería como un cero
               real y no como un permiso de insights que falta. -->
          <template v-else>
            <span class="sr__link-label">{{ link.short }}</span>
          </template>
        </template>
      </span>

      <i class="sr__chevron fa-solid fa-chevron-down" :class="{ 'is-open': open }" />
    </button>

    <AccordionTransition>
      <ScriptRowDetail
        v-if="open"
        :item="item"
        :parts="script.parts"
        :has-metrics="hasMetrics"
        :metrics="metrics"
        @preview="showPreview = true"
        @link-reel="$emit('link-reel', item)"
        @edit-item="$emit('edit-item', item)"
      />
    </AccordionTransition>

    <ReelPreviewModal
      :show="showPreview"
      :reel="previewData"
      @close="showPreview = false"
      @select="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AccordionTransition from '@/components/common/AccordionTransition.vue'
import ReelPreviewModal from '@/components/videoPlanning/ReelPreviewModal.vue'
import ScriptRowDetail from './ScriptRowDetail.vue'
import { linkStyle } from '@/utils/videoLink'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'

const props = defineProps<{ item: WorkspaceVideoItem }>()

const link = computed(() => linkStyle(props.item))
const adSpend = computed(() => props.item.metrics?.adSpend || 0)

defineEmits<{
  (e: 'link-reel', item: WorkspaceVideoItem): void
  (e: 'edit-item', item: WorkspaceVideoItem): void
}>()

const open = ref(false)
const showPreview = ref(false)

/** Shaped like a picker reel so the preview modal is reused as-is. */
const previewData = computed(() => ({
  permalink: props.item.igPermalink,
  caption: props.item.copyPublicacion || props.item.tema,
  timestamp: props.item.fechaPublicacion,
  likes: props.item.metrics?.likes ?? 0,
  comments: props.item.metrics?.comments ?? 0,
  views: props.item.metrics?.views ?? 0,
}))

/**
 * A script may live as free text (`guion`) or as the AI structure (`guionIA`);
 * both must render, and the hook leads the collapsed row.
 */
const script = computed(() => {
  const ia = props.item.guionIA
  const parts: Array<{ label: string; text: string }> = []

  if (ia) {
    if (ia.gancho) parts.push({ label: 'Hook 1 (0-3 seg)', text: ia.gancho })
    if (ia.textoPantalla) parts.push({ label: 'Texto en pantalla', text: ia.textoPantalla })
    if (ia.cuerpo) parts.push({ label: 'Cuerpo (abre con Hook 2)', text: ia.cuerpo })
    if (ia.cta) parts.push({ label: 'CTA', text: ia.cta })
    if (ia.broll) parts.push({ label: 'B-roll', text: ia.broll })
    if (ia.conceptoVisual) parts.push({ label: 'Concepto visual', text: ia.conceptoVisual })
  }

  if (!parts.length && props.item.guion) {
    parts.push({ label: 'Guion', text: props.item.guion })
  }

  return { parts, preview: ia?.gancho || props.item.guion || '' }
})

/**
 * Whether Instagram actually returned numbers.
 *
 * All-zero metrics mean the insights call was refused (the app lacks
 * `instagram_manage_insights`), not that the reel got no views.
 */
const hasMetrics = computed(() => {
  const m = props.item.metrics
  if (!m) return false
  return [m.views, m.reach, m.likes, m.saved, m.comments].some((v) => (v ?? 0) > 0)
})

const metrics = computed(() => [
  { label: 'Vistas', value: props.item.metrics?.views || 0, icon: 'fa-solid fa-eye' },
  { label: 'Alcance', value: props.item.metrics?.reach || 0, icon: 'fa-solid fa-users' },
  { label: 'Likes', value: props.item.metrics?.likes || 0, icon: 'fa-regular fa-heart' },
  { label: 'Guardados', value: props.item.metrics?.saved || 0, icon: 'fa-regular fa-bookmark' },
])

const formatNumber = (n: number) => new Intl.NumberFormat('es-EC').format(n)
</script>

<style scoped lang="scss">
.sr {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 10px;
  transition: border-color 0.15s;

  &:hover { border-color: rgba($secondary, 0.35); }
  &.is-open { border-color: rgba($secondary, 0.5); }

  // A thin rail makes linked vs unlinked scannable down the whole list.
  &.is-linked { box-shadow: inset 3px 0 0 $BAKANO-GREEN; }
  &:not(.is-linked) { box-shadow: inset 3px 0 0 rgba($text-secondary, 0.25); }
}

.sr__main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.7rem 0.9rem;
  font-family: inherit;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.sr__num {
  flex-shrink: 0;
  width: 2.2rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: $text-secondary;
}

.sr__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.sr__title {
  overflow: hidden;
  font-size: 0.88rem;
  font-weight: 700;
  color: $primary-dark;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sr__hook {
  overflow: hidden;
  font-size: 0.76rem;
  color: $text-secondary;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--empty { font-style: italic; opacity: 0.7; }
}

.sr__tags {
  display: flex;
  flex-shrink: 0;
  gap: 0.3rem;
}

.sr__funnel,
.sr__tag {
  padding: 0.12rem 0.45rem;
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 20px;
}

.sr__tag { color: $secondary-dark; background: $overlay-purple; }

.sr__funnel {
  &.is-tofu { color: $alert-info; background: $alert-info-bg; }
  &.is-mofu { color: $secondary; background: $overlay-purple; }
  &.is-bofu { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.1); }
}

.sr__link-state {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  min-width: 7rem;
  font-size: 0.75rem;
  color: $text-secondary;

  strong { color: $primary-dark; }

  // Un color por origen: morado orgánico, rosa pautado, verde ambos.
  &.is-reel i { color: $secondary; }
  &.is-ad i { color: $primary; }
  &.is-both i { color: $BAKANO-GREEN; }
}

.sr__link-label { font-size: 0.7rem; }

.sr__chevron {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.22s ease;

  &.is-open { transform: rotate(180deg); }
}

@media (prefers-reduced-motion: reduce) {
  .sr__chevron { transition: none; }
}










@media (max-width: 760px) {
  .sr__tags,
  .sr__link-label { display: none; }
}
</style>
