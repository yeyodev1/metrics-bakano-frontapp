<template>
  <div class="trf__grid">
    <div v-for="n in 6" :key="n" class="trf-sk-card">
      <div class="trf-sk-card__top">
        <div class="trf-sk-card__name-area">
          <div class="trf-sk trf-sk--avatar" />
          <div>
            <div class="trf-sk trf-sk--name" />
            <div class="trf-sk trf-sk--sub" />
          </div>
        </div>
        <div class="trf-sk trf-sk--badge" />
      </div>
      <div class="trf-sk-card__metrics">
        <div class="trf-sk trf-sk--metric" />
        <div class="trf-sk trf-sk--metric" />
      </div>
      <div class="trf-sk trf-sk--progress" />
      <div class="trf-sk trf-sk--footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes sk-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

%sk-pulse {
  background: linear-gradient(90deg, #eef0f3 25%, #e4e6ea 50%, #eef0f3 75%);
  background-size: 1200px 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}

.trf-sk {
  @extend %sk-pulse;
  border-radius: 8px;

  &--avatar   { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
  &--name     { width: 120px; height: 13px; margin-bottom: 6px; }
  &--sub      { width: 80px; height: 10px; }
  &--badge    { width: 58px; height: 42px; border-radius: 12px; flex-shrink: 0; }
  &--metric   { flex: 1; height: 52px; border-radius: 0;
    &:first-child { border-radius: 12px 0 0 12px; }
    &:last-child  { border-radius: 0 12px 12px 0; }
  }
  &--progress { width: 100%; height: 7px; border-radius: 100px; }
  &--footer   { width: 45%; height: 14px; }
}

.trf-sk-card {
  background: white;
  border-radius: 16px;
  border: 1.5px solid rgba($primary, 0.06);
  border-left: 5px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  &__name-area {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__metrics {
    display: flex;
    border: 1px solid rgba($primary, 0.07);
    border-radius: 12px;
    overflow: hidden;
    gap: 1px;
    background: rgba($primary, 0.04);
  }
}

.trf__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 580px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1360px) { grid-template-columns: repeat(3, 1fr); }
}
</style>
