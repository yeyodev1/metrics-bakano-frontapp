<template>
  <div class="jt">
    <div class="jt__cta">
      <div class="jt__cta-icon"><i class="fa-solid fa-compass-drafting" /></div>
      <div class="jt__cta-text">
        <h2>{{ hasStrategy ? 'Editar Estrategia de Marca' : 'Definir Estrategia de Marca' }}</h2>
        <p>Un solo documento: propuesta de valor, segmentos, canales, actividades clave y casos de Customer Journey.</p>
      </div>
      <button class="jt__btn jt__btn--primary" @click="$emit('open-wizard')">
        <i class="fa-solid fa-wand-magic-sparkles" />
        {{ hasStrategy ? 'Editar todo' : 'Iniciar' }}
      </button>
    </div>

    <div class="jt__box">
      <section v-if="profile.propuestaValor" class="jt__section">
        <header class="jt__head"><i class="fa-solid fa-gem" /><span>Propuesta de Valor</span></header>
        <p class="jt__quote">{{ profile.propuestaValor }}</p>
      </section>

      <section v-if="segmentos.length" class="jt__section">
        <header class="jt__head"><i class="fa-solid fa-users" /><span>Segmento de Mercado</span></header>
        <div class="jt__chips">
          <div v-for="(s, idx) in segmentos" :key="idx" class="jt__chip-card">
            <strong v-if="s.nombre">{{ s.nombre }}</strong>
            <p>{{ s.descripcion }}</p>
          </div>
        </div>
      </section>

      <section v-if="canales.length" class="jt__section">
        <header class="jt__head"><i class="fa-solid fa-tower-broadcast" /><span>Canales</span></header>
        <div class="jt__tags">
          <span v-for="(c, idx) in canales" :key="idx" class="jt__tag">
            <i class="fa-solid fa-tower-broadcast" /> {{ c }}
          </span>
        </div>
      </section>

      <section v-if="actividades.length" class="jt__section">
        <header class="jt__head"><i class="fa-solid fa-list-check" /><span>Actividades Clave</span></header>
        <div class="jt__tags">
          <span v-for="(a, idx) in actividades" :key="idx" class="jt__tag jt__tag--green">
            <i class="fa-solid fa-circle-check" /> {{ a }}
          </span>
        </div>
      </section>

      <!-- The most frequent action lives here, not buried inside the strategy document -->
      <section class="jt__section">
        <header class="jt__head">
          <i class="fa-solid fa-route" />
          <span>Customer Journey — {{ cases.length }} Caso{{ cases.length === 1 ? '' : 's' }}</span>
          <button class="jt__add" @click="$emit('add-case')">
            <i class="fa-solid fa-plus" /> Agregar caso
          </button>
        </header>

        <p v-if="!cases.length" class="jt__cases-empty">
          Un caso es un tipo de cliente. Con ellos la IA sabe de qué dolor sacar el
          gancho de cada guión. Agrega el primero: son tres preguntas.
        </p>

        <div v-else class="jt__cases">
          <div
            v-for="c in cases"
            :key="c.casoNumero"
            class="jt__case"
            role="button"
            tabindex="0"
            @click="$emit('edit-case', c)"
            @keydown.enter="$emit('edit-case', c)"
          >
            <span class="jt__case-badge">Caso #{{ c.casoNumero }}</span>
            <strong v-if="c.nombreCaso">{{ c.nombreCaso }}</strong>
            <div class="jt__case-field">
              <label><i class="fa-solid fa-user" /> Quién es:</label><p>{{ c.potencialCliente }}</p>
            </div>
            <div class="jt__case-field">
              <label><i class="fa-solid fa-face-flushed" /> Cómo se siente:</label><p>{{ c.efectoAnuncio }}</p>
            </div>
            <div class="jt__case-field">
              <label><i class="fa-solid fa-bullseye" /> Qué obtiene:</label><p>{{ c.accionEsperada }}</p>
            </div>
            <span class="jt__case-edit"><i class="fa-solid fa-pen" /> Editar</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BrandProfile, CustomerJourneyCase } from '@/types'

const props = defineProps<{ profile: BrandProfile }>()

defineEmits<{
  (e: 'open-wizard'): void
  (e: 'add-case'): void
  (e: 'edit-case', caso: CustomerJourneyCase): void
}>()

const segmentos = computed(() => props.profile.segmentosMercado ?? [])
const canales = computed(() => props.profile.canalesDetail ?? [])
const actividades = computed(() => props.profile.actividadesClave ?? [])
const cases = computed(() => props.profile.customerJourneyCases ?? [])

const hasStrategy = computed(() => !!props.profile.propuestaValor || cases.value.length > 0)
</script>

<style scoped lang="scss">
.jt {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.jt__cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem;
  background: $overlay-purple;
  border: 1.5px solid rgba($secondary, 0.2);
  border-radius: 18px;
}

.jt__cta-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
  color: $white;
  background: $secondary;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba($secondary, 0.3);
}

.jt__cta-text {
  flex: 1 1 240px;
  min-width: 0;

  h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.3rem 0 0; font-size: 0.85rem; line-height: 1.5; color: $text-secondary; }
}

.jt__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &--primary {
    color: $white;
    background: linear-gradient(135deg, $secondary 0%, $secondary-dark 100%);
    box-shadow: 0 4px 14px rgba($secondary, 0.3);

    &:hover { transform: translateY(-1px); }
  }
}

.jt__box {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 18px;
}

.jt__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba($primary-dark, 0.06);

  &:last-child { padding-bottom: 0; border-bottom: none; }
}

.jt__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: $primary-dark;

  i { font-size: 1rem; color: $secondary; }
}

.jt__add {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  padding: 0.35rem 0.8rem;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  color: $white;
  background: $primary;
  border: none;
  border-radius: 999px;
  cursor: pointer;

  &:hover { filter: brightness(1.08); }
}

.jt__quote {
  margin: 0;
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: $primary-dark;
  background: rgba($primary-dark, 0.02);
  border-left: 3px solid $secondary;
  border-radius: 0 8px 8px 0;
}

.jt__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.jt__chip-card {
  flex: 1 1 240px;
  min-width: 0;
  padding: 0.9rem 1rem;
  background: rgba($primary-dark, 0.02);
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 10px;

  strong { display: block; margin-bottom: 0.3rem; font-size: 0.85rem; color: $secondary; }
  p { margin: 0; font-size: 0.85rem; line-height: 1.5; color: $primary-dark; }
}

.jt__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.jt__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: $alert-info;
  background: $alert-info-bg;
  border-radius: 20px;

  &--green { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.1); }
}

.jt__cases-empty {
  margin: 0;
  padding: 0.85rem 1rem;
  font-size: 0.84rem;
  line-height: 1.5;
  color: $text-secondary;
  background: rgba($text-secondary, 0.06);
  border-radius: 10px;
}

.jt__cases {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.jt__case {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.15rem;
  background: rgba($primary-dark, 0.015);
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  strong { font-size: 0.95rem; color: $primary-dark; }

  &:hover,
  &:focus-visible {
    border-color: rgba($secondary, 0.5);
    box-shadow: 0 2px 10px rgba($secondary, 0.12);

    .jt__case-edit { opacity: 1; }
  }
}

.jt__case-badge {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: $white;
  background: $secondary;
  border-radius: 20px;
}

.jt__case-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: $secondary-dark;

    i { font-size: 0.68rem; }
  }

  p { margin: 0; font-size: 0.85rem; line-height: 1.5; color: $primary-dark; }
}

.jt__case-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: $secondary;
  opacity: 0;
  transition: opacity 0.15s;
}
</style>
