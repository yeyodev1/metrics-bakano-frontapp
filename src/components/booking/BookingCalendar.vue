<script setup lang="ts">
import type { BookingExpert } from './booking.types'

defineProps<{ expert: BookingExpert }>()
defineEmits<{ back: [] }>()
</script>

<template>
  <section class="calendar">
    <aside class="calendar__sidebar">
      <button class="calendar__back" @click="$emit('back')"><i class="fa-solid fa-arrow-left"></i> Volver a selección</button>
      <div class="calendar__profile">
        <img :src="expert.photo" :alt="expert.name" />
        <h2>{{ expert.name }}</h2>
        <span :style="{ color: expert.color }">{{ expert.role }}</span>
        <b :style="{ color: expert.color, background: expert.accentBg, borderColor: expert.accentBorder }"><i class="fa-solid fa-circle-info"></i>{{ expert.warning }}</b>
        <p>{{ expert.warningDesc }}</p>
        <small>Temas que se tratarán:</small>
        <ul><li v-for="topic in expert.topics" :key="topic"><i class="fa-solid fa-circle-check" :style="{ color: expert.color }"></i>{{ topic }}</li></ul>
      </div>
    </aside>
    <main class="calendar__content"><iframe :src="expert.url" :title="`Agenda de ${expert.name}`" allowfullscreen></iframe></main>
  </section>
</template>

<style scoped lang="scss">
.calendar { display: flex; min-height: calc(100vh - 60px); background: #f8f7f5; }
.calendar__sidebar { display: flex; width: 320px; flex: 0 0 auto; flex-direction: column; gap: 1rem; padding: 1.5rem; border-right: 1px solid rgba(0,0,0,.05); background: $white; }
.calendar__back { display: inline-flex; align-self: flex-start; align-items: center; gap: .45rem; padding: .3rem 0; border: 0; color: #888; background: transparent; cursor: pointer; font: inherit; font-size: .82rem; font-weight: 700; transition: color .2s; }
.calendar__back:hover { color: #333; }
.calendar__profile { display: flex; flex-direction: column; align-items: center; gap: .65rem; padding: 1.5rem 1rem; border: 1px solid rgba(0,0,0,.04); border-radius: 16px; text-align: center; background: #fafafa; }
.calendar__profile > img { width: 80px; height: 80px; border: 3px solid $white; border-radius: 50%; box-shadow: 0 4px 16px rgba(0,0,0,.08); object-fit: cover; object-position: top center; }
.calendar h2 { margin: 0; color: #111; font-size: 1.05rem; }
.calendar__profile > span { font-size: .68rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.calendar__profile > b { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .7rem; border: 1px solid; border-radius: 999px; font-size: .72rem; }
.calendar__profile > p { max-width: 260px; margin: 0; color: #777; font-size: .78rem; line-height: 1.5; }
.calendar__profile > small { margin-top: .25rem; color: #aaa; font-size: .68rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.calendar__profile ul { display: flex; flex-direction: column; width: 100%; gap: .4rem; margin: 0; padding: 0; text-align: left; list-style: none; }
.calendar__profile li { display: flex; align-items: center; gap: .45rem; color: #555; font-size: .78rem; }
.calendar__content { display: flex; flex: 1; padding: 1.5rem; }
.calendar__content iframe { width: 100%; flex: 1; border: 1px solid rgba(0,0,0,.05); border-radius: 14px; background: $white; box-shadow: 0 4px 20px rgba(0,0,0,.04); }
@media (max-width: 820px) { .calendar { flex-direction: column; } .calendar__sidebar { width: auto; border-right: 0; border-bottom: 1px solid rgba(0,0,0,.05); } .calendar__content { min-height: 580px; padding: 1rem; } }
</style>
