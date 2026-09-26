<script setup lang="ts">
import { computed } from 'vue'
import type { CrmPermisos, CrmVista } from '@/services/integraciones.service'
import { fechaHoraEs } from './format'

/** Lo que se sabe de una conexión ya guardada: datos, WhatsApp y permisos. */
const props = defineProps<{ crm: CrmVista }>()

const PERMISOS: Array<{ key: keyof CrmPermisos; label: string }> = [
  { key: 'conversaciones', label: 'Conversaciones' },
  { key: 'mensajes', label: 'Mensajes' },
  { key: 'oportunidades', label: 'Oportunidades' },
  { key: 'contactos', label: 'Contactos' },
]

const conectadoPor = computed(() => {
  const quien = props.crm.conectadoPor
  if (!quien) return '—'
  return quien.esEquipo ? 'Equipo Bakano' : quien.nombre
})
</script>

<template>
  <div class="details">
    <dl class="details__grid">
      <div class="details__item">
        <dt>Location ID</dt>
        <dd class="details__mono">{{ crm.locationId }}</dd>
      </div>
      <div class="details__item">
        <dt>Token</dt>
        <dd class="details__mono">••••{{ crm.tokenFinal }}</dd>
      </div>
      <div class="details__item">
        <dt>Conectado por</dt>
        <dd>
          {{ conectadoPor }}
          <span v-if="crm.conectadoPor" class="details__muted">· {{ fechaHoraEs(crm.conectadoPor.en) }}</span>
        </dd>
      </div>
      <div class="details__item">
        <dt>Última revisión</dt>
        <dd>{{ crm.ultimaRevision ? fechaHoraEs(crm.ultimaRevision) : 'Aún no hemos hecho la primera' }}</dd>
      </div>
    </dl>

    <p v-if="crm.whatsapp === 'conectado'" class="details__wa details__wa--ok">
      <i class="fa-brands fa-whatsapp" aria-hidden="true" />
      <span><strong>WhatsApp conectado.</strong> Revisamos tus conversaciones cada día.</span>
    </p>
    <p v-else-if="crm.whatsapp === 'no_detectado'" class="details__wa details__wa--warn" role="status">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <span>
        No vemos conversaciones de WhatsApp en tu CRM: conecta tu WhatsApp Business al CRM para que podamos
        revisarlas. Mientras tanto revisamos tus oportunidades.
      </span>
    </p>
    <p v-else class="details__wa">
      <i class="fa-brands fa-whatsapp" aria-hidden="true" />
      <span>Todavía no sabemos si tu WhatsApp está conectado al CRM. Lo confirmamos en la próxima revisión.</span>
    </p>

    <div class="details__perms">
      <h3>Permisos detectados</h3>
      <ul>
        <li
          v-for="permiso in PERMISOS"
          :key="permiso.key"
          :class="crm.permisos[permiso.key] ? 'is-ok' : 'is-missing'"
        >
          <i
            :class="crm.permisos[permiso.key] ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"
            aria-hidden="true"
          />
          {{ permiso.label }}
          <span class="sr-only">{{ crm.permisos[permiso.key] ? '(activo)' : '(falta)' }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.details { display: flex; flex-direction: column; gap: 0.9rem; }

.details__grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem; margin: 0;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
}

.details__item {
  background: rgba($primary-dark, 0.03);
  border-radius: 10px; padding: 0.6rem 0.75rem; min-width: 0;

  dt { font-size: 0.66rem; font-weight: 700; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.05em; }
  dd { margin: 0.15rem 0 0; font-size: 0.86rem; font-weight: 600; color: $primary-dark; overflow-wrap: anywhere; }
  dd.details__mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.82rem; }
}

.details__muted { font-weight: 500; color: $text-secondary; }

.details__wa {
  display: flex; align-items: flex-start; gap: 0.55rem;
  margin: 0; padding: 0.7rem 0.8rem; border-radius: 10px;
  font-size: 0.8rem; line-height: 1.45;
  background: rgba($primary-dark, 0.04); color: $text-secondary;
  i { margin-top: 0.15rem; font-size: 0.95rem; }

  &--ok { background: rgba(#10b981, 0.08); color: #065f46; i { color: #0d9668; } }
  &--warn { background: rgba(#d97706, 0.1); color: #92400e; i { color: #d97706; } }
}

.details__perms {
  h3 { font-size: 0.72rem; font-weight: 800; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.45rem; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; }

  li {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.3rem 0.65rem; border-radius: 999px;
    font-size: 0.76rem; font-weight: 700;

    &.is-ok { background: rgba(#10b981, 0.1); color: #0d9668; }
    &.is-missing { background: rgba(#ef4444, 0.08); color: #dc2626; }
  }
}

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>
