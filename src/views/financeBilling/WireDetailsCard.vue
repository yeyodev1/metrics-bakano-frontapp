<script setup lang="ts">
import { ref } from 'vue'

/** Datos de la cuenta Mercury de Bakano.ec LLC (fuente: PDF oficial en /public). */

interface WireField {
  label: string
  value: string
  hint?: string
}

const international: WireField[] = [
  { label: 'SWIFT / BIC', value: 'CLNOUS66MER' },
  {
    label: 'ABA Routing Number',
    value: '121145433',
    hint: 'Si tu banco no lo reconoce, usa 121145307',
  },
  {
    label: 'Banco receptor',
    value: 'Column N.A.',
    hint: '1 Letterman Drive, Building A, Suite A4-700, San Francisco, CA 94129 USA',
  },
  {
    label: 'Banco intermediario (OBLIGATORIO)',
    value: 'CHASUS33XXX',
    hint: 'Campo 56A del formulario MT103 — sin esto la transferencia se rechaza',
  },
  { label: 'Beneficiario', value: 'Bakano.ec LLC' },
  { label: 'IBAN / Número de cuenta', value: '923827836910950' },
  {
    label: 'Dirección del beneficiario',
    value: '30 North Gould Street, STE N, Sheridan, WY 82801 USA',
  },
]

const domestic: WireField[] = [
  { label: 'ABA Routing Number', value: '121145433' },
  { label: 'Número de cuenta', value: '923827836910950' },
  { label: 'Tipo de cuenta', value: 'Checking' },
  { label: 'Beneficiario', value: 'Bakano.ec LLC' },
  {
    label: 'Dirección del beneficiario',
    value: '30 North Gould Street, STE N, Sheridan, WY 82801 US',
  },
]

const copied = ref<string | null>(null)

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = value
    setTimeout(() => {
      if (copied.value === value) copied.value = null
    }, 1600)
  } catch {
    /* clipboard bloqueado: el usuario puede seleccionar a mano */
  }
}
</script>

<template>
  <div class="wire-card">
    <div class="wire-card__head">
      <h4><i class="fa-solid fa-building-columns" aria-hidden="true" /> Datos para tu transferencia</h4>
      <a class="wire-card__pdf" href="/bakano-wire-details.pdf" download="bakano-wire-details.pdf">
        <i class="fa-solid fa-file-arrow-down" aria-hidden="true" /> Descargar PDF
      </a>
    </div>

    <section class="wire-card__section">
      <h5><i class="fa-solid fa-globe" aria-hidden="true" /> Transferencia internacional (SWIFT)</h5>
      <ul class="wire-card__list">
        <li v-for="field in international" :key="field.label" class="wire-card__row">
          <div class="wire-card__info">
            <span class="wire-card__label">{{ field.label }}</span>
            <span class="wire-card__value">{{ field.value }}</span>
            <span v-if="field.hint" class="wire-card__hint">{{ field.hint }}</span>
          </div>
          <button type="button" class="wire-card__copy" :title="`Copiar ${field.label}`" @click="copy(field.value)">
            <i :class="copied === field.value ? 'fa-solid fa-check' : 'fa-regular fa-copy'" aria-hidden="true" />
            <span>{{ copied === field.value ? 'Copiado' : 'Copiar' }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section class="wire-card__section">
      <h5><i class="fa-solid fa-flag-usa" aria-hidden="true" /> Transferencia doméstica US (ACH / Wire)</h5>
      <ul class="wire-card__list">
        <li v-for="field in domestic" :key="field.label" class="wire-card__row">
          <div class="wire-card__info">
            <span class="wire-card__label">{{ field.label }}</span>
            <span class="wire-card__value">{{ field.value }}</span>
          </div>
          <button type="button" class="wire-card__copy" :title="`Copiar ${field.label}`" @click="copy(field.value)">
            <i :class="copied === field.value ? 'fa-solid fa-check' : 'fa-regular fa-copy'" aria-hidden="true" />
            <span>{{ copied === field.value ? 'Copiado' : 'Copiar' }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.wire-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    h4 {
      margin: 0;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  &__pdf {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e6285c;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__section h5 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.55rem 0;
    border-bottom: 1px dashed #e5e7eb;

    &:last-child {
      border-bottom: none;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    flex: 1 1 220px;
    min-width: 0;
  }

  &__label {
    font-size: 0.75rem;
    color: #6b7280;
  }

  &__value {
    font-weight: 700;
    font-size: 0.95rem;
    word-break: break-word;
  }

  &__hint {
    font-size: 0.75rem;
    color: #b45309;
  }

  &__copy {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    font-size: 0.78rem;
    cursor: pointer;
    color: #374151;

    &:hover {
      background: #f3f4f6;
    }
  }
}
</style>
