<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import type { WorkspaceUser } from '@/types'
import { useToast } from '@/composables/useToast'

import TeamHeader from './components/TeamHeader.vue'
import TeamVideos from './components/TeamVideos.vue'
import TeamGrid from './components/TeamGrid.vue'
import ProfileModal from './components/ProfileModal.vue'
import EvaluateModal from './components/EvaluateModal.vue'
import TeamSkeleton from './components/TeamSkeleton.vue'
import { evaluationService, type TeamRanking as TeamRankingType } from '@/services/evaluation.service'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const workspaceId = route.params.workspaceId as string
const toast = useToast()

const loading = ref(true)
const members = ref<WorkspaceUser[]>([])
const teamRanking = ref<TeamRankingType[]>([])
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

const handleEvaluationSubmit = async (data: { rating: number; feedback: string }) => {
  try {
    if (!selectedMemberToEvaluate.value) return;
    
    await evaluationService.submitEvaluation({
      evaluatedUserId: selectedMemberToEvaluate.value._id,
      workspaceId,
      rating: data.rating,
      feedback: data.feedback
    });
    
    toast.success(`Evaluación de ${selectedMemberToEvaluate.value.name || 'tu especialista'} enviada con éxito. ¡Gracias por tu feedback!`)
    closeEvaluateModal()
    
    // Refresh ranking silently
    teamRanking.value = await evaluationService.getTeamRanking(workspaceId)
  } catch (error) {
    console.error('Error submitting evaluation:', error)
    toast.error('Hubo un problema al enviar la evaluación. Intenta de nuevo.')
  }
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

const getTeamMemberRanking = (userId: string) => {
  return teamRanking.value.find(r => r._id === userId)
}

const goToEvaluations = () => {
  router.push({ name: 'WorkspaceEvaluations', params: { workspaceId } })
}

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
    const [teamRes, rankingRes] = await Promise.all([
      workspaceService.getTeam(workspaceId),
      evaluationService.getTeamRanking(workspaceId).catch(err => {
        console.error('Failed to load ranking', err)
        return [] as TeamRankingType[]
      })
    ])

    let currentMembers: WorkspaceUser[] = []
    if (teamRes && teamRes.data) {
      members.value = teamRes.data.members
      currentMembers = teamRes.data.members
    }
    // Process ranking: the backend now automatically injects mock data for missing members
    const fullRanking = [...rankingRes]

    // Sort the full ranking by rating and evaluations
    fullRanking.sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      return b.totalEvaluations - a.totalEvaluations
    })

    teamRanking.value = fullRanking;
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
      <TeamSkeleton />
    </div>
    
    <div v-else-if="errorMsg" class="team-awwwards__error">
      {{ errorMsg }}
    </div>
    
    <div v-else class="team-awwwards__content">
      <TeamHeader />

      <TeamVideos :uniqueVideos="uniqueVideos" />

      <div class="ranking-cta-container">
        <button class="btn-ranking-cta" @click="goToEvaluations">
          <i class="fa-solid fa-trophy"></i> Ver Ranking y Reconocimientos
        </button>
      </div>

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
      :memberRanking="getTeamMemberRanking(selectedMemberProfile._id)"
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

  &__loading {
    width: 100%;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ff6b6b;
    height: 60vh;
    font-size: 1.25rem;
  }

  .ranking-cta-container {
    display: flex;
    justify-content: center;
    margin: 3rem 0;

    .btn-ranking-cta {
      background: linear-gradient(135deg, rgba(#FFD700, 0.2), rgba(#FFD700, 0.05));
      color: #FFD700;
      border: 1px solid rgba(#FFD700, 0.3);
      padding: 1rem 2.5rem;
      border-radius: 100px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        font-size: 1.25rem;
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(#FFD700, 0.15);
        background: linear-gradient(135deg, rgba(#FFD700, 0.25), rgba(#FFD700, 0.1));
      }
    }
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
