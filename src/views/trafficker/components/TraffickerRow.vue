<template>
  <article class="trow" :class="[`trow--${estado.tono}`, { 'is-open': abierta, 'is-cargando': card.loading }]">
    <!-- Cabecera: siempre visible, es lo que se escanea de un vistazo. -->
    <button type="button" class="trow__head" :aria-expanded="abierta" @click="emit('toggle')">
      <i class="fa-solid fa-chevron-right trow__chevron" aria-hidden="true" />

      <span class="trow__logo" aria-hidden="true">
        <img v-if="card.logoUrl" :src="card.logoUrl" :alt="''" loading="lazy" />
        <span v-else>{{ iniciales }}</span>
      </span>

      <span class="trow__main">
        <span class="trow__name">{{ card.name }}</span>

        <span class="trow__chips">
          <!-- Conectar a medias es la causa silenciosa de la mitad de los ceros. -->
          <span
            v-if="card.conexion && !card.conexion.completa"
            class="trow__chip trow__chip--aviso"
            :title="`Falta conectar: ${(card.conexion?.faltan ?? []).join(', ')}`"
          >
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Conexión incompleta
          </span>

          <span class="trow__chip" :class="`trow__chip--${estado.tono}`" :title="estado.detalle">
            {{ estado.label }}
          </span>

          <span
            v-if="card.actividad?.conectado"
            class="trow__chip"
            :class="card.actividad.activos ? 'trow__chip--ok' : ''"
            :title="card.actividad.error || `${card.actividad.activos} activos · ${card.actividad.pausados} pausados`"
          >
            <i class="fa-solid fa-circle trow__punto" aria-hidden="true" />
            {{ card.actividad.activos }} {{ card.actividad.activos === 1 ? 'activo' : 'activos' }}
          </span>
          <span v-else-if="card.actividad" class="trow__chip" title="Meta no está conectada en este entorno">
            Sin Meta
          </span>
        </span>
      </span>

      <span class="trow__metric">
        <small>ROAS</small>
        <strong v-if="!card.loading">{{ card.spend > 0 ? card.roas.toFixed(2) : '—' }}</strong>
        <span v-else class="trow__cargando" aria-label="Cargando" />
      </span>

      <span class="trow__metric trow__metric--hide-sm">
        <small>Inversión</small>
        <strong v-if="!card.loading">{{ money(card.spend) }}</strong>
        <span v-else class="trow__cargando" aria-hidden="true" />
      </span>

      <span class="trow__metric trow__metric--hide-sm">
        <small>Facturación</small>
        <strong v-if="!card.loading">{{ money(card.revenue) }}</strong>
        <span v-else class="trow__cargando" aria-hidden="true" />
      </span>
    </button>

    <!-- Cuerpo: solo se pinta al abrir. La altura se mide al vuelo porque
         'auto' no se puede animar. -->
    <Transition name="desplegar" @enter="alAbrir" @after-enter="alTerminar" @leave="alCerrar">
      <div v-if="abierta" class="trow__body">
      <dl class="trow__datos">
        <div>
          <dt>Inversión en Meta</dt>
          <dd>{{ money(card.spend) }}</dd>
        </div>
        <div>
          <dt>Facturación del mes</dt>
          <dd>{{ money(card.revenue) }}</dd>
        </div>
        <div>
          <dt>ROAS</dt>
          <dd>{{ card.spend > 0 ? card.roas.toFixed(2) : 'Sin pauta' }}</dd>
        </div>
        <div>
          <dt>Meta</dt>
          <dd>{{ card.conexion?.completa ? 'Conectada' : `Faltan ${(card.conexion?.faltan ?? []).length}` }}</dd>
        </div>
      </dl>

      <TraffickerAdsResumen v-if="card.actividad?.conectado" :actividad="card.actividad" />


      <TraffickerConexion
        v-if="card.conexion && !card.conexion.completa"
        :faltan="card.conexion.faltan"
        @conectar="emit('conectar')"
      />

      <TraffickerAdsBreakdown
        :workspace-id="card.id"
        :activo="abierta"
        :puede-consultar="!!card.conexion && !card.conexion.faltan.includes('cuenta publicitaria')"
      />

      <p class="trow__nota">{{ estado.detalle }}</p>

      <div class="trow__acciones">
        <button type="button" class="trow__btn trow__btn--primary" @click="emit('go-detail')">
          <i class="fa-solid fa-arrow-right" aria-hidden="true" /> Ver el entorno
        </button>
        <button
          v-if="card.revenue === 0"
          type="button"
          class="trow__btn"
          :disabled="isReminding || isReminded"
          @click="emit('remind')"
        >
          <i :class="isReminded ? 'fa-solid fa-check' : 'fa-solid fa-bell'" aria-hidden="true" />
          {{ isReminded ? 'Recordatorio enviado' : isReminding ? 'Enviando…' : 'Recordar facturación' }}
        </button>
        </div>
      </div>
    </Transition>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TraffickerAdsBreakdown from './TraffickerAdsBreakdown.vue'
import TraffickerConexion from './TraffickerConexion.vue'
import TraffickerAdsResumen from './TraffickerAdsResumen.vue'
import type { Card } from '../composables/useTraffickerDashboard'

const props = defineProps<{
  card: Card
  abierta: boolean
  isReminding: boolean
  isReminded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'go-detail'): void
  (e: 'remind'): void
  (e: 'conectar'): void
}>()


// 'height: auto' no se puede animar: se fija el alto real y se suelta al final.
function alAbrir(el: Element) {
  const e = el as HTMLElement
  e.style.height = '0'
  requestAnimationFrame(() => { e.style.height = `${e.scrollHeight}px` })
}
function alTerminar(el: Element) {
  ;(el as HTMLElement).style.height = 'auto'
}
function alCerrar(el: Element) {
  const e = el as HTMLElement
  e.style.height = `${e.scrollHeight}px`
  requestAnimationFrame(() => { e.style.height = '0' })
}

const num = (n: number) => new Intl.NumberFormat('es-EC').format(n || 0)

const iniciales = computed(() =>
  props.card.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
)


const money = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

/**
 * El estado dice qué hacer, no solo cómo va.
 *
 * Un ROAS bajo y "no facturó" son problemas distintos: el primero es de
 * campaña, el segundo es que falta un dato y por eso el ROAS no se puede leer.
 */
const estado = computed(() => {
  const { spend, revenue, roas, loading } = props.card

  if (loading) {
    return { tono: 'cargando', label: 'Cargando…', detalle: 'Trayendo las cifras de este entorno.' }
  }

  if (spend > 0 && revenue === 0) {
    return { tono: 'alerta', label: 'Pauta sin facturar', detalle: 'Hay inversión pero nadie registró facturación este mes: el ROAS no se puede calcular.' }
  }
  if (spend === 0 && revenue > 0) {
    return { tono: 'sin-pauta', label: 'Sin pauta', detalle: 'Factura, pero este mes no tiene inversión en Meta.' }
  }
  if (spend === 0 && revenue === 0) {
    return { tono: 'sin-pauta', label: 'Sin pauta ni facturación', detalle: 'Ni inversión ni facturación registradas este mes.' }
  }
  if (roas < 1) {
    return { tono: 'critico', label: 'Pierde dinero', detalle: 'Factura menos de lo que invierte: cada dólar en pauta devuelve menos de un dólar.' }
  }
  if (roas < 2) {
    return { tono: 'aviso', label: 'Ajustado', detalle: 'Devuelve la inversión pero con poco margen.' }
  }
  return { tono: 'ok', label: 'En objetivo', detalle: 'La inversión está rindiendo por encima del doble.' }
})
</script>

<style lang="scss" scoped>
.trow {
  border: 1.5px solid rgba($primary-dark, 0.09);
  border-radius: 12px;
  background: $white;
  overflow: hidden;
  transition: border-color 0.18s;

  &.is-open { border-color: rgba($primary, 0.4); }
}

.trow__head {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  width: 100%;
  padding: 0.8rem 1rem;
  font-family: inherit;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover { background: rgba($primary-dark, 0.02); }
  &:focus-visible { outline: 2px solid $primary; outline-offset: -2px; }
}

.trow__chevron {
  flex-shrink: 0;
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.18s;

  .is-open & { transform: rotate(90deg); }
}

.trow__main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

/* El nombre es lo que se busca en la lista: nunca se recorta. Si es largo
   envuelve, que es preferible a leer "CONSTRUCT…". */
.trow__name {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  color: $primary-dark;
  overflow-wrap: anywhere;
}

.trow__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.trow__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.45rem;
  font-size: 0.66rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.06);
  border-radius: 6px;

  &--ok { color: #15803d; background: rgba(#16a34a, 0.12); }
  &--aviso { color: #b45309; background: rgba(#d97706, 0.14); }
  &--alerta { color: #b45309; background: rgba(#d97706, 0.14); }
  &--critico { color: #b91c1c; background: rgba(#dc2626, 0.12); }
}

.trow__punto { font-size: 0.36rem; }


.trow__logo {
  display: flex;
  flex-shrink: 0;
  margin-top: 0.1rem;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  overflow: hidden;
  font-size: 0.68rem;
  font-weight: 800;
  color: $text-secondary;
  background: rgba($primary-dark, 0.06);
  border-radius: 8px;

  img { width: 100%; height: 100%; object-fit: cover; }
}













.trow__metric {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-top: 0.1rem;
  align-items: flex-end;
  min-width: 5.5rem;

  small { font-size: 0.6rem; letter-spacing: 0.04em; color: $text-secondary; text-transform: uppercase; }
  strong { font-size: 0.88rem; font-weight: 800; color: $primary-dark; }
}

/* La apertura acompaña; sin esto el detalle aparecía de golpe. */
.desplegar-enter-active,
.desplegar-leave-active {
  overflow: hidden;
  transition: height 0.24s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease;
}

.desplegar-enter-from,
.desplegar-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .desplegar-enter-active,
  .desplegar-leave-active { transition: none; }
}

.trow__body {
  padding: 0 1rem 1rem 2.6rem;
  border-top: 1px solid rgba($primary-dark, 0.06);
}

.trow__datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.75rem;
  margin: 0.9rem 0 0;

  dt { font-size: 0.68rem; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.04em; }
  dd { margin: 0.15rem 0 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
}

.trow__nota {
  margin: 0.9rem 0 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: $text-secondary;
}

.trow__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

.trow__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  border: none;
  border-radius: 9px;
  cursor: pointer;

  &:hover:not(:disabled) { color: $primary-dark; background: rgba($primary-dark, 0.1); }
  &:disabled { opacity: 0.6; cursor: default; }

  &--primary {
    color: $white;
    background: $primary;

    &:hover:not(:disabled) { color: $white; filter: brightness(1.08); }
  }
}

@media (max-width: 720px) {
  .trow__metric--hide-sm { display: none; }
}
</style>
