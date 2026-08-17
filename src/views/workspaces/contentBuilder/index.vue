<template>
  <!-- Gated on hasLoaded, not on `loading`: AppLayout remounts this view on
       every navigation, and a bare `loading` check would show the skeleton
       forever. -->
  <BuilderSkeleton v-if="!builder.hasLoaded.value" />

  <div v-else class="cb">
    <BuilderHero
      :workspace-name="builder.workspace.value?.name"
      :workspace-id="workspaceId"
      :avatar="workspaceAvatar"
      :total-scripts="builder.totalScripts.value"
      :total-linked-reels="builder.totalLinkedReels.value"
      :total-views="builder.totalViews.value"
      :total-ad-spend="builder.totalAdSpend.value"
      @open-wizard="showWizard = true"
      @new-script="openItemModal(null)"
    />

    <nav class="cb__tabs">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        :class="['cb__tab', { 'is-active': activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon" /> {{ tab.label }}
      </button>
    </nav>

    <main class="cb__content">
      <ScriptMatrixTab
        v-if="activeTab === 'matrix'"
        :items="builder.items.value"
        :journey-cases="builder.journeyCases.value"
        @link-reel="openReelModal"
        @edit-item="openItemModal"
      />

      <JourneyTab
        v-else-if="activeTab === 'journey'"
        :profile="builder.profile.value"
        @open-wizard="showWizard = true"
        @add-case="openNewCase"
        @edit-case="openEditCase"
      />

      <ScriptPerformanceSection
        v-else-if="activeTab === 'performance'"
        :workspace-id="workspaceId"
        :items="builder.items.value"
        @go-link="goLinkReels"
      />

      <AgentFeedTab
        v-else
        :workspace-id="workspaceId"
        :workspace-name="builder.workspace.value?.name"
        :profile="builder.profile.value"
        :total-scripts="builder.totalScripts.value"
        :total-linked-reels="builder.totalLinkedReels.value"
        :total-views="builder.totalViews.value"
        :total-ad-spend="builder.totalAdSpend.value"
      />
    </main>

    <VideoReelLinkModal
      :show="showReelModal"
      :planning-id="selectedItemForReel?.planningId || ''"
      :workspace-id="workspaceId"
      :item="selectedItemForReel"
      :customer-journey-cases="builder.journeyCases.value"
      :all-items="builder.items.value"
      @close="showReelModal = false"
      @linked="builder.applyLinkedReel"
    />

    <VideoPlanningItemModal
      :show="showItemModal"
      :item="editingItem"
      :is-saving="builder.isSavingItem.value"
      :locked="false"
      :workspace-id="workspaceId"
      :has-brand-profile="true"
      :brand-profile="builder.profile.value"
      :all-items="builder.items.value"
      @close="showItemModal = false"
      @save="handleSaveItem"
    />

    <JourneyCaseModal
      :show="showCaseModal"
      :caso="editingCase"
      :next-number="builder.nextCaseNumber.value"
      :saving="builder.savingCase.value"
      @close="showCaseModal = false"
      @save="handleCaseSave"
      @delete="handleCaseDelete"
    />

    <BrandStrategyWizardModal
      :show="showWizard"
      :profile="builder.profile.value"
      :is-saving="builder.isSavingProfile.value"
      @close="showWizard = false"
      @finish="handleWizardFinish"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getWorkspaceImage } from '@/utils/workspaceImage'
import VideoReelLinkModal from '@/components/videoPlanning/VideoReelLinkModal.vue'
import VideoPlanningItemModal from '@/components/videoPlanning/VideoPlanningItemModal.vue'
import BrandStrategyWizardModal from '@/components/brandProfile/BrandStrategyWizardModal.vue'
import JourneyCaseModal from '@/components/brandProfile/JourneyCaseModal.vue'
import ScriptPerformanceSection from '@/components/scriptPerformance/ScriptPerformanceSection.vue'
import BuilderHero from './components/BuilderHero.vue'
import BuilderSkeleton from './components/BuilderSkeleton.vue'
import ScriptMatrixTab from './components/ScriptMatrixTab.vue'
import JourneyTab from './components/JourneyTab.vue'
import AgentFeedTab from './components/AgentFeedTab.vue'
import { useContentBuilder, type WizardPayload } from './useContentBuilder'
import { isLinked } from '@/utils/videoLink'
import type { CustomerJourneyCase } from '@/types'
import type { WorkspaceVideoItem, CreateVideoItemPayload } from '@/types/videoPlanning'

type TabId = 'matrix' | 'journey' | 'performance' | 'agent-feed'

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'matrix', label: 'Matriz de Guiones & Videos', icon: 'fa-solid fa-table-cells' },
  { id: 'journey', label: 'Customer Journey & Estrategia', icon: 'fa-solid fa-route' },
  { id: 'performance', label: 'Qué Guiones Funcionan', icon: 'fa-solid fa-chart-simple' },
  { id: 'agent-feed', label: 'Feed para Agente IA', icon: 'fa-solid fa-robot' },
]

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)

const builder = useContentBuilder(workspaceId)

const TAB_IDS = TABS.map((t) => t.id)

/** `?tab=journey` lets other screens send the user straight to the right place. */
const initialTab = TAB_IDS.includes(route.query.tab as TabId)
  ? (route.query.tab as TabId)
  : 'matrix'

const activeTab = ref<TabId>(initialTab)
const workspaceAvatar = computed(() => getWorkspaceImage(builder.workspace.value))

// ── Modals ────────────────────────────────────────────────────────────────
const showWizard = ref(false)
const showReelModal = ref(false)
const showItemModal = ref(false)
const showCaseModal = ref(false)

const selectedItemForReel = ref<WorkspaceVideoItem | null>(null)
const editingItem = ref<WorkspaceVideoItem | null>(null)
const editingCase = ref<CustomerJourneyCase | null>(null)

function openReelModal(item: WorkspaceVideoItem) {
  selectedItemForReel.value = item
  showReelModal.value = true
}

function openItemModal(item: WorkspaceVideoItem | null) {
  editingItem.value = item
  showItemModal.value = true
}

/**
 * From the empty performance panel straight into the action that fills it:
 * the matrix, with the linking modal already open on the first script that
 * still has no reel.
 */
function goLinkReels() {
  activeTab.value = 'matrix'
  const pending = builder.items.value.find((i) => !isLinked(i))
  if (pending) openReelModal(pending)
}

function openNewCase() {
  editingCase.value = null
  showCaseModal.value = true
}

function openEditCase(caso: CustomerJourneyCase) {
  editingCase.value = caso
  showCaseModal.value = true
}

// ── Handlers ──────────────────────────────────────────────────────────────
async function handleSaveItem(payload: CreateVideoItemPayload) {
  if (!editingItem.value) return
  const ok = await builder.saveItem(editingItem.value, payload)
  if (ok) showItemModal.value = false
}

async function handleCaseSave(caso: CustomerJourneyCase) {
  const ok = await builder.saveCase(caso)
  if (ok) showCaseModal.value = false
}

async function handleCaseDelete(casoNumero: number) {
  const ok = await builder.deleteCase(casoNumero)
  if (ok) showCaseModal.value = false
}

async function handleWizardFinish(data: WizardPayload) {
  const ok = await builder.saveWizard(data)
  if (ok) showWizard.value = false
}
</script>

<style scoped lang="scss">
.cb {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  min-width: 0;
  padding: 1.5rem;
}

.cb__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid rgba($primary-dark, 0.06);
}

.cb__tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: $text-secondary;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { color: $primary-dark; background: rgba($primary-dark, 0.03); }

  &.is-active { color: $secondary; background: $overlay-purple; }
}

.cb__content {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}
</style>
