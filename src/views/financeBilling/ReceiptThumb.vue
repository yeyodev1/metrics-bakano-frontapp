<script setup lang="ts">
import { isImageUrl } from './format'

/**
 * El recibo siempre visible: miniatura clickeable si es imagen, chip con
 * icono si es PDF. Antes el comprobante subido no tenia ni link — el cliente
 * no podia volver a ver lo que envio.
 */
defineProps<{ url: string; label?: string }>()
</script>

<template>
  <a :href="url" target="_blank" rel="noopener" class="receipt-thumb" :title="label || 'Ver recibo'">
    <img v-if="isImageUrl(url)" :src="url" alt="Recibo" loading="lazy" />
    <span v-else class="receipt-thumb__pdf">
      <i class="fa-solid fa-file-pdf" aria-hidden="true" />
    </span>
    <span class="receipt-thumb__label">
      <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
      {{ label || 'Ver recibo' }}
    </span>
  </a>
</template>

<style lang="scss" scoped>
.receipt-thumb {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;

  img {
    width: 46px; height: 46px; object-fit: cover;
    border-radius: 9px; border: 1px solid rgba($primary-dark, 0.12);
    background: rgba($primary-dark, 0.04);
  }

  &:hover img { border-color: #6366f1; }
  &:hover .receipt-thumb__label { color: #6366f1; }
}

.receipt-thumb__pdf {
  width: 46px; height: 46px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(#dc2626, 0.08); color: #dc2626;
  border: 1px solid rgba(#dc2626, 0.2); font-size: 1.1rem;
}

.receipt-thumb__label {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.74rem; font-weight: 700; color: $text-secondary;

  i { font-size: 0.64rem; }
}
</style>
