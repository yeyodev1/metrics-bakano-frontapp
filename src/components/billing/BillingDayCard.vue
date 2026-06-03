<template>
  <div
    class="day-card"
    :class="[
      `day-card--${viewMode}`,
      {
        'day-today': isToday(day.date),
        'day-has-data': day.entryCount > 0,
        'day-pending': canRegister,
        'day-empty': day.entryCount === 0 && !canRegister,
      }
    ]"
  >
    <!-- GRID VIEW -->
    <template v-if="viewMode === 'grid'">
      <div class="day-card__header">
        <div class="date-info">
          <span class="date-info__number">{{ dayNumber(day.date) }}</span>
          <div class="date-info__text">
            <span class="date-info__name">{{ dayName(day.date) }}</span>
            <span v-if="isToday(day.date)" class="today-badge">Hoy</span>
          </div>
        </div>
        <div class="roas-pill" :class="roasPillClass(day.avgROAS)">
          <span class="roas-label">ROAS</span>
          <span class="roas-value">{{ day.avgROAS > 0 ? day.avgROAS.toFixed(2) + 'x' : '—' }}</span>
        </div>
      </div>

    <!-- Summary Amounts (Only if there is data) -->
    <div v-if="day.entryCount > 0" class="day-card__amounts">
      <div class="amount-item amount-item--billed">
        <div class="amount-item__label">
          <i class="fa-solid fa-dollar-sign" /> Facturado
        </div>
        <div class="amount-item__val">${{ formatAmount(day.totalAmount) }}</div>
      </div>
      <div v-if="day.totalMetaSpend > 0" class="amount-item amount-item--meta">
        <div class="amount-item__label">
          <i class="fa-brands fa-meta" /> Inversión
        </div>
        <div class="amount-item__val">${{ formatAmount(day.totalMetaSpend) }}</div>
      </div>
    </div>

    <!-- Entries -->
    <div v-if="day.entries?.length" class="day-card__entries">
      <div
        v-for="entry in day.entries"
        :key="entry._id"
        class="entry-row"
        :class="{ 'entry-row--mine': isMyEntry(entry) }"
      >
        <div class="entry-row__main">
          <div class="entry-avatar">{{ entry.userName.charAt(0).toUpperCase() }}</div>
          <div class="entry-details">
            <span class="entry-name">{{ shortName(entry.userName) }} <span v-if="isMyEntry(entry)" class="entry-mine-tag">yo</span></span>
            <span class="entry-amount">${{ formatAmount(entry.amount) }}</span>
          </div>
          <button
            v-if="canEditEntry(entry, day.date)"
            class="entry-edit-btn"
            title="Editar"
            @click.stop="$emit('edit-entry', { entry, date: dateStr(day.date), total: day.totalAmount })"
          >
            <i class="fa-solid fa-pen" />
          </button>
        </div>
        <div v-if="entry.branches?.length" class="entry-branches">
          <span v-for="b in entry.branches" :key="b.branchId" class="branch-chip">
            {{ b.name }}: ${{ formatAmount(b.amount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Pending CTA (no entry yet and user can register) -->
    <div v-if="canRegister" class="day-card__cta" :class="{ 'day-card__cta--today': isToday(day.date) }">
      <div class="cta-message">
        <i class="fa-solid fa-circle-exclamation" />
        <span>{{ isToday(day.date) ? 'Aún no registraste hoy' : 'Sin registros' }}</span>
      </div>
      <button class="btn-register" @click="$emit('add-entry', { date: dateStr(day.date), total: day.totalAmount })">
        <i class="fa-solid fa-plus" />
        {{ isToday(day.date) ? 'Registrar ahora' : 'Añadir' }}
      </button>
    </div>

      <!-- Empty State -->
      <div v-else-if="day.entryCount === 0" class="day-card__empty">
        <i class="fa-solid fa-lock" /> Sin acceso a datos
      </div>
    </template>

    <!-- LIST VIEW -->
    <template v-else>
      <div class="day-strip">
        <div class="day-strip__date">
          <span class="day-number">{{ dayNumber(day.date) }}</span>
          <span class="day-name">{{ dayName(day.date) }}</span>
          <span v-if="isToday(day.date)" class="today-badge">Hoy</span>
        </div>

        <div v-if="day.entryCount > 0" class="day-strip__amounts">
          <span class="amount-billed" title="Facturado">
            <i class="fa-solid fa-dollar-sign" />
            ${{ formatAmount(day.totalAmount) }}
          </span>
          <span v-if="day.totalMetaSpend > 0" class="amount-meta" title="Inversión Meta">
            <i class="fa-brands fa-meta" />
            ${{ formatAmount(day.totalMetaSpend) }}
          </span>
        </div>

        <div class="day-strip__roas" :class="roasPillClass(day.avgROAS)">
          {{ day.avgROAS > 0 ? day.avgROAS.toFixed(2) + 'x' : '—' }}
        </div>
      </div>

      <!-- Entries -->
      <div v-if="day.entries?.length" class="entry-list">
        <div
          v-for="entry in day.entries"
          :key="entry._id"
          class="entry-row entry-row--list"
          :class="{ 'entry-row--mine': isMyEntry(entry) }"
        >
          <div class="entry-avatar">{{ entry.userName.charAt(0).toUpperCase() }}</div>
          <div class="entry-details">
            <span class="entry-name">{{ shortName(entry.userName) }}</span>
            <span v-if="isMyEntry(entry)" class="entry-mine-tag">yo</span>
          </div>
          <span class="entry-amount">${{ formatAmount(entry.amount) }}</span>
          <button
            v-if="canEditEntry(entry, day.date)"
            class="entry-edit-btn"
            @click.stop="$emit('edit-entry', { entry, date: dateStr(day.date), total: day.totalAmount })"
          >
            <i class="fa-solid fa-pen-to-square" /> Editar
          </button>
          <div v-if="entry.branches?.length" class="entry-branches">
            <span v-for="b in entry.branches" :key="b.branchId" class="entry-branch-chip">
              <i class="fa-solid fa-store" />
              {{ b.name }}: ${{ formatAmount(b.amount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pending CTA -->
      <div v-if="canRegister" class="day-pending-cta" :class="{ 'day-pending-cta--today': isToday(day.date) }">
        <div class="day-pending-cta__left">
          <i class="fa-solid fa-circle-exclamation" />
          <span>{{ isToday(day.date) ? 'Aún no registraste hoy' : 'Facturación pendiente' }}</span>
        </div>
        <button class="btn-register-pending" @click="$emit('add-entry', { date: dateStr(day.date), total: day.totalAmount })">
          <i class="fa-solid fa-plus" />
          {{ isToday(day.date) ? 'Registrar ahora' : 'Completar' }}
        </button>
      </div>

      <div v-else-if="day.entryCount === 0" class="no-data-row">
        <i class="fa-solid fa-lock" /> Sin acceso / Sin datos
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  day: any
  todayStr: string
  canEnterBilling: boolean
  canRegister: boolean
  viewMode: 'list' | 'grid'
}>()

defineEmits<{
  (e: 'add-entry', payload: { date: string; total: number }): void
  (e: 'edit-entry', payload: { entry: any; date: string; total: number }): void
}>()

const userStore = useUserStore()

function dateStr(date: string): string { return date.substring(0, 10) }
function isToday(date: string) { return dateStr(date) === props.todayStr }
function dayNumber(date: string) { return new Date(dateStr(date) + 'T12:00:00').getDate().toString() }
function dayName(date: string) { return new Date(dateStr(date) + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short' }) }
function formatAmount(val: number) { return val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function isMyEntry(entry: any): boolean {
  return (!!userStore.id && entry.userId === userStore.id) ||
         (!!userStore.email && entry.userEmail === userStore.email)
}

function shortName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return name
  return `${parts[0]} ${parts[1].charAt(0)}.`
}

function canEditEntry(entry: any, entryDate: string): boolean {
  if (!props.canEnterBilling) return false
  if (userStore.role === 'superadmin') return true
  const isOwner = isMyEntry(entry)
  if (!isOwner) return false
  const entryTime = new Date(dateStr(entryDate) + 'T12:00:00').getTime()
  const todayTime = new Date(props.todayStr + 'T12:00:00').getTime()
  const diffDays = Math.round((todayTime - entryTime) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

function roasPillClass(roas: number) {
  if (!roas) return 'pill-none'
  if (roas >= 3) return 'pill-good'
  if (roas >= 1) return 'pill-medium'
  return 'pill-bad'
}
</script>

<style scoped lang="scss">
@import '@/styles/colorVariables.module.scss';

.day-card {
  background: $white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);

  &--grid {
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }

  &.day-today {
    border: 2px solid $primary;
    box-shadow: 0 8px 24px rgba($primary, 0.15);
  }

  &.day-pending {
    border-color: #fbd38d;
    background: #fffdf5;
  }
}

.day-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12px;

  &__number {
    font-size: 26px;
    font-weight: 900;
    color: $primary-dark;
    line-height: 1;
  }

  &__text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  &__name {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .today-badge {
    background: $primary;
    color: $white;
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.roas-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 4px 10px;
  border-radius: 8px;
  min-width: 60px;
  text-align: right;

  .roas-label {
    font-size: 10px;
    font-weight: 700;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .roas-value {
    font-size: 14px;
    font-weight: 800;
  }

  &.pill-none { background: #f1f5f9; color: #64748b; }
  &.pill-good { background: #dcfce7; color: #16a34a; }
  &.pill-medium { background: #fef9c3; color: #ca8a04; }
  &.pill-bad { background: #fee2e2; color: #dc2626; }
}

.day-card__amounts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #f1f5f9;
  border-bottom: 1px solid #f1f5f9;

  .amount-item {
    background: $white;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &__label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    &__val {
      font-size: 16px;
      font-weight: 800;
      color: $primary-dark;
    }

    &--billed .amount-item__label i { color: #059669; }
    &--meta .amount-item__label i { color: #3b82f6; }
  }
}

.day-card__entries {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  flex: 1;
}

.entry-row {
  background: $white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &--mine {
    border-color: rgba($primary, 0.3);
    background: rgba($primary, 0.02);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .entry-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #e2e8f0;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .entry-details {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .entry-name {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entry-mine-tag {
    background: $primary;
    color: $white;
    font-size: 9px;
    padding: 2px 4px;
    border-radius: 4px;
    margin-left: 4px;
  }

  .entry-amount {
    font-size: 15px;
    font-weight: 800;
    color: $primary-dark;
  }

  .entry-edit-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f1f5f9;
      color: $primary-dark;
    }
  }

  .entry-branches {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px dashed #e2e8f0;

    .branch-chip {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 6px;
    }
  }
}

.day-card__cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fffaf0;
  border-top: 1px solid #fef3c7;
  margin-top: auto;

  &--today {
    background: rgba($primary, 0.05);
    border-top-color: rgba($primary, 0.1);
    .cta-message { color: $primary; }
  }

  .cta-message {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #d97706;
    font-weight: 600;
    font-size: 13px;
  }

  .btn-register {
    background: $primary;
    color: $white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;

    &:hover {
      background: lighten($primary, 5%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($primary, 0.2);
    }
  }
}

.day-card__empty {
  padding: 16px;
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
  margin-top: auto;
}

/* === LIST VIEW STYLES === */
.day-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: transparent;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 16px;

  &__date {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 120px;

    .day-number {
      font-size: 20px;
      font-weight: 800;
      color: $primary-dark;
      width: 28px;
      text-align: right;
    }

    .day-name {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      text-transform: capitalize;
    }

    .today-badge {
      background: $primary;
      color: $white;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  &__amounts {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: flex-end;

    .amount-billed, .amount-meta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 700;
      color: $primary-dark;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 8px;

      i { font-size: 14px; }
    }

    .amount-billed i { color: #059669; }
    .amount-meta i { color: #3b82f6; }

    @media (max-width: 640px) {
      justify-content: flex-start;
      width: 100%;
    }
  }

  &__roas {
    font-size: 14px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 100px;
    text-align: center;
    min-width: 80px;

    &.pill-none { background: #f1f5f9; color: #94a3b8; }
    &.pill-good { background: #dcfce7; color: #16a34a; }
    &.pill-medium { background: #fef9c3; color: #ca8a04; }
    &.pill-bad { background: #fee2e2; color: #dc2626; }
  }
}

.entry-list {
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
}

.entry-row--list {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: $white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  flex-direction: row;

  .entry-avatar {
    width: 28px;
    height: 28px;
  }

  .entry-details {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 120px;
  }

  .entry-name {
    font-size: 13px;
    white-space: normal;
  }

  .entry-edit-btn {
    width: auto;
    padding: 4px 8px;
    font-size: 12px;
    background: none;
    gap: 4px;

    &:hover {
      background: #e2e8f0;
    }
  }

  .entry-branches {
    width: 100%;
    border-top: none;
    padding-top: 0;
    margin-top: 4px;

    .entry-branch-chip {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.day-pending-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fffaf0;
  gap: 16px;
  flex-wrap: wrap;

  &--today {
    background: rgba($primary, 0.05);
    .day-pending-cta__left { color: $primary; }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #d97706;
    font-weight: 600;
    font-size: 14px;
  }

  .btn-register-pending {
    background: $primary;
    color: $white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;

    &:hover {
      background: lighten($primary, 5%);
      transform: translateY(-1px);
    }
  }
}

.no-data-row {
  padding: 16px 20px;
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
}
</style>
