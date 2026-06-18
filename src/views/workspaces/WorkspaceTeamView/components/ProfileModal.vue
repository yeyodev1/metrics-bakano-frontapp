<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { WorkspaceUser } from '@/types'
import type { TeamRanking } from '@/services/evaluation.service'
import { getRoleLabel, getRoleDescription } from '../utils/roles'

const props = defineProps({
  member: {
    type: Object as () => WorkspaceUser,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  memberRanking: {
    type: Object as () => TeamRanking | undefined,
    required: false,
  }
})

const emit = defineEmits(['close'])
const router = useRouter()
const route = useRoute()

const copySuccess = ref(false)

const copyEmail = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch (err) {
    console.error('Error al copiar el email', err)
  }
}

const goToWhatsApp = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '')
  window.open(`https://wa.me/${cleanPhone}`, '_blank')
}

const goToUserEvaluations = (userId: string) => {
  const workspaceId = route.params.workspaceId
  emit('close')
  router.push({ name: 'WorkspaceEvaluations', params: { workspaceId }, query: { userId } })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="profile-modal">
      <button class="close-btn" @click="emit('close')">
        <i class="fa-solid fa-xmark"></i>
      </button>
      
      <div class="profile-header">
        <div class="profile-avatar">
          <img 
            v-if="member.photoUrl" 
            :src="member.photoUrl" 
            :alt="member.name" 
          />
          <div v-else class="fallback">
            {{ member.name ? member.name.charAt(0).toUpperCase() : 'U' }}
          </div>
        </div>
        <h2>{{ member.name }}</h2>
        <span class="role-badge">{{ getRoleLabel(member.internalRole) }}</span>
      </div>

      <div class="profile-body">
        <p class="profile-bio">{{ getRoleDescription(member.internalRole) }}</p>
        
        <div class="contact-info">
          <div class="info-item" v-if="member.email">
            <div class="info-label">
              <i class="fa-solid fa-envelope"></i>
              <span>{{ member.email }}</span>
            </div>
            <button class="action-btn" @click="copyEmail(member.email)" :title="copySuccess ? 'Copiado!' : 'Copiar Correo'">
              <i :class="copySuccess ? 'fa-solid fa-check text-success' : 'fa-regular fa-copy'"></i>
            </button>
          </div>
          <div class="info-item" v-if="member.phoneNumber">
            <div class="info-label">
              <i class="fa-brands fa-whatsapp"></i>
              <span>{{ member.phoneNumber }} <span v-if="member.phoneExtension">Ext: {{ member.phoneExtension }}</span></span>
            </div>
            <button class="action-btn" @click="goToWhatsApp(member.phoneNumber)" title="Escribir por WhatsApp">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
          </div>
        </div>

        <!-- Feedback & Rating Section -->
        <div class="member-feedback" v-if="memberRanking && memberRanking.totalEvaluations > 0">
          <div class="member-feedback__score">
            <i class="fa-solid fa-star"></i> {{ memberRanking.averageRating.toFixed(1) }} 
            <span class="member-feedback__count">({{ memberRanking.totalEvaluations }} opiniones)</span>
          </div>
          
          <div class="member-feedback__list" v-if="memberRanking.positiveFeedback && memberRanking.positiveFeedback.length > 0">
            <div class="feedback-comment" v-for="(comment, idx) in memberRanking.positiveFeedback" :key="idx">
              <i class="fa-solid fa-quote-left quote-icon"></i>
              <div class="feedback-author">
                <strong>Evaluador Anónimo</strong>
                <span class="feedback-date">{{ new Date(comment.createdAt).toLocaleDateString() }}</span>
              </div>
              <p>"{{ comment.feedback }}"</p>
            </div>
            
            <button class="btn-view-more" @click="goToUserEvaluations(member._id)">
              Ver todos los reconocimientos
            </button>
          </div>
        </div>
      </div>

      <div class="profile-footer">
        <button class="btn-primary" @click="emit('close')">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeInModal 0.3s ease;
}

@keyframes fadeInModal {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUpModal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-modal {
  background: #1a1a24;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.2s;

    &:hover { color: #ffffff; }
  }

  .profile-header {
    margin-bottom: 2rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .profile-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid $primary;
      padding: 4px;
      margin-bottom: 1.5rem;

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
        font-size: 3rem;
        font-weight: 700;
        color: rgba(255,255,255,0.8);
      }
    }

    h2 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }

    .role-badge {
      display: inline-block;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: $primary;
      font-weight: 600;
      background: rgba($primary, 0.1);
      padding: 0.4em 1em;
      border-radius: 100px;
    }
  }

  .profile-body {
    width: 100%;
    margin-bottom: 2rem;

    .profile-bio {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.5;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: left;

      .info-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;

        .info-label {
          display: flex;
          align-items: center;
          gap: 1rem;

          i {
            color: $primary;
            width: 20px;
            text-align: center;
          }
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(255, 255, 255, 0.15);
            color: $primary;
          }

          .text-success {
            color: #2ecc71;
          }
        }
      }
    }
  }

  .profile-footer {
    width: 100%;
    
    .btn-primary {
      width: 100%;
      padding: 0.8rem;
      border-radius: 100px;
      font-weight: 600;
      font-size: 1rem;
      background: $primary;
      color: #ffffff;
      border: none;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
    }
  }

  .member-feedback {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    text-align: left;

    &__score {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFD700;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .member-feedback__count {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 400;
      }
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 250px;
      overflow-y: auto;
      padding-right: 0.5rem;
      
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
    }

    .feedback-comment {
      background: rgba(255, 255, 255, 0.03);
      padding: 1rem;
      border-radius: 12px;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.05);

      .quote-icon {
        position: absolute;
        top: -8px;
        left: 10px;
        font-size: 1rem;
        color: $primary;
        opacity: 0.8;
        background: #1a1a24;
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
        padding-left: 1.5rem;
      }
    }

    .btn-view-more {
      width: 100%;
      background: rgba($primary, 0.1);
      color: $primary;
      border: 1px solid rgba($primary, 0.2);
      padding: 0.75rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 0.5rem;

      &:hover {
        background: $primary;
        color: #fff;
      }
    }
  }
}
</style>
