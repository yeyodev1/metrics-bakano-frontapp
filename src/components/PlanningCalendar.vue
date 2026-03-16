<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { planningService } from '@/services/planning.service'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { PlanningEntry, CreatePlanningEntryPayload } from '@/types'

import BaseTimePicker from './common/BaseTimePicker.vue'

const props = defineProps({
  workspaceId: {
    type: String,
    required: true,
  },
})

const userStore = useUserStore()
const toast = useToast()
const confirm = useConfirm()

// ── State ──────────────────────────────────────────────────
const entries = ref<PlanningEntry[]>([])
const isLoading = ref(true)
const currentMonth = ref(new Date())
const showModal = ref(false)
const isSaving = ref(false)

// Form State
const selectedEntry = ref<PlanningEntry | null>(null)
const form = ref<CreatePlanningEntryPayload>({
  title: '',
  date: '',
  time: '',
  notes: '',
})

// ── Computed ───────────────────────────────────────────────
const canManage = computed(() => {
  // Superadmin or Internal Collaborator (Bakano Team) can manage
  if (userStore.role === 'superadmin' || userStore.isInternal) return true
  
  // Per-workspace admin check for client users
  const wsAccess = userStore.workspaces?.find((w: any) => {
    const wsId = typeof w.workspaceId === 'object' ? w.workspaceId._id : w.workspaceId
    return wsId === props.workspaceId
  })
  return wsAccess?.role === 'admin'
})

const daysInMonth = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  
  // Padding for start of week (Sunday start for simplicity, adjust for Monday if needed)
  const startDay = firstDay.getDay()
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }
  
  return days
})

const monthYearLabel = computed(() => {
  return currentMonth.value.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

// ── Methods ────────────────────────────────────────────────
async function fetchEntries() {
  isLoading.value = true
  try {
    const start = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1).toISOString()
    const end = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0).toISOString()
    
    const response = await planningService.listEntries(props.workspaceId as string, { startDate: start, endDate: end })
    entries.value = response.entries
  } catch (err) {
    toast.error('Error al cargar la planificación')
  } finally {
    isLoading.value = false
  }
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
  fetchEntries()
}

function prevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
  fetchEntries()
}

function getEntriesForDay(day: Date | null) {
  if (!day) return []
  // Target date in YYYY-MM-DD format (local to the calendar grid)
  const targetDate = day.toLocaleDateString('en-CA') 
  
  return entries.value.filter(e => {
    // Entry date converted to Ecuador YYYY-MM-DD
    const entryEctDate = new Date(e.date).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
    return entryEctDate === targetDate
  }).sort((a, b) => a.date.localeCompare(b.date))
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'America/Guayaquil'
  })
}

function isToday(day: Date | null) {
  if (!day) return false
  const targetDate = day.toLocaleDateString('en-CA')
  const ectNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return targetDate === ectNow
}

function isPast(day: Date | null) {
  if (!day) return false
  const targetDate = day.toLocaleDateString('en-CA')
  const ectNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return targetDate < ectNow
}

function openCreate(day?: Date) {
  if (!canManage.value) return
  selectedEntry.value = null
  
  // Get current time in Ecuador
  const ectTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: 'America/Guayaquil' 
  })

  form.value = {
    title: '',
    date: day ? (day.toISOString().split('T')[0] ?? '') : (new Date().toISOString().split('T')[0] ?? ''),
    time: ectTime,
    notes: '',
  }
  showModal.value = true
}

function openEdit(entry: PlanningEntry) {
  if (!canManage.value) return
  selectedEntry.value = entry
  
  // Extract date and time in Ecuador timezone
  const entryDate = new Date(entry.date)
  const d = entryDate.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) // YYYY-MM-DD
  const t = entryDate.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: 'America/Guayaquil' 
  })

  form.value = {
    title: entry.title,
    date: d,
    time: t,
    notes: entry.notes || '',
  }
  showModal.value = true
}

async function handleSave() {
  if (isSaving.value || !props.workspaceId) return
  isSaving.value = true
  try {
    // Combine date and time as Ecuador ISO (UTC-5)
    // format: YYYY-MM-DDTHH:mm:00-05:00
    const fullIsoDate = `${form.value.date}T${form.value.time}:00-05:00`
    
    const payload = {
      ...form.value,
      date: fullIsoDate
    }

    if (selectedEntry.value) {
      await planningService.updateEntry(selectedEntry.value._id, payload)
      toast.success('Entrada actualizada')
    } else {
      await planningService.createEntry(props.workspaceId as string, payload)
      toast.success('Entrada creada')
    }
    showModal.value = false
    fetchEntries()
  } catch (err) {
    toast.error('Error al guardar')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  if (!selectedEntry.value) return
  const isConfirmed = await confirm.confirm({
    title: '¿Eliminar entrada?',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    requireHold: true,
  })
  
  if (isConfirmed) {
    try {
      await planningService.deleteEntry(selectedEntry.value._id)
      toast.success('Entrada eliminada')
      showModal.value = false
      fetchEntries()
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }
}

onMounted(fetchEntries)
</script>

<template>
  <div class="planning-calendar">
    <div class="planning-calendar__header">
      <div class="planning-calendar__title">
        <i class="fa-solid fa-calendar-days" />
        <h2>Planificación de Ingresos</h2>
      </div>
      
      <div class="planning-calendar__controls">
        <button class="planning-calendar__nav-btn" @click="prevMonth">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <span class="planning-calendar__month">{{ monthYearLabel }}</span>
        <button class="planning-calendar__nav-btn" @click="nextMonth">
          <i class="fa-solid fa-chevron-right" />
        </button>
        
        <button v-if="canManage" class="planning-calendar__add-btn" @click="openCreate()">
          <i class="fa-solid fa-plus" />
          <span>Añadir Evento</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="planning-calendar__loading">
      <div class="planning-calendar__spinner" />
    </div>

    <div v-else class="planning-calendar__grid">
      <!-- Week Headers -->
      <div v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']" :key="day" class="planning-calendar__weekday">
        {{ day }}
      </div>
      
      <!-- Days -->
      <div
        v-for="(day, index) in daysInMonth"
        :key="index"
        class="planning-calendar__day"
        :class="{ 
          'planning-calendar__day--empty': !day,
          'planning-calendar__day--clickable': day && canManage,
          'planning-calendar__day--today': isToday(day),
          'planning-calendar__day--past': isPast(day)
        }"
        @click="day && canManage && openCreate(day)"
      >
        <div v-if="day" class="planning-calendar__day-content">
          <span class="planning-calendar__day-number">{{ day.getDate() }}</span>
          <div class="planning-calendar__day-entries">
            <div
              v-for="entry in getEntriesForDay(day)"
              :key="entry._id"
              class="planning-calendar__entry"
              :class="{ 'planning-calendar__entry--past': isPast(day) }"
              @click.stop="openEdit(entry)"
            >
              <span class="planning-calendar__entry-time">{{ formatTime(entry.date) }}</span>
              <span class="planning-calendar__entry-title">{{ entry.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <Transition name="modal">
      <div v-if="showModal" class="planning-calendar__overlay" @click.self="showModal = false">
        <div class="planning-calendar__modal">
          <div class="planning-calendar__modal-header">
            <div class="planning-calendar__modal-title">
              <i :class="selectedEntry ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-calendar-plus'" />
              <h3>{{ selectedEntry ? 'Editar' : 'Nueva' }} Planificación</h3>
            </div>
            <button class="planning-calendar__close-btn" @click="showModal = false">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          
          <form @submit.prevent="handleSave" class="planning-calendar__form">
            <div class="planning-calendar__form-main">
              <div class="planning-calendar__form-group">
                <label>Título / Actividad</label>
                <div class="planning-calendar__input-wrapper">
                  <i class="fa-solid fa-heading" />
                  <input v-model="form.title" type="text" placeholder="Ej: Ingreso Backup" required :disabled="!canManage" />
                </div>
              </div>
              
              <div class="planning-calendar__form-row">
                <div class="planning-calendar__form-group">
                  <label>Fecha</label>
                  <div class="planning-calendar__input-wrapper">
                    <i class="fa-solid fa-calendar-day" />
                    <input v-model="form.date" type="date" required :disabled="!canManage" />
                  </div>
                </div>

                <div class="planning-calendar__form-group planning-calendar__form-group--time">
                  <label>
                    <i class="fa-solid fa-clock-rotate-left" />
                    <span>Hora</span>
                    <span class="planning-calendar__timezone-tag">ECT (UTC-5)</span>
                  </label>
                  <BaseTimePicker v-model="form.time" :disabled="!canManage" />
                </div>
              </div>
              
              <div class="planning-calendar__form-group">
                <label>Notas adicionales</label>
                <div class="planning-calendar__input-wrapper planning-calendar__input-wrapper--textarea">
                  <i class="fa-solid fa-note-sticky" />
                  <textarea v-model="form.notes" placeholder="Detalles de la visita, requerimientos..." :disabled="!canManage" />
                </div>
              </div>
            </div>
            
            <div v-if="canManage" class="planning-calendar__modal-footer">
              <button v-if="selectedEntry" type="button" class="planning-calendar__btn-danger" @click="handleDelete">
                <i class="fa-solid fa-trash-can" />
                <span>Eliminar</span>
              </button>
              <div class="planning-calendar__modal-spacer" />
              <button type="button" class="planning-calendar__btn-ghost" @click="showModal = false">Cancelar</button>
              <button type="submit" class="planning-calendar__btn-primary" :disabled="isSaving">
                <span v-if="!isSaving">{{ selectedEntry ? 'Actualizar' : 'Guardar' }}</span>
                <span v-else class="planning-calendar__spinner planning-calendar__spinner--sm" />
              </button>
            </div>
            <div v-else class="planning-calendar__modal-footer">
               <button type="button" class="planning-calendar__btn-primary" @click="showModal = false">Cerrar</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.planning-calendar {
  background: $white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba($primary-dark, 0.04);
  border: 1px solid rgba($primary-dark, 0.05);

  @media (min-width: 768px) {
    padding: 2.5rem;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    
    i {
      font-size: 1.75rem;
      background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    h2 {
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: -0.02em;
      color: $primary-dark;
      font-weight: 700;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  &__month {
    font-weight: 700;
    text-transform: capitalize;
    min-width: 160px;
    text-align: center;
    font-size: 1.1rem;
    color: $primary-dark;
  }

  &__nav-btn {
    background: rgba($primary, 0.08);
    border: none;
    color: $primary;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: $primary;
      color: $white;
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &__add-btn {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 8%) 100%);
    border: none;
    color: $white;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba($primary, 0.2);
    transition: all 0.25s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 25px rgba($primary, 0.3);
      filter: brightness(1.05);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba($primary-dark, 0.08);
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  }

  &__weekday {
    background: rgba($primary, 0.03);
    padding: 1.25rem;
    text-align: center;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-secondary;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__day {
    background: $white;
    min-height: 140px;
    padding: 1rem;
    transition: all 0.2s ease;
    
    &:not(&--empty):hover {
      background: rgba($primary, 0.01);
    }
    
    &--clickable {
      cursor: pointer;

      &:hover {
        background: rgba($primary, 0.02);
      }
    }

    &--today {
      position: relative;
      background: rgba($primary, 0.02);
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: $primary;
      }

      .planning-calendar__day-number {
        color: $primary;
        opacity: 1;
      }
    }

    &--past {
      background: rgba($primary-dark, 0.015);
      
      .planning-calendar__day-number {
        opacity: 0.2;
      }

      &:hover {
        background: rgba($primary-dark, 0.025);
      }
    }
    
    &--empty {
      background: rgba($primary-dark, 0.01);
    }
  }

  &__day-number {
    font-weight: 800;
    font-size: 1rem;
    color: rgba($primary-dark, 0.3);
    margin-bottom: 0.75rem;
    display: block;
    transition: color 0.2s;

    .planning-calendar__day:not(.planning-calendar__day--empty):hover & {
      color: $primary;
    }
  }

  &__day-entries {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__entry {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 0 3px 6px rgba($primary, 0.15);
    transition: all 0.2s;
    border-left: 3px solid rgba($white, 0.3);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      transform: translateX(3px) scale(1.02);
      filter: brightness(1.1);
      box-shadow: 0 5px 12px rgba($primary, 0.25);
    }

    &--past {
      background: linear-gradient(135deg, grayscale($primary) 0%, darken(grayscale($primary), 10%) 100%);
      opacity: 0.5;
      filter: grayscale(0.5);
      border-left-color: rgba($white, 0.1);
      box-shadow: none;

      &:hover {
        opacity: 0.8;
        transform: translateX(2px);
      }
    }
  }

  &__entry-time {
    font-weight: 700;
    font-size: 0.65rem;
    color: $primary;
    background: rgba($white, 0.95);
    padding: 0.15rem 0.4rem;
    border-radius: 5px;
    letter-spacing: 0.02em;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;

    .planning-calendar__entry--past & {
      background: rgba($white, 0.5);
      color: $text-secondary;
      box-shadow: none;
    }
  }

  &__entry-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // Mobile adjustments
  @media (max-width: 768px) {
    padding: 1rem;
    
    &__grid {
      grid-template-columns: repeat(1, 1fr);
      gap: 0;
    }
    
    &__weekday {
      display: none;
    }
    
    &__day {
      min-height: auto;
      border-bottom: 1px solid rgba($primary-dark, 0.03);
      padding: 1.25rem 1rem;
      
      &--empty {
        display: none;
      }
    }
    
    &__day-number {
      font-size: 1.1rem;
      margin-bottom: 0;
      min-width: 40px;
      color: $primary;
    }
    
    &__day-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    &__day-entries {
      flex: 1;
    }
  }

  // ── Modal Redesign ───────────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1.5rem;
    animation: fadeIn 0.3s ease;
  }

  &__modal {
    background: $white;
    width: 100%;
    max-width: 540px;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__modal-header {
    padding: 1.75rem 2rem;
    background: linear-gradient(to bottom, rgba($primary, 0.03), transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__modal-title {
    display: flex;
    align-items: center;
    gap: 1rem;

    i {
      font-size: 1.5rem;
      color: $primary;
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: $primary-dark;
      letter-spacing: -0.01em;
    }
  }

  &__close-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba($primary-dark, 0.04);
    color: $text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s;

    &:hover {
      background: $alert-error-bg;
      color: $alert-error;
      transform: rotate(90deg);
    }
  }

  &__form {
    padding: 0;
  }

  &__form-main {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  &__form-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;
    
    label {
      font-size: 0.85rem;
      font-weight: 700;
      color: $primary-dark;
      letter-spacing: 0.02em;
      margin-left: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-transform: uppercase;
      opacity: 0.8;
      
      i {
        font-size: 0.9rem;
        color: $primary;
      }
    }

    &--time {
      max-width: 220px;
      
      @media (max-width: 480px) {
        max-width: none;
      }
    }
  }

  &__timezone-tag {
    font-size: 0.6rem;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 15%) 100%);
    color: $white;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    font-weight: 900;
    text-transform: uppercase;
    box-shadow: 0 2px 5px rgba($primary, 0.2);
    letter-spacing: 0.03em;
  }

  &__form-row {
    display: flex;
    gap: 1.5rem;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 1.75rem;
    }
  }

  &__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    i {
      position: absolute;
      left: 1.15rem;
      color: $text-secondary;
      font-size: 0.95rem;
      pointer-events: none;
      opacity: 0.7;
      transition: color 0.2s;
    }

    input, textarea {
      width: 100%;
      padding: 0.85rem 1rem 0.85rem 3rem;
      border-radius: 14px;
      border: 1.5px solid rgba($primary-dark, 0.1);
      background: rgba($primary-dark, 0.02);
      font-family: inherit;
      font-size: 1rem;
      color: $primary-dark;
      transition: all 0.25s ease;
      
      &::placeholder {
        color: rgba($text-secondary, 0.5);
      }

      &:disabled {
        background: rgba($primary-dark, 0.05);
        cursor: not-allowed;
        opacity: 0.7;
      }

      &:focus {
        outline: none;
        border-color: $primary;
        background: $white;
        box-shadow: 0 0 0 4px rgba($primary, 0.1);

        ~ i {
          color: $primary;
          opacity: 1;
        }
      }
    }

    &--textarea {
      align-items: flex-start;

      i {
        top: 1rem;
      }

      textarea {
        min-height: 120px;
        padding-top: 0.85rem;
        resize: vertical;
      }
    }
  }

  &__modal-footer {
    padding: 1.5rem 2rem 2rem;
    background: rgba($primary-dark, 0.02);
    display: flex;
    align-items: center;
    gap: 1rem;
    border-top: 1px solid rgba($primary-dark, 0.05);

    @media (max-width: 480px) {
      flex-direction: column-reverse;
      align-items: stretch;
      
      .planning-calendar__modal-spacer {
        display: none;
      }
    }
  }

  &__modal-spacer {
    flex: 1;
  }

  &__btn-ghost {
    background: transparent;
    border: none;
    color: $text-secondary;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.05);
      color: $primary-dark;
    }
  }

  &__btn-primary {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    border: none;
    padding: 0.85rem 2rem;
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba($primary, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 140px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba($primary, 0.4);
      filter: brightness(1.05);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      background: #ccc;
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  &__btn-danger {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
    border: 1.5px solid rgba($alert-error, 0.1);
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.25s;

    &:hover {
      background: $alert-error;
      color: $white;
      box-shadow: 0 4px 12px rgba($alert-error, 0.2);
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 6rem 0;
  }

  &__spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba($primary, 0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    
    &--sm {
      width: 20px;
      height: 20px;
      border-width: 2px;
      border-top-color: $white;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-enter-active {
  animation: fadeIn 0.3s ease;
}
.modal-leave-active {
  animation: fadeIn 0.3s ease reverse;
}
.modal-enter-from .planning-calendar__modal,
.modal-leave-to .planning-calendar__modal {
  animation: slideUp 0.3s ease reverse;
}
</style>
