<script setup lang="ts">
const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['logout'])

function onLogout() {
  emit('logout')
}
</script>

<template>
  <div class="card-sidebar">
    <!-- Temp Dev Logout Button -->
    <button class="btn-dev-logout" @click="onLogout" title="Cerrar sesión (Temporal Dev)">
      <i class="fa-solid fa-right-from-bracket"></i> Salir
    </button>

    <div class="sidebar-content">
      <Transition name="slide-up" mode="out-in">
        <div :key="currentStep" class="step-info">
          <h2 class="sidebar-title">
            {{ currentStep === 1 ? 'Tu viaje comienza aquí' :
              currentStep === 2 ? 'Formalicemos el acuerdo' :
                currentStep === 3 ? 'Conecta con el equipo' : '¡Bienvenido a bordo!' }}
          </h2>
          <p class="sidebar-subtitle">
            {{ currentStep === 1 ? 'Alineemos expectativas para garantizar tu éxito.' :
              currentStep === 2 ? 'Ingresa los datos para generar tu contrato de servicios.' :
                currentStep === 3 ? 'Agenda tu llamada de kickoff con tu estratega asignado.' : 'Tu entorno de trabajo está siendo preparado.' }}
          </p>
        </div>
      </Transition>
    </div>

    <div class="sidebar-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(currentStep / 4) * 100}%` }"></div>
      </div>
      <span class="progress-text">Paso {{ currentStep }} de 4</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-sidebar {
  flex: 0 0 320px;
  background: linear-gradient(135deg, $primary-dark 0%, $primary 100%);
  color: $white;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.btn-dev-logout {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: $white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  align-self: flex-start;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.step-info {
  margin-bottom: 2rem;
}

.sidebar-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.sidebar-subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  line-height: 1.5;
}

.sidebar-progress {
  margin-top: auto;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $white;
  transition: width 0.5s ease-out;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>
