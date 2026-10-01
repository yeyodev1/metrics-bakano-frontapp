<template>
  <Teleport to="body">
    <Transition name="emm-fade">
      <div v-if="show" class="emm__overlay" @click.self="emit('close')">
        <section class="emm" role="dialog" aria-labelledby="emm-titulo">
          <header class="emm__head">
            <div class="emm__title">
              <span class="emm__live" :class="{ 'emm__live--on': !!estado && !error }" aria-hidden="true" />
              <div>
                <h3 id="emm-titulo">Estado en Metrics · {{ nombre }}</h3>
                <p>
                  En vivo: es lo mismo que ve el bot de Telegram, Lucas y el MCP.
                  <template v-if="estado"> Actualizado {{ haceCuanto }}.</template>
                </p>
              </div>
            </div>
            <div class="emm__head-actions">
              <button type="button" class="emm__icon-btn" :disabled="cargando" title="Actualizar ahora" @click="cargar">
                <i class="fa-solid fa-rotate" :class="{ 'fa-spin': cargando }" />
              </button>
              <button type="button" class="emm__icon-btn" title="Cerrar" @click="emit('close')">
                <i class="fa-solid fa-xmark" />
              </button>
            </div>
          </header>

          <div class="emm__body">
            <p v-if="error" class="emm__error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</p>
            <p v-else-if="!estado" class="emm__muted"><i class="fa-solid fa-spinner fa-spin" /> Leyendo el entorno…</p>

            <template v-if="estado">
              <div class="emm__grid">
                <article class="emm__card emm__card--ok">
                  <h4><i class="fa-solid fa-circle-check" /> Ya está en Metrics</h4>
                  <ul v-if="estado.yaEsta.length">
                    <li v-for="x in estado.yaEsta" :key="x">{{ x }}</li>
                  </ul>
                  <p v-else class="emm__muted">Nada todavía.</p>
                </article>
                <article class="emm__card emm__card--warn">
                  <h4><i class="fa-solid fa-hourglass-half" /> Falta</h4>
                  <ul v-if="estado.falta.length">
                    <li v-for="x in estado.falta" :key="x">{{ x }}</li>
                  </ul>
                  <p v-else class="emm__muted">Nada: está al día.</p>
                </article>
              </div>

              <article class="emm__card">
                <h4><i class="fa-solid fa-calendar-days" /> Citas agendadas</h4>
                <ul v-if="estado.citas.length" class="emm__citas">
                  <li v-for="c in estado.citas" :key="c.cita + c.cuando">
                    <div>
                      <strong>{{ c.cita }}</strong>
                      <span>{{ c.cuando }} · con {{ c.con }}</span>
                      <span v-if="c.lugar" class="emm__muted"><i class="fa-solid fa-location-dot" /> {{ c.lugar }}</span>
                    </div>
                    <a v-if="c.linkMeet" :href="c.linkMeet" target="_blank" rel="noopener" class="emm__meet">
                      <i class="fa-solid fa-video" /> Meet
                    </a>
                  </li>
                </ul>
                <p v-else class="emm__muted">Ninguna cita futura.</p>
              </article>

              <div class="emm__grid emm__grid--3">
                <article class="emm__card">
                  <h4><i class="fa-solid fa-file-signature" /> Contrato</h4>
                  <p :class="estado.contrato.firmado ? 'emm__ok' : 'emm__warn'">
                    {{ estado.contrato.firmado ? 'Firmado' : 'Sin firmar' }}
                    <template v-if="estado.contrato.firmadoEn"> · {{ fechaCorta(estado.contrato.firmadoEn) }}</template>
                  </p>
                  <a v-if="estado.contrato.verContrato" :href="estado.contrato.verContrato" target="_blank" rel="noopener">Ver contrato</a>
                </article>
                <article class="emm__card">
                  <h4><i class="fa-solid fa-palette" /> Archivos de marca</h4>
                  <p>Logo: <b>{{ estado.archivos.logo.cantidad }}</b> · Línea gráfica: <b>{{ estado.archivos.lineaGrafica.cantidad }}</b> · Catálogo: <b>{{ estado.archivos.catalogo.cantidad }}</b></p>
                  <a :href="estado.archivos.dondeSubir" target="_blank" rel="noopener">Ver recursos</a>
                </article>
                <article class="emm__card">
                  <h4><i class="fa-solid fa-id-card" /> Datos de marca</h4>
                  <p>{{ estado.datosMarca.completos }} de {{ estado.datosMarca.total }} completos</p>
                  <a :href="estado.datosMarca.dondeVer" target="_blank" rel="noopener">Ver perfil de marca</a>
                </article>
                <article class="emm__card">
                  <h4><i class="fa-solid fa-pen-nib" /> Guiones</h4>
                  <p>
                    <b>{{ estado.guiones.aprobados }}</b> aprobados · <b>{{ estado.guiones.porRevisar }}</b> por revisar ·
                    <b>{{ estado.guiones.conCorrecciones }}</b> con correcciones
                  </p>
                  <a :href="estado.guiones.dondeVer" target="_blank" rel="noopener">Ver planificación</a>
                </article>
                <article class="emm__card">
                  <h4><i class="fa-solid fa-film" /> Videos</h4>
                  <p>
                    <b>{{ estado.videos.editados }}</b> editados · <b>{{ estado.videos.aprobadosPorCliente }}</b> aprobados ·
                    <b>{{ estado.videos.porRevisar }}</b> por revisar · <b>{{ estado.videos.publicados }}</b> publicados
                  </p>
                </article>
                <article class="emm__card">
                  <h4><i class="fa-solid fa-plug" /> Conexiones</h4>
                  <p>
                    <span :class="estado.meta.conectado ? 'emm__ok' : 'emm__warn'"><i class="fa-brands fa-meta" /> Meta</span> ·
                    <span :class="estado.crm.conectado ? 'emm__ok' : 'emm__warn'"><i class="fa-solid fa-diagram-project" /> CRM</span> ·
                    <span :class="estado.pagos.alDia ? 'emm__ok' : 'emm__warn'"><i class="fa-solid fa-wallet" /> {{ estado.pagos.alDia ? 'Pagos al día' : estado.pagos.deuda }}</span>
                  </p>
                  <small v-if="estado.crm.locationId" class="emm__muted">Subcuenta {{ estado.crm.locationId }}</small>
                </article>
              </div>

              <article class="emm__card">
                <h4><i class="fa-solid fa-route" /> Sesiones del onboarding</h4>
                <ul class="emm__sesiones">
                  <li v-for="s in estado.onboarding.sesiones" :key="s.sesion">
                    <span class="emm__dot" :class="`emm__dot--${s.estado}`" />
                    <strong>{{ s.etiqueta }}</strong>
                    <span class="emm__muted">{{ etiquetaEstado(s.estado) }}<template v-if="s.fecha"> · {{ s.fecha }}</template></span>
                  </li>
                </ul>
              </article>
            </template>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { workspaceService, type EstadoEnMetrics } from '@/services/workspace.service'

/**
 * Foto en vivo del entorno: lo que ya está, lo que falta, citas con su Meet,
 * guiones, videos y conexiones. Se refresca sola cada 30 s mientras está
 * abierta, para ver los cambios del cliente (firma, archivos, citas) al toque.
 */
const REFRESCO_MS = 30_000

const props = defineProps<{ show: boolean; workspaceId: string; nombre: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const estado = ref<EstadoEnMetrics | null>(null)
const error = ref('')
const cargando = ref(false)
const ahora = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let reloj: ReturnType<typeof setInterval> | null = null

async function cargar() {
  if (cargando.value) return
  cargando.value = true
  try {
    estado.value = await workspaceService.getEstadoMetrics(props.workspaceId)
    error.value = ''
  } catch (e: any) {
    error.value = e?.message || 'No pude leer el entorno.'
  } finally {
    cargando.value = false
  }
}

function parar() {
  if (timer) clearInterval(timer)
  if (reloj) clearInterval(reloj)
  timer = reloj = null
}

watch(
  () => [props.show, props.workspaceId] as const,
  ([abierto]) => {
    parar()
    if (!abierto) return
    estado.value = null
    error.value = ''
    cargar()
    timer = setInterval(cargar, REFRESCO_MS)
    reloj = setInterval(() => (ahora.value = Date.now()), 5_000)
  },
  { immediate: true }
)

onBeforeUnmount(parar)

const haceCuanto = computed(() => {
  if (!estado.value) return ''
  const s = Math.max(0, Math.round((ahora.value - new Date(estado.value.generadoEn).getTime()) / 1000))
  return s < 10 ? 'recién' : s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`
})

const ESTADOS: Record<string, string> = {
  pendiente: 'Pendiente',
  agendada: 'Agendada',
  cumplida: 'Hecha',
  bloqueada: 'Bloqueada',
  no_aplica: 'No aplica',
  ya_paso_sin_cerrar: 'Ya pasó, sin cerrar',
}

function etiquetaEstado(e: string): string {
  return ESTADOS[e] || e
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style lang="scss" scoped>
.emm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
  background: rgba($primary-dark, 0.6);
}

.emm {
  width: 100%;
  max-width: 860px;
  background: $white;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba($primary-dark, 0.28);
}

.emm__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.2rem 0.9rem;
  border-bottom: 1px solid rgba($primary-dark, 0.07);

  h3 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.2rem 0 0; font-size: 0.76rem; color: $text-secondary; }
}

.emm__title { display: flex; gap: 0.7rem; align-items: flex-start; }

.emm__live {
  width: 10px;
  height: 10px;
  margin-top: 0.35rem;
  border-radius: 50%;
  background: rgba($text-secondary, 0.4);
  flex-shrink: 0;

  &--on {
    background: $alert-success;
    box-shadow: 0 0 0 0 rgba($alert-success, 0.5);
    animation: emm-pulso 2s infinite;
  }
}

@keyframes emm-pulso {
  0% { box-shadow: 0 0 0 0 rgba($alert-success, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba($alert-success, 0); }
  100% { box-shadow: 0 0 0 0 rgba($alert-success, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .emm__live--on { animation: none; }
}

.emm__head-actions { display: flex; gap: 0.3rem; }

.emm__icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: $text-secondary;
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba($primary-dark, 0.06); color: $primary-dark; }
  &:disabled { opacity: 0.5; cursor: default; }
}

.emm__body { display: flex; flex-direction: column; gap: 0.8rem; padding: 1rem 1.2rem 1.3rem; }

.emm__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  &--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    &--3 { grid-template-columns: 1fr; }
  }
}

.emm__card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  font-size: 0.8rem;
  color: $primary-dark;

  h4 {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 800;
    color: $primary-dark;

    i { color: $primary; margin-right: 0.3rem; }
  }

  p { margin: 0; line-height: 1.5; }
  ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.25rem; line-height: 1.45; }
  a { font-size: 0.74rem; font-weight: 700; color: $primary; text-decoration: none; &:hover { text-decoration: underline; } }

  &--ok { background: rgba($alert-success, 0.05); h4 i { color: $alert-success; } }
  &--warn { background: rgba(#d97706, 0.05); h4 i { color: #d97706; } }
}

.emm__citas {
  list-style: none;
  padding: 0 !important;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid rgba($primary-dark, 0.06);

    &:last-child { border-bottom: none; }

    div { display: flex; flex-direction: column; gap: 0.1rem; }
    span { font-size: 0.76rem; }
  }
}

.emm__meet {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.4rem 0.75rem;
  border-radius: 9px;
  background: $primary;
  color: $white !important;
  font-size: 0.74rem;
  font-weight: 700;
  text-decoration: none !important;
}

.emm__sesiones {
  list-style: none;
  padding: 0 !important;

  li { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
}

.emm__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba($text-secondary, 0.4);

  &--cumplida { background: $alert-success; }
  &--agendada { background: $primary; }
  &--bloqueada,
  &--ya_paso_sin_cerrar { background: #d97706; }
}

.emm__ok { color: darken($alert-success, 8%); font-weight: 700; }
.emm__warn { color: #b45309; font-weight: 700; }
.emm__muted { margin: 0; color: $text-secondary; font-size: 0.76rem; }
.emm__error { margin: 0; color: $alert-error; font-weight: 600; font-size: 0.8rem; }

.emm-fade-enter-active,
.emm-fade-leave-active { transition: opacity 0.15s ease; }
.emm-fade-enter-from,
.emm-fade-leave-to { opacity: 0; }
</style>
