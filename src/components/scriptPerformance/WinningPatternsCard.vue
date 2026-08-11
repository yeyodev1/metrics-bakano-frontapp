<template>
  <section class="engram-card">
    <header class="panel-header">
      <div class="panel-title">
        <i class="fa-solid fa-brain" />
        <h3>Aprendizajes de la marca</h3>
        <span v-if="active" class="version-badge">v{{ active.version }}</span>
      </div>
      <p class="subtitle">
        Lo que los números de esta marca ya demostraron. Se inyecta en cada guión que genera la IA.
      </p>
    </header>

    <div v-if="loading" class="skeleton-wrap">
      <div v-for="i in 3" :key="i" class="skeleton line-skeleton" />
    </div>

    <template v-else>
      <p v-if="error" class="error-banner">
        <i class="fa-solid fa-circle-exclamation" />
        {{ error }}
      </p>

      <div v-if="!active && !draft" class="empty-state">
        <i class="fa-regular fa-lightbulb" />
        <p>Esta marca todavía no tiene aprendizajes.</p>
        <span>
          Genera el primer engram cuando tengas al menos 6 videos publicados con métricas.
        </span>
      </div>

      <!-- A draft is a proposal, never live until someone approves it -->
      <div v-if="draft" class="draft-banner">
        <div class="draft-text">
          <strong>Borrador v{{ draft.version }} listo para revisar.</strong>
          <span>
            Analizó {{ draft.basadoEn?.videosAnalizados ?? 0 }} videos.
            No alimenta los guiones hasta que lo actives.
          </span>
        </div>
        <button type="button" class="btn-activate" :disabled="activating" @click="activate(draft!.version)">
          <i class="fa-solid fa-check" />
          {{ activating ? 'Activando…' : 'Activar' }}
        </button>
      </div>

      <div v-if="shown" class="engram-body">
        <div v-if="shown.winningPatterns.length" class="block">
          <h4 class="block-title good">
            <i class="fa-solid fa-arrow-trend-up" /> Lo que sí funciona
          </h4>
          <ul>
            <li v-for="(p, i) in shown.winningPatterns" :key="`w-${i}`">
              <span class="pattern">{{ p.patron }}</span>
              <span v-if="p.evidencia?.length" class="evidence">
                Ej.: {{ p.evidencia.map(e => `${e.tema} (${formatNumber(e.valor)})`).join(' · ') }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="shown.losingPatterns.length" class="block">
          <h4 class="block-title bad">
            <i class="fa-solid fa-arrow-trend-down" /> Lo que no funciona
          </h4>
          <ul>
            <li v-for="(p, i) in shown.losingPatterns" :key="`l-${i}`">
              <span class="pattern">{{ p.patron }}</span>
            </li>
          </ul>
        </div>

        <div v-if="shown.toneRules.length" class="block">
          <h4 class="block-title"><i class="fa-solid fa-comment-dots" /> Tono de la marca</h4>
          <ul>
            <li v-for="(r, i) in shown.toneRules" :key="`t-${i}`">
              <span class="pattern">{{ r.regla }}</span>
              <span v-if="r.ejemploBueno" class="evidence">Así sí: “{{ r.ejemploBueno }}”</span>
            </li>
          </ul>
        </div>

        <div v-if="shown.vocabularioProhibido.length" class="block">
          <h4 class="block-title bad"><i class="fa-solid fa-ban" /> Palabras prohibidas</h4>
          <div class="chips">
            <span v-for="word in shown.vocabularioProhibido" :key="word" class="chip chip-banned">
              {{ word }}
            </span>
          </div>
        </div>

        <div v-if="shown.vocabularioMarca.length" class="block">
          <h4 class="block-title"><i class="fa-solid fa-quote-left" /> Vocabulario propio</h4>
          <div class="chips">
            <span v-for="word in shown.vocabularioMarca" :key="word" class="chip">{{ word }}</span>
          </div>
        </div>
      </div>

      <footer v-if="canRebuild" class="card-footer">
        <button type="button" class="btn-rebuild" :disabled="rebuilding" @click="rebuild">
          <i class="fa-solid fa-arrows-rotate" :class="{ spinning: rebuilding }" />
          {{ rebuilding ? 'Analizando guiones…' : 'Regenerar aprendizajes' }}
        </button>
        <span class="footer-note">
          Analiza los mejores y peores guiones del período y propone un borrador nuevo.
        </span>
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { engramService, type Engram } from '@/services/engram.service'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  workspaceId: string
  metric: 'views' | 'leads'
  month?: string
}>()

const userStore = useUserStore()

const active = ref<Engram | null>(null)
const versions = ref<Engram[]>([])
const loading = ref(false)
const rebuilding = ref(false)
const activating = ref(false)
const error = ref('')

/** Only internal staff decide what a brand has learned. */
const canRebuild = computed(() => userStore.isInternal || userStore.role === 'superadmin')

const draft = computed(() => versions.value.find(v => v.status === 'draft') ?? null)

/** Show the draft when there is one — it is what needs a decision. */
const shown = computed(() => draft.value ?? active.value)

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-EC', { maximumFractionDigits: 0 }).format(value)
}

async function load() {
  if (!props.workspaceId) return
  loading.value = true
  error.value = ''
  try {
    const data = await engramService.getEngram(props.workspaceId)
    active.value = data.active
    versions.value = data.versions
  } catch (err: any) {
    error.value = err?.message ?? 'No fue posible cargar los aprendizajes.'
  } finally {
    loading.value = false
  }
}

async function rebuild() {
  rebuilding.value = true
  error.value = ''
  try {
    await engramService.rebuild(props.workspaceId, {
      metric: props.metric,
      month: props.month,
    })
    await load()
  } catch (err: any) {
    error.value = err?.message ?? 'No fue posible generar los aprendizajes.'
  } finally {
    rebuilding.value = false
  }
}

async function activate(version: number) {
  activating.value = true
  error.value = ''
  try {
    await engramService.activate(props.workspaceId, version)
    await load()
  } catch (err: any) {
    error.value = err?.message ?? 'No fue posible activar el engram.'
  } finally {
    activating.value = false
  }
}

watch(() => props.workspaceId, load)
onMounted(load)
</script>

<style lang="scss" scoped>
.engram-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  padding: 1.25rem;
  background: $white;
  border: 1px solid rgba($text-secondary, 0.15);
  border-radius: 12px;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: $secondary;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: $primary-dark;
  }
}

.version-badge {
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  color: $secondary-dark;
  background: $overlay-purple;
  border-radius: 4px;
}

.subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: $text-secondary;
}

.draft-banner {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.8rem 0.9rem;
  background: $alert-warning-bg;
  border-radius: 8px;
}

.draft-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.82rem;
  color: $primary-dark;

  span {
    color: $text-secondary;
  }
}

.btn-activate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  color: $white;
  background: $alert-success;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.engram-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding-left: 0.75rem;
    border-left: 2px solid rgba($text-secondary, 0.2);
  }
}

.block-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &.good i {
    color: $alert-success;
  }

  &.bad i {
    color: $alert-error;
  }
}

.pattern {
  font-size: 0.86rem;
  line-height: 1.45;
  color: $primary-dark;
}

.evidence {
  font-size: 0.75rem;
  color: $text-secondary;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  color: $secondary-dark;
  background: $overlay-purple;
  border-radius: 999px;
}

.chip-banned {
  color: $alert-error;
  background: $alert-error-bg;
  text-decoration: line-through;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba($text-secondary, 0.12);
}

.btn-rebuild {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  color: $white;
  background: $secondary;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.footer-note {
  font-size: 0.75rem;
  color: $text-secondary;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.65rem 0.8rem;
  font-size: 0.82rem;
  color: $alert-error;
  background: $alert-error-bg;
  border-radius: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.75rem 1rem;
  text-align: center;
  color: $text-secondary;

  i {
    font-size: 1.8rem;
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-weight: 600;
    color: $primary-dark;
  }

  span {
    font-size: 0.85rem;
  }
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba($text-secondary, 0.1) 25%,
    rgba($text-secondary, 0.18) 50%,
    rgba($text-secondary, 0.1) 75%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.4s infinite;
}

.line-skeleton {
  height: 2.5rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .draft-banner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .btn-activate {
    flex: 0 0 auto;
  }

  .card-footer {
    flex-direction: row;
    align-items: center;
    gap: 0.85rem;
  }
}
</style>
