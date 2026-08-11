<template>
  <!-- Escribirlo a mano es la vía más rápida cuando no hay PDF. Se guarda como
       .txt y aparece en la misma lista que los archivos subidos. -->
  <section class="ctp">
    <div class="ctp__or"><span>o escríbelo</span></div>

    <header class="ctp__head">
      <span class="ctp__icon"><i class="fa-solid fa-pen-nib" /></span>
      <div class="ctp__titles">
        <h2>¿No tienes el catálogo en archivo?</h2>
        <p>Escríbelo aquí y cuenta igual que un PDF.</p>
      </div>
    </header>

    <div class="ctp__field">
      <textarea
        id="catalog-text"
        v-model="text"
        class="ctp__area"
        rows="5"
        :disabled="saving"
        placeholder="Ej: Plan mensual $120/mes · Bowl de quinoa $8.50 · Catering desde $500&#10;Incluye: diseño de historias, copywriting, pauta en Meta Ads…"
      />
      <span class="ctp__counter" :class="{ 'is-active': text.trim().length }">
        {{ text.trim().length }} caracteres
      </span>
    </div>

    <div class="ctp__foot">
      <small class="ctp__hint">
        <i class="fa-solid fa-lightbulb" />
        Entre más concreto — precios, nombres reales, qué incluye — mejores salen
        los guiones.
      </small>

      <button
        type="button"
        class="ctp__save"
        :disabled="saving || !text.trim()"
        @click="submit"
      >
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
        {{ saving ? 'Guardando…' : 'Guardar catálogo' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ saving: boolean }>()

const emit = defineEmits<{ (e: 'save', text: string): void }>()

const text = ref('')

function submit() {
  const clean = text.value.trim()
  if (!clean) return
  emit('save', clean)
}

/** El padre lo llama al guardar con éxito, para no borrar texto que falló. */
function reset() {
  text.value = ''
}

defineExpose({ reset })
</script>

<style scoped lang="scss">
// Vive dentro de la sección de catálogo, así que no repite marco ni fondo:
// sería una tarjeta dentro de otra tarjeta.
.ctp {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.ctp__or {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: $text-secondary;

  span { font-size: 0.7rem; font-weight: 700; text-transform: lowercase; }

  &::before,
  &::after {
    flex: 1;
    height: 1px;
    background: rgba($primary-dark, 0.08);
    content: '';
  }
}

.ctp__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ctp__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 0.9rem;
  color: $BAKANO-GREEN;
  background: rgba($BAKANO-GREEN, 0.1);
  border-radius: 12px;
}

.ctp__titles {
  display: flex;
  flex-direction: column;
  min-width: 0;

  h2 { margin: 0; font-size: 0.95rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.1rem 0 0; font-size: 0.76rem; color: $text-secondary; }
}

.ctp__field { position: relative; }

.ctp__area {
  width: 100%;
  padding: 0.8rem;
  font-family: inherit;
  font-size: 0.83rem;
  line-height: 1.55;
  color: $primary-dark;
  background: $primary-light;
  border: 1.5px solid transparent;
  border-radius: 12px;
  resize: vertical;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder { color: rgba($text-secondary, 0.75); }

  &:focus {
    background: $white;
    border-color: $BAKANO-GREEN;
    outline: none;
    box-shadow: 0 0 0 3px rgba($BAKANO-GREEN, 0.12);
  }

  &:disabled { opacity: 0.6; }
}

.ctp__counter {
  position: absolute;
  right: 0.6rem;
  bottom: 0.6rem;
  font-size: 0.66rem;
  color: rgba($text-secondary, 0.7);
  pointer-events: none;

  &.is-active { color: $BAKANO-GREEN; }
}

.ctp__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
}

.ctp__hint {
  display: flex;
  flex: 1 1 14rem;
  align-items: flex-start;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.73rem;
  line-height: 1.45;
  color: $text-secondary;

  i { margin-top: 0.12rem; color: $alert-warning; }
}

.ctp__save {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.79rem;
  font-weight: 700;
  color: $white;
  background: $BAKANO-GREEN;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;

  &:hover:not(:disabled) {
    box-shadow: 0 8px 18px -8px rgba($BAKANO-GREEN, 0.8);
    transform: translateY(-1px);
  }

  &:disabled { cursor: not-allowed; opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .ctp__area, .ctp__save { transition: none; }
  .ctp__save:hover:not(:disabled) { transform: none; }
}
</style>
