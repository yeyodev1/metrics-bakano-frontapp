<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useGlobalUserModal } from '@/composables/useGlobalUserModal'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
// @ts-ignore
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'
import type { CreateGlobalUserPayload, UpdateGlobalUserPayload, Workspace, InternalRole } from '@/types'

// Internal role definitions for the picker
const INTERNAL_ROLES: { value: InternalRole; label: string; icon: string }[] = [
  { value: 'director', label: 'Director', icon: 'fa-star' },
  { value: 'estratega', label: 'Estratega', icon: 'fa-chess' },
  { value: 'project_manager', label: 'Project Manager', icon: 'fa-diagram-project' },
  { value: 'content_manager', label: 'Content Manager', icon: 'fa-layer-group' },
  { value: 'account_manager', label: 'Account Manager', icon: 'fa-handshake' },
  { value: 'community_manager', label: 'Community Manager', icon: 'fa-comments' },
  { value: 'productor', label: 'Productor', icon: 'fa-clapperboard' },
  { value: 'asistente_produccion', label: 'Asistente Producción', icon: 'fa-camera' },
  { value: 'editor', label: 'Editor', icon: 'fa-film' },
  { value: 'disenador', label: 'Diseñador', icon: 'fa-pen-ruler' },
  { value: 'copywriter', label: 'Copywriter', icon: 'fa-feather' },
  { value: 'analista', label: 'Analista', icon: 'fa-chart-bar' },
  { value: 'desarrollador', label: 'Desarrollador', icon: 'fa-code' },
  { value: 'trafficker', label: 'Trafficker', icon: 'fa-bullseye' },
]

const { isVisible, modalOptions, close } = useGlobalUserModal()
const toast = useToast()

const userForm = ref<any>({
  name: '',
  email: '',
  password: '',
  workspaces: [] as { workspaceId: string, role: 'admin' | 'colaborador' }[],
  phoneNumber: '',
  phoneExtension: '',
  isInternal: false,
  internalRole: null as InternalRole | null,
  sendWelcomeEmail: true,
})

const allWorkspaces = ref<Workspace[]>([])
const isLoadingWorkspaces = ref(false)
const isSaving = ref(false)
const userError = ref('')
const workspaceSearch = ref('')

// Resend invite
const showResendPanel = ref(false)
const resendPassword = ref('')
const isResending = ref(false)
const resendError = ref('')
const resendSuccess = ref(false)

async function handleResendInvite() {
  if (!resendPassword.value || resendPassword.value.length < 8) {
    resendError.value = 'La contraseña debe tener mínimo 8 caracteres.'
    return
  }
  if (!modalOptions.value.user?._id) return
  isResending.value = true
  resendError.value = ''
  resendSuccess.value = false
  try {
    await workspaceService.resendInvite(modalOptions.value.user._id, resendPassword.value)
    resendSuccess.value = true
    resendPassword.value = ''
    setTimeout(() => { resendSuccess.value = false; showResendPanel.value = false }, 3000)
  } catch (err: any) {
    resendError.value = err.response?.data?.message || 'Error al reenviar invitación.'
  } finally {
    isResending.value = false
  }
}

async function fetchWorkspaces() {
  isLoadingWorkspaces.value = true
  try {
    const response = await workspaceService.listWorkspaces({ limit: 100, minimal: true })
    allWorkspaces.value = response.workspaces
  } catch (err) {
    toast.error('Error al cargar entornos')
  } finally {
    isLoadingWorkspaces.value = false
  }
}

watch(isVisible, (newVal) => {
  if (newVal) {
    userError.value = ''
    fetchWorkspaces()
    if (modalOptions.value.mode === 'edit' && modalOptions.value.user) {
      const user = modalOptions.value.user as any
      userForm.value = {
        name: user.name || '',
        email: user.email,
        password: '',
        workspaces: (user.workspaces || []).map((w: any) => ({
          workspaceId: w.workspaceId?._id || w.workspaceId,
          role: w.role
        })),
        phoneNumber: user.phoneNumber || '',
        phoneExtension: user.phoneExtension || '',
        isInternal: user.isInternal || false,
        internalRole: user.internalRole || null
      }
    } else {
      userForm.value = { 
        name: '', 
        email: '', 
        password: '', 
        workspaces: [],
        phoneNumber: '',
        phoneExtension: '',
        isInternal: false,
        internalRole: null
      }
    }
  }
})

function handlePhoneInput(_: string, phoneObject: any) {
  if (phoneObject && phoneObject.country && phoneObject.country.dialCode) {
    userForm.value.phoneExtension = `+${phoneObject.country.dialCode}`
  } else {
    userForm.value.phoneExtension = ''
  }
}

const filteredWorkspaces = computed(() => { // Added computed filteredWorkspaces
  if (!workspaceSearch.value.trim()) return allWorkspaces.value
  const query = workspaceSearch.value.toLowerCase()
  return allWorkspaces.value.filter(ws => 
    ws.name.toLowerCase().includes(query) || 
    ws.metaAds?.pageName?.toLowerCase().includes(query)
  )
})

function toggleWorkspace(workspaceId: string) { // Changed wsId to workspaceId
  const index = userForm.value.workspaces.findIndex((w: any) => w.workspaceId === workspaceId) // Changed wsId to workspaceId
  if (index === -1) {
    userForm.value.workspaces.push({ workspaceId: workspaceId, role: 'colaborador' }) // Changed wsId to workspaceId
  } else {
    userForm.value.workspaces.splice(index, 1)
  }
}

function updateWorkspaceRole(wsId: string, role: 'admin' | 'colaborador') {
  const ws = userForm.value.workspaces.find((w: any) => w.workspaceId === wsId)
  if (ws) {
    ws.role = role
  }
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    parent.classList.add('global-user-modal__ws-avatar--fallback')
  }
}

async function handleSubmit() {
  if (isSaving.value) return

  if (!userForm.value.email.trim()) {
    userError.value = 'El correo es obligatorio.'
    return
  }
  
  if (userForm.value.workspaces.length === 0) {
    userError.value = 'Debes seleccionar al menos un entorno.'
    return
  }

  // A los clientes les llegan avisos por WhatsApp: sin numero no hay canal.
  // A los internos de Bakano no se les exige.
  if (
    modalOptions.value.mode !== 'edit' &&
    !userForm.value.isInternal &&
    !userForm.value.phoneNumber?.trim()
  ) {
    userError.value = 'El número de teléfono es obligatorio para usuarios cliente: es la vía de los avisos por WhatsApp.'
    return
  }

  isSaving.value = true
  userError.value = ''

  try {
    if (modalOptions.value.mode === 'edit' && modalOptions.value.user) {
      const payload: UpdateGlobalUserPayload = {
        name: userForm.value.name,
        email: userForm.value.email,
        workspaces: userForm.value.workspaces,
        phoneNumber: userForm.value.phoneNumber,
        phoneExtension: userForm.value.phoneExtension,
        isInternal: userForm.value.isInternal,
        internalRole: userForm.value.isInternal ? userForm.value.internalRole : null
      }
      if (userForm.value.password) payload.password = userForm.value.password

      const { user } = await workspaceService.updateGlobalUser(modalOptions.value.user._id, payload)
      toast.success('Usuario actualizado correctamente.')
      close(user)
    } else {
      const payload: CreateGlobalUserPayload = {
        name: userForm.value.name,
        email: userForm.value.email,
        password: userForm.value.password,
        workspaces: userForm.value.workspaces,
        phoneNumber: userForm.value.phoneNumber,
        phoneExtension: userForm.value.phoneExtension,
        isInternal: userForm.value.isInternal,
        internalRole: userForm.value.isInternal ? userForm.value.internalRole : undefined,
        sendWelcomeEmail: userForm.value.sendWelcomeEmail,
      }
      const { user } = await workspaceService.createGlobalUser(payload)
      toast.success('Colaborador creado con éxito.')
      close(user)
    }
  } catch (err: any) {
    userError.value = err.response?.data?.message || 'Error al guardar usuario.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Transition name="global-modal">
    <div v-if="isVisible" class="global-user-modal-overlay" @click.self="close(null)">
      <div class="global-user-modal">
        <div class="global-user-modal__header">
          <div class="global-user-modal__title">
            <i class="fa-solid fa-user-plus" v-if="modalOptions.mode === 'create'" />
            <i class="fa-solid fa-user-pen" v-else />
            <h3>{{ modalOptions.mode === 'edit' ? 'Editar Colaborador' : 'Nuevo Colaborador de Cuenta' }}</h3>
          </div>
          <button class="global-user-modal__close-btn" @click="close(null)">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="global-user-modal__form">
          <div class="global-user-modal__main-fields">
            <div class="global-user-modal__form-group">
              <label>Nombre Completo</label>
              <input v-model="userForm.name" type="text" placeholder="Ej: Diego Reyes" />
            </div>
            <div class="global-user-modal__form-group">
              <label>Email Corporativo</label>
              <input v-model="userForm.email" type="email" required placeholder="email@bakano.com" />
            </div>
            <div class="global-user-modal__form-group">
              <label>
                Contraseña
                <span class="global-user-modal__hint">
                  {{ modalOptions.mode === 'edit' ? '(Dejar en blanco para no cambiar)' : '(Mínimo 8 caracteres)' }}
                </span>
              </label>
              <input v-model="userForm.password" type="password" minlength="8" placeholder="••••••••" />
            </div>

            <div class="global-user-modal__form-group">
              <label>Teléfono</label>
              <VueTelInput
                v-model="userForm.phoneNumber"
                mode="international"
                @on-input="handlePhoneInput"
              />
            </div>

            <div class="global-user-modal__form-group global-user-modal__form-group--checkbox">
              <label class="global-user-modal__checkbox-label" title="Los colaboradores internos tienen permisos globales sobre el calendario de planificación">
                <div class="global-user-modal__checkbox-wrap">
                  <input type="checkbox" v-model="userForm.isInternal" />
                  <div class="global-user-modal__checkbox-custom">
                    <i class="fa-solid fa-check" v-if="userForm.isInternal" />
                  </div>
                </div>
                <span>Colaborador Interno Bakano</span>
              </label>
            </div>

            <!-- Internal Role Picker: only visible when isInternal is checked -->
            <Transition name="role-picker-fade">
              <div v-if="userForm.isInternal" class="global-user-modal__form-group global-user-modal__form-group--full-width">
                <label>
                  <i class="fa-solid fa-id-badge" />
                  Rol del Colaborador
                </label>
                <div class="global-user-modal__role-grid">
                  <button
                    v-for="role in INTERNAL_ROLES"
                    :key="role.value"
                    type="button"
                    class="global-user-modal__role-chip"
                    :class="{ 'is-active': userForm.internalRole === role.value }"
                    @click="userForm.internalRole = userForm.internalRole === role.value ? null : role.value"
                  >
                    <i :class="`fa-solid ${role.icon}`" />
                    <span>{{ role.label }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <div class="global-user-modal__ws-section">
            <div class="global-user-modal__ws-header">
                <span class="global-user-modal__section-label">Asignar Entornos</span>
                <div class="global-user-modal__ws-search">
                    <i class="fa-solid fa-magnifying-glass" />
                    <input 
                        v-model="workspaceSearch" 
                        type="text" 
                        placeholder="Buscar entorno..." 
                        @click.stop
                    />
                </div>
            </div>

            <div v-if="isLoadingWorkspaces" class="global-user-modal__loading-ws">
              <span class="global-user-modal__spinner" />
              <p>Cargando entornos...</p>
            </div>
            <div v-else-if="filteredWorkspaces.length === 0" class="global-user-modal__ws-empty">
              No se encontraron entornos.
            </div>
            <div v-else class="global-user-modal__ws-grid">
              <div 
                v-for="ws in filteredWorkspaces" 
                :key="ws._id" 
                class="global-user-modal__ws-item"
                :class="{ 'global-user-modal__ws-item--selected': userForm.workspaces.some((w: any) => w.workspaceId === ws._id) }"
              >
                <div class="global-user-modal__ws-card" @click="toggleWorkspace(ws._id)">
                  <div class="global-user-modal__ws-avatar">
                    <img 
                      v-if="ws.metaAds?.pageId" 
                      :src="`https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=normal`" 
                      alt="Logo" 
                      class="global-user-modal__ws-page-img"
                      @error="handleImgError"
                    />
                    <span v-else>{{ ws.name.substring(0, 2).toUpperCase() }}</span>
                  </div>
                  
                  <div class="global-user-modal__ws-details">
                    <p class="global-user-modal__ws-name">{{ ws.name }}</p>
                    <div v-if="userForm.workspaces.some((w: any) => w.workspaceId === ws._id)" class="global-user-modal__ws-role-badge">
                        <select 
                        :value="userForm.workspaces.find((w: any) => w.workspaceId === ws._id)?.role"
                        @click.stop
                        @change="(e) => updateWorkspaceRole(ws._id, (e.target as HTMLSelectElement).value as any)"
                        >
                        <option value="admin">Admin</option>
                        <option value="colaborador">Colab</option>
                        </select>
                    </div>
                  </div>

                  <div class="global-user-modal__ws-check">
                    <i class="fa-solid fa-circle-check" v-if="userForm.workspaces.some((w: any) => w.workspaceId === ws._id)" />
                    <i class="fa-regular fa-circle" v-else />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Welcome email toggle (only for new users) -->
          <div v-if="modalOptions.mode === 'create'" class="global-user-modal__welcome-email">
            <label class="global-user-modal__welcome-label">
              <div class="global-user-modal__checkbox-wrap">
                <input type="checkbox" v-model="userForm.sendWelcomeEmail" />
                <div class="global-user-modal__checkbox-custom">
                  <i class="fa-solid fa-check" v-if="userForm.sendWelcomeEmail" />
                </div>
              </div>
              <div class="global-user-modal__welcome-text">
                <span class="global-user-modal__welcome-title">
                  <i class="fa-solid fa-envelope-open-text" />
                  Enviar email de bienvenida
                </span>
                <span class="global-user-modal__welcome-desc">
                  Se enviará un correo con las credenciales de acceso al usuario
                  <strong>{{ userForm.isInternal ? '(colaborador interno)' : '(cliente)' }}</strong>
                </span>
              </div>
            </label>
          </div>

          <!-- Resend invite panel (edit mode only) -->
          <div v-if="modalOptions.mode === 'edit'" class="global-user-modal__resend-block">
            <button
              type="button"
              class="global-user-modal__resend-toggle"
              @click="showResendPanel = !showResendPanel; resendError = ''; resendSuccess = false"
            >
              <i class="fa-solid fa-paper-plane" />
              Reenviar invitación / cambiar contraseña
              <i :class="showResendPanel ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" style="margin-left:auto" />
            </button>

            <Transition name="resend-fade">
              <div v-if="showResendPanel" class="global-user-modal__resend-panel">
                <p class="global-user-modal__resend-hint">
                  Escribe la nueva contraseña — se actualizará en la cuenta y se enviará el email de bienvenida con las credenciales.
                </p>
                <div class="global-user-modal__resend-row">
                  <input
                    v-model="resendPassword"
                    type="password"
                    minlength="8"
                    placeholder="Nueva contraseña (mín. 8 caracteres)"
                    class="global-user-modal__resend-input"
                    @keydown.enter.prevent="handleResendInvite"
                  />
                  <button
                    type="button"
                    class="global-user-modal__resend-btn"
                    :disabled="isResending"
                    @click="handleResendInvite"
                  >
                    <span v-if="isResending" class="global-user-modal__spinner" />
                    <i v-else class="fa-solid fa-paper-plane" />
                    {{ isResending ? '' : 'Enviar' }}
                  </button>
                </div>
                <p v-if="resendError" class="global-user-modal__resend-error">{{ resendError }}</p>
                <p v-if="resendSuccess" class="global-user-modal__resend-ok">
                  <i class="fa-solid fa-circle-check" /> Invitación enviada correctamente
                </p>
              </div>
            </Transition>
          </div>

          <p v-if="userError" class="global-user-modal__error-text">{{ userError }}</p>

          <div class="global-user-modal__footer">
            <button type="button" class="global-user-modal__btn-ghost" @click="close(null)">Cancelar</button>
            <button type="submit" class="global-user-modal__btn-primary" :disabled="isSaving">
              <span v-if="!isSaving">{{ modalOptions.mode === 'edit' ? 'Actualizar Colaborador' : 'Crear Colaborador' }}</span>
              <span v-else class="global-user-modal__spinner" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.global-user-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(#0a192f, 0.7);
  backdrop-filter: blur(8px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.global-user-modal {
  background: #ffffff;
  width: 100%;
  max-width: 650px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  &__header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(#0a192f, 0.05);
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: $primary-dark;

    i {
      font-size: 1.25rem;
      color: $primary;
    }

    h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
    }
  }

  &__close-btn {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;

    &:hover {
      color: $alert-error;
      transform: rotate(90deg);
    }
  }

  &__form {
    padding: 2rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__main-fields {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 600;
      font-size: 0.9rem;
      color: $primary-dark;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    input {
      padding: 0.85rem;
      border: 1.5px solid rgba($primary-dark, 0.1);
      border-radius: 12px;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.2s;

      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 4px rgba($primary, 0.1);
        outline: none;
      }
    }

    &--checkbox {
      flex-direction: row;
      align-items: center;
      padding: 1.25rem;
      background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($primary, 0.02) 100%);
      border: 2px solid rgba($primary, 0.15);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: $primary;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 0;
      }

      &:hover {
        border-color: rgba($primary, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba($primary, 0.1);

        &::before {
          opacity: 0.03;
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  &__checkbox-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    width: 100%;
    user-select: none;
    position: relative;
    z-index: 1;

    span {
      font-weight: 700;
      font-size: 0.95rem;
      color: $primary-dark;
      letter-spacing: -0.01em;
    }
  }

  &__checkbox-wrap {
    position: relative;
    width: 24px;
    height: 24px;
    flex-shrink: 0;

    input {
      position: absolute !important;
      opacity: 0 !important;
      cursor: pointer;
      height: 0;
      width: 0;
    }
  }

  &__checkbox-custom {
    position: absolute;
    top: 0;
    left: 0;
    height: 24px;
    width: 24px;
    background-color: $white;
    border: 2.5px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    .global-user-modal__form-group--checkbox:hover & {
      border-color: rgba($primary, 0.4);
    }

    i {
      color: $white;
      font-size: 0.85rem;
      transform: scale(0.5);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    input:checked ~ & {
      background-color: $primary;
      border-color: $primary;
      box-shadow: 0 4px 12px rgba($primary, 0.3);

      i {
        transform: scale(1);
        opacity: 1;
      }
    }
  }

  &__hint {
    font-size: 0.75rem;
    font-weight: normal;
    color: #64748b;
  }

  &__form-group--full-width {
    grid-column: 1 / -1;

    > label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: $primary-dark;
      margin-bottom: 0.75rem;

      i {
        color: $primary;
      }
    }
  }

  &__role-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  &__role-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.1);
    background: $white;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    i {
      font-size: 0.85rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    &:hover {
      border-color: rgba($primary, 0.3);
      background: rgba($primary, 0.04);
      color: $primary-dark;
      transform: translateY(-1px);
    }

    &.is-active {
      background: $primary;
      border-color: $primary;
      color: $white;
      box-shadow: 0 4px 12px rgba($primary, 0.25);
      transform: translateY(-2px);

      i {
        opacity: 1;
      }
    }
  }

  &__section-label {
    font-weight: 700;
    font-size: 1rem;
    color: $primary-dark;
    margin-bottom: 1rem;
    display: block;
  }

  &__ws-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  &__ws-search {
    position: relative;
    flex: 1;
    max-width: 200px;

    i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: rgba($primary-dark, 0.4);
    }

    input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1.5px solid rgba($primary-dark, 0.08);
      border-radius: 10px;
      font-size: 0.85rem;
      background: $white;
      transition: all 0.2s;

      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba($primary, 0.1);
        outline: none;
      }
    }
  }

  &__ws-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    max-height: 350px;
    overflow-y: auto;
    padding-right: 0.5rem;

    @media (min-width: 500px) {
      grid-template-columns: 1fr 1fr;
    }

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba($primary, 0.2);
      border-radius: 2px;
    }
  }

  &__ws-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #ffffff;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    width: 100%;

    &:hover {
      border-color: rgba($primary, 0.3);
      background: rgba($primary, 0.01);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .global-user-modal__ws-item--selected & {
      border-color: $primary;
      background: rgba($primary, 0.04);
      box-shadow: 0 4px 15px rgba($primary, 0.15);
    }
  }

  &__ws-avatar {
    width: 44px;
    height: 44px;
    background: rgba($primary, 0.08);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $primary;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid rgba($primary-dark, 0.05);

    &--fallback {
      background: rgba($primary-dark, 0.05);
      color: rgba($primary-dark, 0.4);
    }
  }

  &__ws-page-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__ws-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  &__ws-name {
    margin: 0;
    font-weight: 700;
    font-size: 0.9rem;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-role-badge {
    select {
      appearance: none;
      -webkit-appearance: none;
      padding: 0.15rem 1.5rem 0.15rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba($primary, 0.2);
      background: $white;
      font-size: 0.7rem;
      font-weight: 700;
      color: $primary;
      outline: none;
      cursor: pointer;
      transition: all 0.2s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.4rem center;
      background-size: 0.7rem;

      &:hover {
        background-color: rgba($primary, 0.05);
        border-color: $primary;
      }
    }
  }

  &__ws-check {
    font-size: 1.1rem;
    color: rgba($primary-dark, 0.1);
    transition: all 0.2s;

    .global-user-modal__ws-item--selected & {
      color: $primary;
    }
  }

  &__welcome-email {
    background: rgba($primary, 0.04);
    border: 1.5px solid rgba($primary, 0.12);
    border-radius: 12px;
    padding: 1rem 1.25rem;
  }

  &__welcome-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;
  }

  &__welcome-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__welcome-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    i { color: $primary; }
  }

  &__welcome-desc {
    font-size: 0.78rem;
    color: $text-secondary;
    line-height: 1.5;
  }

  &__resend-block {
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    overflow: hidden;
  }

  &__resend-toggle {
    width: 100%; display: flex; align-items: center; gap: 0.6rem;
    padding: 0.9rem 1.1rem; background: rgba($primary-dark, 0.03);
    border: none; cursor: pointer; font-size: 0.85rem; font-weight: 700;
    color: $primary-dark; transition: background 0.2s;
    &:hover { background: rgba($primary, 0.06); }
    i:first-child { color: $primary; }
  }

  &__resend-panel {
    padding: 1rem 1.1rem 1.1rem;
    border-top: 1px solid rgba($primary-dark, 0.08);
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  &__resend-hint {
    margin: 0; font-size: 0.78rem; color: $text-secondary; line-height: 1.5;
  }

  &__resend-row { display: flex; gap: 0.5rem; }

  &__resend-input {
    flex: 1; padding: 0.7rem 1rem; border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.12); font-family: inherit;
    font-size: 0.88rem; transition: all 0.2s;
    &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  }

  &__resend-btn {
    padding: 0.7rem 1.2rem; border-radius: 10px; border: none;
    background: $primary; color: white; font-weight: 700; font-size: 0.85rem;
    cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
    transition: all 0.2s; white-space: nowrap;
    &:hover { background: $primary-dark; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__resend-error {
    margin: 0; font-size: 0.8rem; color: $alert-error; font-weight: 600;
  }

  &__resend-ok {
    margin: 0; font-size: 0.82rem; color: #16a34a; font-weight: 700;
    display: flex; align-items: center; gap: 0.4rem;
  }

  &__error-text {
    color: $alert-error;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
    text-align: center;
    padding: 0.65rem;
    background: rgba($alert-error, 0.05);
    border-radius: 10px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__btn-ghost {
    padding: 0.85rem 1.5rem;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: #64748b;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.05);
    }
  }

  &__btn-primary {
    padding: 0.85rem 2rem;
    border-radius: 12px;
    border: none;
    background: $primary;
    color: $white;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    &:hover {
      box-shadow: 0 10px 25px rgba($primary, 0.3);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba($white, 0.3);
    border-top-color: $white;
    border-radius: 50%;
    animation: global-user-spin 0.8s linear infinite;
  }
}

@keyframes global-user-spin {
  to { transform: rotate(360deg); }
}

.global-modal-enter-active,
.global-modal-leave-active {
  transition: opacity 0.3s;
  .global-user-modal { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
}

.global-modal-enter-from,
.global-modal-leave-to {
  opacity: 0;
  .global-user-modal { transform: scale(0.9) translateY(30px); }
}

// Role picker reveal animation — slide down + fade + subtle scale
.role-picker-fade-enter-active {
  transition:
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-height: 200px;
}

.role-picker-fade-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-height: 200px;
}

.role-picker-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
  max-height: 0;
}

.role-picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
  max-height: 0;
}

.resend-fade-enter-active { transition: opacity 0.2s, transform 0.2s; }
.resend-fade-leave-active  { transition: opacity 0.15s; }
.resend-fade-enter-from    { opacity: 0; transform: translateY(-6px); }
.resend-fade-leave-to      { opacity: 0; }

:deep(.vue-tel-input) {
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  height: 48px;
  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
  .vti__input {
    background: transparent;
    border-radius: 0 12px 12px 0;
  }
  .vti__dropdown {
    border-radius: 12px 0 0 12px;
  }
}
</style>
