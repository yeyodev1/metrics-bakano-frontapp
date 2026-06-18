<script setup lang="ts">
import type { WorkspaceUser } from '@/types'
import { getRoleLabel, getRoleDescription } from '../utils/roles'

const props = defineProps({
  member: {
    type: Object as () => WorkspaceUser,
    required: true,
  }
})

const emit = defineEmits(['view-profile', 'evaluate'])
</script>

<template>
  <article class="member-card">
    <div class="member-card__glass">
      <div class="member-card__avatar">
        <img 
          v-if="member.photoUrl" 
          :src="member.photoUrl" 
          :alt="member.name" 
        />
        <div v-else class="fallback">
          {{ member.name ? member.name.charAt(0).toUpperCase() : 'U' }}
        </div>
      </div>
      <div class="member-card__info">
        <h3>{{ member.name }}</h3>
        <span class="role">{{ getRoleLabel(member.internalRole) }}</span>
        <p class="description">{{ getRoleDescription(member.internalRole) }}</p>
        
        <div class="member-card__actions">
          <button class="btn-profile" @click="emit('view-profile', member)">
            <i class="fa-solid fa-user"></i> Ver Perfil
          </button>
          <button class="btn-evaluate" @click="emit('evaluate', member)">
            <i class="fa-solid fa-star"></i> Evaluar
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.member-card {
  perspective: 1000px;
  width: 100%;

  &__glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.4s ease;
    height: 100%;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 40px rgba($primary, 0.1);
      
      .member-card__avatar {
        transform: scale(1.05);
        border-color: $primary; // Asume $primary de vite conf
      }
    }
  }

  &__avatar {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    margin-bottom: 1.5rem;
    border: 2px solid rgba(255,255,255,0.1);
    padding: 6px;
    transition: all 0.4s ease;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .fallback {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #2a2a35, #1a1a24);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3.5rem;
      font-weight: 700;
      color: rgba(255,255,255,0.8);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    width: 100%;

    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }

    .role {
      display: inline-block;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: $primary;
      font-weight: 500;
      background: rgba($primary, 0.1);
      padding: 0.4em 1em;
      border-radius: 100px;
      margin-bottom: 1rem;
    }

    .description {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.4;
      margin-bottom: 1.5rem;
      min-height: 2.8rem;
    }

    .member-card__actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: auto;
    }

    .btn-profile, .btn-evaluate {
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.6rem 1rem;
      border-radius: 100px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }

    .btn-profile {
      i { color: #4facfe; }
    }

    .btn-evaluate {
      i { color: #f1c40f; }
    }
  }
}
</style>
