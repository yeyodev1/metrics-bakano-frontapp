<script setup lang="ts">
/**
 * Guía para sacar el token de GoHighLevel. Va plegada: quien ya sabe hacerlo
 * no tiene que atravesarla, y quien no, la abre justo encima del formulario.
 */
const PERMISOS = [
  'conversations.readonly',
  'conversations/message.readonly',
  'opportunities.readonly',
  'contacts.readonly',
]
</script>

<template>
  <details class="guide">
    <summary>
      <i class="fa-regular fa-circle-question" aria-hidden="true" />
      <span>¿Cómo obtengo mi token?</span>
      <i class="fa-solid fa-chevron-down guide__chevron" aria-hidden="true" />
    </summary>

    <div class="guide__body">
      <h3>Token de integración privada</h3>
      <ol class="guide__steps">
        <li>Entra a GoHighLevel y abre la <strong>subcuenta</strong> de tu negocio.</li>
        <li>Ve a <strong>Configuración</strong> (Settings) → <strong>Integraciones privadas</strong> (Private Integrations).</li>
        <li>Toca <strong>Crear nueva integración</strong> y ponle de nombre <strong>Bakano</strong>.</li>
        <li>
          Marca solo estos permisos de <strong>solo lectura</strong>:
          <ul class="guide__scopes">
            <li v-for="permiso in PERMISOS" :key="permiso"><code>{{ permiso }}</code></li>
          </ul>
        </li>
        <li>Crea la integración y <strong>copia el token</strong>. Pégalo abajo.</li>
      </ol>

      <h3>Location ID</h3>
      <p>
        Lo encuentras en <strong>Configuración → Perfil del negocio</strong> (Business Profile), o en la
        dirección de la subcuenta: es lo que va después de <code>/location/</code> y antes de la siguiente
        <code>/</code>.
      </p>

      <p class="guide__note">
        <i class="fa-solid fa-lock" aria-hidden="true" />
        Son permisos de solo lectura: Bakano puede ver, pero nunca escribir ni borrar nada en tu CRM.
      </p>
      <p class="guide__note guide__note--team">
        <i class="fa-solid fa-user-gear" aria-hidden="true" />
        Si Bakano administra tu CRM, tu equipo de Bakano puede conectarlo por ti.
      </p>
    </div>
  </details>
</template>

<style lang="scss" scoped>
.guide {
  border: 1px solid rgba(#6366f1, 0.2);
  border-radius: 12px;
  background: rgba(#6366f1, 0.03);

  summary {
    list-style: none;
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.75rem 0.9rem; min-height: 44px;
    font-size: 0.84rem; font-weight: 700; color: #4f46e5;
    cursor: pointer; user-select: none;
    &::-webkit-details-marker { display: none; }
    span { flex: 1; }
  }

  &[open] .guide__chevron { transform: rotate(180deg); }
}

.guide__chevron { font-size: 0.72rem; transition: transform 0.2s ease; }

.guide__body {
  padding: 0 0.9rem 0.9rem;
  font-size: 0.82rem; line-height: 1.55; color: $primary-dark;

  h3 { font-size: 0.78rem; font-weight: 800; margin: 0.4rem 0 0.4rem; text-transform: uppercase; letter-spacing: 0.04em; color: $text-secondary; }
  p { margin: 0 0 0.7rem; &:last-child { margin-bottom: 0; } }
  code {
    font-size: 0.76rem; background: rgba($primary-dark, 0.06);
    padding: 0.06rem 0.35rem; border-radius: 5px; word-break: break-all;
  }
}

.guide__steps {
  margin: 0 0 0.9rem; padding-left: 1.2rem;
  display: flex; flex-direction: column; gap: 0.45rem;
}

.guide__scopes {
  list-style: none; margin: 0.4rem 0 0; padding: 0;
  display: flex; flex-wrap: wrap; gap: 0.35rem;
}

.guide__note {
  display: flex; align-items: flex-start; gap: 0.5rem;
  font-size: 0.78rem; color: $text-secondary;
  i { margin-top: 0.2rem; color: #0d9668; }

  &--team { color: $primary-dark; font-weight: 600; i { color: #6366f1; } }
}

@media (prefers-reduced-motion: reduce) {
  .guide__chevron { transition: none; }
}
</style>
