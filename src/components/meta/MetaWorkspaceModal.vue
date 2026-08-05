<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SearchableSelect from '@/components/sales/SearchableSelect.vue'
import type { PendingMetaAccount } from '@/services/meta.service'
import type { Workspace } from '@/types'

type AccountWithLink = PendingMetaAccount & { linkedWorkspace?: { id: string; name: string } | null }

const props = defineProps<{
  show: boolean
  workspace: Workspace | null
  allAdAccounts: AccountWithLink[]
  allInstagramAccounts: AccountWithLink[]
  saving: boolean
  unlinking: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-link', payload: { workspaceId: string; adAccountId?: string; instagramAccountId?: string }): void
}>()

const selectedAdAccountId = ref<string>('')
const selectedInstagramAccountId = ref<string>('')

function normalizeName(val: string) {
  return val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\b(official|oficial|ecuador|ec|ads|facebook|instagram|ig|grupo|corp|inc|llc|la|el|los|las|de|del|s|a)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function computeSimilarity(aStr: string, bStr: string): number {
  const a = normalizeName(aStr)
  const b = normalizeName(bStr)
  if (!a || !b) return 0
  const aNoSpace = a.replace(/\s+/g, '')
  const bNoSpace = b.replace(/\s+/g, '')
  if (a === b || (aNoSpace.length >= 3 && aNoSpace === bNoSpace)) return 1.0
  if (aNoSpace.length >= 3 && bNoSpace.length >= 3 && (bNoSpace.includes(aNoSpace) || aNoSpace.includes(bNoSpace))) return 0.95
  if (a.length >= 3 && b.length >= 3 && (b.includes(a) || a.includes(b))) return 0.9

  const aWords = new Set(a.split(' ').filter((w) => w.length > 1))
  const bWords = new Set(b.split(' ').filter((w) => w.length > 1))
  if (aWords.size === 0 || bWords.size === 0) return 0
  const intersection = [...aWords].filter((w) => bWords.has(w)).length
  const minWords = Math.min(aWords.size, bWords.size)
  const overlap = intersection / minWords
  if (overlap === 1) return 0.85
  return overlap * 0.7
}

const selectedIgAccount = computed(() => {
  if (!selectedInstagramAccountId.value) return null
  return props.allInstagramAccounts.find((a) => a.id === selectedInstagramAccountId.value) || null
})

function getWorkspaceLogo(w: Workspace | null): string | undefined {
  if (!w) return undefined
  if (w.metaAds?.pictureUrl) return w.metaAds.pictureUrl
  if (w.resources?.length) {
    const logo = w.resources.find((r: any) => r.categoria === 'logo')
    if (logo?.url) return logo.url
  }
  if (w.brandProfile?.archivos?.length) {
    const file = w.brandProfile.archivos.find((a: any) => a.tipo?.includes('image') || a.url?.match(/\.(png|jpg|jpeg|webp|svg)$/i))
    if (file?.url) return file.url
  }
  if (w.metaAds?.pageId) {
    return `https://graph.facebook.com/${w.metaAds.pageId}/picture?type=normal`
  }
  return undefined
}

const workspaceLogo = computed(() => {
  return selectedIgAccount.value?.profilePictureUrl || getWorkspaceLogo(props.workspace)
})

const recommendedAdAccount = computed(() => {
  if (!props.workspace || !props.allAdAccounts.length) return null
  const wsName = props.workspace.name
  let bestScore = 0
  let bestAccount: AccountWithLink | null = null

  for (const acc of props.allAdAccounts) {
    const searchTerms = [acc.name, acc.businessName, acc.pageName].filter(Boolean).join(' ')
    const score = computeSimilarity(wsName, searchTerms)
    if (score > bestScore && score >= 0.3) {
      bestScore = score
      bestAccount = acc
    }
  }
  return bestAccount
})

const recommendedInstagramAccount = computed(() => {
  if (!props.workspace || !props.allInstagramAccounts.length) return null
  const wsName = props.workspace.name
  let bestScore = 0
  let bestAccount: AccountWithLink | null = null

  for (const acc of props.allInstagramAccounts) {
    const searchTerms = [acc.name, acc.username, acc.businessName, acc.pageName].filter(Boolean).join(' ')
    const score = computeSimilarity(wsName, searchTerms)
    if (score > bestScore && score >= 0.3) {
      bestScore = score
      bestAccount = acc
    }
  }
  return bestAccount
})

const adAccountOptions = computed(() => {
  const recId = recommendedAdAccount.value?.accountId || recommendedAdAccount.value?.id
  const opts = props.allAdAccounts.map((a) => {
    const accId = a.accountId || a.id
    const isRec = accId === recId
    const isCurrentWs = a.linkedWorkspace?.id === props.workspace?._id

    let sub = ''
    if (isCurrentWs) {
      sub = '✅ Vincular actualmente a este workspace'
    } else if (a.linkedWorkspace) {
      sub = `⚠️ Vinculado actualmente a: ${a.linkedWorkspace.name}`
    } else if (isRec) {
      sub = '✨ Recomendado por coincidencia'
    } else {
      sub = [a.businessName ? `Portafolio: ${a.businessName}` : null, a.pageName ? `Página: ${a.pageName}` : null].filter(Boolean).join(' · ')
    }

    return {
      value: accId,
      label: `${a.name}${a.currency ? ` (${a.currency})` : ''}`,
      icon: 'fa-solid fa-bullhorn',
      subtitle: sub,
    }
  })
  if (recId) {
    opts.sort((a, b) => (a.value === recId ? -1 : b.value === recId ? 1 : 0))
  }
  return opts
})

const instagramOptions = computed(() => {
  const recId = recommendedInstagramAccount.value?.id
  const opts = props.allInstagramAccounts.map((a) => {
    const isRec = a.id === recId
    const isCurrentWs = a.linkedWorkspace?.id === props.workspace?._id

    let sub = ''
    if (isCurrentWs) {
      sub = '✅ Vincular actualmente a este workspace'
    } else if (a.linkedWorkspace) {
      sub = `⚠️ Vinculado actualmente a: ${a.linkedWorkspace.name}`
    } else if (isRec) {
      sub = '✨ Recomendado por coincidencia'
    } else {
      sub = [a.businessName ? `Portafolio: ${a.businessName}` : null, a.pageName ? `Página: ${a.pageName}` : null].filter(Boolean).join(' · ')
    }

    return {
      value: a.id,
      label: a.name,
      image: a.profilePictureUrl,
      icon: a.profilePictureUrl ? undefined : 'fa-brands fa-instagram',
      subtitle: sub,
    }
  })
  if (recId) {
    opts.sort((a, b) => (a.value === recId ? -1 : b.value === recId ? 1 : 0))
  }
  return opts
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.workspace) {
      selectedAdAccountId.value = props.workspace.metaAds?.adAccountId || recommendedAdAccount.value?.accountId || recommendedAdAccount.value?.id || ''
      selectedInstagramAccountId.value = props.workspace.metaAds?.instagramAccountId || recommendedInstagramAccount.value?.id || ''
    }
  },
  { immediate: true }
)

function handleClose() {
  if (props.saving || props.unlinking) return
  emit('close')
}

function handleSave() {
  if (!props.workspace || props.saving || props.unlinking) return
  emit('confirm-link', {
    workspaceId: props.workspace._id,
    adAccountId: selectedAdAccountId.value || undefined,
    instagramAccountId: selectedInstagramAccountId.value || undefined,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show && workspace" class="meta-modal-overlay" @click.self="handleClose">
        <div class="meta-modal">
          <header class="meta-modal__header">
            <div class="meta-modal__header-info">
              <img v-if="workspaceLogo" :src="workspaceLogo" class="meta-modal__header-logo" alt="" />
              <div v-else class="meta-modal__header-icon">
                <i class="fa-solid fa-building" />
              </div>
              <div>
                <h3>Vincular Cuentas Meta a {{ workspace.name }}</h3>
                <p>Asigna la cuenta de anuncios (Ads) y la cuenta de Instagram para este workspace.</p>
              </div>
            </div>
            <button class="meta-modal__close" :disabled="saving || unlinking" @click="handleClose">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div class="meta-modal__body">
            <!-- Section 1: Meta Ads Account Selection -->
            <div class="meta-modal__section">
              <label class="meta-modal__label">
                <i class="fa-solid fa-bullhorn" /> Cuenta de Anuncios Publicitarios (Meta Ads):
              </label>

              <div v-if="recommendedAdAccount && !workspace.metaAds?.adAccountId" class="meta-modal__recommendation">
                <div class="meta-modal__recommendation-left">
                  <i class="fa-solid fa-wand-magic-sparkles" />
                  <div>
                    <span class="meta-modal__recommendation-label">Sugerencia Ads:</span>
                    <strong>{{ recommendedAdAccount.name }}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  class="meta-modal__recommendation-btn"
                  :class="{ 'meta-modal__recommendation-btn--selected': selectedAdAccountId === (recommendedAdAccount.accountId || recommendedAdAccount.id) }"
                  @click="selectedAdAccountId = recommendedAdAccount.accountId || recommendedAdAccount.id"
                >
                  <i :class="selectedAdAccountId === (recommendedAdAccount.accountId || recommendedAdAccount.id) ? 'fa-solid fa-circle-check' : 'fa-solid fa-hand-pointer'" />
                  {{ selectedAdAccountId === (recommendedAdAccount.accountId || recommendedAdAccount.id) ? 'Seleccionada' : 'Usar sugerida' }}
                </button>
              </div>

              <SearchableSelect
                v-model="selectedAdAccountId"
                placeholder="Seleccionar cuenta de Ads..."
                search-placeholder="Buscar cuenta de anuncios..."
                :options="adAccountOptions"
              />
            </div>

            <!-- Section 2: Instagram Account Selection -->
            <div class="meta-modal__section">
              <label class="meta-modal__label">
                <i class="fa-brands fa-instagram" /> Cuenta de Instagram Orgánica / Reels:
              </label>

              <div v-if="recommendedInstagramAccount && !workspace.metaAds?.instagramAccountId" class="meta-modal__recommendation">
                <div class="meta-modal__recommendation-left">
                  <i class="fa-solid fa-wand-magic-sparkles" />
                  <div>
                    <span class="meta-modal__recommendation-label">Sugerencia Instagram:</span>
                    <strong>{{ recommendedInstagramAccount.name }}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  class="meta-modal__recommendation-btn"
                  :class="{ 'meta-modal__recommendation-btn--selected': selectedInstagramAccountId === recommendedInstagramAccount.id }"
                  @click="selectedInstagramAccountId = recommendedInstagramAccount.id"
                >
                  <i :class="selectedInstagramAccountId === recommendedInstagramAccount.id ? 'fa-solid fa-circle-check' : 'fa-solid fa-hand-pointer'" />
                  {{ selectedInstagramAccountId === recommendedInstagramAccount.id ? 'Seleccionada' : 'Usar sugerida' }}
                </button>
              </div>

              <SearchableSelect
                v-model="selectedInstagramAccountId"
                placeholder="Seleccionar cuenta de Instagram..."
                search-placeholder="Buscar cuenta de Instagram (@usuario)..."
                :options="instagramOptions"
              />
            </div>
          </div>

          <footer class="meta-modal__footer">
            <button class="meta-modal__btn-cancel" :disabled="saving || unlinking" @click="handleClose">
              Cancelar
            </button>
            <button
              class="meta-modal__btn-primary"
              :disabled="(!selectedAdAccountId && !selectedInstagramAccountId) || saving || unlinking"
              @click="handleSave"
            >
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
              {{ saving ? 'Guardando...' : 'Guardar Vinculación' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.meta-modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba($primary-dark, .5); backdrop-filter: blur(4px); }
.meta-modal { position: relative; display: flex; flex-direction: column; width: 100%; max-width: 32rem; background: $white; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,.22); overflow: visible; }
.meta-modal__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba($primary-dark, .08); background: $primary-light; border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
.meta-modal__header-info { display: flex; align-items: center; gap: .85rem; }
.meta-modal__header-logo { width: 3rem; height: 3rem; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid $white; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
.meta-modal__header-icon { display: flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; border-radius: .75rem; background: $overlay-purple; color: $secondary; font-size: 1.3rem; flex-shrink: 0; }
.meta-modal__header h3 { margin: 0; font-size: 1.05rem; color: $primary-dark; }
.meta-modal__header p { margin: .2rem 0 0; font-size: .82rem; color: $text-secondary; }
.meta-modal__close { border: 0; background: transparent; color: $text-secondary; font-size: 1.25rem; cursor: pointer; padding: .25rem; }
.meta-modal__close:disabled { opacity: .5; cursor: not-allowed; }

.meta-modal__body { position: relative; display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; overflow: visible; }
.meta-modal__section { display: flex; flex-direction: column; gap: .5rem; }
.meta-modal__label { font-size: .88rem; font-weight: 700; color: $primary-dark; display: flex; align-items: center; gap: .4rem; i { color: $primary; } }

.meta-modal__recommendation { display: flex; align-items: center; justify-content: space-between; gap: .8rem; padding: .65rem .85rem; border-radius: .65rem; background: $overlay-purple; border: 1px solid rgba($secondary, .25); color: $primary-dark; }
.meta-modal__recommendation-left { display: flex; align-items: center; gap: .55rem; i { color: $secondary; font-size: 1.1rem; flex-shrink: 0; } div { display: flex; flex-direction: column; gap: .05rem; } }
.meta-modal__recommendation-label { font-size: .72rem; color: $secondary-dark; font-weight: 600; }
.meta-modal__recommendation-val { font-size: .88rem; color: $primary-dark; }
.meta-modal__recommendation-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .7rem; border: 0; border-radius: .5rem; background: $secondary; color: $white; font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all .2s; }
.meta-modal__recommendation-btn:hover { background: darken($secondary, 8%); }
.meta-modal__recommendation-btn--selected { background: $alert-success; }

.meta-modal__footer { display: flex; align-items: center; justify-content: flex-end; gap: .65rem; padding: 1rem 1.5rem; border-top: 1px solid rgba($primary-dark, .08); background: rgba($primary-dark, .02); border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; }
.meta-modal__btn-cancel, .meta-modal__btn-primary { border: 0; border-radius: .6rem; padding: .65rem 1.1rem; font: inherit; font-weight: 700; cursor: pointer; transition: all .2s; }
.meta-modal__btn-cancel { background: transparent; color: $text-secondary; }
.meta-modal__btn-cancel:hover { color: $primary-dark; background: rgba($primary-dark, .05); }
.meta-modal__btn-primary { background: $primary; color: $white; }
.meta-modal__btn-primary:hover { background: darken($primary, 8%); }
.meta-modal__btn-primary:disabled, .meta-modal__btn-cancel:disabled { opacity: .55; cursor: not-allowed; }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .25s ease; .meta-modal { transition: transform .25s cubic-bezier(0.16, 1, 0.3, 1), opacity .25s ease; } }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; .meta-modal { opacity: 0; transform: scale(0.93) translateY(10px); } }
</style>
