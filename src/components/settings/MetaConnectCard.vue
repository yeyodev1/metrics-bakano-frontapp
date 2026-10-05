<template>
  <section class="mcc">
    <!-- Estado: lo primero que se lee es si ya está conectado -->
    <header class="mcc__hero" :class="{ 'is-on': conectado }">
      <div class="mcc__hero-icon">
        <i class="fa-brands fa-facebook" />
      </div>
      <div class="mcc__hero-text">
        <h3>Facebook e Instagram (Meta Ads)</h3>
        <p v-if="conectado">
          Conectado
          <template v-if="metaAds?.pageName"> · página <b>{{ metaAds.pageName }}</b></template>
          <template v-if="metaAds?.adAccountName"> · cuenta publicitaria <b>{{ metaAds.adAccountName }}</b></template>
        </p>
        <p v-else>Conecta tu Facebook para ver en Metrics el rendimiento de tus anuncios.</p>
      </div>
      <RouterLink v-if="metaAds?.adAccountId" :to="{ name: 'AppVisual', params: { workspaceId } }" class="mcc__btn mcc__btn--ghost">
        <i class="fa-solid fa-chart-line" /> Ver métricas
      </RouterLink>
    </header>

    <!-- La página conectada: seguidores y últimas publicaciones (pages_read_engagement) -->
    <div v-if="pagina" class="mcc__block mcc__page">
      <h4><i class="fa-solid fa-flag mcc__icon--blue" /> Tu página: {{ pagina.name }}</h4>
      <p class="mcc__muted">
        <b>{{ numero(pagina.followers_count ?? pagina.fan_count) }}</b> seguidores
      </p>
      <ul v-if="publicaciones.length" class="mcc__posts">
        <li v-for="post in publicaciones" :key="post.id">
          <a :href="post.permalink_url" target="_blank" rel="noopener">
            {{ (post.message || 'Publicación sin texto').slice(0, 90) }}
          </a>
          <small>{{ fecha(post.created_time) }}</small>
        </li>
      </ul>
    </div>

    <!-- Opción 1: conectar con el botón de Facebook -->
    <div class="mcc__block">
      <h4><i class="fa-solid fa-plug mcc__icon--blue" /> Conectar con Facebook</h4>

      <template v-if="!puedeConectar">
        <p class="mcc__muted"><i class="fa-solid fa-lock" /> Solo un administrador del entorno puede conectar Facebook.</p>
      </template>

      <template v-else-if="authStep === 'pick_page'">
        <p class="mcc__muted">Elige la página de tu negocio:</p>
        <div class="mcc__list">
          <button
            v-for="page in availablePages"
            :key="page.id"
            type="button"
            class="mcc__option"
            :disabled="isLoggingIn"
            @click="selectPageAndSave(workspaceId, page)"
          >
            <img v-if="page.picture?.data?.url" :src="page.picture.data.url" alt="" />
            <i v-else class="fa-solid fa-flag mcc__icon--blue" />
            <span>{{ page.name }}</span>
          </button>
          <p v-if="!availablePages.length" class="mcc__muted">No encontramos páginas en tu cuenta de Facebook.</p>
        </div>
      </template>

      <template v-else-if="authStep === 'pick_ad_account'">
        <p class="mcc__muted">Elige la cuenta publicitaria de la que quieres ver métricas:</p>
        <div class="mcc__list">
          <button
            v-for="cuenta in availableAdAccounts"
            :key="cuenta.id"
            type="button"
            class="mcc__option"
            :disabled="isLoggingIn"
            @click="elegirCuenta(cuenta)"
          >
            <i class="fa-solid fa-rectangle-ad mcc__icon--blue" />
            <span>{{ cuenta.name }}</span>
            <small>{{ cuenta.account_id }}<template v-if="cuenta.currency"> · {{ cuenta.currency }}</template></small>
          </button>
        </div>
      </template>

      <template v-else-if="authStep === 'done'">
        <p class="mcc__ok"><i class="fa-solid fa-circle-check" /> Listo, tu Facebook quedó conectado.</p>
      </template>

      <template v-else>
        <p class="mcc__muted">
          Te pedimos solo permisos de <b>lectura</b>: ver tus páginas y las métricas de tus anuncios. Bakano no publica ni cambia nada en tu cuenta.
        </p>
        <button type="button" class="mcc__btn mcc__btn--fb" :disabled="isLoggingIn" @click="loginWithMeta">
          <i class="fa-brands fa-facebook" />
          {{ isLoggingIn ? 'Conectando…' : conectado ? 'Reconectar con Facebook' : 'Conectar con Facebook' }}
        </button>
      </template>

      <p v-if="error" class="mcc__error"><i class="fa-solid fa-triangle-exclamation" /> {{ error }}</p>
    </div>

    <!-- Opción 2: acceso de socio desde el Business Manager -->
    <div class="mcc__block mcc__block--alt">
      <h4><i class="fa-solid fa-handshake mcc__icon--green" /> O compártenos el acceso desde tu Business Manager</h4>
      <p class="mcc__muted">Si el botón no te deja elegir tus cuentas, este camino siempre funciona:</p>
      <ol class="mcc__steps">
        <li>
          Entra a
          <a href="https://business.facebook.com/settings/partners" target="_blank" rel="noopener">business.facebook.com</a>
          → <b>Configuración del negocio</b> → <b>Socios</b>.
        </li>
        <li>Toca <b>Agregar</b> → <b>Dar acceso a tus activos a un socio</b> e ingresa el ID de negocio de Bakano:
          <span class="mcc__id">
            <code>{{ BAKANO_BUSINESS_ID }}</code>
            <button type="button" class="mcc__copy" @click="copiarId">
              <i :class="copiado ? 'fa-solid fa-check' : 'fa-regular fa-copy'" /> {{ copiado ? 'Copiado' : 'Copiar' }}
            </button>
          </span>
        </li>
        <li>Comparte tu <b>cuenta publicitaria</b> con el permiso <b>Ver rendimiento</b> (análisis) y tu <b>página</b> de Facebook.</li>
        <li>Avísanos: nuestro equipo la vincula a tu entorno y ves tus métricas aquí.</li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMetaAds } from '@/composables/useMetaAds'
import { metaService, type MetaAdAccount } from '@/services/meta.service'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  workspaceId: string
  puedeConectar: boolean
  metaAds?: { pageName?: string; adAccountId?: string; adAccountName?: string } | null
}>()
const emit = defineEmits<{ (e: 'conectado'): void }>()

const BAKANO_BUSINESS_ID = '289122353312940'

const toast = useToast()
const {
  isLoggingIn,
  error,
  authStep,
  availablePages,
  availableAdAccounts,
  loginWithMeta,
  selectPageAndSave,
  selectAdAccountAndSave,
} = useMetaAds()

const conectado = computed(() => Boolean(props.metaAds?.pageName || props.metaAds?.adAccountId))
const copiado = ref(false)

const pagina = ref<{ name: string; followers_count?: number; fan_count?: number } | null>(null)
const publicaciones = ref<{ id: string; message?: string; created_time: string; permalink_url: string }[]>([])

async function cargarPagina() {
  if (!props.metaAds?.pageName) return
  try {
    const data = await metaService.getOrganicInsights(props.workspaceId)
    pagina.value = data?.pageInfo ?? null
    publicaciones.value = (data?.recentPosts ?? []).slice(0, 3)
  } catch {
    // Sin datos de la página no se muestra el bloque: la conexión sigue sirviendo.
    pagina.value = null
  }
}

onMounted(cargarPagina)
watch(() => props.metaAds?.pageName, cargarPagina)

function numero(n?: number) {
  return typeof n === 'number' ? n.toLocaleString('es-EC') : '—'
}

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
}

async function elegirCuenta(cuenta: MetaAdAccount) {
  await selectAdAccountAndSave(props.workspaceId, cuenta)
  if (authStep.value === 'done') {
    toast.success('Facebook conectado')
    emit('conectado')
  }
}

async function copiarId() {
  try {
    await navigator.clipboard.writeText(BAKANO_BUSINESS_ID)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
  } catch {
    toast.error('No pude copiar el ID: cópialo a mano.')
  }
}
</script>

<style lang="scss" scoped>
.mcc {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__hero {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    background: #fafafa;
    border: 1px solid rgba($primary-dark, 0.06);

    &.is-on {
      background: rgba(#1877f2, 0.05);
      border-color: rgba(#1877f2, 0.2);
    }
  }

  &__hero-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: #1877f2;
    background: rgba(#1877f2, 0.1);
  }

  &__hero-text {
    flex: 1;
    min-width: 0;

    h3 { margin: 0 0 0.25rem; font-size: 1.05rem; color: $primary-dark; }
    p { margin: 0; color: $text-secondary; font-size: 0.9rem; }
  }

  &__block {
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid rgba($primary-dark, 0.06);

    h4 {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      color: $primary-dark;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    &--alt { background: rgba($BAKANO-GREEN, 0.04); }
  }

  &__icon--blue { color: #1877f2; }
  &__icon--green { color: $BAKANO-GREEN; }

  &__muted { margin: 0 0 0.75rem; color: $text-secondary; font-size: 0.9rem; line-height: 1.5; }
  &__ok { margin: 0; color: $alert-success; font-weight: 600; }
  &__error { margin: 0.75rem 0 0; color: $alert-error; font-size: 0.9rem; }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.1rem;
    border-radius: 10px;
    border: none;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;

    &:disabled { opacity: 0.6; cursor: wait; }

    &--fb { background: #1877f2; color: $white; }
    &--ghost { background: $white; color: #1877f2; border: 1px solid rgba(#1877f2, 0.3); }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba($primary-dark, 0.1);
    background: $white;
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
    color: $primary-dark;

    img { width: 28px; height: 28px; border-radius: 50%; }
    span { flex: 1; font-weight: 600; }
    small { color: $text-secondary; }

    &:hover:not(:disabled) { border-color: #1877f2; }
    &:disabled { opacity: 0.6; cursor: wait; }
  }

  &__posts {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.85rem;
    }

    a { color: $primary-dark; text-decoration: none; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    a:hover { color: #1877f2; }
    small { color: $text-secondary; flex-shrink: 0; }
  }

  &__steps {
    margin: 0;
    padding-left: 1.25rem;
    color: $primary-dark;
    font-size: 0.9rem;
    line-height: 1.7;

    a { color: #1877f2; font-weight: 600; }
  }

  &__id {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 0.25rem;

    code {
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      background: $white;
      border: 1px solid rgba($primary-dark, 0.1);
      font-weight: 700;
    }
  }

  &__copy {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    border: 1px solid rgba($BAKANO-GREEN, 0.4);
    background: $white;
    color: $BAKANO-GREEN;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    &__hero { flex-wrap: wrap; }
  }
}
</style>
