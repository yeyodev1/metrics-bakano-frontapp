<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  meeting: {
    type: Object as () => any | null,
    default: null,
  },
})

const emit = defineEmits(['close'])

const formattedDate = computed(() => {
  if (!props.meeting || !props.meeting.startTime) return ''
  return new Date(props.meeting.startTime).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const formattedTime = computed(() => {
  if (!props.meeting || !props.meeting.startTime || !props.meeting.endTime) return ''
  const start = new Date(props.meeting.startTime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const end = new Date(props.meeting.endTime).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${start} - ${end}`
})
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fa-brands fa-google" style="color: #4285F4; margin-right: 8px;"></i>
          Detalle de Reunión
        </h3>
        <button class="modal-close" @click="emit('close')">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <div v-if="meeting" class="modal-body">
        <h2 class="meeting-title">{{ meeting.title || 'Reunión sin título' }}</h2>
        
        <div class="meeting-detail-item">
          <i class="fa-regular fa-calendar" />
          <span>{{ formattedDate }}</span>
        </div>
        
        <div class="meeting-detail-item">
          <i class="fa-regular fa-clock" />
          <span>{{ formattedTime }}</span>
        </div>

        <div v-if="meeting.appointmentStatus" class="meeting-detail-item">
          <i class="fa-solid fa-circle-info" />
          <span>Estado: <strong style="text-transform: capitalize;">{{ meeting.appointmentStatus }}</strong></span>
        </div>

        <div v-if="meeting.calendarName" class="meeting-detail-item">
          <i class="fa-solid fa-calendar-days" />
          <span>Calendario: <strong>{{ meeting.calendarName }}</strong></span>
        </div>

        <div v-if="meeting.attendees && meeting.attendees.length > 0" class="meeting-attendees-section">
          <h4>Asistentes ({{ meeting.attendees.length }})</h4>
          <div class="attendees-list">
            <div v-for="att in meeting.attendees" :key="att.email" class="attendee-card">
              <img v-if="att.photoUrl" :src="att.photoUrl" :alt="att.name" class="attendee-avatar" />
              <div v-else class="attendee-avatar fallback">
                {{ att.name ? att.name.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="attendee-info">
                <span class="attendee-name">{{ att.name || 'Sin Nombre' }}</span>
                <span class="attendee-email" v-if="att.email">{{ att.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba($primary-dark, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container {
  background: $white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba($primary, 0.1);
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: $primary-dark;
  display: flex;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  color: $text-secondary;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba($primary, 0.1);
    color: $primary;
  }
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meeting-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: $primary-dark;
}

.meeting-detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $text-secondary;
  font-size: 0.95rem;

  i {
    width: 20px;
    text-align: center;
    color: $primary;
  }
}

.meeting-attendees-section {
  margin-top: 1rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: $primary-dark;
  }
}

.attendees-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attendee-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba($primary, 0.03);
  border-radius: 12px;
  border: 1px solid rgba($primary, 0.05);
}

.attendee-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;

  &.fallback {
    background: linear-gradient(135deg, $primary, darken($primary, 15%));
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
  }
}

.attendee-info {
  display: flex;
  flex-direction: column;

  .attendee-name {
    font-weight: 600;
    color: $primary-dark;
    font-size: 0.95rem;
  }

  .attendee-email {
    color: $text-secondary;
    font-size: 0.85rem;
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
