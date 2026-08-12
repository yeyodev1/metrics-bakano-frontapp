<template>
  <div class="ira">
    <div class="ira__head">
      <i class="fa-solid fa-circle-exclamation" />
      <span>MOTIVO DE RECHAZO</span>
    </div>
    <p>{{ motivo || 'Sin comentario de rechazo' }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ motivo: string }>()
</script>

<style scoped lang="scss">
.ira {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.25rem;
  background: #fef2f2;
  border: 1.5px solid #ef4444;
  border-radius: 16px;
  animation: ira-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;

  p {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.5;
    color: #991b1b;
  }
}

.ira__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #b91c1c;

  i { font-size: 1.1rem; }
  span { font-size: 0.75rem; font-weight: 900; letter-spacing: 0.1em; }
}

@keyframes ira-shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
