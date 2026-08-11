<template>
  <!--
    Mirrors the real layout so nothing jumps when the data lands: same hero,
    same four KPI cards, same tab bar, same card grid.
  -->
  <div class="bsk" aria-busy="true" aria-live="polite">
    <span class="bsk__sr">Cargando el Builder de Contenido…</span>

    <div class="bsk__hero">
      <div class="bsk__hero-left">
        <div class="bsk__box bsk__avatar" />
        <div class="bsk__stack">
          <div class="bsk__box bsk__line" style="width: 8rem; height: 0.7rem" />
          <div class="bsk__box bsk__line" style="width: 20rem; height: 1.3rem" />
          <div class="bsk__box bsk__line" style="width: 26rem; height: 0.8rem" />
        </div>
      </div>
      <div class="bsk__hero-actions">
        <div class="bsk__box bsk__btn" style="width: 12rem" />
        <div class="bsk__box bsk__btn" style="width: 9rem" />
      </div>
    </div>

    <div class="bsk__kpis">
      <div v-for="n in 4" :key="n" class="bsk__kpi">
        <div class="bsk__box bsk__kpi-icon" />
        <div class="bsk__stack">
          <div class="bsk__box bsk__line" style="width: 6rem; height: 0.65rem" />
          <div class="bsk__box bsk__line" style="width: 3.5rem; height: 1.1rem" />
        </div>
      </div>
    </div>

    <div class="bsk__tabs">
      <div v-for="n in 4" :key="n" class="bsk__box bsk__tab" :style="{ width: `${9 + n}rem` }" />
    </div>

    <div class="bsk__box bsk__bar" />

    <div class="bsk__grid">
      <div v-for="n in 6" :key="n" class="bsk__card">
        <div class="bsk__row">
          <div class="bsk__box bsk__chip" style="width: 2rem" />
          <div class="bsk__box bsk__chip" style="width: 3.5rem" />
          <div class="bsk__box bsk__chip" style="width: 3rem" />
        </div>
        <div class="bsk__box bsk__line" style="width: 70%; height: 1.05rem" />
        <div class="bsk__box bsk__line" style="width: 90%; height: 0.8rem" />
        <div class="bsk__box bsk__script" />
        <div class="bsk__row">
          <div class="bsk__box bsk__btn" style="flex: 1" />
          <div class="bsk__box bsk__btn" style="width: 5.5rem" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bsk {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  min-width: 0;
  padding: 1.5rem;
}

.bsk__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

// One shimmering surface, reused for every placeholder shape.
.bsk__box {
  background: linear-gradient(
    90deg,
    rgba($text-secondary, 0.1) 25%,
    rgba($text-secondary, 0.18) 50%,
    rgba($text-secondary, 0.1) 75%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  animation: bsk-shimmer 1.4s infinite;
}

.bsk__stack {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.bsk__row {
  display: flex;
  gap: 0.5rem;
}

.bsk__line { max-width: 100%; }
.bsk__chip { height: 1.1rem; border-radius: 20px; }
.bsk__btn { height: 2.4rem; border-radius: 10px; }

.bsk__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.75rem 2rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 18px;
}

.bsk__hero-left {
  display: flex;
  flex: 1 1 20rem;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
}

.bsk__avatar {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

.bsk__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bsk__kpis {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.bsk__kpi {
  display: flex;
  flex: 1 1 220px;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  padding: 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
}

.bsk__kpi-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.bsk__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba($primary-dark, 0.06);
}

.bsk__tab {
  height: 2.4rem;
  border-radius: 10px;
}

.bsk__bar {
  height: 5rem;
  border-radius: 12px;
}

.bsk__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.bsk__card {
  display: flex;
  flex: 1 1 340px;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  padding: 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
}

.bsk__script {
  height: 4.5rem;
  border-radius: 10px;
}

@keyframes bsk-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

// Respect users who asked the OS for less motion.
@media (prefers-reduced-motion: reduce) {
  .bsk__box { animation: none; }
}
</style>
