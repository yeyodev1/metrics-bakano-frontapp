<script setup lang="ts">
// TeamSkeleton.vue
</script>

<template>
  <div class="team-skeleton">
    <!-- Header Skeleton -->
    <div class="skeleton-header">
      <div class="skeleton-title shimmer"></div>
      <div class="skeleton-subtitle shimmer"></div>
    </div>

    <!-- Videos Skeleton -->
    <div class="skeleton-videos">
      <div class="skeleton-video shimmer" v-for="i in 3" :key="'video-' + i"></div>
    </div>

    <!-- CTA Skeleton -->
    <div class="skeleton-cta-container">
      <div class="skeleton-cta shimmer"></div>
    </div>

    <!-- Groups Skeleton -->
    <div class="skeleton-group" v-for="g in 2" :key="'group-' + g">
      <div class="skeleton-group-title shimmer"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card shimmer" v-for="c in 4" :key="'card-' + g + '-' + c">
          <div class="skeleton-card-avatar"></div>
          <div class="skeleton-card-name"></div>
          <div class="skeleton-card-role"></div>
          <div class="skeleton-card-actions">
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.team-skeleton {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;

  .shimmer {
    background: rgba(255, 255, 255, 0.05);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.02) 20%,
        rgba(255, 255, 255, 0.05) 60%,
        rgba(255, 255, 255, 0)
      );
      animation: shimmer 2s infinite;
    }
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  // Header
  .skeleton-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 5rem;

    .skeleton-title {
      width: 400px;
      height: 4rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .skeleton-subtitle {
      width: 500px;
      height: 1.5rem;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      .skeleton-title {
        width: 80%;
        height: 3rem;
      }
      .skeleton-subtitle {
        width: 90%;
      }
    }
  }

  // Videos
  .skeleton-videos {
    display: flex;
    gap: 1.5rem;
    overflow: hidden;
    margin-bottom: 4rem;

    .skeleton-video {
      flex: 0 0 300px;
      height: 500px;
      border-radius: 20px;
    }
  }

  // CTA
  .skeleton-cta-container {
    display: flex;
    justify-content: center;
    margin: 3rem 0 5rem;

    .skeleton-cta {
      width: 350px;
      height: 3.5rem;
      border-radius: 100px;
    }
  }

  // Groups
  .skeleton-group {
    margin-bottom: 5rem;

    .skeleton-group-title {
      width: 250px;
      height: 2.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2.5rem;

      .skeleton-card {
        border-radius: 16px;
        padding: 2.5rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.05);

        &-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 1.5rem;
        }

        &-name {
          width: 70%;
          height: 1.25rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 0.5rem;
        }

        &-role {
          width: 50%;
          height: 1rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 2rem;
        }

        &-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .skeleton-btn {
            width: 100%;
            height: 2.5rem;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
          }
        }
      }
    }
  }
}
</style>
