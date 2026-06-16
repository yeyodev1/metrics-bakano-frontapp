<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import type { WorkspaceUser } from '@/types'

import TeamHeader from './components/TeamHeader.vue'
import TeamVideos from './components/TeamVideos.vue'
import TeamGrid from './components/TeamGrid.vue'
import ProfileModal from './components/ProfileModal.vue'
import EvaluateModal from './components/EvaluateModal.vue'

const route = useRoute()
const workspaceId = route.params.workspaceId as string

const loading = ref(true)
const members = ref<WorkspaceUser[]>([])
const errorMsg = ref('')

const showProfileModal = ref(false)
const selectedMemberProfile = ref<WorkspaceUser | null>(null)

const showEvaluateModal = ref(false)
const selectedMemberToEvaluate = ref<WorkspaceUser | null>(null)

const openProfileModal = (member: WorkspaceUser) => {
  selectedMemberProfile.value = member
  showProfileModal.value = true
}

const closeProfileModal = () => {
  showProfileModal.value = false
  setTimeout(() => {
    selectedMemberProfile.value = null
  }, 300)
}

const openEvaluateModal = (member: WorkspaceUser) => {
  selectedMemberToEvaluate.value = member
  showEvaluateModal.value = true
}

const closeEvaluateModal = () => {
  showEvaluateModal.value = false
  setTimeout(() => {
    selectedMemberToEvaluate.value = null
  }, 300)
}

const handleEvaluationSubmit = (data: { rating: number; feedback: string }) => {
  // Implementación futura del endpoint de evaluación
  console.log('Evaluando a:', selectedMemberToEvaluate.value?.name, data)
  alert(`Evaluación de ${selectedMemberToEvaluate.value?.name} enviada con éxito. ¡Gracias por tu feedback!`)
  closeEvaluateModal()
}

// Extrae las URLs únicas de presentación
const uniqueVideos = computed(() => {
  const videos = new Set<string>()
  members.value.forEach(m => {
    if (m.presentationVideoUrl) {
      videos.add(m.presentationVideoUrl)
    }
  })
  return Array.from(videos)
})

interface GroupedMembers {
  groupName: string;
  icon: string;
  members: WorkspaceUser[];
}

const groupedTeam = computed(() => {
  const groups = {
    liderazgo: { groupName: 'Dirección y Estrategia', icon: 'fa-solid fa-star', members: [] as WorkspaceUser[] },
    cuentas: { groupName: 'Gestión y Cuentas', icon: 'fa-solid fa-bullseye', members: [] as WorkspaceUser[] },
    contenido: { groupName: 'Contenido y Redes', icon: 'fa-solid fa-pen-nib', members: [] as WorkspaceUser[] },
    produccion: { groupName: 'Diseño y Producción', icon: 'fa-solid fa-palette', members: [] as WorkspaceUser[] },
    growth: { groupName: 'Growth y Data', icon: 'fa-solid fa-rocket', members: [] as WorkspaceUser[] },
    otros: { groupName: 'Equipo Designado', icon: 'fa-solid fa-users', members: [] as WorkspaceUser[] },
  }

  members.value.forEach(m => {
    const r = m.internalRole
    if (r === 'director' || r === 'estratega') groups.liderazgo.members.push(m)
    else if (r === 'project_manager' || r === 'account_manager') groups.cuentas.members.push(m)
    else if (r === 'content_manager' || r === 'community_manager' || r === 'copywriter') groups.contenido.members.push(m)
    else if (r === 'editor' || r === 'disenador' || r === 'productor' || r === 'asistente_produccion') groups.produccion.members.push(m)
    else if (r === 'trafficker' || r === 'analista' || r === 'desarrollador') groups.growth.members.push(m)
    else groups.otros.members.push(m)
  })

  return Object.values(groups).filter(g => g.members.length > 0)
})

onMounted(async () => {
  try {
    const res = await workspaceService.getTeam(workspaceId)
    if (res && res.data) {
      members.value = res.data.members
    }
  } catch (e: any) {
    errorMsg.value = 'No se pudo cargar la información del equipo.'
    console.error('Error fetching team:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="team-awwwards">
    <div v-if="loading" class="team-awwwards__loading">
      <div class="spinner"></div>
      <p>Cargando a tu equipo estelar...</p>
    </div>
    
    <div v-else-if="errorMsg" class="team-awwwards__error">
      {{ errorMsg }}
    </div>
    
    <div v-else class="team-awwwards__content">
      <TeamHeader />

      <TeamVideos :uniqueVideos="uniqueVideos" />

      <TeamGrid 
        :groupedTeam="groupedTeam" 
        @view-profile="openProfileModal"
        @evaluate="openEvaluateModal"
      />
    </div>

    <!-- Modals -->
    <ProfileModal 
      v-if="selectedMemberProfile"
      :member="selectedMemberProfile"
      :isOpen="showProfileModal"
      @close="closeProfileModal"
    />

    <EvaluateModal 
      v-if="selectedMemberToEvaluate"
      :member="selectedMemberToEvaluate"
      :isOpen="showEvaluateModal"
      @close="closeEvaluateModal"
      @submit="handleEvaluationSubmit"
    />
  </div>
</template>

<style lang="scss" scoped>
.team-awwwards {
  min-height: 100vh;
  padding: 4rem 2rem;
  background-color: #0b0c10; // Dark background para estética premium
  color: #ffffff;
  font-family: 'Inter', system-ui, sans-serif;

  &__loading, &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.7);
  }

  &__error {
    color: #ff4b4b;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  &__content {
    max-width: 1400px;
    margin: 0 auto;
    animation: fadeIn 0.8s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
</style>
