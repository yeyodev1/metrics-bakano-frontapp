<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { internalPulseService, type PulseOverview } from '@/services/internalPulse.service'
import { money, pct, nombreMes, ESTADO_LABEL } from '../workspaces/InternalPulseView/utils/format'

const router = useRouter()
const ahoraEc = new Date(Date.now() - 5 * 60 * 60 * 1000)
const year = ref(ahoraEc.getUTCFullYear())
const month = ref(ahoraEc.getUTCMonth() + 1)

const data = ref<PulseOverview | null>(null)
const cargando = ref(true)
const errorCarga = ref('')
const filtro = ref<'todos' | 'sin_meta' | 'atrasado'>('todos')

const filas = computed(() => {
  const rows = data.value?.rows ?? []
  if (filtro.value === 'sin_meta') return rows.filter((r) => !r.hasTarget)
  if (filtro.value === 'atrasado') return rows.filter((r) => r.paceStatus === 'atrasado')
  return rows
})

const avanceGlobal = computed(() => {
  const t = data.value?.totals
  if (!t || t.targetAmount <= 0) return 0
  return (t.billed / t.targetAmount) * 100
})

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    data.value = await internalPulseService.getOverview(year.value, month.value)
  } catch (error: any) {
    errorCarga.value = error?.message || 'No se pudo cargar el pulso global.'
  } finally {
    cargando.value = false
  }
}

function abrir(workspaceId: string) {
  router.push({ name: 'WorkspacePulse', params: { workspaceId } })
}

onMounted(cargar)
</script>

<template>
  <div class="ov">
    <header class="ov__head">
      <div>
        <span class="ov__tag">Interno</span>
        <h1 class="ov__title">Metas de clientes · {{ nombreMes(month) }} {{ year }}</h1>
        <p class="ov__sub">
          Cada cliente, su meta del mes y qué tan lejos está del ritmo esperado.
          Los que están sin meta salen primero.
        </p>
      </div>
    </header>

    <div v-if="cargando" class="ov__loading">Cargando el pulso de todos los clientes…</div>

    <div v-else-if="errorCarga" class="ov__error">
      <p>{{ errorCarga }}</p>
      <button type="button" @click="cargar">Reintentar</button>
    </div>

    <template v-else-if="data">
      <div class="ov__totals">
        <article class="ov__total">
          <p class="ov__total-label">Facturado del mes</p>
          <p class="ov__total-value">{{ money(data.totals.billed, true) }}</p>
          <p class="ov__total-foot">Meta sumada {{ money(data.totals.targetAmount, true) }} · {{ pct(avanceGlobal) }}</p>
        </article>
        <article class="ov__total ov__total--warn">
          <p class="ov__total-label">Clientes sin meta</p>
          <p class="ov__total-value">{{ data.totals.withoutTarget }}</p>
          <p class="ov__total-foot">de {{ data.totals.clients }} activos</p>
        </article>
        <article class="ov__total ov__total--bad">
          <p class="ov__total-label">Atrasados</p>
          <p class="ov__total-value">{{ data.totals.behind }}</p>
          <p class="ov__total-foot">el mes corrió {{ pct(data.period.expectedPct) }}</p>
        </article>
      </div>

      <div class="ov__filters">
        <button type="button" :class="{ 'is-on': filtro === 'todos' }" @click="filtro = 'todos'">Todos</button>
        <button type="button" :class="{ 'is-on': filtro === 'sin_meta' }" @click="filtro = 'sin_meta'">Sin meta</button>
        <button type="button" :class="{ 'is-on': filtro === 'atrasado' }" @click="filtro = 'atrasado'">Atrasados</button>
      </div>

      <ul class="ov__list">
        <li v-for="r in filas" :key="r.workspaceId">
          <button type="button" class="ov__row" :class="`ov__row--${r.paceStatus}`" @click="abrir(r.workspaceId)">
            <div class="ov__row-main">
              <p class="ov__row-name">{{ r.name }}</p>
              <p class="ov__row-meta">
                <span class="ov__state">{{ ESTADO_LABEL[r.paceStatus] }}</span>
                <template v-if="r.missingCount"> · {{ r.missingCount }} días sin registro</template>
              </p>
            </div>

            <div class="ov__row-bar">
              <div class="ov__bar">
                <span class="ov__bar-fill" :style="{ width: `${Math.min(r.progressPct, 100)}%` }" />
                <span class="ov__bar-mark" :style="{ left: `${Math.min(r.expectedPct, 100)}%` }" />
              </div>
              <p class="ov__row-amounts">
                {{ money(r.billed, true) }}
                <span v-if="r.hasTarget">de {{ money(r.targetAmount, true) }}</span>
                <span v-else class="is-none">sin meta definida</span>
              </p>
            </div>

            <p class="ov__row-pct">{{ r.hasTarget ? pct(r.progressPct) : '—' }}</p>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ov {
  padding: 16px 16px 80px;
  width: 100%;
  max-width: 1180px;

  @media (min-width: 640px) { padding: 28px 32px 80px; }
}

.ov__head { margin-bottom: 1.25rem; }

.ov__tag {
  display: inline-block;
  border-radius: 7px;
  padding: 0.25rem 0.5rem;
  background: rgba($secondary, 0.12);
  color: $secondary-dark;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ov__title { margin: 0.5rem 0 0.25rem; color: $primary-dark; font-size: 1.6rem; font-weight: 800; }
.ov__sub { margin: 0; color: $text-secondary; font-size: 0.86rem; }

.ov__loading { color: $text-secondary; font-size: 0.9rem; padding: 2rem 0; }

.ov__error {
  border: 1px solid #f3d8de;
  border-radius: 16px;
  padding: 2rem;
  background: #fff8f9;
  text-align: center;

  button {
    margin-top: 0.75rem;
    border: 0;
    border-radius: 10px;
    padding: 0.55rem 1rem;
    background: $primary;
    color: $white;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
}

.ov__totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.9rem; }

.ov__total {
  --tono: #{$primary};
  border: 1px solid #e8e6ef;
  border-left: 4px solid var(--tono);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  background: $white;

  &--warn { --tono: #{$alert-warning}; }
  &--bad { --tono: #{$alert-error}; }
}

.ov__total-label { margin: 0; color: $text-secondary; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.ov__total-value { margin: 0.2rem 0 0.1rem; color: $primary-dark; font-size: 1.5rem; font-weight: 800; }
.ov__total-foot { margin: 0; color: $text-secondary; font-size: 0.75rem; }

.ov__filters { display: flex; gap: 0.45rem; margin: 1.25rem 0 0.75rem; }

.ov__filters button {
  border: 1px solid #e2dfe9;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  background: $white;
  color: $text-secondary;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &.is-on { border-color: $primary; background: rgba($primary, 0.08); color: $primary; }
}

.ov__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }

.ov__row {
  --tono: #{$text-secondary};
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  border: 1px solid #e8e6ef;
  border-left: 4px solid var(--tono);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  background: $white;
  cursor: pointer;
  text-align: left;
  transition: transform 0.14s ease, box-shadow 0.14s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(25, 20, 35, 0.08); }

  &--sin_meta { --tono: #{$primary}; }
  &--atrasado { --tono: #{$alert-warning}; }
  &--en_linea { --tono: #{$alert-info}; }
  &--adelante,
  &--cumplida { --tono: #{$alert-success}; }
}

.ov__row-main { flex: 0 0 210px; min-width: 0; }
.ov__row-name { margin: 0; color: $primary-dark; font-size: 0.92rem; font-weight: 800; }
.ov__row-meta { margin: 0.15rem 0 0; color: $text-secondary; font-size: 0.74rem; }
.ov__state { color: var(--tono); font-weight: 800; }

.ov__row-bar { flex: 1; min-width: 0; }

.ov__bar {
  position: relative;
  height: 9px;
  border-radius: 999px;
  background: #f0eef5;
  overflow: hidden;
}

.ov__bar-fill { position: absolute; inset: 0 auto 0 0; border-radius: 999px; background: var(--tono); }

.ov__bar-mark {
  position: absolute;
  top: -2px;
  width: 2px;
  height: 13px;
  background: $primary-dark;
  opacity: 0.55;
}

.ov__row-amounts {
  margin: 0.4rem 0 0;
  color: $primary-dark;
  font-size: 0.78rem;
  font-weight: 700;

  span { color: $text-secondary; font-weight: 600; margin-left: 0.3rem; }
  .is-none { color: $primary; font-weight: 700; }
}

.ov__row-pct { flex: 0 0 62px; margin: 0; color: var(--tono); font-size: 1rem; font-weight: 800; text-align: right; }

@media (max-width: 780px) {
  .ov__row { flex-wrap: wrap; }
  .ov__row-main { flex: 1 1 100%; }
  .ov__row-pct { flex: 0 0 auto; }
}
</style>
