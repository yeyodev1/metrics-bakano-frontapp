<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { surveyService } from '@/services/survey.service'
import { useUserStore } from '@/stores/user'
import type { Workspace, WorkspaceUser } from '@/types'

type SendMode = 'clients' | 'internal'

const props = defineProps<{
  surveyId: string
  visible: boolean
  initialWorkspaceId?: string
  initialMode?: SendMode
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'sent', result: { sent: number; skipped: number }): void
}>()

const userStore = useUserStore()
const isSuperadmin = computed(() => userStore.role === 'superadmin')

// Mode
const mode = ref<SendMode>('clients')

// Clients mode state
const workspaces = ref<Workspace[]>([])
const selectedWorkspaceId = ref('')
const clientUsers = ref<WorkspaceUser[]>([])
const isLoadingWorkspaces = ref(false)
const isLoadingClientUsers = ref(false)
const wsSearch = ref('')
let searchTimeout: any = null

const filteredWorkspaces = computed(() => {
  if (!wsSearch.value) return workspaces.value
  const query = wsSearch.value.toLowerCase()
  return workspaces.value.filter(ws => ws.name.toLowerCase().includes(query))
})

// Internal mode state
const internalUsers = ref<{ _id: string; name: string; email: string }[]>([])
const isLoadingInternalUsers = ref(false)

// Shared state
const selectedUserIds = ref<string[]>([])
const message = ref('')
const isSending = ref(false)
const error = ref('')

const currentUsers = computed(() => {
  if (mode.value === 'clients') {
    // Filter out internal users from the clients list
    return clientUsers.value.filter(u => !u.isInternal && !u.internalRole)
  }
  return internalUsers.value
})

watch(
  () => props.visible,
  async (val) => {
    if (!val) return
    error.value = ''
    // Force 'clients' mode for non-superadmins, they shouldn't manage internals
    mode.value = isSuperadmin.value ? (props.initialMode || 'clients') : 'clients'
    selectedWorkspaceId.value = props.initialWorkspaceId || ''
    wsSearch.value = ''
    selectedUserIds.value = []
    message.value = ''
    clientUsers.value = []
    internalUsers.value = []

    // Set loading flags immediately to "calm the user"
    isLoadingWorkspaces.value = true
    if (mode.value === 'clients' && selectedWorkspaceId.value) {
      isLoadingClientUsers.value = true
    } else if (mode.value === 'internal') {
      isLoadingInternalUsers.value = true
    }

    // Load necessary data in parallel
    const promises: Promise<any>[] = [loadWorkspaces()]

    if (mode.value === 'clients' && selectedWorkspaceId.value) {
      promises.push(loadClientUsers(selectedWorkspaceId.value))
    } else if (mode.value === 'internal') {
      promises.push(loadInternalAndSurveyData())
    }

    await Promise.all(promises)
  },
)

async function loadInternalAndSurveyData() {
  isLoadingInternalUsers.value = true
  try {
    // Fetch both the full team and the current survey state
    const [usersRes, surveyRes] = await Promise.all([
      surveyService.listInternalUsers(),
      surveyService.getSurvey(props.surveyId)
    ])
    
    internalUsers.value = usersRes.users
    
    // Pre-populate if we have authorizedSenders
    if (surveyRes.survey.authorizedSenders) {
      selectedUserIds.value = surveyRes.survey.authorizedSenders.map((s: any) => 
        typeof s === 'object' ? s._id : s
      )
    }
  } catch (err: any) {
    error.value = 'No se pudieron cargar los datos de asignación.'
  } finally {
    isLoadingInternalUsers.value = false
  }
}

async function loadWorkspaces(search = '') {
  isLoadingWorkspaces.value = true
  try {
    const res = await workspaceService.listWorkspaces({ search, limit: 12 })
    workspaces.value = res.workspaces
  } catch {
    error.value = 'No se pudieron cargar los entornos.'
  } finally {
    isLoadingWorkspaces.value = false
  }
}

// Debounced search watch
watch(wsSearch, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadWorkspaces(val)
  }, 400)
})

async function loadClientUsers(workspaceId: string) {
  if (!workspaceId) {
    clientUsers.value = []
    return
  }
  isLoadingClientUsers.value = true
  selectedUserIds.value = []
  try {
    const res = await workspaceService.listUsers(workspaceId)
    clientUsers.value = res.users
  } catch {
    error.value = 'No se pudieron cargar los usuarios.'
  } finally {
    isLoadingClientUsers.value = false
  }
}


watch(selectedWorkspaceId, async (id) => {
  if (props.visible && id) {
    await loadClientUsers(id)
  }
})

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    parent.classList.add('ws-card__avatar--fallback')
  }
}

async function switchMode(m: SendMode) {
  mode.value = m
  selectedUserIds.value = []
  error.value = ''
  if (m === 'internal') {
    await loadInternalAndSurveyData()
  }
}

function toggleUser(userId: string) {
  const idx = selectedUserIds.value.indexOf(userId)
  if (idx > -1) selectedUserIds.value.splice(idx, 1)
  else selectedUserIds.value.push(userId)
}

function selectAll() {
  selectedUserIds.value = currentUsers.value.map((u) => u._id)
}

function deselectAll() {
  selectedUserIds.value = []
}

async function handleAction() {
  error.value = ''

  if (mode.value === 'clients') {
    if (!selectedWorkspaceId.value || selectedUserIds.value.length === 0) {
      error.value = 'Selecciona un entorno y al menos un usuario.'
      return
    }
    isSending.value = true
    try {
      const result = await surveyService.sendSurvey(props.surveyId, {
        workspaceId: selectedWorkspaceId.value,
        userIds: selectedUserIds.value,
        message: message.value || undefined,
      })
      emit('sent', result)
      emit('close')
    } catch (err: any) {
      error.value = err?.message || 'Error al enviar la encuesta.'
    } finally {
      isSending.value = false
    }
  } else {
    // Assign internal users as authorized senders (they will send to clients)
    isSending.value = true
    try {
      await surveyService.assignInternalSenders(props.surveyId, selectedUserIds.value)
      emit('close')
    } catch (err: any) {
      error.value = err?.message || 'Error al asignar responsables.'
    } finally {
      isSending.value = false
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="survey-send-modal__backdrop" @click.self="emit('close')">
        <Transition name="modal-scale">
          <div v-if="visible" class="survey-send-modal">
            <div class="survey-send-modal__header">
              <div class="header-title">
                <div class="header-icon">
                  <i class="fa-solid fa-paper-plane" />
                </div>
                <h2>Enviar Encuesta</h2>
              </div>
              <button class="survey-send-modal__close" @click="emit('close')" aria-label="Cerrar">
                <i class="fa-solid fa-xmark" />
              </button>
            </div>

            <div class="survey-send-modal__body">
              <!-- Mode toggle (superadmin only) -->
              <div v-if="isSuperadmin" class="survey-send-modal__mode-toggle">
                <button
                  type="button"
                  class="survey-send-modal__mode-btn"
                  :class="{ 'survey-send-modal__mode-btn--active': mode === 'clients' }"
                  @click="switchMode('clients')"
                >
                  <i class="fa-solid fa-building" />
                  <span>Clientes</span>
                </button>
                <button
                  type="button"
                  class="survey-send-modal__mode-btn survey-send-modal__mode-btn--internal"
                  :class="{ 'survey-send-modal__mode-btn--active': mode === 'internal' }"
                  @click="switchMode('internal')"
                >
                  <i class="fa-solid fa-users-gear" />
                  <span>Equipo Interno</span>
                </button>
              </div>

              <Transition name="fade">
                <div v-if="error" class="survey-send-modal__error">
                  <i class="fa-solid fa-circle-exclamation" /> {{ error }}
                </div>
              </Transition>

              <!-- ── CLIENTS MODE ── -->
              <template v-if="mode === 'clients'">
                <div class="survey-send-modal__field">
                  <label class="survey-send-modal__label">Selecciona el Entorno</label>
                  <div v-if="isLoadingWorkspaces" class="survey-send-modal__loading-state">
                    <div class="spinner-small"></div>
                    <span>Cargando entornos...</span>
                  </div>
                  <template v-else>
                    <div class="survey-send-modal__search">
                      <i class="fa-solid fa-magnifying-glass" />
                      <input 
                        v-model="wsSearch" 
                        type="text" 
                        placeholder="Buscar entorno..."
                        class="survey-send-modal__search-input"
                      />
                    </div>
                    <div class="survey-send-modal__ws-grid">
                      <button
                        v-for="ws in filteredWorkspaces"
                        :key="ws._id"
                        type="button"
                        class="ws-card"
                        :class="{ 'ws-card--selected': selectedWorkspaceId === ws._id }"
                        @click="selectedWorkspaceId = ws._id"
                      >
                        <div class="ws-card__avatar">
                          <img
                            v-if="ws.metaAds?.pageId"
                            :src="`https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=normal`"
                            alt="Logo"
                            class="ws-card__img"
                            @error="handleImgError"
                          />
                          <span v-else>{{ ws.name.substring(0, 2).toUpperCase() }}</span>
                        </div>
                        <div class="ws-card__info">
                          <span class="ws-card__name">{{ ws.name }}</span>
                          <span class="ws-card__meta">Meta Ads Active</span>
                        </div>
                        <div class="ws-card__check">
                          <i class="fa-solid fa-circle-check" v-if="selectedWorkspaceId === ws._id" />
                          <i class="fa-regular fa-circle" v-else />
                        </div>
                      </button>

                      <!-- Empty State for Search -->
                      <div v-if="!isLoadingWorkspaces && filteredWorkspaces.length === 0" class="survey-send-modal__empty-search">
                        <div class="survey-send-modal__empty-icon">🔍</div>
                        <p>No se encontraron entornos que coincidan con "{{ wsSearch }}"</p>
                        <button type="button" class="btn btn-outline" @click="wsSearch = ''">
                          Limpiar búsqueda
                        </button>
                      </div>
                    </div>
                  </template>
                </div>

                <Transition name="fade-slide">
                  <div v-if="selectedWorkspaceId" class="survey-send-modal__field">
                    <div class="survey-send-modal__users-header">
                      <label class="survey-send-modal__label">Destinatarios</label>
                      <div class="survey-send-modal__select-actions">
                        <button type="button" class="survey-send-modal__link-btn" @click="selectAll">Todos</button>
                        <span class="separator">/</span>
                        <button type="button" class="survey-send-modal__link-btn" @click="deselectAll">Ninguno</button>
                      </div>
                    </div>
                    
                    <div class="users-container" :class="{ 'loading': isLoadingClientUsers }">
                      <div v-if="isLoadingClientUsers" class="survey-send-modal__loading">
                        <div class="spinner"></div>
                        <span>Cargando usuarios...</span>
                      </div>
                      <div v-else-if="clientUsers.length === 0" class="survey-send-modal__empty">
                        <i class="fa-solid fa-users-slash" />
                        <p>No hay usuarios en este entorno.</p>
                      </div>
                      <div v-else class="survey-send-modal__users-list">
                        <label
                          v-for="user in currentUsers"
                          :key="user._id"
                          class="survey-send-modal__user-item"
                          :class="{ 'survey-send-modal__user-item--selected': selectedUserIds.includes(user._id) }"
                        >
                          <div class="checkbox-wrapper">
                            <input type="checkbox" :checked="selectedUserIds.includes(user._id)" @change="toggleUser(user._id)" />
                            <span class="checkbox-custom"></span>
                          </div>
                          <div class="survey-send-modal__user-info">
                            <span class="survey-send-modal__user-name">{{ user.name || '—' }}</span>
                            <span class="survey-send-modal__user-email">{{ user.email }}</span>
                          </div>
                          <span class="status-badge status-badge--client">
                            Cliente Final
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Transition>
              </template>

              <!-- ── INTERNAL MODE: assign as responsible senders ── -->
              <template v-else>
                <div class="internal-notice">
                  <div class="internal-notice__icon">
                    <i class="fa-solid fa-user-shield" />
                  </div>
                  <div class="internal-notice__content">
                    <strong>Gestión de Responsables</strong>
                    <p>Asigna colaboradores internos para que puedan distribuir esta encuesta a sus propios clientes.</p>
                  </div>
                </div>

                <div class="survey-send-modal__field">
                  <div class="survey-send-modal__users-header">
                    <label class="survey-send-modal__label">Equipo Disponible</label>
                    <div class="survey-send-modal__select-actions">
                      <button type="button" class="survey-send-modal__link-btn" @click="selectAll">Todos</button>
                      <span class="separator">/</span>
                      <button type="button" class="survey-send-modal__link-btn" @click="deselectAll">Ninguno</button>
                    </div>
                  </div>

                  <div class="users-container" :class="{ 'loading': isLoadingInternalUsers }">
                    <div v-if="isLoadingInternalUsers" class="survey-send-modal__loading">
                      <div class="spinner"></div>
                      <span>Cargando equipo...</span>
                    </div>
                    <div v-else-if="internalUsers.length === 0" class="survey-send-modal__empty">
                      <i class="fa-solid fa-user-xmark" />
                      <p>No hay colaboradores internos activos.</p>
                    </div>
                    <div v-else class="survey-send-modal__users-list">
                      <label
                        v-for="user in internalUsers"
                        :key="user._id"
                        class="survey-send-modal__user-item survey-send-modal__user-item--internal"
                        :class="{ 'survey-send-modal__user-item--selected': selectedUserIds.includes(user._id) }"
                      >
                        <div class="checkbox-wrapper">
                          <input type="checkbox" :checked="selectedUserIds.includes(user._id)" @change="toggleUser(user._id)" />
                          <span class="checkbox-custom"></span>
                        </div>
                        <div class="survey-send-modal__user-avatar">
                          {{ (user.name || user.email).charAt(0).toUpperCase() }}
                        </div>
                        <div class="survey-send-modal__user-info">
                          <span class="survey-send-modal__user-name">{{ user.name || '—' }}</span>
                          <span class="survey-send-modal__user-email">{{ user.email }}</span>
                        </div>
                        <span v-if="selectedUserIds.includes(user._id)" class="status-badge">
                          Responsable
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Optional message -->
              <Transition name="fade-slide">
                <div v-if="mode === 'clients'" class="survey-send-modal__field">
                  <label class="survey-send-modal__label">Mensaje personalizado (opcional)</label>
                  <div class="textarea-wrapper">
                    <textarea
                      v-model="message"
                      class="survey-send-modal__textarea"
                      rows="3"
                      placeholder="Escribe un mensaje para los clientes..."
                    />
                  </div>
                </div>
              </Transition>
            </div>

            <div class="survey-send-modal__footer">
              <button class="btn-cancel" @click="emit('close')">Cancelar</button>

              <button
                v-if="mode === 'clients'"
                class="btn-primary"
                :disabled="isSending || selectedUserIds.length === 0"
                @click="handleAction"
              >
                <div v-if="isSending" class="spinner-small"></div>
                <i v-else class="fa-solid fa-paper-plane" />
                <span>{{ isSending ? 'Enviando...' : `Enviar a ${selectedUserIds.length} cliente(s)` }}</span>
              </button>

              <button
                v-else
                class="btn-primary btn-primary--internal"
                :disabled="isSending"
                @click="handleAction"
              >
                <div v-if="isSending" class="spinner-small"></div>
                <i v-else class="fa-solid fa-user-check" />
                <span>
                  {{ isSending ? 'Guardando...' : selectedUserIds.length > 0 ? `Asignar ${selectedUserIds.length} responsables` : 'Limpiar responsables' }}
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.survey-send-modal {
  &__backdrop {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1.5rem;
  }

  background: $white;
  border-radius: 24px;
  width: 100%;
  max-width: 540px;
  max-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba($primary-dark, 0.25);
  border: 1px solid rgba($primary-dark, 0.05);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    background: rgba($primary-light, 0.4);
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      background: $white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      font-size: 1.2rem;
      box-shadow: 0 4px 6px -1px rgba($primary-dark, 0.05);
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: $primary-dark;
      margin: 0;
    }
  }

  &__close {
    width: 36px;
    height: 36px;
    border: none;
    background: rgba($primary-dark, 0.04);
    border-radius: 10px;
    cursor: pointer;
    color: $primary-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: rgba($alert-error, 0.1);
      color: $alert-error;
      transform: rotate(90deg);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba($primary-dark, 0.1);
      border-radius: 10px;
    }
  }

  &__mode-toggle {
    display: flex;
    gap: 0.5rem;
    padding: 0.4rem;
    background: rgba($primary-dark, 0.04);
    border-radius: 16px;
    border: 1px solid rgba($primary-dark, 0.05);
  }

  &__mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 700;
    color: $text-secondary;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    i { font-size: 0.95rem; opacity: 0.7; }

    &:hover:not(&--active) {
      background: rgba($white, 0.8);
      color: $primary-dark;
    }

    &--active {
      background: $white;
      color: $primary;
      box-shadow: 0 4px 12px rgba($primary-dark, 0.08);
      
      i { opacity: 1; }
    }

    &--internal.survey-send-modal__mode-btn--active {
      color: $secondary;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__label {
    font-size: 0.8rem;
    font-weight: 800;
    color: $primary-dark;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-left: 0.2rem;
  }

  .select-wrapper, .textarea-wrapper {
    position: relative;
    border-radius: 14px;
    background: $white;
    transition: all 0.2s ease;

    &:focus-within {
      transform: translateY(-1px);
    }
  }

  &__select, &__textarea {
    width: 100%;
    padding: 0.85rem 1.1rem;
    border: 2px solid rgba($primary-dark, 0.08);
    border-radius: 14px;
    font-size: 0.95rem;
    font-weight: 500;
    color: $primary-dark;
    background: transparent;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
      border-color: $primary;
      background: $white;
      box-shadow: 0 0 0 4px rgba($primary, 0.05);
    }

    &:disabled {
      background: rgba($primary-light, 0.5);
      cursor: not-allowed;
      border-color: rgba($primary-dark, 0.04);
    }
  }

  .ws-card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.06);
    border-radius: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    width: 100%;

    &:hover {
      border-color: rgba($primary, 0.3);
      background: rgba($primary, 0.01);
      transform: translateY(-2px);
    }

    &--selected {
      border-color: $primary;
      background: rgba($primary, 0.04);
      box-shadow: 0 4px 12px rgba($primary, 0.12);
    }

    &__avatar {
      width: 38px;
      height: 38px;
      background: rgba($primary, 0.08);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.8rem;
      color: $primary;
      flex-shrink: 0;
      overflow: hidden;
      border: 1px solid rgba($primary-dark, 0.05);

      &--fallback {
        background: rgba($primary-dark, 0.05);
        color: rgba($primary-dark, 0.4);
      }
    }

    &__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    &__name {
      font-size: 0.85rem;
      font-weight: 700;
      color: $primary-dark;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__meta {
      font-size: 0.65rem;
      font-weight: 600;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    &__check {
      font-size: 0.9rem;
      color: rgba($primary-dark, 0.15);
      
      .ws-card--selected & {
        color: $primary;
      }
    }
  }

  &__select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23191423'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1.2rem center;
    background-size: 1rem;
    padding-right: 3rem;
  }

  &__textarea {
    resize: none;
    min-height: 100px;
  }

  &__search {
    position: relative;
    margin-bottom: 0.75rem;

    i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: $text-secondary;
      font-size: 0.9rem;
      pointer-events: none;
    }
  }

  &__search-input {
    width: 100%;
    padding: 0.7rem 1rem 0.7rem 2.5rem;
    background: rgba($primary-dark, 0.04);
    border: 1.5px solid rgba($primary-dark, 0.05);
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
    transition: all 0.2s ease;

    &:focus {
      background: $white;
      border-color: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.05);
      outline: none;
    }

    &::placeholder {
      color: rgba($primary-dark, 0.3);
      font-weight: 500;
    }
  }

  &__loading-state {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba($primary-dark, 0.03);
    border-radius: 12px;
    color: $text-secondary;
    font-size: 0.85rem;
    font-weight: 600;
  }

  &__ws-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 0.5rem;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba($primary-dark, 0.1); border-radius: 10px; }

    @media (min-width: 480px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__users-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.2rem;
  }

  &__select-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;

    .separator { color: rgba($primary-dark, 0.2); }
  }

  &__link-btn {
    background: none;
    border: none;
    color: $primary;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s;

    &:hover { opacity: 0.7; }
  }

  .users-container {
    border: 2px solid rgba($primary-dark, 0.08);
    border-radius: 16px;
    padding: 0.75rem;
    background: rgba($primary-light, 0.2);
    min-height: 120px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;

    &.loading { opacity: 0.6; }
  }

  &__users-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 0.5rem;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba($primary-dark, 0.1); border-radius: 10px; }
  }

  &__user-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    background: $white;
    border-radius: 12px;
    border: 1px solid rgba($primary-dark, 0.03);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($primary-light, 0.3);
      border-color: rgba($primary, 0.1);
      transform: translateX(4px);
    }

    &--selected {
      background: rgba($primary, 0.04);
      border-color: rgba($primary, 0.2);
    }

    .checkbox-wrapper {
      position: relative;
      width: 20px;
      height: 20px;
      flex-shrink: 0;

      input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        width: 100%;
        height: 100%;
        margin: 0;
        z-index: 2;

        &:checked ~ .checkbox-custom {
          background: $primary;
          border-color: $primary;

          &::after { display: block; }
        }
      }

      .checkbox-custom {
        position: absolute;
        inset: 0;
        background: $white;
        border: 2px solid rgba($primary-dark, 0.15);
        border-radius: 6px;
        transition: all 0.2s ease;

        &::after {
          content: "";
          position: absolute;
          display: none;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      }
    }
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
    min-width: 0;
  }

  &__user-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-email {
    font-size: 0.75rem;
    color: $text-secondary;
    font-weight: 500;
  }

  &__user-avatar {
    width: 32px;
    height: 32px;
    background: $primary;
    color: $white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.9rem;
  }

  &__empty-search {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    border: 1px dashed rgba(255, 255, 255, 0.1);

    p {
      margin: 1rem 0 1.5rem;
      font-size: 0.95rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }
  }

  &__empty-icon {
    font-size: 2.5rem;
    opacity: 0.5;
  }

  .status-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    background: rgba($secondary, 0.1);
    color: $secondary;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &--client {
      background: rgba($primary, 0.08);
      color: $primary;
    }
  }

  .internal-notice {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba($secondary, 0.06);
    border-radius: 16px;
    border: 1px solid rgba($secondary, 0.15);

    &__icon {
      width: 44px;
      height: 44px;
      background: $white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $secondary;
      font-size: 1.25rem;
      flex-shrink: 0;
      box-shadow: 0 4px 6px rgba($secondary, 0.05);
    }

    &__content {
      strong { display: block; color: $secondary; font-size: 0.95rem; margin-bottom: 0.25rem; }
      p { margin: 0; font-size: 0.85rem; color: darken($secondary, 15%); line-height: 1.5; font-weight: 500; }
    }
  }

  &__loading, &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem 0;
    color: $text-secondary;
    text-align: center;

    i { font-size: 2rem; opacity: 0.2; }
    p { margin: 0; font-size: 0.9rem; font-weight: 600; }
  }

  &__footer {
    display: flex;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: rgba($primary-light, 0.4);
    border-top: 1px solid rgba($primary-dark, 0.05);

    @media (max-width: 480px) {
      flex-direction: column-reverse;
      gap: 0.75rem;

      button { width: 100%; }
    }
  }

  .btn-cancel {
    padding: 0.85rem 1.5rem;
    border: 2px solid rgba($primary-dark, 0.08);
    border-radius: 14px;
    background: $white;
    color: $primary-dark;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba($primary-dark, 0.02);
      border-color: rgba($primary-dark, 0.2);
    }
  }

  .btn-primary {
    flex: 1;
    padding: 0.85rem 1.5rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba($primary, 0.2);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba($primary, 0.3);
      filter: brightness(1.1);
    }

    &:active { transform: translateY(0); }

    &:disabled {
      background: rgba($primary-dark, 0.3);
      box-shadow: none;
      cursor: not-allowed;
      opacity: 0.8;
    }

    &--internal {
      background: $secondary;
      box-shadow: 0 4px 12px rgba($secondary, 0.2);
      &:hover:not(:disabled) { box-shadow: 0 8px 20px rgba($secondary, 0.3); }
    }
  }

  &__error {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
    padding: 0.8rem 1.25rem;
    border-radius: 12px;
    border: 1px solid rgba($alert-error, 0.15);
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
}

.spinner, .spinner-small {
  border: 3px solid rgba($primary-dark, 0.1);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner { width: 32px; height: 32px; margin-bottom: 0.5rem; }
.spinner-small { width: 18px; height: 18px; border-width: 2.5px; border-top-color: $white; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
}

// ── Transitions ──────────────────────────────────────────────
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active, .modal-scale-leave-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
