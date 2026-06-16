<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  poster: { type: String, default: '' },
})

const videoRef = ref<HTMLVideoElement | null>(null)
const playerRef = ref<HTMLDivElement | null>(null)

const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(1)
const currentTime = ref(0)
const duration = ref(0)
const showControls = ref(true)
let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null

function togglePlay() {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
}

function updateProgress() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
}

function updateDuration() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

function handleSeek(e: Event) {
  if (!videoRef.value) return
  const target = e.target as HTMLInputElement
  const time = (parseFloat(target.value) / 100) * duration.value
  videoRef.value.currentTime = time
}

function toggleMute() {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

function toggleFullscreen() {
  if (!playerRef.value) return
  if (!document.fullscreenElement) {
    playerRef.value.requestFullscreen().catch(err => {
      console.warn(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function handleMouseMove() {
  showControls.value = true
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
  if (isPlaying.value) {
    hideControlsTimeout = setTimeout(() => {
      showControls.value = false
    }, 2500)
  }
}

function handleMouseLeave() {
  if (isPlaying.value) {
    showControls.value = false
  }
}

onUnmounted(() => {
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout)
})
</script>

<template>
  <div 
    class="custom-video-player" 
    ref="playerRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :class="{ 'custom-video-player--playing': isPlaying, 'custom-video-player--idle': !showControls }"
  >
    <video 
      ref="videoRef"
      class="custom-video-player__media"
      :src="src"
      :poster="poster"
      @timeupdate="updateProgress"
      @loadedmetadata="updateDuration"
      @click="togglePlay"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      playsinline
    ></video>

    <!-- Center Play Button Overlay -->
    <transition name="fade">
      <div v-if="!isPlaying" class="custom-video-player__center-play" @click="togglePlay">
        <div class="play-icon-glass">
          <i class="fa-solid fa-play"></i>
        </div>
      </div>
    </transition>

    <!-- Bottom Controls Bar -->
    <div class="custom-video-player__controls" :class="{ 'is-visible': showControls || !isPlaying }">
      <button class="control-btn play-pause-btn" @click.stop="togglePlay">
        <i class="fa-solid" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
      </button>

      <div class="time-display">{{ formatTime(currentTime) }}</div>

      <div class="progress-bar-container" @click.stop>
        <input 
          type="range" 
          class="progress-slider" 
          min="0" 
          max="100" 
          step="0.1"
          :value="duration ? (currentTime / duration) * 100 : 0" 
          @input="handleSeek"
          :style="{ '--progress': duration ? `${(currentTime / duration) * 100}%` : '0%' }"
        />
      </div>

      <div class="time-display">{{ formatTime(duration) }}</div>

      <button class="control-btn volume-btn" @click.stop="toggleMute">
        <i class="fa-solid" :class="isMuted ? 'fa-volume-xmark' : 'fa-volume-high'"></i>
      </button>

      <button class="control-btn fullscreen-btn" @click.stop="toggleFullscreen">
        <i class="fa-solid fa-expand"></i>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.custom-video-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: inherit;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &__media {
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: pointer;
  }

  &__center-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s ease;

    .play-icon-glass {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      i {
        font-size: 2.5rem;
        color: #fff;
        margin-left: 6px;
      }
    }

    &:hover .play-icon-glass {
      transform: scale(1.1);
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &__controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 3rem 1.5rem 1.5rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
    display: flex;
    align-items: center;
    gap: 1.25rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 20;

    &.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &--idle {
    cursor: none;
  }
}

.control-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  i {
    font-size: 1.4rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    transform: scale(1.1);
  }
}

.time-display {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.progress-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  height: 24px;
  cursor: pointer;
}

.progress-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  outline: none;
  margin: 0;
  cursor: pointer;
  position: relative;
  transition: height 0.2s ease;

  background-image: linear-gradient(to right, $primary var(--progress), transparent var(--progress));

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: transform 0.2s;
    opacity: 0;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: transform 0.2s;
    opacity: 0;
  }
}

.progress-bar-container:hover .progress-slider {
  height: 8px;
  &::-webkit-slider-thumb {
    opacity: 1;
    transform: scale(1.2);
  }
  &::-moz-range-thumb {
    opacity: 1;
    transform: scale(1.2);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
