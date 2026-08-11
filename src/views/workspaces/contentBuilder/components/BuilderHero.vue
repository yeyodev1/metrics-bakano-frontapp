<template>
  <div class="bh">
    <header class="bh__hero">
      <div class="bh__left">
        <div class="bh__avatar">
          <img v-if="avatar" :src="avatar" alt="" />
          <i v-else class="fa-solid fa-wand-magic-sparkles" />
        </div>
        <div class="bh__title">
          <div class="bh__eyebrow">
            <span class="bh__tag">STUDIO PRO</span>
            <span>{{ workspaceName || 'Workspace' }}</span>
          </div>
          <h1>Builder de Contenido &amp; Matriz de Guiones</h1>
          <p>Vincula guiones (TOFU/MOFU/BOFU) con Reels en vivo, mide métricas reales e impulsa tu Agente IA.</p>
        </div>
      </div>

      <div class="bh__actions">
        <button class="bh__btn bh__btn--secondary" @click="$emit('open-wizard')">
          <i class="fa-solid fa-diagram-project" /> Definir Estrategia de Marca
        </button>
        <button class="bh__btn bh__btn--primary" @click="$emit('new-script')">
          <i class="fa-solid fa-plus" /> Crear Guion con IA
        </button>
      </div>
    </header>

    <section class="bh__kpis">
      <div v-for="kpi in kpis" :key="kpi.label" class="bh__kpi">
        <div class="bh__kpi-icon" :class="`bh__kpi-icon--${kpi.tone}`">
          <i :class="kpi.icon" />
        </div>
        <div class="bh__kpi-info">
          <span>{{ kpi.label }}</span>
          <strong>{{ kpi.value }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  workspaceName?: string
  avatar?: string | null
  totalScripts: number
  totalLinkedReels: number
  totalViews: number
  totalAdSpend: number
}>()

defineEmits<{ (e: 'open-wizard'): void; (e: 'new-script'): void }>()

const kpis = computed(() => [
  {
    label: 'Guiones Creados',
    value: String(props.totalScripts),
    icon: 'fa-solid fa-scroll',
    tone: 'purple',
  },
  {
    label: 'Reels Vinculados',
    value: `${props.totalLinkedReels} / ${props.totalScripts}`,
    icon: 'fa-brands fa-instagram',
    tone: 'pink',
  },
  {
    label: 'Vistas Orgánicas Total',
    // A zero here means Instagram never returned insights, not zero views.
    value: props.totalViews > 0 ? props.totalViews.toLocaleString('es-EC') : '—',
    icon: 'fa-solid fa-eye',
    tone: 'blue',
  },
  {
    label: 'Inversión Meta Ads',
    value: `$${props.totalAdSpend.toFixed(2)}`,
    icon: 'fa-solid fa-dollar-sign',
    tone: 'green',
  },
])
</script>

<style scoped lang="scss">
.bh {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bh__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.75rem 2rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.bh__left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.bh__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  font-size: 1.5rem;
  color: $secondary;
  background: $overlay-purple;
  border-radius: 16px;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.bh__title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  h1 { margin: 0; font-size: 1.4rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0; font-size: 0.88rem; color: $text-secondary; }
}

.bh__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: $text-secondary;
}

.bh__tag {
  padding: 0.15rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 800;
  color: $white;
  background: $secondary;
  border-radius: 20px;
}

.bh__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bh__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &--primary {
    color: $white;
    background: linear-gradient(135deg, $secondary 0%, $secondary-dark 100%);
    box-shadow: 0 4px 14px rgba($secondary, 0.3);

    &:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba($secondary, 0.4); }
  }

  &--secondary {
    color: $secondary;
    background: $overlay-purple;
    border: 1px solid rgba($secondary, 0.2);

    &:hover { background: rgba($secondary, 0.18); }
  }
}

.bh__kpis {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.bh__kpi {
  display: flex;
  flex: 1 1 220px;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  padding: 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.bh__kpi-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
  border-radius: 12px;

  &--purple { color: $secondary; background: $overlay-purple; }
  &--pink { color: $primary; background: rgba($primary, 0.1); }
  &--blue { color: $alert-info; background: $alert-info-bg; }
  &--green { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.1); }
}

.bh__kpi-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  span { font-size: 0.78rem; font-weight: 600; color: $text-secondary; }
  strong { font-size: 1.25rem; font-weight: 800; color: $primary-dark; }
}
</style>
