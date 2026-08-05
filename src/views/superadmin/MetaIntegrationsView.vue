<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { metaService, type PendingMetaAccount } from '@/services/meta.service'
import { workspaceService } from '@/services/workspace.service'
import MetaWorkspaceModal from '@/components/meta/MetaWorkspaceModal.vue'
import { useToast } from '@/composables/useToast'
import type { Workspace } from '@/types'

const toast = useToast()

const activeTab = ref<'unlinked' | 'linked'>('unlinked')
const searchQuery = ref('')

const workspaces = ref<Workspace[]>([])
const allAdAccounts = ref<(PendingMetaAccount & { linkedWorkspace?: { id: string; name: string } | null })[]>([])
const allInstagramAccounts = ref<(PendingMetaAccount & { linkedWorkspace?: { id: string; name: string } | null })[]>([])

const loading = ref(true)
const matching = ref(false)
const connecting = ref(false)
const connection = ref<{ connected: boolean; name?: string; expiresAt?: string; expired?: boolean }>({ connected: false })
const error = ref<string | null>(null)
const notice = ref<string | null>(null)

const showModal = ref(false)
const selectedWorkspace = ref<Workspace | null>(null)
const savingModal = ref(false)

function isWorkspaceFullyLinked(w: Workspace): boolean {
  return !!(w.metaAds?.adAccountId && w.metaAds?.instagramAccountId)
}

function getWorkspaceLogo(w: Workspace): string | undefined {
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

const unlinkedWorkspaces = computed(() => workspaces.value.filter((w) => !isWorkspaceFullyLinked(w)))
const linkedWorkspaces = computed(() => workspaces.value.filter((w) => isWorkspaceFullyLinked(w)))

const filteredUnlinkedWorkspaces = computed(() => {
  if (!searchQuery.value.trim()) return unlinkedWorkspaces.value
  const q = searchQuery.value.toLowerCase().trim()
  return unlinkedWorkspaces.value.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      (w.metaAds?.adAccountName && w.metaAds.adAccountName.toLowerCase().includes(q)) ||
      (w.metaAds?.instagramAccountName && w.metaAds.instagramAccountName.toLowerCase().includes(q))
  )
})

const filteredLinkedWorkspaces = computed(() => {
  if (!searchQuery.value.trim()) return linkedWorkspaces.value
  const q = searchQuery.value.toLowerCase().trim()
  return linkedWorkspaces.value.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      (w.metaAds?.adAccountName && w.metaAds.adAccountName.toLowerCase().includes(q)) ||
      (w.metaAds?.instagramAccountName && w.metaAds.instagramAccountName.toLowerCase().includes(q))
  )
})

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [workspaceData, allAccountsData] = await Promise.all([
      workspaceService.listWorkspaces({ limit: 100 }),
      metaService.getAllGlobalAccounts(),
    ])
    workspaces.value = workspaceData.workspaces || []
    allAdAccounts.value = allAccountsData.adAccounts || []
    allInstagramAccounts.value = allAccountsData.instagramAccounts || []
  } catch (e: any) {
    error.value = e.message || 'No se pudieron cargar los datos de la integración.'
  } finally {
    loading.value = false
  }
}

async function runAutoMatch() {
  matching.value = true
  error.value = null
  notice.value = null
  try {
    const result = await metaService.runGlobalAutoMatch()
    notice.value = `${result.matches?.length || 0} vinculaciones automáticas confirmadas.`
    await loadData()
  } catch (e: any) {
    error.value = e.message || 'No fue posible ejecutar el mapeo automático.'
  } finally {
    matching.value = false
  }
}

async function connectFacebook() {
  connecting.value = true
  error.value = null
  try {
    window.location.assign(await metaService.getGlobalOAuthUrl())
  } catch (e: any) {
    connecting.value = false
    error.value = e.message || 'No fue posible iniciar la conexión con Facebook.'
  }
}

function openModal(w: Workspace) {
  selectedWorkspace.value = w
  showModal.value = true
}

function closeModal() {
  if (savingModal.value) return
  showModal.value = false
  selectedWorkspace.value = null
}

async function handleConfirmLink(payload: { workspaceId: string; adAccountId?: string; instagramAccountId?: string }) {
  savingModal.value = true
  error.value = null
  notice.value = null
  const ws = selectedWorkspace.value
  try {
    await metaService.manuallyLinkGlobalAccount({
      workspaceId: payload.workspaceId,
      adAccountId: payload.adAccountId,
      instagramAccountId: payload.instagramAccountId,
    })
    const wsName = ws?.name || 'Workspace'
    const successMsg = `Meta Ads vinculado exitosamente a "${wsName}".`
    notice.value = successMsg
    toast.success(successMsg, 'Vinculación Exitosa')

    showModal.value = false
    selectedWorkspace.value = null

    await loadData()
  } catch (e: any) {
    const errorMsg = e.message || 'No se pudo vincular el workspace.'
    error.value = errorMsg
    toast.error(errorMsg, 'Error de Vinculación')
  } finally {
    savingModal.value = false
  }
}

onMounted(async () => {
  try {
    const status = await metaService.getGlobalConnectionStatus()
    connection.value = status
  } catch (e: any) {
    error.value = e.message || 'No se pudo cargar el estado de la integración.'
  }
  if (connection.value.connected && !connection.value.expired) await loadData()
  else loading.value = false
})
</script>

<template>
  <section class="meta-integrations">
    <header class="meta-integrations__header">
      <div>
        <p class="meta-integrations__eyebrow"><i class="fa-brands fa-meta" /> INTEGRACIÓN GLOBAL POR WORKSPACE</p>
        <h1>Workspaces y Cuentas Meta</h1>
        <p>Garantiza que cada cliente tenga su cuenta de Ads e Instagram vinculadas de forma segura uno a uno.</p>
      </div>
      <button class="meta-integrations__primary" :disabled="matching || !connection.connected || connection.expired" @click="runAutoMatch">
        <i :class="matching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'" />
        {{ matching ? 'Analizando coincidencia...' : 'Ejecutar auto-mapeo global' }}
      </button>
    </header>

    <div class="meta-integrations__notice">
      <i class="fa-solid fa-shield-halved" />
      <span>Esta integración usa el perfil de Facebook invitado a los portafolios de clientes. Su token permanece cifrado en el backend.</span>
    </div>

    <div class="meta-integrations__connection" :class="{ 'meta-integrations__connection--active': connection.connected && !connection.expired }">
      <div>
        <strong>{{ connection.connected && !connection.expired ? `Conectado como ${connection.name}` : 'Perfil de Facebook no conectado' }}</strong>
        <span v-if="connection.connected && !connection.expired">Usaremos los activos a los que este perfil fue invitado.</span>
        <span v-else>Conecta el perfil de Facebook que recibe las invitaciones de los clientes.</span>
      </div>
      <button :disabled="connecting" @click="connectFacebook">
        <i :class="connecting ? 'fa-solid fa-spinner fa-spin' : 'fa-brands fa-facebook'" />
        {{ connecting ? 'Redirigiendo...' : connection.connected ? 'Reconectar Facebook' : 'Conectar Facebook' }}
      </button>
    </div>

    <p v-if="notice" class="meta-integrations__success"><i class="fa-solid fa-circle-check" /> {{ notice }}</p>
    <p v-if="error" class="meta-integrations__error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</p>

    <div class="meta-integrations__tabs">
      <button class="meta-integrations__tab" :class="{ 'meta-integrations__tab--active': activeTab === 'unlinked' }" @click="activeTab = 'unlinked'">
        <i class="fa-solid fa-building-circle-exclamation" />
        <span>Workspaces por vincular</span>
        <span class="meta-integrations__tab-badge">{{ unlinkedWorkspaces.length }}</span>
      </button>
      <button class="meta-integrations__tab" :class="{ 'meta-integrations__tab--active': activeTab === 'linked' }" @click="activeTab = 'linked'">
        <i class="fa-solid fa-building-circle-check" />
        <span>Workspaces vinculados</span>
        <span class="meta-integrations__tab-badge meta-integrations__tab-badge--success">{{ linkedWorkspaces.length }}</span>
      </button>
    </div>

    <div class="meta-integrations__search-bar">
      <i class="fa-solid fa-magnifying-glass" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nombre de workspace, cuenta de Ads o Instagram..."
        class="meta-integrations__search-input"
      />
      <button v-if="searchQuery" class="meta-integrations__clear-search" @click="searchQuery = ''">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <!-- WORKSPACES POR VINCULAR TAB -->
    <div v-if="activeTab === 'unlinked'">
      <div class="meta-integrations__section-heading">
        <div>
          <h2>Workspaces pendientes o incompletos</h2>
          <p v-if="searchQuery">Mostrando {{ filteredUnlinkedWorkspaces.length }} resultados para "<strong>{{ searchQuery }}</strong>"</p>
          <p v-else>Total: {{ unlinkedWorkspaces.length }} clientes requieren vincular Meta Ads o Instagram</p>
        </div>
      </div>

      <div v-if="loading" class="meta-integrations__list">
        <div v-for="item in 5" :key="item" class="meta-integrations__skeleton">
          <span class="meta-integrations__skeleton-line meta-integrations__skeleton-line--title" />
          <span class="meta-integrations__skeleton-line" />
        </div>
      </div>

      <div v-else-if="filteredUnlinkedWorkspaces.length" class="meta-integrations__list">
        <article v-for="w in filteredUnlinkedWorkspaces" :key="w._id" class="meta-integrations__account">
          <div class="meta-integrations__account-icon">
            <img v-if="getWorkspaceLogo(w)" :src="getWorkspaceLogo(w)" class="meta-integrations__account-img" alt="" />
            <i v-else class="fa-solid fa-building" />
          </div>
          <div class="meta-integrations__account-info">
            <strong>{{ w.name }}</strong>
            <div class="meta-integrations__account-details">
              <span v-if="w.metaAds?.adAccountId" class="meta-integrations__detail-tag meta-integrations__detail-tag--page">
                <i class="fa-solid fa-bullhorn" /> Ads: {{ w.metaAds.adAccountName || w.metaAds.adAccountId }}
              </span>
              <span v-else class="meta-integrations__detail-tag meta-integrations__detail-tag--missing">
                <i class="fa-solid fa-circle-xmark" /> Sin Ads
              </span>

              <span v-if="w.metaAds?.instagramAccountId" class="meta-integrations__detail-tag meta-integrations__detail-tag--business">
                <i class="fa-brands fa-instagram" /> {{ w.metaAds.instagramAccountName || w.metaAds.instagramAccountId }}
              </span>
              <span v-else class="meta-integrations__detail-tag meta-integrations__detail-tag--missing">
                <i class="fa-solid fa-circle-xmark" /> Sin Instagram
              </span>
            </div>
          </div>
          <button class="meta-integrations__btn-action" @click="openModal(w)">
            <i class="fa-solid fa-link" /> Vincular Cuentas Meta
          </button>
        </article>
      </div>

      <div v-else class="meta-integrations__empty">
        <i class="fa-solid fa-circle-check" />
        <strong>{{ searchQuery ? 'Sin coincidencias' : '¡Todos los clientes vinculados!' }}</strong>
        <span>{{ searchQuery ? 'No se encontraron workspaces que coincidan con la búsqueda.' : 'Todos los workspaces tienen sus cuentas de Meta Ads e Instagram integradas.' }}</span>
      </div>
    </div>

    <!-- WORKSPACES VINCULADOS TAB -->
    <div v-else-if="activeTab === 'linked'">
      <div class="meta-integrations__section-heading">
        <div>
          <h2>Workspaces con integración completa</h2>
          <p v-if="searchQuery">Mostrando {{ filteredLinkedWorkspaces.length }} resultados para "<strong>{{ searchQuery }}</strong>"</p>
          <p v-else>Total: {{ linkedWorkspaces.length }} clientes con Ads e Instagram conectados</p>
        </div>
      </div>

      <div v-if="loading" class="meta-integrations__list">
        <div v-for="item in 5" :key="item" class="meta-integrations__skeleton">
          <span class="meta-integrations__skeleton-line meta-integrations__skeleton-line--title" />
          <span class="meta-integrations__skeleton-line" />
        </div>
      </div>

      <div v-else-if="filteredLinkedWorkspaces.length" class="meta-integrations__list">
        <article v-for="w in filteredLinkedWorkspaces" :key="w._id" class="meta-integrations__account meta-integrations__account--linked">
          <div class="meta-integrations__account-icon meta-integrations__account-icon--linked">
            <img v-if="getWorkspaceLogo(w)" :src="getWorkspaceLogo(w)" class="meta-integrations__account-img" alt="" />
            <i v-else class="fa-solid fa-building" />
          </div>
          <div class="meta-integrations__account-info">
            <strong>{{ w.name }}</strong>
            <div class="meta-integrations__account-details">
              <span class="meta-integrations__detail-tag meta-integrations__detail-tag--workspace">
                <i class="fa-solid fa-circle-check" /> Completo
              </span>
              <span class="meta-integrations__detail-tag meta-integrations__detail-tag--page">
                <i class="fa-solid fa-bullhorn" /> Ads: {{ w.metaAds?.adAccountName || w.metaAds?.adAccountId }}
              </span>
              <span class="meta-integrations__detail-tag meta-integrations__detail-tag--business">
                <i class="fa-brands fa-instagram" /> {{ w.metaAds?.instagramAccountName || w.metaAds?.instagramAccountId }}
              </span>
            </div>
          </div>
          <button class="meta-integrations__btn-action meta-integrations__btn-action--outline" @click="openModal(w)">
            <i class="fa-solid fa-pen-to-square" /> Editar Vinculación
          </button>
        </article>
      </div>

      <div v-else class="meta-integrations__empty">
        <i class="fa-solid fa-circle-info" />
        <strong>{{ searchQuery ? 'Sin coincidencias' : 'No hay workspaces vinculados' }}</strong>
        <span>{{ searchQuery ? 'No se encontraron workspaces que coincidan con la búsqueda.' : 'Aún no se ha completado la vinculación de ningún workspace.' }}</span>
      </div>
    </div>

    <!-- MODAL CENTRADO EN WORKSPACE -->
    <MetaWorkspaceModal
      :show="showModal"
      :workspace="selectedWorkspace"
      :all-ad-accounts="allAdAccounts"
      :all-instagram-accounts="allInstagramAccounts"
      :saving="savingModal"
      :unlinking="false"
      @close="closeModal"
      @confirm-link="handleConfirmLink"
    />
  </section>
</template>

<style scoped lang="scss">
.meta-integrations { width: 100%; min-width: 0; padding: 1rem; color: $primary-dark; }
.meta-integrations__header, .meta-integrations__section-heading, .meta-integrations__account, .meta-integrations__tabs { display: flex; }
.meta-integrations__header { flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
.meta-integrations__header h1, .meta-integrations__section-heading h2 { margin: 0; }
.meta-integrations__header p { margin: .5rem 0 0; color: $text-secondary; line-height: 1.5; }
.meta-integrations__eyebrow { color: $primary !important; font-size: .75rem; font-weight: 800; letter-spacing: .08em; }
.meta-integrations__primary { border: 0; border-radius: .6rem; font: inherit; font-weight: 700; cursor: pointer; align-self: flex-start; padding: .8rem 1rem; color: $white; background: $primary; }
.meta-integrations__primary:disabled { opacity: .55; cursor: not-allowed; }
.meta-integrations__notice, .meta-integrations__success, .meta-integrations__error { display: flex; gap: .65rem; align-items: flex-start; padding: .85rem 1rem; border-radius: .7rem; margin: 0 0 1rem; line-height: 1.4; }
.meta-integrations__notice { background: $overlay-purple; color: $secondary-dark; }
.meta-integrations__connection { display: flex; flex-direction: column; gap: .75rem; padding: 1rem; margin-bottom: 1rem; border: 1px solid rgba($primary-dark, .12); border-radius: .7rem; background: $white; }
.meta-integrations__connection--active { border-color: rgba($alert-success, .5); }
.meta-integrations__connection div { display: flex; flex-direction: column; gap: .25rem; }
.meta-integrations__connection span { color: $text-secondary; font-size: .85rem; }
.meta-integrations__connection button { align-self: flex-start; border: 0; border-radius: .55rem; padding: .65rem .85rem; color: $white; background: $secondary; cursor: pointer; font: inherit; font-weight: 700; }
.meta-integrations__connection button:disabled { opacity: .55; cursor: not-allowed; }
.meta-integrations__success { background: $alert-success-bg; color: $alert-success; }
.meta-integrations__error { background: $alert-error-bg; color: $alert-error; }

/* Tabs & Search Bar */
.meta-integrations__tabs { gap: .5rem; border-bottom: 2px solid rgba($primary-dark, .08); margin-bottom: 1rem; }
.meta-integrations__tab { display: flex; align-items: center; gap: .5rem; padding: .75rem 1rem; border: 0; border-bottom: 2px solid transparent; margin-bottom: -2px; background: transparent; color: $text-secondary; font: inherit; font-weight: 700; cursor: pointer; transition: all .2s; }
.meta-integrations__tab:hover { color: $primary-dark; }
.meta-integrations__tab--active { color: $primary; border-bottom-color: $primary; }
.meta-integrations__tab-badge { display: inline-flex; align-items: center; justify-content: center; padding: .15rem .45rem; border-radius: 99px; background: rgba($primary-dark, .08); color: $primary-dark; font-size: .75rem; font-weight: 800; }
.meta-integrations__tab-badge--success { background: $alert-success-bg; color: $alert-success; }

.meta-integrations__search-bar { display: flex; align-items: center; gap: .65rem; padding: .6rem 1rem; margin-bottom: 1rem; border: 1px solid rgba($primary-dark, .15); border-radius: .7rem; background: $white; transition: border-color .2s, box-shadow .2s; }
.meta-integrations__search-bar:focus-within { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, .12); }
.meta-integrations__search-bar i { color: $text-secondary; font-size: .9rem; flex-shrink: 0; }
.meta-integrations__search-input { flex: 1; border: 0; outline: none; background: transparent; color: $primary-dark; font: inherit; font-size: .88rem; font-weight: 500; }
.meta-integrations__clear-search { border: 0; background: transparent; color: $text-secondary; cursor: pointer; padding: .2rem; font-size: .9rem; }
.meta-integrations__clear-search:hover { color: $primary-dark; }

.meta-integrations__section-heading { align-items: flex-end; justify-content: space-between; gap: 1rem; margin: 1rem 0 .75rem; }
.meta-integrations__section-heading p { margin: .25rem 0 0; color: $text-secondary; }

.meta-integrations__list { display: flex; flex-direction: column; gap: .75rem; }
.meta-integrations__account { display: flex; flex-direction: column; gap: .85rem; padding: 1rem; border: 1px solid rgba($primary-dark, .1); border-radius: .8rem; background: $white; transition: border-color .2s; }
.meta-integrations__account--linked { border-left: 4px solid $alert-success; }
.meta-integrations__account-icon { display: flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; border-radius: .7rem; background: $overlay-purple; color: $secondary; flex-shrink: 0; overflow: hidden; }
.meta-integrations__account-icon--linked { background: $alert-success-bg; color: $alert-success; border: 1px solid rgba($alert-success, .3); }
.meta-integrations__account-img { width: 100%; height: 100%; object-fit: cover; }
.meta-integrations__account-info { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: .2rem; }
.meta-integrations__account-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .95rem; }
.meta-integrations__account-details { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .2rem; }
.meta-integrations__detail-tag { display: inline-flex; align-items: center; gap: .35rem; padding: .2rem .55rem; border-radius: .4rem; background: rgba($primary-dark, .06); color: $text-secondary; font-size: .78rem; font-weight: 600; white-space: nowrap; }
.meta-integrations__detail-tag--business { background: $overlay-purple; color: $secondary-dark; }
.meta-integrations__detail-tag--page { background: rgba($primary, .08); color: $primary-dark; }
.meta-integrations__detail-tag--workspace { background: $alert-success-bg; color: $alert-success; border: 1px solid rgba($alert-success, .3); font-weight: 700; }
.meta-integrations__detail-tag--missing { background: rgba($alert-error, .08); color: $alert-error; border: 1px dashed rgba($alert-error, .3); font-weight: 600; }

.meta-integrations__btn-action { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .65rem 1.1rem; border: 0; border-radius: .6rem; background: $primary; color: $white; font: inherit; font-weight: 700; cursor: pointer; transition: background .2s; }
.meta-integrations__btn-action:hover { background: darken($primary, 8%); }
.meta-integrations__btn-action--outline { background: transparent; border: 1px solid rgba($primary-dark, .25); color: $primary-dark; }
.meta-integrations__btn-action--outline:hover { background: rgba($primary-dark, .05); border-color: $primary-dark; }

.meta-integrations__empty { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 2.5rem 1rem; color: $text-secondary; border: 1px dashed rgba($primary-dark, .2); border-radius: .8rem; text-align: center; }
.meta-integrations__empty i { color: $alert-success; font-size: 2rem; }
.meta-integrations__empty strong { color: $primary-dark; }

.meta-integrations__skeleton { display: flex; flex-direction: column; gap: .5rem; padding: 1rem; border-radius: .8rem; background: $white; }
.meta-integrations__skeleton-line { height: .8rem; width: 45%; border-radius: 99px; background: linear-gradient(90deg, $primary-light, rgba($secondary, .16), $primary-light); background-size: 200% 100%; animation: loading 1.2s infinite; }
.meta-integrations__skeleton-line--title { width: 70%; height: 1rem; }
@keyframes loading { to { background-position: -200% 0; } }

@media (min-width: 768px) {
  .meta-integrations { padding: 1.5rem 2rem; }
  .meta-integrations__header { flex-direction: row; align-items: center; justify-content: space-between; }
  .meta-integrations__primary { align-self: auto; }
  .meta-integrations__account { flex-direction: row; align-items: center; justify-content: space-between; }
  .meta-integrations__connection { flex-direction: row; align-items: center; justify-content: space-between; }
}
</style>
