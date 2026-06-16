<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  uniqueVideos: {
    type: Array as () => string[],
    required: true,
  }
})

const activeVideo = ref(0)
</script>

<template>
  <section class="team-awwwards__showcase" v-if="uniqueVideos.length > 0">
    <!-- Si hay 1 solo video -->
    <div v-if="uniqueVideos.length === 1" class="video-grid">
      <div class="video-card video-card--active">
        <div class="video-card__inner single-video">
          <video 
            class="video-card__media" 
            controls 
            playsinline 
            preload="metadata"
            :src="uniqueVideos[0]"
          ></video>
        </div>
        <div class="video-card__badge">Presentación Oficial</div>
      </div>
    </div>

    <!-- Si hay múltiples videos: Diseño Accordion Interactivo -->
    <div v-else class="video-accordion">
      <div 
        v-for="(videoUrl, index) in uniqueVideos" 
        :key="index" 
        class="video-card"
        :class="{ 'video-card--active': activeVideo === index }"
        @click="activeVideo = index"
      >
        <div class="video-card__inner">
          <video 
            class="video-card__media" 
            controls 
            playsinline 
            preload="metadata"
            :src="videoUrl"
          ></video>
        </div>
        <div class="video-card__overlay" v-if="activeVideo !== index">
          <i class="fa-solid fa-play"></i>
          <span>Ver Presentación {{ index + 1 }}</span>
        </div>
        <div class="video-card__badge" v-if="activeVideo === index">
          Presentación {{ index + 1 }}
        </div>
      </div>
    </div>
  </section>

  <section class="team-awwwards__showcase" v-else>
    <div class="video-card empty-state">
      <i class="fa-solid fa-video-slash"></i>
      <p>La presentación oficial de tu equipo está en producción.</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.team-awwwards__showcase {
  display: flex;
  flex-direction: column;
  margin-bottom: 6rem;
}

.video-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.video-accordion {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 900px) {
    flex-direction: row;
    height: 500px;
    gap: 1rem;
  }
}

.video-card {
  position: relative;
  border-radius: 24px;
  padding: 2px; // for gradient border
  background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  
  // Default para mobile (stack)
  width: 100%;
  
  // En Desktop actúan como Flex Accordion
  @media (min-width: 900px) {
    flex: 1;
    height: 100%;
  }

  &--active {
    cursor: default;
    @media (min-width: 900px) {
      flex: 3; // El activo toma 3 veces más espacio
    }
  }

  &:not(.video-card--active):hover {
    @media (min-width: 900px) {
      flex: 1.2;
      background: linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
    }
  }

  &__inner {
    background: #000;
    border-radius: 22px;
    overflow: hidden;
    width: 100%;
    height: 100%;
    position: relative;

    &.single-video {
      aspect-ratio: 16 / 9;
      max-height: 500px;
    }
  }

  &__media {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #000;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border-radius: 24px;
    z-index: 2;
    transition: background 0.3s ease;

    i {
      font-size: 3rem;
      color: rgba(255, 255, 255, 0.8);
      transition: transform 0.3s ease;
    }

    span {
      font-weight: 600;
      font-size: 1.1rem;
      letter-spacing: 0.5px;
      text-align: center;
      padding: 0 1rem;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.4);
      i {
        transform: scale(1.1);
        color: $primary; // $primary debe estar globalmente inyectado
      }
    }
  }

  &__badge {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    background: rgba(0, 0, 0, 0.7);
    color: $primary;
    padding: 0.5rem 1.25rem;
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba($primary, 0.3);
    z-index: 2;
    animation: fadeIn 0.5s ease;
  }

  &.empty-state {
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255,255,255,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    box-shadow: none;

    &:hover {
      transform: none;
    }

    i {
      font-size: 4rem;
      color: rgba(255,255,255,0.2);
      margin-bottom: 1.5rem;
    }

    p {
      color: rgba(255,255,255,0.5);
      font-size: 1.25rem;
      text-align: center;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
