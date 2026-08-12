<template>
  <!-- Quien llega sin cuenta no se va con las manos vacías: o es cliente y
         entra, o quiere serlo y va al sitio comercial. -->
    <section class="prospecto">
      <div class="prospecto__box">
        <p class="prospecto__eyebrow">¿Todavía no eres cliente?</p>
        <h2 class="prospecto__title">Esta plataforma es solo para clientes de Bakano.</h2>
        <p class="prospecto__text">
          Si quieres que llevemos el marketing de tu negocio, escríbenos desde el sitio
          principal y te contamos cómo trabajamos.
        </p>
        <a
          class="prospecto__cta"
          href="https://mkt.bakano.ec/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Quiero ser cliente de Bakano
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </a>
      </div>
    </section>
</template>

<style lang="scss" scoped>
.prospecto {
  // Sin el padding de arriba la caja quedaba pegada al borde de la sección
  // anterior, como si fuera parte de ella.
  padding: clamp(3rem, 7vw, 5rem) 1.5rem clamp(3rem, 6vw, 4.5rem);
}

.prospecto__box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.75rem 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba($primary, 0.06), rgba($secondary, 0.06));
  border: 1.5px solid rgba($primary, 0.18);
  border-radius: 20px;
}

.prospecto__eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: $primary;
  text-transform: uppercase;
}

.prospecto__title {
  max-width: 34rem;
  margin: 0;
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: $primary-dark;
}

.prospecto__text {
  max-width: 32rem;
  margin: 0 0 0.9rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: $text-secondary;
}

.prospecto__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  // En móvil se partía en dos líneas con el icono colgando.
  max-width: 100%;
  padding: 0.85rem 1.6rem;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 700;
  color: $white;
  text-decoration: none;
  background: $primary-dark;
  border-radius: 12px;
  transition: transform 0.18s, box-shadow 0.18s;

  i { font-size: 0.8rem; }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba($primary-dark, 0.28);
  }

  &:focus-visible { outline: 2px solid $primary; outline-offset: 3px; }
}
</style>
