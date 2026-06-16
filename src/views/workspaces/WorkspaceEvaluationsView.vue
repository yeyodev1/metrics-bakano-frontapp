<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { evaluationService, type TeamRanking as TeamRankingType } from '@/services/evaluation.service'
import { workspaceService } from '@/services/workspace.service'
import type { WorkspaceUser } from '@/types'
import TeamRanking from './WorkspaceTeamView/components/TeamRanking.vue'

const route = useRoute()
const router = useRouter()
const workspaceId = route.params.workspaceId as string
const selectedUserId = computed(() => route.query.userId as string | undefined)

const loading = ref(true)
const errorMsg = ref('')

const fullRanking = ref<TeamRankingType[]>([])
const allEvaluations = ref<any[]>([])

const loadEvaluations = async () => {
  try {
    loading.value = true
    const [teamRes, rankingRes] = await Promise.all([
      workspaceService.getTeam(workspaceId),
      evaluationService.getTeamRanking(workspaceId).catch(() => [])
    ])

    let members: WorkspaceUser[] = []
    if (teamRes && teamRes.data) {
      members = teamRes.data.members.filter((m: WorkspaceUser) => m.email !== 'testing@bakano.ec')
    }

    const ranking = rankingRes.filter(r => r.email !== 'testing@bakano.ec')

    fullRanking.value = ranking

    // Flatten to all evaluations
    const evals: any[] = []
    ranking.forEach(member => {
      member.positiveFeedback.forEach(pf => {
        evals.push({
          memberId: member._id,
          memberName: member.name || 'Especialista Bakano',
          memberPhoto: member.photoUrl || '',
          memberRole: member.internalRole || '',
          rating: pf.rating,
          feedback: pf.feedback,
          createdAt: pf.createdAt
        })
      })
    })

    allEvaluations.value = evals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (e: any) {
    errorMsg.value = 'No se pudo cargar el muro de reconocimientos.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvaluations()
})

const filteredEvaluations = computed(() => {
  if (selectedUserId.value) {
    return allEvaluations.value.filter(e => e.memberId === selectedUserId.value)
  }
  return allEvaluations.value
})

const goBack = () => {
  router.push({ name: 'WorkspaceTeam', params: { workspaceId } })
}

const clearFilter = () => {
  router.replace({ query: {} })
}
</script>

<template>
  <div class="evaluations-view-wrapper">
    <div class="evaluations-view">
      <div class="evaluations-view__nav">
        <button class="back-btn" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i> Volver al Equipo
        </button>
      </div>

      <header class="evaluations-view__header">
        <h1 class="title"><i class="fa-solid fa-star"></i> Muro de Reconocimientos</h1>
        <p class="subtitle">Todas las opiniones positivas y calificaciones de la comunidad Bakano.</p>

        <div v-if="selectedUserId" class="filter-badge" @click="clearFilter">
          Mostrando reconocimientos de un especialista específico
          <i class="fa-solid fa-xmark"></i>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando reconocimientos estelares...</p>
      </div>

      <div v-else-if="errorMsg" class="error-state">
        {{ errorMsg }}
      </div>

      <div v-else>
        <div v-if="!selectedUserId">
          <TeamRanking :ranking="fullRanking" />
          
          <div class="wall-section-title">
            <h3><i class="fa-solid fa-comments"></i> Todos los reconocimientos</h3>
          </div>
        </div>

        <div class="team-wall__grid">
          <div v-for="(evalData, i) in filteredEvaluations" :key="i" class="wall-card">
            <div class="wall-card__header">
              <div class="author-info">
                <strong>Evaluador Anónimo</strong>
                <span>{{ new Date(evalData.createdAt).toLocaleDateString() }}</span>
              </div>
              <div class="rating">
                <i class="fa-solid fa-star" v-for="n in evalData.rating" :key="n"></i>
              </div>
            </div>

            <div class="wall-card__content">
              <i class="fa-solid fa-quote-left quote-icon"></i>
              <p>"{{ evalData.feedback }}"</p>
            </div>

            <div class="wall-card__member">
              <div class="member-avatar">
                <img v-if="evalData.memberPhoto" :src="evalData.memberPhoto" alt="Avatar" />
                <div v-else class="fallback">{{ evalData.memberName.charAt(0).toUpperCase() }}</div>
              </div>
              <div class="member-info">
                <span class="member-label">Reconocimiento para:</span>
                <strong>{{ evalData.memberName }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && filteredEvaluations.length === 0" class="empty-state">
          No hay reconocimientos para mostrar en este momento.
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.evaluations-view-wrapper {
  background-color: #0b0c10; // Dark premium background
  min-height: 100vh;
  color: #ffffff;
  font-family: 'Inter', system-ui, sans-serif;
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.evaluations-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.evaluations-view__nav {
  margin-bottom: 3rem;

  .back-btn {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1.5rem;
    border-radius: 100px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      transform: translateX(-5px);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

.evaluations-view__header {
  text-align: center;
  margin-bottom: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  .title {
    font-size: clamp(2.5rem, 4vw, 4rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.5) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    i { 
      color: #FFD700; 
      -webkit-text-fill-color: initial;
    }
  }

  .subtitle {
    font-size: clamp(1.1rem, 2vw, 1.3rem);
    color: rgba(255, 255, 255, 0.6);
    max-width: 600px;
    margin: 0 auto;
  }

  .filter-badge {
    margin-top: 1.5rem;
    background: rgba($primary, 0.1);
    color: $primary;
    border: 1px solid rgba($primary, 0.3);
    padding: 0.5rem 1.5rem;
    border-radius: 100px;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary, 0.2);
    }
  }
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  min-height: 50vh;

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ff6b6b;
}

.wall-section-title {
  margin: 4rem 0 2rem;
  text-align: center;
  
  h3 {
    font-size: 1.75rem;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    i {
      color: $primary;
    }
  }
}

.team-wall__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.wall-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    .author-info {
      display: flex;
      flex-direction: column;
      
      strong {
        color: $primary;
        font-size: 0.95rem;
      }

      span {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
      }
    }

    .rating {
      color: #FFD700;
      font-size: 0.85rem;
      display: flex;
      gap: 0.1rem;
    }
  }

  &__content {
    position: relative;
    margin-bottom: 2rem;

    .quote-icon {
      position: absolute;
      top: -5px;
      left: -10px;
      font-size: 1.5rem;
      color: rgba($primary, 0.15);
    }

    p {
      margin: 0;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
      line-height: 1.6;
      padding-left: 1.5rem;
    }
  }

  &__member {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);

    .member-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      overflow: hidden;
      background: $primary-light;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba($primary, 0.2);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .fallback {
        color: $primary;
        font-size: 1.2rem;
        font-weight: 700;
      }
    }

    .member-info {
      display: flex;
      flex-direction: column;

      .member-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      strong {
        color: #ffffff;
        font-size: 0.95rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .evaluations-view__nav {
    margin-bottom: 2rem;
  }

  .evaluations-view__header {
    margin-bottom: 3rem;
  }
}
</style>
