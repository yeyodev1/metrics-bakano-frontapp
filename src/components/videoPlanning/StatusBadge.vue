<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type: 'idea' | 'produccion' | 'edicion' | 'publicacion' | 'aprobacion'
}>()

const LABELS: Record<string, string> = {
  APROBADO: 'Aprobado',
  POR_REVISAR: 'Por revisar',
  RECHAZADO: 'Rechazado',
  GRABADO: 'Grabado',
  POR_GRABAR: 'Por grabar',
  EDITADO: 'Editado',
  POR_EDITAR: 'Por editar',
  PROGRAMADO: 'Programado',
  PUBLICADO: 'Publicado',
  POR_PUBLICAR: 'Por publicar',
  '-': '—',
  PENDIENTE: 'Pendiente',
}

const COLOR_MAP: Record<string, string> = {
  APROBADO: 'green',
  GRABADO: 'green',
  EDITADO: 'green',
  PUBLICADO: 'green',
  POR_REVISAR: 'yellow',
  POR_GRABAR: 'yellow',
  POR_EDITAR: 'yellow',
  POR_PUBLICAR: 'yellow',
  PROGRAMADO: 'blue',
  RECHAZADO: 'red',
  PENDIENTE: 'gray',
  '-': 'gray',
}

const color = computed(() => COLOR_MAP[props.status] || 'gray')
const label = computed(() => LABELS[props.status] || props.status)
</script>

<template>
  <span class="status-badge" :class="`status-badge--${color}`">{{ label }}</span>
</template>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.02em;

  &--green  { background: #dcfce7; color: #166534; }
  &--yellow { background: #fef9c3; color: #854d0e; }
  &--blue   { background: #dbeafe; color: #1e40af; }
  &--red    { background: #fee2e2; color: #991b1b; }
  &--gray   { background: #f3f4f6; color: #6b7280; }
}
</style>
