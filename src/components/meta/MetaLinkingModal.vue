<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SearchableSelect from '@/components/sales/SearchableSelect.vue'
import type { PendingMetaAccount, LinkedMetaAccount } from '@/services/meta.service'
import type { Workspace } from '@/types'

const props = defineProps<{
  show: boolean
  account: PendingMetaAccount | LinkedMetaAccount | null
  workspaces: Workspace[]
  saving: boolean
  unlinking: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-link', workspaceId: string): void
  (e: 'confirm-unlink'): void
}>()

const selectedWorkspaceId = ref<string>('')

const isAdsAccountInBusiness = computed(() => {
  return props.account?.type === 'ad_account' && !!props.account?.businessName
})

const currentAccountWorkspaceName = computed(() => {
  if (props.account && 'workspaceName' in props.account) {
    return props.account.workspaceName
  }
  return ''
})

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
  return 0
}

const recommendedWorkspace = computed(() => {
  if (!props.account || !props.workspaces.length) return null
  const acc = props.account
  const terms = [acc.name, acc.username, acc.businessName, acc.pageName].filter(Boolean).join(' ')
  let bestScore = 0
  let bestWs: Workspace | null = null

  for (const ws of props.workspaces) {
    const score = computeSimilarity(ws.name, terms)
    if (score > bestScore && score >= 0.5) {
      bestScore = score
      bestWs = ws
    }
  }
  return bestWs
})

function getWorkspaceLogo(w: Workspace): string | undefined {
  if (w.resources?.length) {
    const logo = w.resources.find((r: any) => r.categoria === 'logo')
    if (logo?.url) return logo.url
  }
  if (w.brandProfile?.archivos?.length) {
    const file = w.brandProfile.archivos.find((a: any) => a.tipo?.includes('image') || a.url?.match(/\.(png|jpg|jpeg|webp|svg)$/i))
    if (file?.url) return file.url
  }
  return undefined
}

const selectedWorkspaceObj = computed(() => {
  if (!selectedWorkspaceId.value) return null
  return props.workspaces.find((w) => w._id === selectedWorkspaceId.value) || null
})

const selectedWorkspaceLogo = computed(() => {
  if (!selectedWorkspaceObj.value) return undefined
  return getWorkspaceLogo(selectedWorkspaceObj.value)
})

const workspaceOptions = computed(() => {
  const recId = recommendedWorkspace.value?._id
  const opts = props.workspaces.map((w) => {
    const img = getWorkspaceLogo(w)
    return {
      value: w._id,
      label: w.name,
      image: img,
      icon: img ? undefined : 'fa-solid fa-building',
      subtitle: w._id === recId ? '✨ Recomendado por coincidencia' : undefined,
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
    if (newVal && props.account) {
      if ('workspaceId' in props.account && props.account.workspaceId) {
        selectedWorkspaceId.value = props.account.workspaceId
      } else {
        selectedWorkspaceId.value = recommendedWorkspace.value?._id || ''
      }
    }
  },
  { immediate: true }
)

function handleClose() {
  emit('close')
}

function handleLink() {
  if (!selectedWorkspaceId.value || props.saving || props.unlinking) return
  emit('confirm-link', selectedWorkspaceId.value)
}

const isAccountAlreadyLinked = computed(() => {
  return props.account && 'workspaceId' in props.account && !!props.account.workspaceId
})

function handleUnlink() {
  if (props.saving || props.unlinking) return
  emit('confirm-unlink')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show && account" class="meta-modal-overlay" @click.self="handleClose">
        <div class="meta-modal">
          <header class="meta-modal__header">
            <div>
              <h3>
                <i :class="account.type === 'instagram' ? 'fa-brands fa-instagram' : 'fa-solid fa-bullhorn'" />
                {{ isAccountLinked ? 'Editar Vinculación de Cuenta' : 'Vincular Cuenta Meta' }}
              </h3>
              <p>Selecciona el workspace para asignar este activo uno a uno.</p>
            </div>
            <button class="meta-modal__close" :disabled="saving || unlinking" @click="handleClose">
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div class="meta-modal__body">
            <!-- Account Summary Card with Image Replacement when Workspace Selected -->
            <div class="meta-modal__account-card">
              <div class="meta-modal__account-header">
                <!-- If a workspace is selected and has a logo, display the workspace logo, otherwise account image -->
                <img v-if="selectedWorkspaceLogo" :src="selectedWorkspaceLogo" class="meta-modal__avatar meta-modal__avatar--ws" alt="" />
                <img v-else-if="account.profilePictureUrl" :src="account.profilePictureUrl" class="meta-modal__avatar" alt="" />
                <div v-else class="meta-modal__avatar-icon">
                  <i :class="account.type === 'instagram' ? 'fa-brands fa-instagram' : 'fa-solid fa-bullhorn'" />
                </div>

                <div class="meta-modal__account-title">
                  <strong>{{ account.name }}</strong>
                  <span class="meta-modal__account-type">
                    {{ account.type === 'instagram' ? 'Instagram Account' : 'Cuenta de Anuncios (Ads)' }} {{ account.currency ? `(${account.currency})` : '' }}
                  </span>
                </div>
              </div>

              <!-- Primary Account badge for Ads in Portfolio -->
              <div v-if="isAdsAccountInBusiness" class="meta-modal__primary-badge">
                <i class="fa-solid fa-star" />
                <span>Esta cuenta publicitaria se asignará como la <strong>Cuenta Principal de Anuncios (Ads)</strong> del workspace.</span>
              </div>

              <div class="meta-modal__meta-list">
                <div v-if="account.pageName" class="meta-modal__meta-item meta-modal__meta-item--page">
                  <i class="fa-solid fa-flag" />
                  <div>
                    <span class="meta-modal__meta-label">Página de Facebook asociada:</span>
                    <strong class="meta-modal__meta-val">{{ account.pageName }}</strong>
                  </div>
                </div>
                <div v-if="account.businessName" class="meta-modal__meta-item meta-modal__meta-item--business">
                  <i class="fa-solid fa-briefcase" />
                  <div>
                    <span class="meta-modal__meta-label">Portafolio Business Manager:</span>
                    <strong class="meta-modal__meta-val">{{ account.businessName }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recommendation Banner -->
            <div v-if="recommendedWorkspace" class="meta-modal__recommendation">
              <div class="meta-modal__recommendation-left">
                <i class="fa-solid fa-wand-magic-sparkles" />
                <div>
                  <span class="meta-modal__recommendation-label">Coincidencia recomendada:</span>
                  <strong class="meta-modal__recommendation-val">{{ recommendedWorkspace.name }}</strong>
                </div>
              </div>
              <button
                type="button"
                class="meta-modal__recommendation-btn"
                :class="{ 'meta-modal__recommendation-btn--selected': selectedWorkspaceId === recommendedWorkspace._id }"
                @click="selectedWorkspaceId = recommendedWorkspace._id"
              >
                <i :class="selectedWorkspaceId === recommendedWorkspace._id ? 'fa-solid fa-circle-check' : 'fa-solid fa-hand-pointer'" />
                {{ selectedWorkspaceId === recommendedWorkspace._id ? 'Seleccionado' : 'Usar recomendado' }}
              </button>
            </div>

            <!-- Notice when already linked -->
            <div v-if="isAccountAlreadyLinked" class="meta-modal__warning">
              <i class="fa-solid fa-triangle-exclamation" />
              <div>
                <strong>Esta cuenta ya está vinculada</strong>
                <p>Actualmente pertenece al workspace <strong>"{{ currentAccountWorkspaceName }}"</strong>. No se modificará salvo que selecciones explícitamente otro workspace y confirmes el cambio.</p>
              </div>
            </div>

            <div class="meta-modal__form-group">
              <label><i class="fa-solid fa-building" /> Selecciona el Workspace destino:</label>
              <SearchableSelect
                v-model="selectedWorkspaceId"
                placeholder="Buscar workspace..."
                search-placeholder="Escribe el nombre del workspace..."
                :options="workspaceOptions"
              />
            </div>

            <!-- Selected Workspace Meta Connection Context Card -->
            <div v-if="selectedWorkspaceObj?.metaAds" class="meta-modal__ws-context">
              <div v-if="selectedWorkspaceObj.metaAds.instagramAccountName" class="meta-modal__ws-context-item">
                <i class="fa-brands fa-instagram" />
                <span>Instagram en {{ selectedWorkspaceObj.name }}: <strong>{{ selectedWorkspaceObj.metaAds.instagramAccountName }}</strong></span>
              </div>
              <div v-if="account.type === 'ad_account' && selectedWorkspaceObj.metaAds.adAccountId && selectedWorkspaceObj.metaAds.adAccountId !== (account.accountId || account.id)" class="meta-modal__ws-context-item meta-modal__ws-context-item--replace">
                <i class="fa-solid fa-triangle-exclamation" />
                <span>Atención: Reemplazará a la cuenta de Ads anterior (<strong>{{ selectedWorkspaceObj.metaAds.adAccountName || selectedWorkspaceObj.metaAds.adAccountId }}</strong>).</span>
              </div>
              <div v-else-if="account.type === 'ad_account' && !selectedWorkspaceObj.metaAds.adAccountId && selectedWorkspaceObj.metaAds.instagramAccountName" class="meta-modal__ws-context-item meta-modal__ws-context-item--info">
                <i class="fa-solid fa-circle-check" />
                <span>Completará la integración de Meta para {{ selectedWorkspaceObj.name }} (uniéndose a {{ selectedWorkspaceObj.metaAds.instagramAccountName }}).</span>
              </div>
            </div>
          </div>

          <footer class="meta-modal__footer">
            <button class="meta-modal__btn-cancel" :disabled="saving || unlinking" @click="handleClose">
              Cancelar
            </button>
            <button
              v-if="isAccountAlreadyLinked"
              class="meta-modal__btn-danger"
              :disabled="saving || unlinking"
              @click="handleUnlink"
            >
              <i :class="unlinking ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-link-slash'" />
              {{ unlinking ? 'Desvinculando...' : 'Desvincular' }}
            </button>
            <button
              class="meta-modal__btn-primary"
              :disabled="!selectedWorkspaceId || saving || unlinking"
              @click="handleLink"
            >
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
              {{ saving ? 'Guardando...' : 'Confirmar Vinculación' }}
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
.meta-modal__header h3 { margin: 0; font-size: 1.1rem; color: $primary-dark; display: flex; align-items: center; gap: .5rem; i { color: $primary; } }
.meta-modal__header p { margin: .25rem 0 0; font-size: .85rem; color: $text-secondary; }
.meta-modal__close { border: 0; background: transparent; color: $text-secondary; font-size: 1.25rem; cursor: pointer; padding: .25rem; }
.meta-modal__close:disabled { opacity: .5; cursor: not-allowed; }
.meta-modal__body { position: relative; display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; overflow: visible; }
.meta-modal__account-card { display: flex; flex-direction: column; gap: .85rem; padding: 1rem; border-radius: .8rem; background: rgba($primary-dark, .03); border: 1px solid rgba($primary-dark, .08); }
.meta-modal__account-header { display: flex; align-items: center; gap: .8rem; }
.meta-modal__avatar { width: 3.2rem; height: 3.2rem; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid $white; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
.meta-modal__avatar--ws { border-color: $primary; }
.meta-modal__avatar-icon { display: flex; align-items: center; justify-content: center; width: 3.2rem; height: 3.2rem; border-radius: .75rem; background: $overlay-purple; color: $secondary; font-size: 1.4rem; flex-shrink: 0; }
.meta-modal__account-title { display: flex; flex-direction: column; gap: .15rem; min-width: 0; }
.meta-modal__account-title strong { font-size: 1.05rem; color: $primary-dark; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta-modal__account-type { font-size: .8rem; color: $text-secondary; font-weight: 600; }

.meta-modal__primary-badge {
  display: flex;
  align-items: center;
  gap: .55rem;
  padding: .5rem .75rem;
  border-radius: .55rem;
  background: rgba($primary, .08);
  border: 1px dashed rgba($primary, .3);
  color: $primary-dark;
  font-size: .78rem;
  font-weight: 700;
  i { color: $primary; font-size: .9rem; flex-shrink: 0; }
}

.meta-modal__meta-list { display: flex; flex-direction: column; gap: .5rem; border-top: 1px solid rgba($primary-dark, .06); padding-top: .65rem; }
.meta-modal__meta-item { display: flex; align-items: flex-start; gap: .6rem; font-size: .82rem; line-height: 1.35; i { margin-top: .2rem; flex-shrink: 0; } div { display: flex; flex-direction: column; } }
.meta-modal__meta-item--page i { color: $primary; }
.meta-modal__meta-item--business i { color: $secondary-dark; }
.meta-modal__meta-label { color: $text-secondary; font-size: .75rem; }
.meta-modal__meta-val { color: $primary-dark; font-weight: 700; }

.meta-modal__recommendation { display: flex; align-items: center; justify-content: space-between; gap: .8rem; padding: .85rem 1rem; border-radius: .75rem; background: $overlay-purple; border: 1px solid rgba($secondary, .3); color: $primary-dark; }
.meta-modal__recommendation-left { display: flex; align-items: center; gap: .65rem; i { color: $secondary; font-size: 1.25rem; flex-shrink: 0; } div { display: flex; flex-direction: column; gap: .1rem; } }
.meta-modal__recommendation-label { font-size: .75rem; color: $secondary-dark; font-weight: 600; }
.meta-modal__recommendation-val { font-size: .95rem; color: $primary-dark; }
.meta-modal__recommendation-btn { display: inline-flex; align-items: center; gap: .4rem; padding: .45rem .8rem; border: 0; border-radius: .55rem; background: $secondary; color: $white; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all .2s; }
.meta-modal__recommendation-btn:hover { background: darken($secondary, 8%); }
.meta-modal__recommendation-btn--selected { background: $alert-success; }

.meta-modal__warning { display: flex; gap: .75rem; padding: .85rem 1rem; border-radius: .7rem; background: $alert-warning-bg; border: 1px solid rgba($alert-warning, .4); color: $primary-dark; font-size: .85rem; line-height: 1.4; i { color: $alert-warning; font-size: 1.2rem; flex-shrink: 0; margin-top: .1rem; } p { margin: .2rem 0 0; } }
.meta-modal__form-group { position: relative; display: flex; flex-direction: column; gap: .4rem; }
.meta-modal__form-group label { font-size: .88rem; font-weight: 700; color: $primary-dark; display: flex; align-items: center; gap: .4rem; }

.meta-modal__ws-context {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  padding: .75rem 1rem;
  border-radius: .7rem;
  background: rgba($primary-dark, .03);
  border: 1px solid rgba($primary-dark, .08);
}
.meta-modal__ws-context-item {
  display: flex;
  align-items: center;
  gap: .55rem;
  font-size: .82rem;
  color: $primary-dark;
  i { color: $secondary; font-size: .95rem; flex-shrink: 0; }
}
.meta-modal__ws-context-item--replace {
  color: darken($alert-warning, 15%);
  i { color: $alert-warning; }
}
.meta-modal__ws-context-item--info {
  color: $alert-success;
  i { color: $alert-success; }
}
.meta-modal__footer { display: flex; align-items: center; justify-content: flex-end; gap: .65rem; padding: 1rem 1.5rem; border-top: 1px solid rgba($primary-dark, .08); background: rgba($primary-dark, .02); border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; }
.meta-modal__btn-cancel, .meta-modal__btn-primary, .meta-modal__btn-danger { border: 0; border-radius: .6rem; padding: .65rem 1.1rem; font: inherit; font-weight: 700; cursor: pointer; transition: all .2s; }
.meta-modal__btn-cancel { background: transparent; color: $text-secondary; }
.meta-modal__btn-cancel:hover { color: $primary-dark; background: rgba($primary-dark, .05); }
.meta-modal__btn-danger { background: $alert-error-bg; color: $alert-error; border: 1px solid rgba($alert-error, .3); }
.meta-modal__btn-danger:hover { background: darken($alert-error-bg, 3%); }
.meta-modal__btn-primary { background: $primary; color: $white; }
.meta-modal__btn-primary:hover { background: darken($primary, 8%); }
.meta-modal__btn-primary:disabled, .meta-modal__btn-danger:disabled, .meta-modal__btn-cancel:disabled { opacity: .55; cursor: not-allowed; }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .25s ease; .meta-modal { transition: transform .25s cubic-bezier(0.16, 1, 0.3, 1), opacity .25s ease; } }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; .meta-modal { opacity: 0; transform: scale(0.93) translateY(10px); } }
</style>
