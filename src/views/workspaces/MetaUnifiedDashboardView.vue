<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { metaService } from '@/services/meta.service'

const route = useRoute()
const workspaceId = route.params.workspaceId as string
const loading = ref(true)
const error = ref<string | null>(null)
const dashboard = ref<any>(null)

const adsSummary = computed(() => dashboard.value?.ads?.summary)
const videos = computed(() => dashboard.value?.organic?.videos || [])

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-EC').format(value || 0)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value || 0)
}

async function load() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await metaService.getUnifiedDashboard(workspaceId)
  } catch (e: any) {
    error.value = e.message || 'No fue posible obtener las métricas de Meta.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="meta-dashboard">
    <header class="meta-dashboard__header">
      <div>
        <p class="meta-dashboard__eyebrow"><i class="fa-brands fa-meta" /> MÉTRICAS INTEGRALES</p>
        <h1>{{ dashboard?.workspace?.name || 'Dashboard Meta' }}</h1>
        <p>Rendimiento de anuncios y contenido orgánico del mes en curso.</p>
      </div>
      <button :disabled="loading" @click="load"><i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" /> Actualizar</button>
    </header>

    <p v-if="error" class="meta-dashboard__error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</p>

    <template v-if="loading">
      <div class="meta-dashboard__cards" aria-label="Cargando métricas de anuncios">
        <div v-for="item in 4" :key="item" class="meta-dashboard__skeleton-card"><span /><span /><span /></div>
      </div>
      <div class="meta-dashboard__video-skeletons">
        <div v-for="item in 4" :key="item" class="meta-dashboard__skeleton-video"><span /><span /><span /></div>
      </div>
    </template>

    <template v-else>
      <section class="meta-dashboard__section">
        <div class="meta-dashboard__section-heading">
          <div><h2>Publicidad Meta</h2><p>Resumen de campañas y resultados.</p></div>
          <span v-if="!adsSummary" class="meta-dashboard__unavailable">Sin cuenta Ads vinculada</span>
        </div>
        <div v-if="adsSummary" class="meta-dashboard__cards">
          <article class="meta-dashboard__card"><i class="fa-solid fa-dollar-sign" /><span>Dinero gastado</span><strong>{{ formatCurrency(adsSummary.spend) }}</strong></article>
          <article class="meta-dashboard__card"><i class="fa-solid fa-users" /><span>Alcance total</span><strong>{{ formatNumber(adsSummary.reach) }}</strong></article>
          <article class="meta-dashboard__card"><i class="fa-solid fa-bullseye" /><span>Costo por resultado</span><strong>{{ formatCurrency(adsSummary.costPerResult) }}</strong><small>{{ adsSummary.resultType || 'Sin resultados' }}</small></article>
          <article class="meta-dashboard__card"><i class="fa-solid fa-chart-line" /><span>Impresiones</span><strong>{{ formatNumber(adsSummary.impressions) }}</strong><small>CPC {{ formatCurrency(adsSummary.cpc) }}</small></article>
        </div>
      </section>

      <section class="meta-dashboard__section">
        <div class="meta-dashboard__section-heading">
          <div><h2>Videos orgánicos de Instagram</h2><p v-if="dashboard?.organic?.profile">@{{ dashboard.organic.profile.username }} · {{ formatNumber(dashboard.organic.profile.followers_count) }} seguidores</p></div>
          <span v-if="!dashboard?.organic" class="meta-dashboard__unavailable">Sin Instagram vinculado</span>
        </div>
        <div v-if="videos.length" class="meta-dashboard__videos">
          <article v-for="video in videos" :key="video.id" class="meta-dashboard__video">
            <img v-if="video.thumbnailUrl" :src="video.thumbnailUrl" :alt="video.caption || 'Video de Instagram'" />
            <div v-else class="meta-dashboard__video-placeholder"><i class="fa-brands fa-instagram" /></div>
            <div class="meta-dashboard__video-body">
              <p>{{ video.caption || 'Sin descripción' }}</p>
              <div class="meta-dashboard__video-metrics">
                <span><i class="fa-solid fa-play" /> {{ formatNumber(video.views) }}</span>
                <span><i class="fa-solid fa-eye" /> {{ formatNumber(video.reach) }}</span>
                <span><i class="fa-solid fa-heart" /> {{ formatNumber(video.likes) }}</span>
                <span><i class="fa-solid fa-comment" /> {{ formatNumber(video.comments) }}</span>
              </div>
              <a v-if="video.permalink" :href="video.permalink" target="_blank" rel="noopener noreferrer">Ver en Instagram <i class="fa-solid fa-arrow-up-right-from-square" /></a>
            </div>
          </article>
        </div>
        <div v-else-if="dashboard?.organic" class="meta-dashboard__empty">No hay videos orgánicos disponibles para esta cuenta.</div>
      </section>
    </template>
  </section>
</template>

<style scoped lang="scss">
.meta-dashboard { width: 100%; min-width: 0; padding: 1rem; color: $primary-dark; }
.meta-dashboard__header, .meta-dashboard__section-heading, .meta-dashboard__cards, .meta-dashboard__videos, .meta-dashboard__video-metrics { display: flex; }
.meta-dashboard__header { flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.meta-dashboard__header h1, .meta-dashboard__section-heading h2 { margin: 0; }
.meta-dashboard__header p, .meta-dashboard__section-heading p { margin: .4rem 0 0; color: $text-secondary; }
.meta-dashboard__eyebrow { color: $primary !important; font-weight: 800; font-size: .75rem; letter-spacing: .08em; }
.meta-dashboard__header button { align-self: flex-start; border: 0; border-radius: .55rem; padding: .7rem .9rem; color: $white; background: $primary; cursor: pointer; font: inherit; font-weight: 700; }
.meta-dashboard__header button:disabled { opacity: .55; cursor: not-allowed; }
.meta-dashboard__error { display: flex; gap: .6rem; align-items: center; padding: .85rem; border-radius: .65rem; color: $alert-error; background: $alert-error-bg; }
.meta-dashboard__section { margin-top: 2rem; }
.meta-dashboard__section-heading { align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.meta-dashboard__unavailable { color: $text-secondary; font-size: .8rem; white-space: nowrap; }
.meta-dashboard__cards { flex-wrap: wrap; gap: .75rem; }
.meta-dashboard__card { display: flex; flex: 1 1 10rem; min-width: 0; flex-direction: column; gap: .45rem; padding: 1rem; border-radius: .8rem; background: $white; border: 1px solid rgba($primary-dark, .1); }
.meta-dashboard__card > i { color: $primary; font-size: 1.15rem; }
.meta-dashboard__card span, .meta-dashboard__card small { color: $text-secondary; }
.meta-dashboard__card strong { font-size: 1.25rem; }
.meta-dashboard__videos { flex-wrap: wrap; gap: 1rem; }
.meta-dashboard__video { display: flex; flex: 1 1 17rem; min-width: 0; flex-direction: column; overflow: hidden; border-radius: .8rem; background: $white; border: 1px solid rgba($primary-dark, .1); }
.meta-dashboard__video > img, .meta-dashboard__video-placeholder { width: 100%; height: 12rem; object-fit: cover; background: $overlay-purple; }
.meta-dashboard__video-placeholder { display: flex; align-items: center; justify-content: center; color: $secondary; font-size: 2rem; }
.meta-dashboard__video-body { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: .8rem; padding: .9rem; }
.meta-dashboard__video-body p { display: -webkit-box; margin: 0; overflow: hidden; line-height: 1.45; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.meta-dashboard__video-metrics { flex-wrap: wrap; gap: .6rem; color: $text-secondary; font-size: .82rem; }
.meta-dashboard__video-metrics span { display: inline-flex; gap: .3rem; align-items: center; }
.meta-dashboard__video-body a { margin-top: auto; color: $primary; font-size: .85rem; font-weight: 700; text-decoration: none; }
.meta-dashboard__empty { padding: 1.5rem; border: 1px dashed rgba($primary-dark, .2); border-radius: .75rem; color: $text-secondary; text-align: center; }
.meta-dashboard__video-skeletons { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; }
.meta-dashboard__skeleton-card, .meta-dashboard__skeleton-video { display: flex; flex-direction: column; gap: .7rem; padding: 1rem; border-radius: .8rem; background: $white; }
.meta-dashboard__skeleton-card { flex: 1 1 10rem; }
.meta-dashboard__skeleton-video { flex: 1 1 17rem; min-height: 15rem; }
.meta-dashboard__skeleton-card span, .meta-dashboard__skeleton-video span { height: .85rem; width: 75%; border-radius: 99px; background: linear-gradient(90deg, $primary-light, rgba($secondary, .16), $primary-light); background-size: 200% 100%; animation: loading 1.2s infinite; }
.meta-dashboard__skeleton-video span:first-child { width: 100%; height: 8rem; }
@keyframes loading { to { background-position: -200% 0; } }
@media (min-width: 768px) { .meta-dashboard { padding: 1.5rem 2rem; } .meta-dashboard__header { flex-direction: row; align-items: center; justify-content: space-between; } .meta-dashboard__header button { align-self: auto; } }
</style>
