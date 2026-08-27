<template>
  <div class="gpd">
    <p class="gpd__text">
      <i class="fa-solid fa-triangle-exclamation" />
      <span>
        Hay un guión nuevo de la IA y el de abajo tiene cambios tuyos. Reemplaza
        solo los bloques que quieras cambiar, o todo el guión.
      </span>
    </p>

    <ul class="gpd__lista">
      <li v-for="(bloque, idx) in bloques" :key="idx" class="gpd__bloque">
        <div class="gpd__bloque-head">
          <span class="gpd__rotulo">{{ rotulos[idx] }}</span>
          <button
            v-if="!esIgual(idx)"
            type="button"
            class="gpd__btn gpd__btn--replace"
            @click="emit('aplicar-bloque', idx, bloque)"
          >
            <i class="fa-solid fa-arrow-turn-down" /> Usar solo este bloque
          </button>
          <span v-else class="gpd__igual">
            <i class="fa-solid fa-check" /> igual al tuyo
          </span>
        </div>
        <pre class="gpd__texto">{{ bloque }}</pre>
      </li>
    </ul>

    <div class="gpd__actions">
      <button type="button" class="gpd__btn" @click="emit('descartar')">
        Conservar el mío
      </button>
      <button type="button" class="gpd__btn gpd__btn--replace" @click="emit('aplicar')">
        <i class="fa-solid fa-arrows-rotate" /> Reemplazar todo el guión
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Bloques del guión nuevo que espera permiso. */
  bloques: string[]
  /** Rótulos de esos bloques (Hook, Cuerpo, Cierre...). */
  rotulos: string[]
  /** Bloques que hay ahora en el textarea, para no ofrecer cambios que no cambian nada. */
  actuales: string[]
}>()

const emit = defineEmits<{
  (e: 'aplicar'): void
  (e: 'descartar'): void
  (e: 'aplicar-bloque', idx: number, texto: string): void
}>()

function esIgual(idx: number) {
  return (props.actuales[idx] ?? '').trim() === (props.bloques[idx] ?? '').trim()
}
</script>

<style lang="scss" scoped>
.gpd {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem 0.85rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 10px;

  &__text {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: #92400e;

    i { margin-top: 0.15rem; }
  }

  &__lista {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__bloque {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__bloque-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__rotulo {
    font-size: 0.72rem;
    font-weight: 800;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__igual {
    font-size: 0.7rem;
    font-weight: 600;
    color: #a16207;
  }

  &__texto {
    max-height: 140px;
    margin: 0;
    padding: 0.5rem 0.6rem;
    overflow: auto;
    font-family: inherit;
    font-size: 0.76rem;
    line-height: 1.45;
    color: #78350f;
    white-space: pre-wrap;
    background: $white;
    border: 1px solid #fde68a;
    border-radius: 8px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.7rem;
    font-size: 0.73rem;
    font-weight: 700;
    color: #92400e;
    background: $white;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.18s;

    &:hover { background: #fef3c7; }

    &--replace {
      color: $white;
      background: #d97706;
      border-color: #d97706;

      &:hover { background: #b45309; }
    }
  }
}
</style>
