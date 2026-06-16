<script setup lang="ts">
// --- TeamHeader.vue ---
</script>

<template>
  <header class="team-awwwards__header">
    <h1 class="title">El Squad Bakano</h1>
    <p class="subtitle">Conoce a las mentes maestras detrás de tu éxito digital.</p>
  </header>
</template>

<style lang="scss" scoped>
.team-awwwards__header {
  text-align: center;
  margin-bottom: 5rem;

  .title {
    font-size: clamp(3rem, 5vw, 5rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.5) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: clamp(1.125rem, 2vw, 1.5rem);
    color: rgba(255, 255, 255, 0.6);
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
