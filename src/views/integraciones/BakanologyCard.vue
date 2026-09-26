<script setup lang="ts">
/** Acceso a Bakanology: el curso para cerrar más de las ventas que detectamos. */
defineProps<{ url: string }>()
</script>

<template>
  <section class="bk" aria-labelledby="bk-title">
    <div class="bk__icon" aria-hidden="true"><i class="fa-solid fa-graduation-cap" /></div>
    <div class="bk__body">
      <h2 id="bk-title">Bakanology</h2>
      <p>
        Avisarte de un cliente listo para comprar es la mitad del trabajo. En Bakanology está el curso para que
        tú y tu equipo cierren más de esas ventas.
      </p>
      <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer" class="bk__link">
        Ir al curso
        <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        <span class="bk__sr">(se abre en otra pestaña)</span>
      </a>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.bk {
  display: flex; gap: 0.9rem; align-items: flex-start;
  background: linear-gradient(135deg, rgba(#6366f1, 0.07), rgba(#10b981, 0.06));
  border: 1px solid rgba(#6366f1, 0.15);
  border-radius: 16px;
  padding: 1.2rem 1.25rem;

  @media (max-width: 560px) { padding: 1rem; border-radius: 14px; }
}

.bk__icon {
  width: 42px; height: 42px; flex-shrink: 0;
  display: grid; place-items: center; border-radius: 12px;
  background: $white; color: #6366f1; font-size: 1.05rem;
}

.bk__body {
  flex: 1; min-width: 0;
  h2 { font-size: 1rem; font-weight: 800; color: $primary-dark; margin: 0 0 0.3rem; }
  p { font-size: 0.84rem; line-height: 1.5; color: $text-secondary; margin: 0 0 0.85rem; }
}

.bk__link {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  min-height: 44px; padding: 0.55rem 1.1rem; border-radius: 10px;
  background: $primary-dark; color: $white; text-decoration: none;
  font-size: 0.84rem; font-weight: 700;
  i { font-size: 0.72rem; }
  &:hover { opacity: 0.9; }
  &:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }

  @media (max-width: 560px) { width: 100%; }
}

.bk__sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>
