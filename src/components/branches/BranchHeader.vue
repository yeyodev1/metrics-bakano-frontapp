<script setup lang="ts">
const emit = defineEmits<{
  (e: 'create'): void
}>()
</script>

<template>
  <div class="view-header">
    <div class="header-banner">
      <div class="header-banner__icon">
        <i class="fa-solid fa-store" />
      </div>
      <div class="header-banner__text">
        <h1 class="header-banner__title">Sucursales</h1>
        <p class="header-banner__subtitle">Gestiona y monitorea las sedes de este workspace</p>
      </div>
    </div>
    <button class="btn-create" @click="emit('create')">
      <span class="btn-create__icon">
        <i class="fa-solid fa-plus" />
      </span>
      <span>Nueva sucursal</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.header-banner {
  display: flex;
  align-items: center;
  gap: 16px;

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.5px;
  }

  &__subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    font-weight: 400;
  }
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  white-space: nowrap;

  &__icon {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
  }

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
