<script setup lang="ts">
import type { BotAcceso } from '@/types'

/**
 * A qué agentes entra una persona del cliente en un entorno: Bakano People,
 * Lucas o los dos. Se elige siempre a conciencia (hay quien solo vende con
 * Lucas y no necesita el bot de Bakano ni el acceso a Metrics, y al revés).
 */
const bots = defineModel<BotAcceso[]>({ required: true })

const AGENTES: { value: BotAcceso; nombre: string; icono: string; que: string }[] = [
  {
    value: 'bakano',
    nombre: 'Bakano People',
    icono: 'fa-solid fa-robot',
    que: 'Su canal con Bakano: citas, guiones, producción, onboarding y facturación. Incluye el acceso a Metrics.',
  },
  {
    value: 'lucas',
    nombre: 'Lucas',
    icono: 'fa-solid fa-comments-dollar',
    que: 'Su asesor de ventas: le dice qué responderle a cada cliente para cerrar la venta.',
  },
]

function alternar(bot: BotAcceso) {
  const actuales = bots.value
  bots.value = actuales.includes(bot)
    ? actuales.filter((b) => b !== bot)
    : AGENTES.map((a) => a.value).filter((b) => b === bot || actuales.includes(b))
}
</script>

<template>
  <div class="agentes-selector">
    <span class="agentes-selector__label">¿A qué tendrá acceso? <span class="agentes-selector__req">*</span></span>
    <div class="agentes-selector__grid" role="group" aria-label="Agentes a los que tendrá acceso">
      <button
        v-for="a in AGENTES"
        :key="a.value"
        type="button"
        class="agente"
        :class="[`agente--${a.value}`, { 'is-active': bots.includes(a.value) }]"
        :aria-pressed="bots.includes(a.value)"
        @click="alternar(a.value)"
      >
        <span class="agente__check"><i :class="bots.includes(a.value) ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" /></span>
        <i :class="[a.icono, 'agente__icono']" />
        <span class="agente__texto">
          <strong>{{ a.nombre }}</strong>
          <small>{{ a.que }}</small>
        </span>
      </button>
    </div>
    <small class="agentes-selector__ayuda">Puedes marcar uno o los dos.</small>
  </div>
</template>

<style lang="scss" scoped>
.agentes-selector { display: flex; flex-direction: column; gap: 0.45rem; }

.agentes-selector__label { font-size: 0.85rem; font-weight: 700; color: #0a192f; }
.agentes-selector__req { color: #dc2626; }

.agentes-selector__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;

  @media (max-width: 520px) { grid-template-columns: 1fr; }
}

.agente {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.8rem;
  border: 1.5px solid rgba(#0a192f, 0.12);
  border-radius: 12px;
  background: #fff;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &__check i { font-size: 1rem; color: #94a3b8; }
  &__icono { font-size: 1.05rem; margin-top: 0.1rem; }
  &__texto { display: flex; flex-direction: column; gap: 0.2rem; }
  strong { font-size: 0.86rem; color: #0a192f; }
  small { font-size: 0.74rem; line-height: 1.4; color: #64748b; }

  &--bakano &__icono { color: #e6285c; }
  &--lucas &__icono { color: #0e9f6e; }

  &:hover { border-color: rgba(#0a192f, 0.25); }

  &.is-active.agente--bakano {
    border-color: #e6285c;
    background: rgba(#e6285c, 0.05);
    .agente__check i { color: #e6285c; }
  }
  &.is-active.agente--lucas {
    border-color: #0e9f6e;
    background: rgba(#0e9f6e, 0.06);
    .agente__check i { color: #0e9f6e; }
  }
}

.agentes-selector__ayuda { font-size: 0.74rem; color: #64748b; }
</style>
