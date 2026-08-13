<script setup lang="ts">
/**
 * Un entorno inactivo sin explicación obligaba a preguntar por WhatsApp si era
 * falta de pago o una pausa acordada. El motivo se guarda al desactivar.
 */
const MOTIVOS_DESACTIVACION: Record<string, string> = {
  falta_de_pago: 'Sin pago',
  fin_de_contrato: 'Contrato terminado',
  pausa_acordada: 'En pausa',
  otro: 'Inactivo',
}

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

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Workspace } from '@/types'
import { getWorkspaceImage } from '@/utils/workspaceImage'

const props = defineProps<{
  workspaces: Workspace[]
  searchQuery: string
  isLoadingWorkspaces: boolean
  hasMore: boolean
  isLoadingMore: boolean
  selectedWorkspace: Workspace | null
  togglingWorkspaceId: string | null
  deletingWorkspaceId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'selectWorkspace', ws: Workspace): void
  (e: 'handleToggleWorkspaceActive', ws: Workspace, ev: Event): void
  (e: 'handleDeleteWorkspace', ws: Workspace, ev: Event): void
  (e: 'fetchWorkspaces', loadMore: boolean): void
  (e: 'openCreateWorkspace'): void
}>()

const router = useRouter()

const failedImages = ref(new Set<string>())
function handleImgError(wsId: string) {
  failedImages.value.add(wsId)
}
function getWorkspaceImg(ws: Workspace): string | null {
  if (failedImages.value.has(ws._id)) return null
  return getWorkspaceImage(ws)
}

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val)
})

function getBrandProfileCompletion(ws: any): number {
  const bp = ws.brandProfile
  if (!bp) return 0
  const required = [
    bp.descripcion?.trim(), bp.tipoNegocio, bp.publicoObjetivo?.trim(),
    bp.propuestaValor?.trim(), bp.tono?.trim(), bp.productosServicios?.trim(),
    bp.problemaResuelto?.trim(), bp.trafficDirection, bp.trafficLink?.trim(),
  ]
  return Math.round(required.filter(Boolean).length / required.length * 100)
}

function getBpBadgeClass(ws: any): string {
  const score = getBrandProfileCompletion(ws)
  if (score === 100) return 'superadmin-dashboard__ws-bp--complete'
  if (score > 0) return 'superadmin-dashboard__ws-bp--partial'
  if (ws.brandProfileInviteSentAt) return 'superadmin-dashboard__ws-bp--invited'
  return 'superadmin-dashboard__ws-bp--none'
}

function getBpLabel(ws: any): string {
  const score = getBrandProfileCompletion(ws)
  if (score === 100) return 'Perfil completo'
  if (score > 0) return `Perfil ${score}%`
  if (ws.brandProfileInviteSentAt) return 'Invitado'
  return 'Sin perfil'
}
</script>

<template>
  <section class="superadmin-dashboard__workspaces">
    <div class="superadmin-dashboard__section-header">
      <div class="superadmin-dashboard__section-title">
        <h3>Entornos</h3>
        <span class="superadmin-dashboard__count">{{ workspaces.length }}</span>
      </div>
      <div class="superadmin-dashboard__header-actions">
        <div class="superadmin-dashboard__search-wrap">
          <i v-if="isLoadingWorkspaces" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-magnifying-glass" />
          <input 
            v-model="localSearchQuery" 
            type="text" 
            placeholder="Buscar entorno..." 
            class="superadmin-dashboard__search-input"
          />
        </div>
        <button class="superadmin-dashboard__btn-primary" @click="emit('openCreateWorkspace')">
          <i class="fa-solid fa-plus" /> Crear Entorno
        </button>
      </div>
    </div>

    <div v-if="isLoadingWorkspaces && workspaces.length === 0" class="superadmin-dashboard__loading">
      <span class="superadmin-dashboard__spinner" />
      <p>Buscando entornos...</p>
    </div>

    <div v-else-if="workspaces.length === 0 && !isLoadingWorkspaces" class="superadmin-dashboard__empty-state">
      <div class="superadmin-dashboard__empty-state-icon">
        <i class="fa-solid fa-layer-group" aria-hidden="true" />
      </div>
      <h4 class="superadmin-dashboard__empty-state-title">No hay entornos de trabajo</h4>
      <p class="superadmin-dashboard__empty-state-desc">Crea un nuevo entorno para empezar a organizar a tus clientes y colaboradores.</p>
    </div>

    <div v-else class="superadmin-dashboard__workspace-grid" :class="{ 'is-loading': isLoadingWorkspaces }">
      <div
        v-for="ws in workspaces"
        :key="ws._id"
        class="superadmin-dashboard__workspace-card"
        :class="{
          'superadmin-dashboard__workspace-card--inactive': !ws.isActive
        }"
      >
        <div class="superadmin-dashboard__workspace-card-header">
          <div class="superadmin-dashboard__ws-icon">
            <img
              v-if="getWorkspaceImg(ws)"
              :src="getWorkspaceImg(ws)!"
              :alt="ws.name"
              class="superadmin-dashboard__ws-icon-img"
              @error="handleImgError(ws._id)"
            />
            <i v-else class="fa-solid fa-building" />
          </div>
          <div class="superadmin-dashboard__ws-info-top">
            <span class="superadmin-dashboard__ws-name">
              {{ ws.name }}
              <span
                v-if="!ws.isActive"
                class="superadmin-dashboard__ws-inactive-badge"
                :title="detalleDesactivacion(ws)"
              >{{ etiquetaDesactivacion(ws) }}</span>
            </span>
            <span v-if="ws.adminId" class="superadmin-dashboard__ws-admin-email">{{ ws.adminId.email }}</span>
            <span v-else class="superadmin-dashboard__ws-meta-empty">Sin admin asignado</span>
          </div>
          <div class="superadmin-dashboard__ws-actions-menu">
            <button
              class="superadmin-dashboard__ws-toggle-btn"
              :class="ws.isActive ? 'superadmin-dashboard__ws-toggle-btn--deactivate' : 'superadmin-dashboard__ws-toggle-btn--activate'"
              :disabled="togglingWorkspaceId === ws._id"
              :title="ws.isActive ? 'Desactivar entorno' : 'Activar entorno'"
              @click.stop="emit('handleToggleWorkspaceActive', ws, $event)"
            >
              <span v-if="togglingWorkspaceId === ws._id" class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
              <i v-else :class="ws.isActive ? 'fa-solid fa-ban' : 'fa-solid fa-circle-play'" />
            </button>
            <button
              class="superadmin-dashboard__ws-toggle-btn superadmin-dashboard__ws-toggle-btn--delete"
              :disabled="deletingWorkspaceId === ws._id"
              title="Eliminar entorno"
              @click.stop="emit('handleDeleteWorkspace', ws, $event)"
            >
              <span v-if="deletingWorkspaceId === ws._id" class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
              <i v-else class="fa-solid fa-trash-can" />
            </button>
          </div>
        </div>
        
        <div class="superadmin-dashboard__workspace-card-body">
          <div class="superadmin-dashboard__ws-tags">
            <span v-if="ws.metaAds?.pageId" class="superadmin-dashboard__ws-meta-badge">
              <i class="fa-brands fa-meta" /> Meta
            </span>
            <span :class="['superadmin-dashboard__ws-bp', getBpBadgeClass(ws)]">
              <i :class="getBrandProfileCompletion(ws) === 100 ? 'fa-solid fa-circle-check' : getBrandProfileCompletion(ws) > 0 ? 'fa-solid fa-circle-half-stroke' : ws.brandProfileInviteSentAt ? 'fa-solid fa-envelope' : 'fa-regular fa-circle'" />
              {{ getBpLabel(ws) }}
            </span>
          </div>
        </div>

        <div class="superadmin-dashboard__workspace-card-footer">
          <button
            class="superadmin-dashboard__btn-outline superadmin-dashboard__btn-outline--sm"
            @click="emit('selectWorkspace', ws)"
          >
            <i class="fa-solid fa-users" /> Gestionar
          </button>
          <button
            class="superadmin-dashboard__btn-primary superadmin-dashboard__btn-primary--sm"
            @click="router.push({ name: 'BillingRoas', params: { workspaceId: ws._id } })"
          >
            <i class="fa-solid fa-right-to-bracket" /> Ingresar
          </button>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="superadmin-dashboard__load-more">
      <button 
        class="superadmin-dashboard__btn-ghost superadmin-dashboard__btn-ghost--full"
        :disabled="isLoadingMore"
        @click="emit('fetchWorkspaces', true)"
      >
        <span v-if="!isLoadingMore">Cargar más</span>
        <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__workspaces {
  width: 100%;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
  border: 1px solid rgba($primary-dark, 0.05);
  min-height: 400px;
}

.superadmin-dashboard__section-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.superadmin-dashboard__section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: $primary-dark;
    font-weight: 800;
  }
}

.superadmin-dashboard__count {
  background: rgba($primary, 0.1);
  color: $primary;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
}

.superadmin-dashboard__header-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
}

.superadmin-dashboard__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 250px;

  i {
    position: absolute;
    left: 0.875rem;
    font-size: 0.85rem;
    color: $text-secondary;
    pointer-events: none;
  }
}

.superadmin-dashboard__search-input {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2.5rem;
  border-radius: 10px;
  border: 1.5px solid rgba($primary-dark, 0.1);
  font-size: 0.9rem;
  background: rgba($primary-dark, 0.02);
  transition: all 0.25s ease;

  &:focus {
    outline: none;
    border-color: $primary;
    background: $white;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
}

.superadmin-dashboard__workspace-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  padding: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

.superadmin-dashboard__workspace-card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

  &:hover {
    box-shadow: 0 8px 24px rgba($primary-dark, 0.06);
    transform: translateY(-2px);
  }

  &--inactive {
    opacity: 0.6;
    background: #fdfdfd;
  }
}

.superadmin-dashboard__workspace-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.superadmin-dashboard__ws-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $primary-light 0%, rgba($primary, 0.1) 100%);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.4rem;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba($primary, 0.1);
}

.superadmin-dashboard__ws-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.superadmin-dashboard__ws-info-top {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.superadmin-dashboard__ws-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.1rem;
}

.superadmin-dashboard__ws-admin-email {
  font-size: 0.8rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.superadmin-dashboard__ws-meta-empty {
  font-size: 0.8rem;
  color: rgba($text-secondary, 0.6);
  font-style: italic;
}

.superadmin-dashboard__ws-inactive-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 800;
  color: #ef4444;
  background: rgba(#ef4444, 0.1);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  vertical-align: middle;
  margin-left: 0.4rem;
}

.superadmin-dashboard__ws-actions-menu {
  display: flex;
  gap: 0.4rem;
}

.superadmin-dashboard__ws-toggle-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba($primary-dark, 0.04);
  color: $text-secondary;

  &:hover:not(:disabled) {
    background: rgba($primary-dark, 0.1);
    color: $primary-dark;
  }

  &--deactivate {
    &:hover:not(:disabled) { background: rgba(#ef4444, 0.1); color: #ef4444; }
  }

  &--delete {
    &:hover:not(:disabled) { background: rgba(#dc2626, 0.1); color: #dc2626; }
  }

  &--activate {
    &:hover:not(:disabled) { background: rgba(#16a34a, 0.1); color: #16a34a; }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.superadmin-dashboard__workspace-card-body {
  padding-top: 0.5rem;
}

.superadmin-dashboard__ws-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.superadmin-dashboard__ws-meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1877f2;
  background: rgba(#1877f2, 0.08);
  padding: 0.25rem 0.6rem;
  border-radius: 100px;
}

.superadmin-dashboard__ws-bp {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 100px;

  &--none {
    background: rgba($primary-dark, 0.06);
    color: $text-secondary;
  }

  &--invited {
    background: rgba(234, 179, 8, 0.1);
    color: #92400e;
  }

  &--partial {
    background: rgba(234, 179, 8, 0.12);
    color: #92400e;
  }

  &--complete {
    background: rgba(#22c55e, 0.1);
    color: darken(#22c55e, 15%);
  }
}

.superadmin-dashboard__workspace-card-footer {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba($primary-dark, 0.05);

  button {
    flex: 1;
    justify-content: center;
  }
}

.superadmin-dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  color: $text-secondary;

  &-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($primary, 0.1) 100%);
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px rgba($primary, 0.1);
  }

  &-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 0.5rem;
  }

  &-desc {
    font-size: 0.95rem;
    max-width: 320px;
    margin: 0 0 1.5rem;
    line-height: 1.5;
  }
}

.superadmin-dashboard__btn-outline {
  background: transparent;
  border: 1px solid rgba($primary-dark, 0.15);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: $primary-dark;
  transition: all 0.2s;

  &:hover {
    background: rgba($primary-dark, 0.03);
    border-color: $primary;
    color: $primary;
  }

  &--sm {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}

.superadmin-dashboard__btn-primary {
  background: $primary;
  color: $white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: box-shadow 0.2s, opacity 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba($primary, 0.3);
    opacity: 0.95;
  }

  &--sm {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}

.superadmin-dashboard__btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  color: $text-secondary;

  &:hover {
    background: rgba($primary-dark, 0.05);
  }

  &--full {
    width: 100%;
    border-radius: 0;
    padding: 1rem;
  }
}

.superadmin-dashboard__load-more {
  border-top: 1px solid rgba($primary-dark, 0.05);
}

.superadmin-dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: $text-secondary;
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  &--sm {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
