<template>
  <div class="step-content step-content--success" key="step4">
    <div class="success-icon">
      <i class="fa-solid fa-check-circle"></i>
    </div>
    <h1 class="main-title">¡Todo listo!</h1>
    <p class="success-message">
      "Veo que ya agendaste tu sesión con tu experto asignado en Meta. Entrando a esa reunión, todo estará bien y dejaremos la estructura lista."
    </p>
    <div class="redirect-message">Redirigiendo a tu plataforma...</div>
  </div>
</template>

<style lang="scss" scoped>
.step-content {
  width: 100%;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.step-content--success {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.success-icon {
  font-size: 5rem;
  color: #10b981;
  margin-bottom: 2rem;
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 50%;
    z-index: -1;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba($primary, 0.1); }
  70% { box-shadow: 0 0 0 10px rgba($primary, 0); }
  100% { box-shadow: 0 0 0 0 rgba($primary, 0); }
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.success-message {
  font-size: 1.2rem;
  color: #4b5563;
  font-style: italic;
  max-width: 500px;
  line-height: 1.6;
  margin-bottom: 3rem;
}

.redirect-message {
  padding: 1rem 2rem;
  background: rgba($primary, 0.05);
  color: $primary;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    display: block;
    width: 16px;
    height: 16px;
    border: 2px solid $primary;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
