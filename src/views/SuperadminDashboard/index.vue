<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'
import GlobalUserModal from '@/components/common/GlobalUserModal.vue'

// Modular subcomponents
import DashboardTopBar from './components/DashboardTopBar.vue'
import DashboardTabsNavigation from './components/DashboardTabsNavigation.vue'
import WorkspacesTab from './components/WorkspacesTab.vue'
import AccountAdminsTab from './components/AccountAdminsTab.vue'
import TraffickersTab from './components/TraffickersTab.vue'
import SuperadminsTab from './components/SuperadminsTab.vue'
import PlanningTab from './components/PlanningTab.vue'
import SurveysTab from './components/SurveysTab.vue'
import CreateWorkspaceWizardModal from './components/CreateWorkspaceWizardModal.vue'

// Refs to children tabs
const workspacesTabRef = ref<InstanceType<typeof WorkspacesTab> | null>(null)
const superadminsTabRef = ref<InstanceType<typeof SuperadminsTab> | null>(null)

const activeTab = ref<'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys' | 'traffickers'>('workspaces')
const showCreateWorkspace = ref(false)
const traffickersCount = ref(0)

const selectedWorkspace = computed(() => {
  return workspacesTabRef.value?.selectedWorkspace || null
})

async function fetchTraffickersCount(): Promise<void> {
  try {
    const { users } = await workspaceService.listAllCollaborators()
    traffickersCount.value = users.filter((u: any) => u.internalRole === 'trafficker').length
  } catch {
    // Fail silently
  }
}

function openCreateSuperadmin(): void {
  superadminsTabRef.value?.openCreate()
}

function onWorkspaceCreated(workspace: Workspace) {
  showCreateWorkspace.value = false
  workspacesTabRef.value?.onCreated(workspace)
  fetchTraffickersCount()
}

function switchTab(tab: 'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys' | 'traffickers'): void {
  activeTab.value = tab
}

onMounted(() => {
  fetchTraffickersCount()
})
</script>

<template>
  <div class="superadmin-dashboard">
    <!-- Top bar and Navigation via components -->
    <DashboardTopBar 
      :active-tab="activeTab" 
      :selected-workspace="selectedWorkspace"
      @create-workspace="showCreateWorkspace = true"
      @create-superadmin="openCreateSuperadmin"
    />

    <DashboardTabsNavigation
      :active-tab="activeTab"
      :traffickers-count="traffickersCount"
      @switch-tab="switchTab"
    />

    <!-- Content: Workspaces Tab -->
    <WorkspacesTab
      v-if="activeTab === 'workspaces'"
      ref="workspacesTabRef"
      @open-create-workspace="showCreateWorkspace = true"
    />

    <!-- Content: Account Admins Tab -->
    <AccountAdminsTab
      v-if="activeTab === 'account-admins'"
    />

    <!-- Content: Traffickers Tab -->
    <TraffickersTab
      v-if="activeTab === 'traffickers'"
      @refresh-count="fetchTraffickersCount"
    />

    <!-- Content: Superadmins Tab -->
    <SuperadminsTab
      v-if="activeTab === 'superadmins'"
      ref="superadminsTabRef"
    />

    <!-- Content: Planning Tab -->
    <PlanningTab
      v-if="activeTab === 'planning'"
    />

    <!-- Content: Surveys Tab -->
    <SurveysTab
      v-if="activeTab === 'surveys'"
    />

    <!-- Modals -->
    <CreateWorkspaceWizardModal
      :show="showCreateWorkspace"
      @close="showCreateWorkspace = false"
      @created="onWorkspaceCreated"
    />

    <GlobalUserModal />
  </div>
</template>

<style lang="scss">
.superadmin-dashboard {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s;

    .superadmin-dashboard__modal {
      transition: transform 0.3s;
    }
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;

    .superadmin-dashboard__modal {
      transform: scale(0.95);
    }
  }
}
</style>
