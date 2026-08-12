<template>
  <div class="sgp">
    <header class="sgp__header">
      <div class="sgp__header-left">
        <i class="fa-solid fa-wand-magic-sparkles sgp__icon" />
        <span class="sgp__title">Guión IA</span>
        <span
          class="sgp__badge"
          :style="{ background: tipoInfo.color + '18', color: tipoInfo.color, borderColor: tipoInfo.color + '30' }"
        >
          <i :class="tipoInfo.icon" /> {{ tipoInfo.label }}
          <span class="sgp__badge-tooltip">{{ tipoInfo.desc }}</span>
        </span>
      </div>
      <span v-if="hasExistingScript" class="sgp__done">
        <i class="fa-solid fa-circle-check" /> Guión generado
      </span>
    </header>

    <div class="sgp__body">
      <!-- Missing brand profile blocks generation entirely -->
      <BrandProfileBar
        v-if="!hasBrandProfile && !showBpEditor"
        :has-brand-profile="false"
        @edit="showBpEditor = true"
        @go-page="router.push({ name: 'WorkspaceBrandProfile', params: { workspaceId } })"
      />

      <BrandProfileEditor
        v-if="showBpEditor"
        :workspace-id="workspaceId"
        :brand-profile="brandProfile"
        :has-brand-profile="hasBrandProfile"
        @close="showBpEditor = false"
        @saved="(p) => emit('brand-profile-updated', p)"
      />

      <template v-else>
        <BrandProfileBar
          v-if="hasBrandProfile"
          :has-brand-profile="true"
          :brand-profile="brandProfile"
          @edit="showBpEditor = true"
        />

        <TipoGuionSelector :model-value="selectedTipoGuion" @update:model-value="onTipoGuionPick" />
        <ObjetivoSelector :model-value="selectedObjetivo" @update:model-value="onObjetivoPick" />

        <!-- Opción, no default: el Hook 2 ya vive dentro del cuerpo. -->
        <label class="sgp__toggle" :class="{ 'is-on': dobleHook }">
          <input v-model="dobleHook" type="checkbox" />
          <span class="sgp__toggle-box"><i class="fa-solid fa-check" /></span>
          <span class="sgp__toggle-text">
            <strong><i class="fa-solid fa-bolt-lightning" /> Doble hook separado</strong>
            <small>Saca el Hook 2 a su propio campo para grabarlo y medirlo aparte.</small>
          </span>
        </label>

        <!-- The 10/5/5 goal is per monthly planning; across a workspace it
             would read as "74/10", so proportions are shown instead. -->
        <ScriptDistributionWidget
          v-if="allItems && allItems.length > 0"
          :items="allItems"
          compact
          :show-targets="allItems.length <= 25"
        />

        <GenerateContextForm
          v-model="contextoMes"
          :generating="generating"
          :can-generate="canGenerate"
          :llm-checking="llmChecking"
          :llm-available="!!llmStatus?.available"
          :has-existing-script="hasExistingScript"
          :error="error"
          :can-generate-variants="!!item?._id"
          @generate="onGenerate"
          @generate-variants="onGenerateVariants"
        />

        <!-- Three takes to choose from, editable before anything is saved -->
        <ScriptVariants
          v-if="variants.length"
          :options="variants"
          :contexto="variantContext"
          :saving="generating"
          @save="onAdoptVariant"
          @discard="discardVariants"
        />

        <GeneratedScript
          v-if="hasExistingScript && localGuionIA"
          :guion-i-a="localGuionIA"
          :is-field-visible="isFieldVisible"
          :final-usado="finalUsado"
          @use-final="onUseFinal"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { BrandProfile } from '@/types'
import type { VideoItem, GuionIA, TipoGuion, ObjetivoGuion } from '@/types/videoPlanning'
import ScriptDistributionWidget from './ScriptDistributionWidget.vue'
import TipoGuionSelector from './scriptGenerator/TipoGuionSelector.vue'
import ObjetivoSelector from './scriptGenerator/ObjetivoSelector.vue'
import BrandProfileEditor from './scriptGenerator/BrandProfileEditor.vue'
import BrandProfileBar from './scriptGenerator/BrandProfileBar.vue'
import GenerateContextForm from './scriptGenerator/GenerateContextForm.vue'
import GeneratedScript from './scriptGenerator/GeneratedScript.vue'
import ScriptVariants from './scriptGenerator/ScriptVariants.vue'
import { TIPO_GUION_INFO, inferTipoGuion, type FinalKey } from './scriptGenerator/constants'
import { useScriptGeneration } from './scriptGenerator/useScriptGeneration'

const props = defineProps<{
  item: VideoItem | null
  workspaceId: string
  tema?: string
  tipo?: string
  tipoGuion?: TipoGuion
  objetivo?: ObjetivoGuion
  hasBrandProfile: boolean
  brandProfile?: BrandProfile | null
  allItems?: VideoItem[]
}>()

const emit = defineEmits<{
  (e: 'script-generated', guionIA: GuionIA): void
  (e: 'brand-profile-updated', profile: BrandProfile): void
  (e: 'update:tipoGuion', tipoGuion: TipoGuion): void
  (e: 'update:objetivo', objetivo: ObjetivoGuion): void
}>()

const router = useRouter()
const showBpEditor = ref(false)

// ── Funnel stage ────────────────────────────────────────────────
function resolveTipoGuion(item: VideoItem | null): TipoGuion {
  return props.tipoGuion ?? item?.tipoGuion ?? (item?.numero ? inferTipoGuion(item.numero) : 'TOFU')
}

const selectedTipoGuion = ref<TipoGuion>(resolveTipoGuion(props.item))

watch(() => props.tipoGuion, (t) => { if (t) selectedTipoGuion.value = t })
watch(() => props.item, (item) => { selectedTipoGuion.value = resolveTipoGuion(item) })

// Emit only on an actual user pick. Emitting from a watcher would also fire
// when the prop syncs down, and the parent mirrors tipoGuion onto `tipo` —
// that round trip would overwrite the item's tipo just by opening it.
function onTipoGuionPick(t: TipoGuion) {
  selectedTipoGuion.value = t
  emit('update:tipoGuion', t)
}

// ── Feed vs Anuncio ─────────────────────────────────────────────
const selectedObjetivo = ref<ObjetivoGuion>(
  props.objetivo ?? props.item?.scriptMeta?.objetivo ?? 'feed'
)

watch(() => props.objetivo, (o) => { if (o) selectedObjetivo.value = o })
watch(() => props.item, (item) => {
  selectedObjetivo.value = props.objetivo ?? item?.scriptMeta?.objetivo ?? 'feed'
})

// Same reason as above: only a human pick stamps `clasificadoPor: 'humano'`.
function onObjetivoPick(o: ObjetivoGuion) {
  selectedObjetivo.value = o
  emit('update:objetivo', o)
}

const tipoInfo = computed(() => TIPO_GUION_INFO[selectedTipoGuion.value])

const {
  generating,
  error,
  llmStatus,
  llmChecking,
  contextoMes,
  dobleHook,
  localGuionIA,
  hasExistingScript,
  canGenerate,
  isFieldVisible,
  generate,
  variants,
  variantContext,
  generateVariants,
  discardVariants,
  applyVariant,
} = useScriptGeneration({
  item: toRef(props, 'item'),
  workspaceId: toRef(props, 'workspaceId'),
  tema: toRef(props, 'tema'),
  tipo: toRef(props, 'tipo'),
  hasBrandProfile: toRef(props, 'hasBrandProfile'),
  tipoGuion: selectedTipoGuion,
  objetivo: selectedObjetivo,
})

/**
 * Cuál de los dos finales quedó pegado en el textarea del guión. Arranca en el
 * que corresponde al objetivo elegido, que es el que el backend deja en `cta`.
 */
const finalUsado = ref<FinalKey>(selectedObjetivo.value === 'anuncio' ? 'ads' : 'feed')

async function onGenerate() {
  const guionIA = await generate()
  if (!guionIA) return
  finalUsado.value = selectedObjetivo.value === 'anuncio' ? 'ads' : 'feed'
  emit('script-generated', guionIA)
}

/** Cambiar de final reescribe el guión sin volver a llamar a la IA. */
function onUseFinal(key: FinalKey, texto: string) {
  if (!localGuionIA.value) return
  finalUsado.value = key
  localGuionIA.value = { ...localGuionIA.value, cta: texto }
  emit('script-generated', localGuionIA.value)
}

async function onGenerateVariants() {
  await generateVariants(3)
}

/** The edited version wins — it is what the writer actually approved. */
function onAdoptVariant(guion: GuionIA) {
  applyVariant(guion)
  emit('script-generated', guion)
}

</script>

<style lang="scss" scoped>
.sgp {
  margin-top: 0.75rem;
  overflow: hidden;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba($primary, 0.05), rgba($secondary, 0.04));
    border-bottom: 1px solid rgba($primary-dark, 0.06);
  }

  &__header-left {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  &__icon {
    font-size: 0.9rem;
    color: $primary;
  }

  &__title {
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    border: 1px solid;
    border-radius: 20px;
    cursor: help;

    &:hover .sgp__badge-tooltip {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
  }

  &__badge-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    z-index: 50;
    min-width: 220px;
    padding: 0.5rem 0.75rem;
    font-size: 0.72rem;
    font-weight: 400;
    line-height: 1.45;
    color: $white;
    white-space: normal;
    background: $primary-dark;
    border-radius: 8px;
    opacity: 0;
    transform: translateY(4px);
    pointer-events: none;
    transition: all 0.2s;
  }

  &__done {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: $alert-success;
    background: $alert-success-bg;
    border-radius: 20px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
  }

  &__toggle {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.65rem 0.8rem;
    background: rgba($primary-dark, 0.02);
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;

    &:hover { border-color: rgba($primary, 0.35); }

    &.is-on {
      background: rgba($primary, 0.05);
      border-color: rgba($primary, 0.45);
    }

    input { position: absolute; opacity: 0; pointer-events: none; }
  }

  &__toggle-box {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-top: 0.1rem;
    color: transparent;
    font-size: 0.62rem;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.2);
    border-radius: 6px;
    transition: all 0.18s;
  }

  &__toggle.is-on &__toggle-box {
    color: $white;
    background: $primary;
    border-color: $primary;
  }

  &__toggle-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;

    strong {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      color: $primary-dark;

      i { font-size: 0.72rem; color: $primary; }
    }

    small { font-size: 0.7rem; line-height: 1.4; color: $text-secondary; }
  }




}
</style>
