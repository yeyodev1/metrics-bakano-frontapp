<template>
  <div class="ipf">
    <div class="ipf__row">
      <div class="ipf__field">
        <label>Link de publicación final</label>
        <input v-model="form.linkVideo" type="url" placeholder="https://…" />
      </div>

      <!--
        This date IS the calendar event: getCalendarItems filters on
        fechaPublicacion, so a script without it is invisible in planning and
        excluded from any per-period analysis.
      -->
      <div class="ipf__field">
        <label>
          Fecha de publicación
          <span class="ipf__badge">crea el evento</span>
        </label>
        <input v-model="form.fechaPublicacion" type="date" />

        <p v-if="!form.fechaPublicacion" class="ipf__warn">
          <i class="fa-regular fa-calendar-xmark" />
          <span>
            Sin fecha este video <strong>no aparece en el calendario</strong> de
            planificación y queda fuera del análisis por mes. Ponla aunque sea tentativa.
          </span>
        </p>
        <p v-else class="ipf__ok">
          <i class="fa-regular fa-calendar-check" />
          Se agenda el {{ scheduledLabel }}
        </p>
      </div>
    </div>

    <div class="ipf__statuses">
      <div v-for="s in STATUS_FIELDS" :key="s.key" class="ipf__field">
        <label>{{ s.label }}</label>
        <select v-model="(form as any)[s.key]" :class="s.color((form as any)[s.key])">
          <option v-for="v in s.options" :key="v" :value="v">{{ v.replace(/_/g, ' ') }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  EstadoIdea,
  EstadoProduccion,
  EstadoEdicion,
  EstadoPublicacion,
  type CreateVideoItemPayload,
} from '@/types/videoPlanning'

const form = defineModel<CreateVideoItemPayload>({ required: true })

const scheduledLabel = computed(() => {
  const raw = form.value.fechaPublicacion
  if (!raw) return ''
  // Noon avoids the date shifting a day under the local timezone.
  return new Date(`${raw}T12:00:00`).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})

const tone = (map: Record<string, string>) => (v: string) => map[v] || 'is-gray'

const STATUS_FIELDS = [
  {
    key: 'estadoIdea',
    label: 'Idea',
    options: Object.values(EstadoIdea),
    color: tone({
      [EstadoIdea.APROBADO]: 'is-success',
      [EstadoIdea.POR_REVISAR]: 'is-warning',
      [EstadoIdea.RECHAZADO]: 'is-danger',
    }),
  },
  {
    key: 'estadoProduccion',
    label: 'Producción',
    options: Object.values(EstadoProduccion),
    color: tone({
      [EstadoProduccion.GRABADO]: 'is-success',
      [EstadoProduccion.POR_GRABAR]: 'is-warning',
      [EstadoProduccion.RECHAZADO]: 'is-danger',
    }),
  },
  {
    key: 'edicion',
    label: 'Edición',
    options: Object.values(EstadoEdicion),
    color: tone({
      [EstadoEdicion.EDITADO]: 'is-success',
      [EstadoEdicion.POR_EDITAR]: 'is-warning',
      [EstadoEdicion.RECHAZADO]: 'is-danger',
    }),
  },
  {
    key: 'estadoPublicacion',
    label: 'Publicación',
    options: Object.values(EstadoPublicacion),
    color: tone({
      [EstadoPublicacion.PUBLICADO]: 'is-success',
      [EstadoPublicacion.PROGRAMADO]: 'is-info',
      [EstadoPublicacion.POR_PUBLICAR]: 'is-warning',
    }),
  },
]
</script>

<style scoped lang="scss">
.ipf {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ipf__row,
.ipf__statuses {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ipf__field {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;

  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 800;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  select {
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
  }

  select {
    &.is-success { color: $BAKANO-GREEN; border-color: rgba($BAKANO-GREEN, 0.4); }
    &.is-warning { color: $alert-warning; border-color: rgba($alert-warning, 0.4); }
    &.is-danger { color: $alert-error; border-color: rgba($alert-error, 0.4); }
    &.is-info { color: $alert-info; border-color: rgba($alert-info, 0.4); }
  }
}

.ipf__badge {
  padding: 0.05rem 0.35rem;
  font-size: 0.58rem;
  font-weight: 700;
  color: $secondary-dark;
  letter-spacing: 0.03em;
  background: $overlay-purple;
  border-radius: 4px;
}

.ipf__warn,
.ipf__ok {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0.3rem 0 0;
  font-size: 0.7rem;
  line-height: 1.4;

  i { flex-shrink: 0; margin-top: 0.1rem; }
}

.ipf__warn {
  color: $text-secondary;

  i { color: $alert-warning; }
  strong { color: $primary-dark; }
}

.ipf__ok {
  font-weight: 600;
  color: $BAKANO-GREEN;
}

@media (min-width: 600px) {
  .ipf__row { flex-direction: row; }
  .ipf__statuses { flex-direction: row; flex-wrap: wrap; }
  .ipf__statuses .ipf__field { flex: 1 1 8rem; }
}
</style>
