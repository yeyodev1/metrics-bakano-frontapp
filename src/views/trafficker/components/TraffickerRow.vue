<template>
  <article class="trow" :class="[`trow--${estado.tono}`, { 'is-open': abierta, 'is-cargando': card.loading }]">
    <!-- Cabecera: siempre visible, es lo que se escanea de un vistazo. -->
    <button type="button" class="trow__head" :aria-expanded="abierta" @click="emit('toggle')">
      <i class="fa-solid fa-chevron-right trow__chevron" aria-hidden="true" />

      <span class="trow__logo" aria-hidden="true">
        <img v-if="card.logoUrl" :src="card.logoUrl" :alt="''" loading="lazy" />
        <span v-else>{{ iniciales }}</span>
      </span>

      <span class="trow__name">{{ card.name }}</span>

      <!-- Conectar a medias es la causa silenciosa de la mitad de los ceros. -->
      <span
        v-if="!card.conexion.completa"
        class="trow__incompleta"
        :title="`Falta conectar: ${card.conexion.faltan.join(', ')}`"
      >
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        Conexión incompleta
      </span>

      <span class="trow__estado" :title="estado.detalle">{{ estado.label }}</span>

      <!-- Lo que se venía a saber: quién tiene campañas corriendo AHORA. -->
      <span
        v-if="card.actividad?.conectado"
        class="trow__activos"
        :class="{ 'is-cero': !card.actividad.activos }"
        :title="card.actividad.error || `${card.actividad.activos} activos · ${card.actividad.pausados} pausados`"
      >
        <i class="fa-solid fa-circle" aria-hidden="true" />
        {{ card.actividad.activos }} {{ card.actividad.activos === 1 ? 'activo' : 'activos' }}
      </span>
      <span v-else-if="card.actividad" class="trow__activos is-cero" title="Meta no está conectada en este entorno">
        Sin Meta
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

    <!-- Cuerpo: solo se pinta al abrir. -->
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
          <dd>{{ card.metaConnected ? 'Conectada' : 'Sin conectar' }}</dd>
        </div>
      </dl>

      <div v-if="card.actividad?.conectado" class="trow__ads">
        <p class="trow__ads-titulo">
          Anuncios este mes
          <span>{{ card.actividad.activos }} activos · {{ card.actividad.pausados }} pausados</span>
        </p>
        <p v-if="card.actividad.error" class="trow__ads-error">{{ card.actividad.error }}</p>
        <dl v-else class="trow__ads-metricas">
          <div><dt>Impresiones</dt><dd>{{ num(card.actividad.impresiones) }}</dd></div>
          <div><dt>Clics</dt><dd>{{ num(card.actividad.clics) }}</dd></div>
          <div><dt>CTR</dt><dd>{{ card.actividad.ctr !== null ? card.actividad.ctr.toFixed(2) + '%' : '—' }}</dd></div>
          <div><dt>CPC</dt><dd>{{ card.actividad.cpc !== null ? money(card.actividad.cpc) : '—' }}</dd></div>
        </dl>
      </div>

      <TraffickerAdsBreakdown
        :workspace-id="card.id"
        :activo="abierta"
        :conexion-completa="card.conexion.completa"
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
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TraffickerAdsBreakdown from './TraffickerAdsBreakdown.vue'
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
}>()

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
  align-items: center;
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
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.18s;

  .is-open & { transform: rotate(90deg); }
}

.trow__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: 0.92rem;
  font-weight: 700;
  color: $primary-dark;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trow__estado {
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 800;
  border-radius: 100px;
  color: $text-secondary;
  background: rgba($primary-dark, 0.06);

  .trow--ok & { color: #15803d; background: rgba(#16a34a, 0.12); }
  .trow--aviso & { color: #b45309; background: rgba(#d97706, 0.14); }
  .trow--alerta & { color: #b45309; background: rgba(#d97706, 0.14); }
  .trow--critico & { color: #b91c1c; background: rgba(#dc2626, 0.12); }
}

.trow__logo {
  display: flex;
  flex-shrink: 0;
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

.trow__incompleta {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.66rem;
  font-weight: 800;
  color: #b45309;
  background: rgba(#d97706, 0.14);
  border-radius: 100px;
}




.trow__activos {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #15803d;
  background: rgba(#16a34a, 0.1);
  border-radius: 100px;

  i { font-size: 0.4rem; }

  &.is-cero { color: $text-secondary; background: rgba($primary-dark, 0.06); }
}

.trow__ads {
  padding: 0.8rem 0.9rem;
  margin-top: 0.9rem;
  background: rgba($primary-dark, 0.02);
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 10px;
}

.trow__ads-titulo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  span { font-weight: 600; color: $text-secondary; text-transform: none; letter-spacing: 0; }
}

.trow__ads-error {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: #b45309;
}

.trow__ads-metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
  gap: 0.6rem;
  margin: 0;

  dt { font-size: 0.65rem; color: $text-secondary; text-transform: uppercase; }
  dd { margin: 0.1rem 0 0; font-size: 0.92rem; font-weight: 800; color: $primary-dark; }
}

.trow__metric {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-end;
  min-width: 5.5rem;

  small { font-size: 0.6rem; letter-spacing: 0.04em; color: $text-secondary; text-transform: uppercase; }
  strong { font-size: 0.88rem; font-weight: 800; color: $primary-dark; }
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
