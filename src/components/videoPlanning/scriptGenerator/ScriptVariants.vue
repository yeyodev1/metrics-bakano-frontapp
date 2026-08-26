<template>
  <div class="sv">
    <!-- What the model actually had, so a thin script can be traced to thin data -->
    <div v-if="contexto" class="sv__context">
      <div class="sv__context-head">
        <i class="fa-solid fa-circle-info" />
        <span>Generado con</span>
      </div>
      <div class="sv__chips">
        <span v-if="contexto.cliente" class="sv__chip sv__chip--brand">{{ contexto.cliente }}</span>
        <span v-if="contexto.vertical" class="sv__chip">{{ contexto.vertical }}</span>
        <span class="sv__chip">{{ contexto.etapaEmbudo }}</span>
        <span v-if="contexto.casoJourney" class="sv__chip sv__chip--case">
          {{ contexto.casoJourney.nombre }}
        </span>
        <span v-if="contexto.usoAprendizajes" class="sv__chip sv__chip--ok">
          <i class="fa-solid fa-brain" /> Aprendizajes de la marca
        </span>
      </div>
      <p v-if="missing.length" class="sv__missing">
        <i class="fa-solid fa-triangle-exclamation" />
        La IA trabajó sin: {{ missing.join(', ') }}. Completar eso mejora el resultado
        más que regenerar.
      </p>
    </div>

    <div class="sv__tabs" role="tablist">
      <button
        v-for="(o, i) in options"
        :key="i"
        type="button"
        role="tab"
        :aria-selected="active === i"
        :class="['sv__tab', { 'is-active': active === i }]"
        @click="active = i"
      >
        <strong>Versión {{ i + 1 }}</strong>
        <span>{{ shortAngle(o.angulo) }}</span>
      </button>
    </div>

    <div v-if="current" class="sv__editor">
      <div v-for="f in FIELDS" :key="f.key" class="sv__field">
        <label :for="`sv-${f.key}`">
          {{ f.label }}
          <span v-if="f.hint" class="sv__hint">{{ f.hint }}</span>
        </label>
        <textarea
          :id="`sv-${f.key}`"
          v-model="(current as any)[f.key]"
          :rows="f.rows"
          @input="touched = true"
        />
      </div>

      <p v-if="touched" class="sv__edited">
        <i class="fa-solid fa-pen" /> Editaste esta versión. Se guardará como la dejaste.
      </p>
    </div>

    <div class="sv__actions">
      <button type="button" class="sv__btn sv__btn--ghost" :disabled="saving" @click="$emit('discard')">
        Descartar
      </button>
      <button type="button" class="sv__btn sv__btn--primary" :disabled="saving" @click="$emit('save', current)">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
        {{ saving ? 'Guardando…' : `Usar versión ${active + 1}` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GuionIA } from '@/types/videoPlanning'

export interface ScriptContextInfo {
  cliente: string | null
  vertical: string | null
  etapaEmbudo: string
  casoJourney: { numero: number; nombre: string; dolor: string } | null
  usoAprendizajes: boolean
  datosDisponibles: {
    propuestaValor: boolean
    segmentos: number
    canales: number
    casosJourney: number
    archivosDeMarca: number
  }
}

const props = defineProps<{
  options: Array<GuionIA & { angulo?: string }>
  contexto?: ScriptContextInfo | null
  saving?: boolean
}>()

defineEmits<{ (e: 'save', guion: any): void; (e: 'discard'): void }>()

interface VariantField {
  key: string
  label: string
  hint?: string
  rows: number
}

const active = ref(0)
const touched = ref(false)

// Edited in place, so switching tabs never loses what was typed.
const drafts = ref<any[]>([])

watch(
  () => props.options,
  (opts) => {
    drafts.value = (opts ?? []).map((o) => ({ ...o }))
    active.value = 0
    touched.value = false
  },
  { immediate: true, deep: false }
)

const current = computed(() => drafts.value[active.value] ?? null)

/**
 * Los campos dependen de cómo se generó: el Hook 2 solo se edita aparte si se
 * pidió doble hook.
 */
const FIELDS = computed<VariantField[]>(() => {
  const d = current.value

  return [
    { key: 'gancho', label: 'Hook 1', hint: '0-3 seg · el que detiene el scroll', rows: 2 },
    { key: 'textoPantalla', label: 'Texto en pantalla', hint: 'debe funcionar sin sonido', rows: 2 },
    ...(d?.hook2
      ? [{ key: 'hook2', label: 'Hook 2', hint: 'seg 3-5 · el giro que reengancha', rows: 2 }]
      : []),
    {
      key: 'cuerpo',
      label: 'Cuerpo',
      hint: d?.hook2 ? 'arranca después del Hook 2' : 'abre con el Hook 2',
      rows: 5,
    },
    { key: 'cta', label: 'Cierre', hint: 'una sola acción', rows: 2 },
    { key: 'broll', label: 'B-roll', rows: 2 },
    { key: 'conceptoVisual', label: 'Concepto visual', rows: 2 },
  ]
})

const missing = computed(() => {
  const d = props.contexto?.datosDisponibles
  if (!d) return []
  const gaps: string[] = []
  if (!d.propuestaValor) gaps.push('propuesta de valor')
  if (!d.segmentos) gaps.push('segmentos de mercado')
  if (!d.canales) gaps.push('canales')
  if (!d.casosJourney) gaps.push('customer journey')
  return gaps
})

function shortAngle(angulo?: string) {
  if (!angulo) return 'Alternativa'
  const match = angulo.match(/por el ([A-ZÁÉÍÓÚ]+)|por la ([A-ZÁÉÍÓÚ]+)/)
  const word = match?.[1] ?? match?.[2]
  return word ? word.charAt(0) + word.slice(1).toLowerCase() : 'Alternativa'
}
</script>

<style scoped lang="scss">
.sv {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.sv__context {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.7rem 0.85rem;
  background: rgba($alert-info, 0.05);
  border: 1px solid rgba($alert-info, 0.18);
  border-radius: 10px;
}

.sv__context-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: $alert-info;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sv__chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.sv__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.12rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($text-secondary, 0.12);
  border-radius: 20px;

  &--brand { color: $white; background: $primary; }
  &--case { color: $secondary-dark; background: $overlay-purple; }
  &--ok { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.12); }
}

.sv__missing {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: $text-secondary;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-warning; }
}

.sv__tabs {
  display: flex;
  gap: 0.4rem;
}

.sv__tab {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  padding: 0.5rem 0.6rem;
  font-family: inherit;
  color: $text-secondary;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;

  strong { font-size: 0.78rem; }
  span { font-size: 0.66rem; opacity: 0.85; }

  &:hover { border-color: rgba($secondary, 0.4); }

  &.is-active {
    color: $secondary-dark;
    background: $overlay-purple;
    border-color: $secondary;
  }
}

.sv__editor {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sv__field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  label {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: baseline;
    font-size: 0.7rem;
    font-weight: 800;
    color: $primary-dark;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  textarea {
    width: 100%;
    padding: 0.55rem 0.7rem;
    font-family: inherit;
    font-size: 0.83rem;
    line-height: 1.5;
    color: $primary-dark;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 8px;
    resize: vertical;
    outline: none;

    &:focus { border-color: rgba($secondary, 0.5); }
  }
}

.sv__hint {
  font-size: 0.66rem;
  font-weight: 500;
  color: $text-secondary;
  text-transform: none;
  letter-spacing: 0;
}

.sv__edited {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.72rem;
  color: $secondary;
}

.sv__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.sv__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  border: none;
  border-radius: 9px;
  cursor: pointer;

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  &--ghost { color: $text-secondary; background: rgba($primary-dark, 0.05); }
  &--primary {
    color: $white;
    background: linear-gradient(135deg, $primary, $secondary);
  }
}

@media (max-width: 560px) {
  .sv__tabs { flex-direction: column; }
}
</style>
