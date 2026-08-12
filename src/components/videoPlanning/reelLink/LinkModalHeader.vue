<template>
  <header class="lmh">
    <div class="lmh__title">
      <i class="fa-solid fa-link lmh__icon" />
      <div>
        <h3>Vincular publicación al Guion #{{ numero }}</h3>
        <p>Conecta el reel orgánico, el anuncio pautado, o los dos.</p>
      </div>
    </div>
    <button class="lmh__close" aria-label="Cerrar" @click="emit('close')">
      <i class="fa-solid fa-xmark" />
    </button>
  </header>
</template>

<script setup lang="ts">
defineProps<{ numero: number | string }>()

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<style scoped lang="scss">
.lmh {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: linear-gradient(135deg, rgba(#e1306c, 0.06), rgba($secondary, 0.04));
  border-bottom: 1px solid rgba($text-secondary, 0.15);

  h3 { margin: 0 0 0.2rem; font-size: 1rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.8rem; line-height: 1.4; color: $text-secondary; }
}

.lmh__title {
  display: flex;
  gap: 0.75rem;
  min-width: 0;
}

.lmh__icon {
  flex-shrink: 0;
  margin-top: 0.15rem;
  font-size: 1.4rem;
  color: #e1306c;
}

.lmh__close {
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

// En pantallas bajas (portátil Windows escalado) el subtítulo se va: el alto
// que ocupa vale más para la lista de reels.
@media (max-height: 780px) {
  .lmh {
    padding: 0.8rem 1rem;

    p { display: none; }
  }

  .lmh__icon { font-size: 1.15rem; }
}
</style>
