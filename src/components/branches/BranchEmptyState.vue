<script setup lang="ts">
const emit = defineEmits<{
  (e: 'create'): void
}>()
</script>

<template>
  <div class="state-empty">
    <div class="empty-icon">
      <i class="fa-solid fa-store" />
    </div>
    <h3>Sin sucursales aún</h3>
    <p>Crea la primera sede para organizar la facturación de este workspace por ubicación.</p>
    <button class="btn-primary" @click="emit('create')">
      <i class="fa-solid fa-plus" />
      Nueva sucursal
    </button>
  </div>
</template>

<style lang="scss" scoped>
.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 24px;
  text-align: center;

  h3 {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.3px;
  }

  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    max-width: 360px;
    line-height: 1.6;
  }
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
  border: 2px solid #c7d2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #6366f1;
  margin-bottom: 4px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  margin-top: 8px;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
}
</style>
