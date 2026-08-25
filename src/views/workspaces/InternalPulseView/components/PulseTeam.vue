<script setup lang="ts">
import { computed } from 'vue'
import type { PulseTeamMember } from '@/services/internalPulse.service'
import { money, rolLabel, iniciales, diaCorto } from '../utils/format'

const props = defineProps<{ team: PulseTeamMember[]; billed: number }>()

const asignados = computed(() => props.team.filter((m) => m.isInternal))
const externos = computed(() => props.team.filter((m) => !m.isInternal))

const share = (monto: number) => (props.billed > 0 ? (monto / props.billed) * 100 : 0)
</script>

<template>
  <section class="team">
    <header class="team__head">
      <h2 class="team__title">Equipo asignado</h2>
      <span class="team__count">{{ asignados.length }} de Bakano · {{ externos.length }} del cliente</span>
    </header>

    <p v-if="!team.length" class="team__empty">
      Ningún usuario interno está asignado a este cliente. Asígnalo desde Usuarios para que reciba
      los recordatorios de meta.
    </p>

    <ul v-else class="team__list">
      <li v-for="m in team" :key="m.userId" class="team__item">
        <span class="team__avatar" :class="{ 'team__avatar--ext': !m.isInternal }">
          <img v-if="m.photoUrl" :src="m.photoUrl" :alt="m.name" />
          <template v-else>{{ iniciales(m.name) }}</template>
        </span>

        <div class="team__info">
          <p class="team__name">
            {{ m.name }}
            <span v-if="!m.isInternal" class="team__tag">cliente</span>
          </p>
          <p class="team__role">{{ m.isInternal ? rolLabel(m.internalRole) : m.email }}</p>
        </div>

        <div class="team__data">
          <p class="team__amount">{{ money(m.amount, true) }}</p>
          <p class="team__meta">
            {{ m.entryCount }} {{ m.entryCount === 1 ? 'registro' : 'registros' }}
            <template v-if="m.lastEntryDate"> · últ. {{ diaCorto(m.lastEntryDate) }}</template>
          </p>
        </div>

        <div class="team__bar" :style="{ '--share': `${Math.min(share(m.amount), 100)}%` }" />
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.team {
  border: 1px solid #e8e6ef;
  border-radius: 18px;
  padding: 1.15rem 1.25rem;
  background: $white;
}

.team__head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; }
.team__title { margin: 0; color: $primary-dark; font-size: 1rem; font-weight: 800; }
.team__count { color: $text-secondary; font-size: 0.75rem; font-weight: 600; }
.team__empty { margin: 0; color: $text-secondary; font-size: 0.85rem; line-height: 1.55; }

.team__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }

.team__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  border: 1px solid #f0eef5;
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  background: #fbfafd;
}

.team__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.35rem;
  height: 2.35rem;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary, $secondary);
  color: $white;
  font-size: 0.78rem;
  font-weight: 800;

  img { width: 100%; height: 100%; object-fit: cover; }

  &--ext { background: linear-gradient(135deg, #94a3b8, #64748b); }
}

.team__info { flex: 1; min-width: 0; }

.team__name {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: $primary-dark;
  font-size: 0.88rem;
  font-weight: 700;
}

.team__tag {
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
  background: #eef2f7;
  color: $text-secondary;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
}

.team__role { margin: 0.1rem 0 0; color: $text-secondary; font-size: 0.75rem; }
.team__data { text-align: right; flex-shrink: 0; }
.team__amount { margin: 0; color: $primary-dark; font-size: 0.9rem; font-weight: 800; }
.team__meta { margin: 0.1rem 0 0; color: $text-secondary; font-size: 0.7rem; }

.team__bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: var(--share);
  background: linear-gradient(90deg, $primary, $secondary);
}
</style>
