<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps({
  modelValue: {
    type: String, // HH:mm format (24h)
    default: '12:00'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Internal 12h state
const hours = Array.from({ length: 12 }, (_, i) => i + 1)
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
const meridiems = ['AM', 'PM']

const selectedHour = ref(12)
const selectedMinute = ref('00')
const selectedMeridiem = ref('AM')

// Sync internal state from modelValue
const syncFromModel = () => {
  if (!props.modelValue) return
  const parts = props.modelValue.split(':')
  if (parts.length < 2) return
  
  const h24 = parseInt(parts[0] || '0', 10)
  const m = parseInt(parts[1] || '0', 10)
  
  if (isNaN(h24) || isNaN(m)) return

  selectedMinute.value = m.toString().padStart(2, '0')
  
  if (h24 === 0) {
    selectedHour.value = 12
    selectedMeridiem.value = 'AM'
  } else if (h24 === 12) {
    selectedHour.value = 12
    selectedMeridiem.value = 'PM'
  } else if (h24 > 12) {
    selectedHour.value = h24 - 12
    selectedMeridiem.value = 'PM'
  } else {
    selectedHour.value = h24
    selectedMeridiem.value = 'AM'
  }
}

// Sync modelValue from internal state
const syncToModel = () => {
  let h24 = selectedHour.value
  if (selectedMeridiem.value === 'PM' && h24 !== 12) h24 += 12
  if (selectedMeridiem.value === 'AM' && h24 === 12) h24 = 0
  
  const timeStr = `${h24.toString().padStart(2, '0')}:${selectedMinute.value}`
  emit('update:modelValue', timeStr)
}

watch(() => props.modelValue, syncFromModel, { immediate: true })

const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const selectHour = (h: number) => {
  selectedHour.value = h
  syncToModel()
}

const selectMinute = (m: string) => {
  selectedMinute.value = m
  syncToModel()
}

const selectMeridiem = (m: string) => {
  selectedMeridiem.value = m
  syncToModel()
}

const close = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

const panelStyles = ref<CSSProperties>({ top: '0px', left: '0px', width: '280px' })

const updatePosition = () => {
  if (containerRef.value && isOpen.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const isMobile = window.innerWidth <= 480
    
    if (isMobile) {
      panelStyles.value = {
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh'
      }
    } else {
      panelStyles.value = {
        top: `${rect.bottom + window.scrollY + 10}px`,
        left: `${rect.left + window.scrollX}px`,
        width: '280px'
      }
    }
  }
}

watch(isOpen, (val) => {
  if (val) {
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
  } else {
    window.removeEventListener('scroll', updatePosition, true)
    window.removeEventListener('resize', updatePosition)
  }
})

onMounted(() => {
  window.addEventListener('mousedown', close)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', close)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div ref="containerRef" class="base-time-picker" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
    <!-- Trigger Display -->
    <div class="base-time-picker__trigger" @click="toggle">
      <div class="base-time-picker__value">
        <span class="base-time-picker__num">{{ selectedHour }}</span>
        <span class="base-time-picker__sep">:</span>
        <span class="base-time-picker__num">{{ selectedMinute }}</span>
        <span class="base-time-picker__meridiem">{{ selectedMeridiem }}</span>
      </div>
      <i class="fa-solid fa-chevron-down base-time-picker__arrow" />
    </div>

    <!-- Dropdown Panel -->
    <Teleport to="body">
      <Transition name="picker-fade">
        <div v-if="isOpen" class="base-time-picker__panel-container" :style="panelStyles">
          <!-- Backdrop for mobile -->
          <div class="base-time-picker__backdrop" @click="isOpen = false" />
          
          <div class="base-time-picker__panel" @mousedown.stop>
            <div class="base-time-picker__header">
              <i class="fa-solid fa-clock-rotate-left" />
              <span>Seleccionar Hora</span>
              <button class="base-time-picker__close-btn" @click="isOpen = false">
                <i class="fa-solid fa-times" />
              </button>
            </div>
            
            <div class="base-time-picker__columns">
              <!-- Hours Column -->
              <div class="base-time-picker__col">
                <div class="base-time-picker__col-label">Hora</div>
                <div class="base-time-picker__scroll">
                  <button 
                    v-for="h in hours" 
                    :key="h"
                    class="base-time-picker__opt"
                    :class="{ 'is-active': selectedHour === h }"
                    @click="selectHour(h)"
                  >
                    {{ h }}
                  </button>
                </div>
              </div>

              <!-- Minutes Column -->
              <div class="base-time-picker__col">
                <div class="base-time-picker__col-label">Min</div>
                <div class="base-time-picker__scroll">
                  <button 
                    v-for="m in minutes" 
                    :key="m"
                    class="base-time-picker__opt"
                    :class="{ 'is-active': selectedMinute === m }"
                    @click="selectMinute(m)"
                  >
                    {{ m }}
                  </button>
                </div>
              </div>

              <!-- Meridiem Column -->
              <div class="base-time-picker__col">
                <div class="base-time-picker__col-label">Merd</div>
                <div class="base-time-picker__scroll">
                  <button 
                    v-for="m in meridiems" 
                    :key="m"
                    class="base-time-picker__opt"
                    :class="{ 'is-active': selectedMeridiem === m }"
                    @click="selectMeridiem(m)"
                  >
                    {{ m }}
                  </button>
                </div>
              </div>
            </div>

            <div class="base-time-picker__footer">
              <button class="base-time-picker__done" @click="isOpen = false">
                Listo
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.base-time-picker {
  position: relative;
  width: 100%;
  user-select: none;

  &__trigger {
    background: rgba($primary-dark, 0.02);
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 14px;
    padding: 0.85rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.25s ease;
    min-height: 54px;

    &:hover {
      background: rgba($primary, 0.05);
      border-color: rgba($primary, 0.3);
    }
  }

  &.is-open &__trigger {
    border-color: $primary;
    background: $white;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }

  &.is-disabled &__trigger {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba($primary-dark, 0.05);
  }

  &__value {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 800;
    font-size: 1.1rem;
    color: $primary-dark;
  }

  &__sep {
    color: $primary;
    opacity: 0.5;
  }

  &__meridiem {
    background: rgba($primary, 0.08);
    color: $primary;
    font-size: 0.75rem;
    padding: 0.15rem 0.6rem;
    border-radius: 6px;
    margin-left: 0.5rem;
    text-transform: uppercase;
  }

  &__arrow {
    font-size: 0.8rem;
    color: $primary;
    opacity: 0.5;
    transition: transform 0.3s;

    .is-open & {
      transform: rotate(180deg);
      opacity: 1;
    }
  }

  &__panel-container {
    position: absolute;
    z-index: 9999;

    @media (max-width: 480px) {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
  }

  &__backdrop {
    display: none;
    
    @media (max-width: 480px) {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba($primary-dark, 0.4);
      backdrop-filter: blur(4px);
    }
  }

  &__panel {
    width: 280px;
    background: $white;
    border-radius: 20px;
    box-shadow: 
      0 15px 40px rgba($primary-dark, 0.2),
      0 0 0 1px rgba($primary-dark, 0.05);
    overflow: hidden;
    position: relative;

    @media (max-width: 480px) {
      width: 100%;
      max-width: 320px;
      animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  &__header {
    background: rgba($primary-dark, 0.02);
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    font-weight: 700;
    font-size: 0.9rem;
    color: $primary-dark;

    i {
      color: $primary;
    }
  }

  &__close-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    color: $text-secondary;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.5;
    transition: all 0.2s;
    padding: 5px;

    &:hover {
      opacity: 1;
      color: $alert-error;
    }

    display: none;
    @media (max-width: 480px) {
      display: flex;
    }
  }

  &__columns {
    display: flex;
    height: 240px;
    padding: 0.5rem;
  }

  &__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba($primary-dark, 0.03);

    &:last-child {
      border-right: none;
    }
  }

  &__col-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 800;
    color: $text-secondary;
    text-align: center;
    padding: 0.5rem 0;
    letter-spacing: 0.1em;
    opacity: 0.5;
  }

  &__scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 0.25rem;
    gap: 2px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba($primary, 0.15);
      border-radius: 10px;
    }
  }

  &__opt {
    border: none;
    background: transparent;
    padding: 0.6rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary, 0.05);
      color: $primary-dark;
    }

    &.is-active {
      background: $primary;
      color: $white;
      box-shadow: 0 4px 10px rgba($primary, 0.2);
    }
  }

  &__footer {
    padding: 0.75rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__done {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: $primary-dark;
    color: $white;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $primary;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba($primary, 0.2);
    }
  }
}

// Transitions
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 480px) {
  .picker-fade-enter-from,
  .picker-fade-leave-to {
    opacity: 0;
    .base-time-picker__backdrop {
      opacity: 0;
    }
    .base-time-picker__panel {
      transform: scale(0.9) translateY(30px);
    }
  }
}
</style>
