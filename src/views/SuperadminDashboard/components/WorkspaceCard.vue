<script setup lang="ts">
import { ref } from 'vue'
import type { Workspace } from '@/types'
import { getWorkspaceImage } from '@/utils/workspaceImage'

/**
 * Tarjeta compacta de un entorno. Desactivar y Eliminar viven en el menú ⋯:
 * antes estaban siempre expuestos junto al nombre y un clic accidental podía
 * borrar un cliente.
 */
const MOTIVOS_DESACTIVACION: Record<string, string> = {
  falta_de_pago: 'Sin pago',
  fin_de_contrato: 'Contrato terminado',
  pausa_acordada: 'En pausa',
  otro: 'Inactivo',
}

const props = defineProps<{
  ws: Workspace
  busy: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'toggleActive', ev: Event): void
  (e: 'remove', ev: Event): void
  (e: 'enter'): void
}>()

function etiquetaDesactivacion(ws: any): string {
  const motivo = ws?.desactivacion?.motivo
  return motivo ? MOTIVOS_DESACTIVACION[motivo] ?? 'Inactivo' : 'Inactivo'
}

function detalleDesactivacion(ws: any): string {
  const d = ws?.desactivacion
  if (!d) return 'Desactivado antes de que se registrara el motivo'
  const cuando = d.fecha ? new Date(d.fecha).toLocaleDateString('es-EC') : ''
  return [
    MOTIVOS_DESACTIVACION[d.motivo] ?? 'Inactivo',
    d.nota,
    cuando && `Desactivado el ${cuando}`,
    d.porNombre && `por ${d.porNombre}`,
  ].filter(Boolean).join(' · ')
}

const imgFailed = ref(false)
function workspaceImg(): string | null {
  if (imgFailed.value) return null
  return getWorkspaceImage(props.ws)
}

/** Iniciales del nombre (max 2), para el avatar cuando no hay imagen. */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

function brandProfileCompletion(ws: any): number {
  const bp = ws.brandProfile
  if (!bp) return 0
  const required = [
    bp.descripcion?.trim(), bp.tipoNegocio, bp.publicoObjetivo?.trim(),
    bp.propuestaValor?.trim(), bp.tono?.trim(), bp.productosServicios?.trim(),
    bp.problemaResuelto?.trim(), bp.trafficDirection, bp.trafficLink?.trim(),
  ]
  return Math.round(required.filter(Boolean).length / required.length * 100)
}

function bpTone(ws: any): string {
  const score = brandProfileCompletion(ws)
  if (score === 100) return 'ok'
  if (score > 0) return 'warn'
  return 'muted'
}

function bpLabel(ws: any): string {
  const score = brandProfileCompletion(ws)
  if (score === 100) return 'Perfil completo'
  if (score > 0) return `Perfil ${score}%`
  if (ws.brandProfileInviteSentAt) return 'Invitado'
  return 'Sin perfil'
}

const menuAbierto = ref(false)
function accionMenu(fn: () => void) {
  menuAbierto.value = false
  fn()
}
</script>

<template>
  <article class="wsc" :class="{ 'wsc--inactive': !ws.isActive }">
    <div class="wsc__top">
      <div class="wsc__avatar">
        <img
          v-if="workspaceImg()"
          :src="workspaceImg()!"
          :alt="ws.name"
          class="wsc__avatar-img"
          @error="imgFailed = true"
        />
        <span v-else>{{ iniciales(ws.name) }}</span>
      </div>
      <div class="wsc__who">
        <div class="wsc__name-row">
          <span class="wsc__name">{{ ws.name }}</span>
          <span
            v-if="!ws.isActive"
            class="wsc__inactive-badge"
            :title="detalleDesactivacion(ws)"
          >{{ etiquetaDesactivacion(ws) }}</span>
        </div>
        <span v-if="ws.adminId" class="wsc__admin">{{ ws.adminId.email }}</span>
        <span v-else class="wsc__admin wsc__admin--missing">Sin admin asignado</span>
      </div>
      <div class="wsc__menu-wrap">
        <button class="wsc__menu-btn" type="button" aria-label="Más acciones" @click.stop="menuAbierto = !menuAbierto">
          <span v-if="busy" class="wsc__spinner" />
          <i v-else class="fa-solid fa-ellipsis" />
        </button>
        <template v-if="menuAbierto">
          <div class="wsc__menu-backdrop" @click="menuAbierto = false" />
          <div class="wsc__menu">
            <button type="button" class="wsc__menu-item" @click="accionMenu(() => emit('select'))">
              <i class="fa-solid fa-users" /> Gestionar usuarios
            </button>
            <button
              v-if="ws.isActive"
              type="button"
              class="wsc__menu-item"
              @click="(ev) => accionMenu(() => emit('toggleActive', ev))"
            >
              <i class="fa-solid fa-ban" /> Desactivar
            </button>
            <button
              type="button"
              class="wsc__menu-item wsc__menu-item--danger"
              @click="(ev) => accionMenu(() => emit('remove', ev))"
            >
              <i class="fa-solid fa-trash-can" /> Eliminar
            </button>
          </div>
        </template>
      </div>
    </div>

    <div class="wsc__bottom">
      <span class="wsc__chip" :class="`wsc__chip--${bpTone(ws)}`">{{ bpLabel(ws) }}</span>
      <span v-if="ws.metaAds?.pageId" class="wsc__chip wsc__chip--ok"><i class="fa-brands fa-meta" /> Meta</span>
      <span v-else class="wsc__chip wsc__chip--warn">Sin Meta</span>
      <div class="wsc__actions">
        <button class="wsc__btn-ghost" type="button" @click="emit('select')">
          <i class="fa-solid fa-users" /><span class="wsc__btn-ghost-label">Usuarios</span>
        </button>
        <button
          v-if="!ws.isActive"
          class="wsc__btn-reactivate"
          type="button"
          :disabled="busy"
          @click="(ev) => emit('toggleActive', ev)"
        >Reactivar</button>
        <button class="wsc__btn-primary" type="button" @click="emit('enter')">
          Ingresar <i class="fa-solid fa-arrow-right" />
        </button>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.wsc {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  box-shadow: 0 2px 10px rgba($primary-dark, 0.04);

  &--inactive { opacity: 0.68; background: rgba($primary-dark, 0.015); }
}

.wsc__top { display: flex; align-items: center; gap: 0.7rem; }

.wsc__avatar {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: rgba($primary, 0.09);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.92rem;
  font-weight: 800;
  flex-shrink: 0;
  overflow: hidden;
}

.wsc__avatar-img { width: 100%; height: 100%; object-fit: cover; }

.wsc__who { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }

.wsc__name-row { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }

.wsc__name {
  font-size: 0.92rem;
  font-weight: 800;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wsc__inactive-badge {
  flex-shrink: 0;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: rgba($text-secondary, 0.16);
  color: darken($text-secondary, 12%);
  cursor: help;
}

.wsc__admin {
  font-size: 0.74rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--missing { color: #b45309; font-weight: 600; }
}

.wsc__menu-wrap { position: relative; flex-shrink: 0; }

.wsc__menu-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { background: rgba($primary-dark, 0.06); color: $primary-dark; }
}

.wsc__menu-backdrop { position: fixed; inset: 0; z-index: 40; }

.wsc__menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 41;
  min-width: 190px;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba($primary-dark, 0.14);
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
}

.wsc__menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: $primary-dark;
  cursor: pointer;
  text-align: left;

  i { width: 14px; font-size: 0.78rem; color: $text-secondary; }

  &:hover { background: rgba($primary-dark, 0.05); }

  &--danger {
    color: $alert-error;
    i { color: $alert-error; }
    &:hover { background: $alert-error-bg; }
  }
}

.wsc__bottom { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

.wsc__chip {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;

  i { font-size: 0.6rem; }

  &--ok { background: rgba($alert-success, 0.12); color: darken($alert-success, 8%); }
  &--warn { background: rgba(#d97706, 0.12); color: #b45309; }
  &--muted { background: rgba($text-secondary, 0.14); color: $text-secondary; }
}

// Grupo de acciones: si no cabe, envuelve COMPLETO y alineado a la derecha,
// en vez de dejar caer el boton "Ingresar" solo y descolgado a la izquierda.
.wsc__actions { display: flex; align-items: center; gap: 0.4rem; margin-left: auto; flex-shrink: 0; }

.wsc__btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: transparent;
  color: $text-secondary;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;

  &:hover { color: $primary-dark; background: rgba($primary-dark, 0.05); }
}

// En móvil el texto "Usuarios" estorba: queda solo el icono con área táctil.
.wsc__btn-ghost-label { display: none; @media (min-width: 640px) { display: inline; } }

.wsc__btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: $primary;
  color: $white;
  border: none;
  border-radius: 9px;
  padding: 0.5rem 0.85rem;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba($primary, 0.25);

  i { font-size: 0.68rem; }

  &:hover { filter: brightness(1.05); }
}

.wsc__btn-reactivate {
  background: $white;
  color: $alert-success;
  border: 1.5px solid rgba($alert-success, 0.4);
  border-radius: 9px;
  padding: 0.45rem 0.85rem;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;

  &:hover { background: rgba($alert-success, 0.06); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.wsc__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: wsc-spin 0.8s linear infinite;
}

@keyframes wsc-spin { to { transform: rotate(360deg); } }
</style>
