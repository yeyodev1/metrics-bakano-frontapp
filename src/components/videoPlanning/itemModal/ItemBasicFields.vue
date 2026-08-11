<template>
  <div class="ibf">
    <div class="ibf__field">
      <label>Tema <span class="ibf__req">*</span></label>
      <input v-model="form.tema" type="text" placeholder="Ej: Receta de verano" required />
    </div>

    <div class="ibf__row">
      <div class="ibf__field">
        <label>Tipo de Reel</label>
        <select v-model="form.tipo">
          <option value="">— Sin tipo —</option>
          <option v-for="t in TipoReel" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div class="ibf__field">
        <label>Caso Customer Journey</label>
        <!-- Cases come from this brand's own journey, never hardcoded -->
        <select v-model="form.casoUsoRef" :disabled="!journeyCases.length">
          <option :value="undefined">— Caso General —</option>
          <option v-for="c in journeyCases" :key="c.casoNumero" :value="c.casoNumero">
            {{ c.nombreCaso || `Caso ${c.casoNumero}` }}
          </option>
        </select>

        <!-- Actionable, not a dead end: the fix is one click away -->
        <button v-if="!journeyCases.length" type="button" class="ibf__cta" @click="$emit('define-journey')">
          <i class="fa-solid fa-route" /> Definir el Customer Journey
          <i class="fa-solid fa-arrow-right" />
        </button>
      </div>
    </div>

    <div class="ibf__field">
      <label>Descripción</label>
      <textarea v-model="form.descripcion" placeholder="Descripción general del video…" rows="2" />
    </div>

    <div class="ibf__row">
      <div class="ibf__field">
        <label>Link del video (Drive/Dropbox)</label>
        <input v-model="form.linkEjemplo" type="url" placeholder="https://…" />
      </div>
      <div class="ibf__field">
        <label>Recursos</label>
        <input v-model="form.recursos" type="text" placeholder="Ej: Cámara, trípode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TipoReel, type CreateVideoItemPayload } from '@/types/videoPlanning'
import type { CustomerJourneyCase } from '@/types'

defineProps<{
  journeyCases: CustomerJourneyCase[]
}>()

defineEmits<{ (e: 'define-journey'): void }>()

const form = defineModel<CreateVideoItemPayload>({ required: true })
</script>

<style scoped lang="scss">
.ibf {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ibf__row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ibf__field {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;

  label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 800;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    font-family: inherit;
    font-size: 0.9rem;
    color: $primary-dark;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 12px;
    outline: none;
    transition: border-color 0.2s;

    &:focus { border-color: $primary; }
    &:disabled { background: rgba($text-secondary, 0.06); cursor: not-allowed; }
  }

  textarea { resize: vertical; }
}

.ibf__req { color: $primary; }

.ibf__cta {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.3rem;
  padding: 0.4rem 0.7rem;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  color: $secondary-dark;
  background: $overlay-purple;
  border: 1.5px solid rgba($secondary, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba($secondary, 0.16); }

  i:last-child { font-size: 0.65rem; }
}

@media (min-width: 600px) {
  .ibf__row { flex-direction: row; }
}
</style>
