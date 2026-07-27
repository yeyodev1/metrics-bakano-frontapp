<script setup lang="ts">
import type { BookingExpert } from './booking.types'

defineProps<{ experts: BookingExpert[] }>()
defineEmits<{ select: [expert: BookingExpert] }>()
</script>

<template>
  <section class="selection">
    <header class="selection__hero">
      <span class="selection__badge">Agenda una reunión</span>
      <h1>¿Con quién necesitas hablar?</h1>
      <p>Selecciona a la persona adecuada según tu consulta. Cada reunión está diseñada para un propósito específico.</p>
    </header>

    <div class="selection__cards">
      <button v-for="expert in experts" :key="expert.key" class="expert-card" :class="{ 'expert-card--sales': expert.key === 'ventas' }" :style="{ '--accent': expert.color, '--accent-bg': expert.accentBg, '--accent-gradient': expert.gradient, '--shadow': expert.shadowColor }" @click="$emit('select', expert)">
        <div class="expert-card__photo"><img :src="expert.photo" :alt="expert.name" /></div>
        <strong>{{ expert.name }}</strong>
        <span>{{ expert.role }}</span>
        <i :class="expert.icon"></i>
        <ul><li v-for="topic in expert.topics" :key="topic">{{ topic }}</li></ul>
        <div class="expert-card__cta">Agendar reunión <i class="fa-solid fa-arrow-right"></i></div>
      </button>
    </div>

    <aside class="selection__policy"><i class="fa-solid fa-shield-halved"></i><p><strong>Política de uso:</strong> Las reuniones de ventas son exclusivas para temas comerciales. El uso indebido será registrado y perderás acceso a futuras agendas con el equipo comercial.</p></aside>
  </section>
</template>

<style scoped lang="scss">
.selection { display: flex; flex-direction: column; gap: 2rem; padding: 3rem 2rem 3.5rem; }
.selection__hero { position: relative; overflow: hidden; padding: 2.8rem 1.5rem; border-radius: 24px; text-align: center; background: linear-gradient(180deg, rgba($primary, .06), transparent); }
.selection__hero::before { position: absolute; top: -10rem; right: -5rem; width: 20rem; height: 20rem; border-radius: 50%; background: radial-gradient(circle, rgba($primary, .08), transparent 70%); content: ''; }
.selection__hero > * { position: relative; }
.selection__badge { display: inline-flex; margin-bottom: 1.1rem; padding: .3rem .85rem; border: 1px solid rgba($primary, .15); border-radius: 999px; color: $primary; background: rgba($primary, .08); font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.selection h1 { margin: 0 0 .7rem; color: $primary-dark; font-size: clamp(2rem, 4vw, 2.7rem); letter-spacing: -.035em; }
.selection__hero p { max-width: 34rem; margin: 0 auto; color: $text-secondary; line-height: 1.6; }
.selection__cards { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.75rem; max-width: 1160px; width: 100%; margin: 0 auto; }
.expert-card { --accent: #999; --accent-bg: rgba(153,153,153,.06); --accent-gradient: linear-gradient(135deg,#999,#bbb); --shadow: rgba(0,0,0,.08); position: relative; display: flex; flex: 1 1 290px; flex-direction: column; align-items: center; max-width: 360px; min-height: 410px; gap: .65rem; overflow: hidden; padding: 2.25rem 1.5rem 1.5rem; border: 1px solid rgba(0,0,0,.06); border-radius: 20px; color: #333; background: $white; box-shadow: 0 2px 12px rgba(0,0,0,.04); cursor: pointer; font: inherit; transition: transform .3s cubic-bezier(.175,.885,.32,1.275), box-shadow .3s; }
.expert-card::before { position: absolute; inset: 0; border: 2px solid var(--accent); border-radius: inherit; content: ''; opacity: 0; transition: opacity .3s; }
.expert-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px var(--shadow); }
.expert-card:hover::before { opacity: 1; }
.expert-card--sales::after { position: absolute; top: 12px; right: 12px; padding: .2rem .5rem; border: 1px solid rgba($alert-error,.15); border-radius: 999px; color: $alert-error; background: rgba($alert-error,.08); content: 'Exclusivo'; font-size: .55rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.expert-card__photo { width: 90px; height: 90px; overflow: hidden; border: 3px solid $white; border-radius: 50%; box-shadow: 0 0 0 4px var(--accent-bg), 0 8px 24px var(--shadow); }
.expert-card__photo img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
.expert-card strong { color: #111; font-size: 1.1rem; }
.expert-card > span { color: var(--accent); font-size: .68rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.expert-card > i { color: var(--accent); font-size: 1.5rem; }
.expert-card ul { display: flex; flex-direction: column; width: 100%; gap: .35rem; margin: 0; padding: 0; text-align: left; list-style: none; }
.expert-card li { position: relative; padding-left: 1rem; color: #555; font-size: .78rem; line-height: 1.4; }
.expert-card li::before { position: absolute; top: .5em; left: 0; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); content: ''; }
.expert-card__cta { display: flex; align-items: center; justify-content: center; width: 100%; gap: .5rem; margin-top: auto; padding: .7rem 1rem; border-radius: 12px; background: rgba(0,0,0,.04); font-size: .82rem; font-weight: 800; transition: background .3s, color .3s; }
.expert-card:hover .expert-card__cta { color: $white; background: var(--accent-gradient); }
.selection__policy { display: flex; align-items: flex-start; max-width: 1100px; gap: .85rem; margin: 0 auto; padding: 1rem 1.25rem; border: 1px solid rgba($alert-error,.12); border-radius: 14px; background: $white; }
.selection__policy > i { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex: 0 0 auto; border-radius: 10px; color: $alert-error; background: rgba($alert-error,.06); }
.selection__policy p { margin: 0; color: #666; font-size: .78rem; line-height: 1.6; }
@media (max-width: 500px) { .selection { padding: 1.5rem 1rem 2.5rem; } .selection__hero { padding: 2rem 1rem; } .expert-card { min-height: 0; max-width: none; } }
</style>
