<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { workspaceService, type EstadoEnMetrics } from '@/services/workspace.service'

/**
 * Agenda del cliente. Todo se agenda por el bot de Telegram (ahí la
 * conversación queda centralizada y el bot ya sabe con quién y en qué orden).
 * Aquí el cliente ve sus citas, con el link de Meet de cada reunión, y entra
 * al bot para agendar, mover o cancelar.
 */
const BOT_URL = 'https://t.me/BakanoAgencyBot'
const REFRESCO_MS = 60_000

const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId || ''))
const estado = ref<EstadoEnMetrics | null>(null)
const cargando = ref(true)
const error = ref('')
let timer: ReturnType<typeof setInterval> | null = null

async function cargar() {
  if (!workspaceId.value) return
  try {
    estado.value = await workspaceService.getEstadoMetrics(workspaceId.value)
    error.value = ''
  } catch (e: any) {
    error.value = e?.message || 'No pude cargar tus citas.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargar()
  timer = setInterval(cargar, REFRESCO_MS)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const sesionesPendientes = computed(() =>
  (estado.value?.onboarding.sesiones || []).filter((s) => s.estado === 'pendiente')
)
</script>

<template>
  <main class="agenda">
    <header class="agenda__head">
      <div>
        <h1>Agenda</h1>
        <p>Tus reuniones con Bakano. Todo se agenda, se mueve y se cancela por nuestro bot de Telegram.</p>
      </div>
      <a :href="`${BOT_URL}?start=agendar`" target="_blank" rel="noopener" class="agenda__cta">
        <i class="fa-brands fa-telegram" aria-hidden="true" /> Agendar por Telegram
      </a>
    </header>

    <section class="agenda__card">
      <h2><i class="fa-solid fa-calendar-days" aria-hidden="true" /> Tus próximas citas</h2>

      <p v-if="cargando" class="agenda__muted"><i class="fa-solid fa-spinner fa-spin" /> Cargando…</p>
      <p v-else-if="error" class="agenda__error">{{ error }}</p>
      <template v-else-if="estado">
        <ul v-if="estado.citas.length" class="agenda__citas">
          <li v-for="c in estado.citas" :key="c.cita + c.cuando">
            <div class="agenda__cita-info">
              <strong>{{ c.cita }}</strong>
              <span><i class="fa-regular fa-clock" aria-hidden="true" /> {{ c.cuando }} (hora Ecuador)</span>
              <span><i class="fa-solid fa-user" aria-hidden="true" /> con {{ c.con }}</span>
              <span v-if="c.lugar"><i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ c.lugar }}</span>
            </div>
            <a v-if="c.linkMeet" :href="c.linkMeet" target="_blank" rel="noopener" class="agenda__meet">
              <i class="fa-solid fa-video" aria-hidden="true" /> Entrar por Meet
            </a>
          </li>
        </ul>
        <p v-else class="agenda__muted">No tienes citas agendadas por ahora.</p>

        <a :href="`${BOT_URL}?start=citas`" target="_blank" rel="noopener" class="agenda__link">
          <i class="fa-solid fa-arrows-rotate" aria-hidden="true" /> Mover o cancelar una cita en Telegram
        </a>
      </template>
    </section>

    <section v-if="sesionesPendientes.length" class="agenda__card agenda__card--pendiente">
      <h2><i class="fa-solid fa-route" aria-hidden="true" /> Te falta agendar</h2>
      <ul class="agenda__pendientes">
        <li v-for="s in sesionesPendientes" :key="s.sesion">
          <span>{{ s.etiqueta }}</span>
          <a :href="`${BOT_URL}?start=onb_${s.sesion}`" target="_blank" rel="noopener">
            <i class="fa-brands fa-telegram" aria-hidden="true" /> Ver horarios
          </a>
        </li>
      </ul>
    </section>

    <section class="agenda__card agenda__card--info">
      <i class="fa-brands fa-telegram agenda__tg" aria-hidden="true" />
      <div>
        <strong>¿Por qué por Telegram?</strong>
        <p>
          Ahí está tu historial con el equipo, el bot te muestra los horarios libres de la persona que corresponde y te avisa
          antes de cada reunión. Escribe a <b>@BakanoAgencyBot</b> con el correo con el que entras a Metrics.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.agenda {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 1.5rem 1rem 2rem;
}

.agenda__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  h1 { margin: 0; font-size: 1.5rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.3rem 0 0; font-size: 0.88rem; color: $text-secondary; }
}

.agenda__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.1rem;
  border-radius: 12px;
  background: #229ed9;
  color: $white;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;

  &:hover { filter: brightness(1.05); }
}

.agenda__card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.1rem 1.2rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba($primary-dark, 0.04);

  h2 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: $primary-dark;

    i { color: $primary; margin-right: 0.35rem; }
  }

  &--pendiente { background: rgba(#d97706, 0.04); h2 i { color: #d97706; } }

  &--info {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.9rem;
    background: rgba(#229ed9, 0.05);

    strong { font-size: 0.88rem; color: $primary-dark; }
    p { margin: 0.25rem 0 0; font-size: 0.82rem; line-height: 1.55; color: $text-secondary; }
  }
}

.agenda__tg { font-size: 1.6rem; color: #229ed9; }

.agenda__citas {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 0;
    border-bottom: 1px solid rgba($primary-dark, 0.06);

    &:last-child { border-bottom: none; }

    @media (max-width: 560px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}

.agenda__cita-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  strong { font-size: 0.92rem; color: $primary-dark; }
  span { font-size: 0.8rem; color: $text-secondary; i { width: 14px; margin-right: 0.25rem; } }
}

.agenda__meet {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  background: $primary;
  color: $white;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;

  &:hover { filter: brightness(1.05); }
}

.agenda__link {
  align-self: flex-start;
  font-size: 0.8rem;
  font-weight: 700;
  color: $primary;
  text-decoration: none;

  i { margin-right: 0.3rem; }
  &:hover { text-decoration: underline; }
}

.agenda__pendientes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    font-size: 0.86rem;
    color: $primary-dark;
  }

  a {
    flex-shrink: 0;
    font-size: 0.8rem;
    font-weight: 700;
    color: #229ed9;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

.agenda__muted { margin: 0; font-size: 0.84rem; color: $text-secondary; }
.agenda__error { margin: 0; font-size: 0.84rem; font-weight: 600; color: $alert-error; }
</style>
