<template>
  <!-- Refleja el layout real para que nada salte al terminar de cargar. -->
  <div class="rsk" role="status" aria-label="Cargando recursos">
    <!-- Mismo alto y mismos bloques que el encabezado real, para que al
         terminar de cargar no salte nada de sitio. -->
    <div class="rsk__hero">
      <div class="rsk__hero-row">
        <div class="rsk__hero-text">
          <div class="rsk__line rsk__line--pill" />
          <div class="rsk__line rsk__line--title" />
          <div class="rsk__line rsk__line--sub" />
          <div class="rsk__line rsk__line--gap" />
        </div>
        <div class="rsk__ring" />
      </div>
      <div class="rsk__hero-stats">
        <div class="rsk__line rsk__line--stat" />
        <div class="rsk__line rsk__line--stat rsk__line--stat-wide" />
      </div>
    </div>

    <div v-for="n in 3" :key="n" class="rsk__section">
      <div class="rsk__head">
        <div class="rsk__icon" />
        <div class="rsk__lines">
          <div class="rsk__line rsk__line--sm" />
          <div class="rsk__line rsk__line--xs" />
        </div>
      </div>
      <div class="rsk__drop" />
      <div class="rsk__grid">
        <div v-for="c in 3" :key="c" class="rsk__card" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@mixin shimmer($light: false) {
  @if $light {
    // Sobre el degradado oscuro hace falta más contraste; con 0.08 los
    // bloques quedaban casi invisibles y el encabezado parecía vacío.
    background: linear-gradient(
      90deg,
      rgba($white, 0.13) 25%,
      rgba($white, 0.26) 37%,
      rgba($white, 0.13) 63%
    );
  } @else {
    background: linear-gradient(
      90deg,
      rgba($primary-dark, 0.05) 25%,
      rgba($primary-dark, 0.09) 37%,
      rgba($primary-dark, 0.05) 63%
    );
  }

  background-size: 400% 100%;
  border-radius: 8px;
  animation: rsk-shimmer 1.4s ease infinite;
}

@keyframes rsk-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.rsk {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  padding: 1.5rem;
}

// Mismo degradado que el encabezado real: la carga no cambia de color.
.rsk__hero {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, $primary-dark 0%, $secondary-dark 100%);
  border-radius: 20px;
}

.rsk__hero-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
}

.rsk__hero-stats { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.rsk__hero-text {
  display: flex;
  flex: 1 1 18rem;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.rsk__ring {
  @include shimmer(true);

  flex-shrink: 0;
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 50%;
}

// La base va primero: los modificadores comparten especificidad, así que gana
// el último declarado. Con .rsk__line al final, el shimmer oscuro pisaba al
// claro y los bloques del encabezado quedaban invisibles sobre el degradado.
.rsk__line { @include shimmer; height: 0.7rem; }
.rsk__line--sm { width: 9rem; }
.rsk__line--xs { width: 60%; height: 0.6rem; }

// Variantes claras, sobre el encabezado oscuro.
.rsk__line--pill { @include shimmer(true); width: 9rem; height: 1.1rem; border-radius: 20px; }
.rsk__line--title { @include shimmer(true); width: 70%; height: 1.9rem; }
.rsk__line--sub { @include shimmer(true); width: 85%; height: 1.6rem; }
.rsk__line--gap { @include shimmer(true); width: 11rem; height: 1.9rem; border-radius: 10px; }
.rsk__line--stat { @include shimmer(true); width: 6rem; height: 1.4rem; }
.rsk__line--stat-wide { width: 10rem; }

.rsk__section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 18px;
}

.rsk__head { display: flex; align-items: center; gap: 0.75rem; }
.rsk__icon { @include shimmer; flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px; }

.rsk__lines { display: flex; flex: 1; flex-direction: column; gap: 0.35rem; }

.rsk__drop { @include shimmer; height: 4.4rem; border-radius: 14px; }

.rsk__grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }

.rsk__card {
  @include shimmer;

  flex: 1 1 100%;
  height: 12rem;
  border-radius: 14px;
}

@media (min-width: 620px) {
  .rsk__card { flex: 1 1 11rem; max-width: 15rem; }
}

@media (prefers-reduced-motion: reduce) {
  .rsk__ring,
  .rsk__icon,
  .rsk__line,
  .rsk__drop,
  .rsk__card { animation: none; }
}
</style>
