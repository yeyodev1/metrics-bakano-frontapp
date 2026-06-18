<script setup lang="ts">
import { ref } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
import type { Workspace, WorkspaceUser, ApiError } from '@/types'
import WizardStep1 from './WizardStep1.vue'
import WizardStep2 from './WizardStep2.vue'
import WizardStep3 from './WizardStep3.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', ws: Workspace): void
}>()

const toast = useToast()

const newWorkspaceName = ref('')
const workspaceError = ref('')
const createWizardStep = ref(1)

const wizardSelectedInternal = ref<WorkspaceUser[]>([])
const wizardClientMode = ref<'new' | 'existing'>('new')
const wizardSelectedExistingClient = ref<WorkspaceUser | null>(null)
const wizardNewClient = ref({ name: '', email: '', password: '', sendWelcomeEmail: true })
const wizardSendBrandProfileInvite = ref(true)
const isSavingWorkspace = ref(false)

function wizardToggleInternal(user: WorkspaceUser): void {
  const idx = wizardSelectedInternal.value.findIndex(u => u._id === user._id)
  if (idx >= 0) {
    wizardSelectedInternal.value.splice(idx, 1)
  } else {
    wizardSelectedInternal.value.push(user)
  }
}

async function wizardNextStep(): Promise<void> {
  workspaceError.value = ''
  if (createWizardStep.value === 1) {
    if (!newWorkspaceName.value.trim()) {
      workspaceError.value = 'El nombre del entorno es requerido.'
      return
    }
    createWizardStep.value = 2
  } else if (createWizardStep.value === 2) {
    if (wizardSelectedInternal.value.length === 0) {
      workspaceError.value = 'Debes asignar al menos un miembro del equipo interno.'
      return
    }
    createWizardStep.value = 3
  }
}

async function handleCreateWorkspace(): Promise<void> {
  workspaceError.value = ''
  if (wizardClientMode.value === 'new') {
    if (!wizardNewClient.value.email.trim() || !wizardNewClient.value.password.trim()) {
      workspaceError.value = 'El email y contraseña del cliente son requeridos.'
      return
    }
    if (wizardNewClient.value.password.length < 8) {
      workspaceError.value = 'La contraseña debe tener al menos 8 caracteres.'
      return
    }
  } else if (!wizardSelectedExistingClient.value) {
    workspaceError.value = 'Selecciona un cliente existente o crea uno nuevo.'
    return
  }

  isSavingWorkspace.value = true
  try {
    const { workspace } = await workspaceService.createWorkspace(newWorkspaceName.value.trim())
    const newWsId = workspace._id

    await Promise.allSettled(
      wizardSelectedInternal.value.map(u =>
        workspaceService.createGlobalUser({
          email: u.email,
          workspaces: [{ workspaceId: newWsId, role: 'colaborador' }],
        })
      )
    )

    if (wizardClientMode.value === 'new') {
      await workspaceService.createUser(newWsId, {
        name: wizardNewClient.value.name,
        email: wizardNewClient.value.email,
        password: wizardNewClient.value.password,
        role: 'admin',
        sendWelcomeEmail: wizardNewClient.value.sendWelcomeEmail,
      } as any)
    } else if (wizardSelectedExistingClient.value) {
      await workspaceService.createGlobalUser({
        email: wizardSelectedExistingClient.value.email,
        workspaces: [{ workspaceId: newWsId, role: 'admin' }],
      })
    }

    if (wizardSendBrandProfileInvite.value) {
      workspaceService.sendBrandProfileInvite(newWsId).catch(() => {})
    }

    toast.success(`Entorno "${workspace.name}" creado con éxito.`)
    emit('created', workspace)
    resetWizard()
  } catch (err: unknown) {
    const e = err as ApiError
    if (e.status === 409) {
      workspaceError.value = 'Ya existe un entorno con ese nombre.'
      createWizardStep.value = 1
    } else {
      toast.error('Ocurrió un error al crear el entorno.')
    }
  } finally {
    isSavingWorkspace.value = false
  }
}

function resetWizard() {
  newWorkspaceName.value = ''
  workspaceError.value = ''
  createWizardStep.value = 1
  wizardSelectedInternal.value = []
  wizardClientMode.value = 'new'
  wizardSelectedExistingClient.value = null
  wizardNewClient.value = { name: '', email: '', password: '', sendWelcomeEmail: true }
  wizardSendBrandProfileInvite.value = true
}

function closeWizard() {
  resetWizard()
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="superadmin-dashboard__overlay" @click.self="closeWizard">
      <div class="superadmin-dashboard__modal superadmin-dashboard__modal--wizard">
        <!-- Header -->
        <div class="superadmin-dashboard__modal-header">
          <div>
            <h3>Nuevo Entorno</h3>
            <p class="superadmin-dashboard__wizard-subtitle">Paso {{ createWizardStep }} de 3</p>
          </div>
          <button class="superadmin-dashboard__close-btn" @click="closeWizard">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Step indicator -->
        <div class="superadmin-dashboard__wizard-steps">
          <template v-for="n in 3" :key="n">
            <div :class="['superadmin-dashboard__wizard-step', { 'is-active': createWizardStep === n, 'is-done': createWizardStep > n }]">
              <span class="superadmin-dashboard__wizard-step-dot">
                <i v-if="createWizardStep > n" class="fa-solid fa-check" />
                <span v-else>{{ n }}</span>
              </span>
              <span class="superadmin-dashboard__wizard-step-label">{{ n === 1 ? 'Nombre' : n === 2 ? 'Equipo' : 'Cliente' }}</span>
            </div>
            <div v-if="n < 3" class="superadmin-dashboard__wizard-step-line" :class="{ 'is-done': createWizardStep > n }" />
          </template>
        </div>

        <!-- Step bodies -->
        <Transition name="wiz-slide" mode="out-in">
          <WizardStep1
            v-if="createWizardStep === 1"
            v-model="newWorkspaceName"
            @next="wizardNextStep"
            @cancel="closeWizard"
          />
          <WizardStep2
            v-else-if="createWizardStep === 2"
            :selected-internal="wizardSelectedInternal"
            @toggle-internal="wizardToggleInternal"
            @next="wizardNextStep"
            @back="createWizardStep = 1"
          />
          <WizardStep3
            v-else
            v-model:client-mode="wizardClientMode"
            v-model:selected-existing-client="wizardSelectedExistingClient"
            v-model:send-brand-profile-invite="wizardSendBrandProfileInvite"
            :new-client="wizardNewClient"
            :is-saving="isSavingWorkspace"
            @submit="handleCreateWorkspace"
            @back="createWizardStep = 2"
          />
        </Transition>
        <p v-if="workspaceError" class="superadmin-dashboard__error" style="padding: 0 1.5rem 1rem;">{{ workspaceError }}</p>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__modal--wizard {
  width: 560px;
  max-width: 96vw;
}

.superadmin-dashboard__wizard-subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: $text-secondary;
  font-weight: 400;
}

.superadmin-dashboard__wizard-steps {
  display: flex;
  align-items: center;
  padding: 0 1.5rem 1.25rem;
  border-bottom: 1px solid rgba($primary-dark, 0.06);
  margin-bottom: 1.25rem;
}

.superadmin-dashboard__wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: $text-secondary;
  flex-shrink: 0;
  width: 64px;

  &.is-active {
    color: #a855f7;
    font-weight: 700;
    .superadmin-dashboard__wizard-step-dot {
      background: #a855f7;
      color: $white;
      box-shadow: 0 0 0 4px rgba(#a855f7, 0.15);
    }
  }

  &.is-done {
    color: #16a34a;
    .superadmin-dashboard__wizard-step-dot { background: #22c55e; color: $white; }
    .superadmin-dashboard__wizard-step-label { color: #16a34a; }
  }
}

.superadmin-dashboard__wizard-step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba($primary-dark, 0.08);
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.superadmin-dashboard__wizard-step-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  transition: color 0.25s;
}

.superadmin-dashboard__wizard-step-line {
  flex: 1;
  height: 2px;
  background: rgba($primary-dark, 0.1);
  margin: 0 0.25rem;
  margin-bottom: 1.1rem;
  border-radius: 99px;
  transition: background 0.35s ease;

  &.is-done { background: #22c55e; }
}

.wiz-slide-enter-active,
.wiz-slide-leave-active { transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.wiz-slide-enter-from { opacity: 0; transform: translateX(18px); }
.wiz-slide-leave-to  { opacity: 0; transform: translateX(-18px); }

.superadmin-dashboard__error {
  color: $alert-error;
  font-size: 0.85rem;
  margin: 0;
}
</style>
