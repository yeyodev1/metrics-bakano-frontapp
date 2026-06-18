<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { TeamRanking } from '@/services/evaluation.service'

const props = defineProps<{
  ranking: TeamRanking[]
}>()

const router = useRouter()
const route = useRoute()
const workspaceId = route.params.workspaceId as string

const hasRanking = computed(() => props.ranking && props.ranking.length > 0)

const goToUserEvaluations = (userId: string) => {
  router.push({ name: 'WorkspaceEvaluations', params: { workspaceId }, query: { userId } })
}
</script>

<template>
  <section class="team-ranking-section" v-if="hasRanking">
    <div class="team-ranking__header">
      <h2><i class="fa-solid fa-trophy"></i> Top Especialistas del Mes</h2>
      <p>Reconocimientos y comentarios positivos de la comunidad Bakano.</p>
    </div>

    <div class="team-ranking__grid">
      <div 
        v-for="(member, index) in ranking" 
        :key="member._id" 
        class="ranking-card"
        :class="{ 'ranking-card--gold': index === 0, 'ranking-card--silver': index === 1, 'ranking-card--bronze': index === 2 }"
        @click="goToUserEvaluations(member._id)"
      >
        <div class="ranking-card__medal" v-if="index < 3">
          <i class="fa-solid fa-medal"></i>
        </div>

        <div class="ranking-card__avatar-wrapper">
          <img v-if="member.photoUrl" :src="member.photoUrl" alt="Avatar" class="ranking-card__avatar" />
          <span v-else class="ranking-card__avatar-fallback">{{ (member.name || member.email).charAt(0).toUpperCase() }}</span>
        </div>
        
        <div class="ranking-card__info">
          <strong class="ranking-card__name">{{ member.name || 'Especialista Bakano' }}</strong>
          <span class="ranking-card__role">{{ member.internalRole ? member.internalRole.replace('_', ' ') : 'Experto' }}</span>
        </div>

        <div class="ranking-card__score">
          <div class="score-value">
            <i class="fa-solid fa-star"></i>
            {{ member.averageRating.toFixed(1) }}
          </div>
          <span class="score-label">De {{ member.totalEvaluations }} evaluaciones</span>
        </div>

        <!-- Positive Feedback Comments (Anonymous) -->
        <div class="ranking-card__feedback-list" v-if="member.positiveFeedback.length > 0">
          <div class="feedback-item" v-for="(comment, i) in member.positiveFeedback.slice(0, 2)" :key="i">
            <i class="fa-solid fa-quote-left quote-icon"></i>
            <div class="feedback-author">
              <strong>Evaluador Anónimo</strong>
              <span class="feedback-date">{{ new Date(comment.createdAt).toLocaleDateString() }}</span>
            </div>
            <p>"{{ comment.feedback }}"</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.team-ranking-section {
  margin: 4rem 0;
  padding: 3rem 0;
  border-top: 1px solid rgba($primary-dark, 0.05);
}

.team-ranking__header {
  text-align: center;
  margin-bottom: 3rem;

  h2 {
    font-size: 2rem;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 0.5rem;

    i {
      color: #FFD700; // Gold
    }
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
}

.team-ranking__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 400px));
  justify-content: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.ranking-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 2.5rem 2rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
    border-color: rgba($primary, 0.3);
  }

  &__medal {
    position: absolute;
    top: -15px;
    right: 20px;
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
  }

  &--gold {
    border: 1px solid rgba(#FFD700, 0.3);
    background: linear-gradient(to bottom, rgba(#FFD700, 0.05), rgba(255, 255, 255, 0.02));
    .ranking-card__medal i { color: #FFD700; }
  }

  &--silver {
    border: 1px solid rgba(#C0C0C0, 0.3);
    background: linear-gradient(to bottom, rgba(#C0C0C0, 0.05), rgba(255, 255, 255, 0.02));
    .ranking-card__medal i { color: #C0C0C0; }
  }

  &--bronze {
    border: 1px solid rgba(#CD7F32, 0.3);
    background: linear-gradient(to bottom, rgba(#CD7F32, 0.05), rgba(255, 255, 255, 0.02));
    .ranking-card__medal i { color: #CD7F32; }
  }

  &__avatar-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 1rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__avatar-fallback {
    color: $primary;
    font-size: 2rem;
    font-weight: 700;
  }

  &__info {
    margin-bottom: 1.5rem;
  }

  &__name {
    display: block;
    font-size: 1.25rem;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 0.25rem;
  }

  &__role {
    font-size: 0.85rem;
    color: $primary;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 1px;
  }

  &__score {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem 2rem;
    border-radius: 16px;
    margin-bottom: 1.5rem;
    width: 100%;

    .score-value {
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      i {
        color: #FFD700;
        font-size: 1.5rem;
      }
    }

    .score-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      display: block;
      margin-top: 0.25rem;
    }
  }

  &__feedback-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    padding-top: 1.5rem;
  }

  .feedback-item {
    background: rgba(255, 255, 255, 0.03);
    padding: 1rem;
    border-radius: 12px;
    position: relative;
    text-align: left;
    border: 1px solid rgba(255, 255, 255, 0.05);

    .quote-icon {
      position: absolute;
      top: -8px;
      left: 10px;
      font-size: 1rem;
      color: $primary;
      opacity: 0.8;
      background: #1a1a24; // fallback background to match the card visually
      padding: 0 4px;
      border-radius: 50%;
    }

    .feedback-author {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      
      strong {
        font-size: 0.85rem;
        color: $primary;
      }
      
      .feedback-date {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
      }
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
      line-height: 1.5;
    }
  }
}
</style>
