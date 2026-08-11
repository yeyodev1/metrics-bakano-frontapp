<template>
  <div class="aft">
    <header class="aft__head">
      <div>
        <h2>API &amp; Feed para Agente de IA</h2>
        <p>Estructura JSON optimizada para ser leída por agentes inteligentes.</p>
      </div>
      <button class="aft__btn" @click="copyUrl">
        <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
        {{ copied ? 'Copiada' : 'Copiar URL del Feed' }}
      </button>
    </header>

    <div class="aft__preview">
      <pre>{{ preview }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import type { BrandProfile } from '@/types'

const props = defineProps<{
  workspaceId: string
  workspaceName?: string
  profile: BrandProfile
  totalScripts: number
  totalLinkedReels: number
  totalViews: number
  totalAdSpend: number
}>()

const toast = useToast()
const copied = ref(false)

const feedUrl = computed(
  () => `${window.location.origin}/api/agent-feed/workspaces/${props.workspaceId}`
)

const preview = computed(() =>
  JSON.stringify(
    {
      workspaceId: props.workspaceId,
      workspaceName: props.workspaceName,
      propuestaValor: props.profile.propuestaValor,
      customerJourneyCases: props.profile.customerJourneyCases ?? [],
      totalScripts: props.totalScripts,
      totalLinkedReels: props.totalLinkedReels,
      totalViews: props.totalViews,
      totalAdSpend: props.totalAdSpend,
    },
    null,
    2
  )
)

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(feedUrl.value)
    copied.value = true
    toast.success('URL de Feed para Agente IA copiada al portapapeles.')
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    toast.error('No se pudo copiar la URL.')
  }
}
</script>

<style scoped lang="scss">
.aft {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 18px;
}

.aft__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.2rem 0 0; font-size: 0.85rem; color: $text-secondary; }
}

.aft__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: $white;
  background: linear-gradient(135deg, $secondary 0%, $secondary-dark 100%);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { transform: translateY(-1px); }
}

// Wide JSON scrolls inside its own box, never the page.
.aft__preview {
  width: 100%;
  min-width: 0;
  padding: 1.5rem;
  overflow-x: auto;
  color: #38bdf8;
  background: $primary-dark;
  border-radius: 12px;

  pre { margin: 0; font-family: monospace; font-size: 0.85rem; line-height: 1.5; }
}
</style>
