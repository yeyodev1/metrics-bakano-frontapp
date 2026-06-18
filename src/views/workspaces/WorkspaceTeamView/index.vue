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
const allInternalUsers = ref<any[]>([])

const getInternalUserPhoto = (names: string[]) => {
  for (const name of names) {
    const found = allInternalUsers.value.find(u => 
      u.name?.toLowerCase().includes(name.toLowerCase()) || 
      u.email?.toLowerCase().includes(name.toLowerCase())
    )
    if (found && found.photoUrl) return found.photoUrl
  }
  return null
}

const getInternalUserFallback = (names: string[]) => {
  for (const name of names) {
    const found = allInternalUsers.value.find(u => 
      u.name?.toLowerCase().includes(name.toLowerCase()) || 
      u.email?.toLowerCase().includes(name.toLowerCase())
    )
    if (found && found.name) return found.name.charAt(0).toUpperCase()
  }
  return names[0].charAt(0).toUpperCase()
}

const luisPhoto = computed(() => getInternalUserPhoto(['luis reyes', 'luis@bakano']) || 'https://ui-avatars.com/api/?name=Luis+Reyes&background=FFD700&color=0b0c10&size=200&bold=true')
const denissePhoto = computed(() => getInternalUserPhoto(['denisse quimi', 'denisse@bakano']))
const diegoPhoto = computed(() => getInternalUserPhoto(['diego reyes', 'diego@bakano']))
const carlosPhoto = computed(() => getInternalUserPhoto(['carlos jurado', 'carlos@bakano']))

const denisseFallback = computed(() => getInternalUserFallback(['denisse quimi', 'denisse@bakano']))
const diegoFallback = computed(() => getInternalUserFallback(['diego reyes', 'diego@bakano']))
const carlosFallback = computed(() => getInternalUserFallback(['carlos jurado', 'carlos@bakano']))

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
      // Filter out testing accounts
      members.value = teamRes.data.members.filter((m: WorkspaceUser) => m.email !== 'testing@bakano.ec')
      currentMembers = members.value
      if (teamRes.data.allInternalUsers) {
        allInternalUsers.value = teamRes.data.allInternalUsers
      }
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

      <!-- Fundadores y Tecnología -->
      <div class="custom-premium-sections">
        <!-- Fundadores -->
        <section class="premium-group">
          <h2 class="premium-group__title">
            <i class="fa-solid fa-crown" style="color: #FFD700;"></i> Fundadores
          </h2>
          
          <!-- Luis Reyes (Pro/Big Card) -->
          <div class="pro-founder-card">
            <div class="pro-founder-card__avatar-wrapper">
              <img :src="luisPhoto" alt="Luis Reyes" />
            </div>
            <div class="pro-founder-card__info">
              <h3>Luis Reyes</h3>
              <span class="role-badge">Fundador & CEO</span>
            </div>
          </div>

          <!-- Denisse y Diego -->
          <div class="premium-grid">
            <div class="premium-member-card">
              <div v-if="denissePhoto" class="premium-member-card__avatar-img-wrapper">
                <img :src="denissePhoto" alt="Denisse Quimi" />
              </div>
              <div v-else class="premium-member-card__avatar fallback">{{ denisseFallback }}</div>
              <div class="premium-member-card__info">
                <h3>Denisse Quimi</h3>
                <span class="role-badge">Cofundadora</span>
              </div>
            </div>
            <div class="premium-member-card">
              <div v-if="diegoPhoto" class="premium-member-card__avatar-img-wrapper">
                <img :src="diegoPhoto" alt="Diego Reyes" />
              </div>
              <div v-else class="premium-member-card__avatar fallback">{{ diegoFallback }}</div>
              <div class="premium-member-card__info">
                <h3>Diego Reyes</h3>
                <span class="role-badge">Cofundador</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Tecnología -->
        <section class="premium-group" style="margin-top: 4rem;">
          <h2 class="premium-group__title">
            <i class="fa-solid fa-code" style="color: #4facfe;"></i> Tecnología
          </h2>
          
          <div class="premium-grid">
            <div class="premium-member-card">
              <div v-if="carlosPhoto" class="premium-member-card__avatar-img-wrapper">
                <img :src="carlosPhoto" alt="Carlos Jurado" />
              </div>
              <div v-else class="premium-member-card__avatar fallback">{{ carlosFallback }}</div>
              <div class="premium-member-card__info">
                <h3>Carlos Jurado</h3>
                <span class="role-badge">Líder de Tecnología</span>
              </div>
            </div>
          </div>
        </section>
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
        background: rgba(#FFD700, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(#FFD700, 0.1);
      }
    }
  }

  /* Custom Premium Sections (Fundadores y Tecnología) */
  .custom-premium-sections {
    margin-bottom: 5rem;

    .premium-group {
      &__title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 2rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: inline-block;

        i {
          margin-right: 0.5rem;
        }
      }
    }

    .pro-founder-card {
      background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02));
      border: 1px solid rgba(255,215,0,0.2);
      border-radius: 24px;
      padding: 3rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2.5rem;
      transition: all 0.4s ease;

      @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
        padding: 2rem;
      }

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255,215,0,0.1);
        border-color: rgba(255,215,0,0.4);
      }

      &__avatar-wrapper {
        width: 160px;
        height: 160px;
        border-radius: 50%;
        border: 4px solid #FFD700;
        padding: 8px;
        flex-shrink: 0;
        
        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
      }

      &__info {
        h3 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }
      }
    }

    .premium-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2.5rem;
    }

    .premium-member-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.4s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-5px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }

      &__avatar, &__avatar-img-wrapper {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        margin-bottom: 1.5rem;
        border: 2px solid rgba(255,255,255,0.1);
        padding: 6px;
      }
      
      &__avatar-img-wrapper {
        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
      }

      &__avatar {
        &.fallback {
          background: linear-gradient(135deg, #2a2a35, #1a1a24);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
        }
      }

      &__info {
        h3 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }
      }
    }

    .role-badge {
      display: inline-block;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #FFD700;
      font-weight: 500;
      background: rgba(255, 215, 0, 0.1);
      padding: 0.4em 1em;
      border-radius: 100px;
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
