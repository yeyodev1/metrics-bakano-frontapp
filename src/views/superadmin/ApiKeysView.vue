<template>
  <div class="api-keys">
    <div class="api-keys__header">
      <div>
        <h2 class="api-keys__title">API Keys</h2>
        <p class="api-keys__subtitle">
          Genera una API key para consultar métricas y alertas de forma externa (dashboards, scripts,
          integraciones).
        </p>
      </div>
    </div>

    <div class="api-keys__card">
      <div class="api-keys__card-header">
        <div class="api-keys__card-icon">
          <i class="fa-solid fa-key" />
        </div>
        <div>
          <h3 class="api-keys__card-title">Tu API Key</h3>
          <p class="api-keys__card-desc">
            Usada en el header <code>x-api-key</code> para autenticar peticiones al endpoint público.
          </p>
        </div>
      </div>

      <div v-if="isLoading" class="api-keys__loading">
        <div class="api-keys__spinner" />
        <span>Cargando...</span>
      </div>

      <div v-else>
        <div v-if="currentKey" class="api-keys__key-row">
          <div class="api-keys__key-display">
            <code class="api-keys__key-value">{{ showFull ? fullKey : currentKey }}</code>
            <button class="api-keys__icon-btn" :title="showFull ? 'Ocultar' : 'Mostrar'" @click="toggleShow">
              <i :class="showFull ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" />
            </button>
            <button class="api-keys__icon-btn" title="Copiar" @click="copyKey">
              <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
            </button>
          </div>
          <div v-if="keyCreatedAt" class="api-keys__key-meta">
            <i class="fa-solid fa-clock" />
            Generada el {{ formatDate(keyCreatedAt) }}
          </div>
        </div>

        <div v-else class="api-keys__empty">
          <i class="fa-solid fa-triangle-exclamation" />
          No tienes una API key activa.
        </div>

        <div class="api-keys__actions">
          <button
            class="api-keys__btn api-keys__btn--primary"
            :disabled="isGenerating"
            @click="handleGenerate"
          >
            <i class="fa-solid fa-rotate" />
            {{ currentKey ? 'Regenerar key' : 'Generar key' }}
          </button>
          <button
            v-if="currentKey"
            class="api-keys__btn api-keys__btn--danger"
            :disabled="isRevoking"
            @click="handleRevoke"
          >
            <i class="fa-solid fa-trash" />
            Revocar
          </button>
        </div>

        <div v-if="newKeyAlert" class="api-keys__alert">
          <i class="fa-solid fa-circle-info" />
          <div>
            <strong>Guarda tu key ahora.</strong> Solo se muestra completa una vez. Cópiala antes de
            salir.
            <div class="api-keys__new-key-box">
              <code>{{ newKeyAlert }}</code>
              <button class="api-keys__icon-btn" @click="copyNewKey">
                <i :class="copiedNew ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="api-keys__docs">
      <h3 class="api-keys__docs-title">Cómo usar</h3>
      <div class="api-keys__docs-grid">
        <div class="api-keys__doc-block">
          <p class="api-keys__doc-label">Métricas globales (todas los workspaces)</p>
          <pre class="api-keys__code">GET /api/public/metrics?page=1&amp;limit=20
x-api-key: tu-api-key</pre>
        </div>
        <div class="api-keys__doc-block">
          <p class="api-keys__doc-label">Métricas por workspace</p>
          <pre class="api-keys__code">GET /api/public/metrics/:workspaceId
x-api-key: tu-api-key</pre>
        </div>
        <div class="api-keys__doc-block">
          <p class="api-keys__doc-label">Alertas de billing (workspaces sin facturación de ayer)</p>
          <pre class="api-keys__code">GET /api/public/billing-alerts
x-api-key: tu-api-key</pre>
        </div>
      </div>
    </div>

    <div v-if="error" class="api-keys__error">
      <i class="fa-solid fa-circle-exclamation" />
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { superadminApiService } from '../../services/superadminApi.service'

const isLoading = ref(true)
const isGenerating = ref(false)
const isRevoking = ref(false)
const currentKey = ref<string | null>(null)
const fullKey = ref<string | null>(null)
const keyCreatedAt = ref<string | null>(null)
const newKeyAlert = ref<string | null>(null)
const showFull = ref(false)
const copied = ref(false)
const copiedNew = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadKey()
})

async function loadKey() {
  isLoading.value = true
  error.value = null
  try {
    const data = await superadminApiService.getApiKey()
    currentKey.value = data.apiKey
    keyCreatedAt.value = data.apiKeyCreatedAt
  } catch (e: any) {
    error.value = e.message || 'Error al cargar la API key'
  } finally {
    isLoading.value = false
  }
}

async function handleGenerate() {
  if (currentKey.value) {
    const confirmed = window.confirm(
      '¿Regenerar la API key? La key anterior dejará de funcionar inmediatamente.',
    )
    if (!confirmed) return
  }
  isGenerating.value = true
  error.value = null
  newKeyAlert.value = null
  try {
    const data = await superadminApiService.generateApiKey()
    fullKey.value = data.apiKey
    newKeyAlert.value = data.apiKey
    keyCreatedAt.value = data.apiKeyCreatedAt
    localStorage.setItem('superadmin_api_key', data.apiKey)
    const masked = `bkn_${'•'.repeat(Math.max(0, data.apiKey.length - 8))}${data.apiKey.slice(-8)}`
    currentKey.value = masked
    showFull.value = true
  } catch (e: any) {
    error.value = e.message || 'Error al generar la API key'
  } finally {
    isGenerating.value = false
  }
}

async function handleRevoke() {
  const confirmed = window.confirm(
    '¿Revocar la API key? Todas las integraciones que la usen dejarán de funcionar.',
  )
  if (!confirmed) return
  isRevoking.value = true
  error.value = null
  try {
    await superadminApiService.revokeApiKey()
    localStorage.removeItem('superadmin_api_key')
    currentKey.value = null
    fullKey.value = null
    keyCreatedAt.value = null
    newKeyAlert.value = null
    showFull.value = false
  } catch (e: any) {
    error.value = e.message || 'Error al revocar la API key'
  } finally {
    isRevoking.value = false
  }
}

function toggleShow() {
  showFull.value = !showFull.value
}

async function copyKey() {
  const val = showFull.value && fullKey.value ? fullKey.value : currentKey.value
  if (!val) return
  await navigator.clipboard.writeText(val)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

async function copyNewKey() {
  if (!newKeyAlert.value) return
  await navigator.clipboard.writeText(newKeyAlert.value)
  copiedNew.value = true
  setTimeout(() => (copiedNew.value = false), 2000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style lang="scss" scoped>
.api-keys {
  max-width: 860px;
  padding: 32px 24px;

  &__header {
    margin-bottom: 28px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-primary, #1a1a2e);
    margin: 0 0 6px;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--color-text-secondary, #6b7280);
    margin: 0;
  }

  &__card {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  &__card-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 20px;
  }

  &__card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f0f4ff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f46e5;
    font-size: 18px;
    flex-shrink: 0;
  }

  &__card-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--color-text-primary, #1a1a2e);
  }

  &__card-desc {
    font-size: 13px;
    color: var(--color-text-secondary, #6b7280);
    margin: 0;

    code {
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text-secondary, #6b7280);
    font-size: 14px;
    padding: 8px 0;
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  &__key-row {
    margin-bottom: 16px;
  }

  &__key-display {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
  }

  &__key-value {
    flex: 1;
    font-size: 13px;
    word-break: break-all;
    color: #374151;
    font-family: monospace;
  }

  &__key-meta {
    font-size: 12px;
    color: var(--color-text-secondary, #6b7280);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 14px;
    transition: color 0.15s, background 0.15s;

    &:hover {
      color: #4f46e5;
      background: #f0f4ff;
    }
  }

  &__empty {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #9ca3af;
    font-size: 14px;
    padding: 8px 0 16px;

    i {
      color: #f59e0b;
    }
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s, background 0.15s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--primary {
      background: #4f46e5;
      color: #fff;

      &:not(:disabled):hover {
        background: #4338ca;
      }
    }

    &--danger {
      background: #fee2e2;
      color: #dc2626;

      &:not(:disabled):hover {
        background: #fecaca;
      }
    }
  }

  &__alert {
    display: flex;
    gap: 12px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    padding: 14px 16px;
    margin-top: 16px;
    font-size: 13px;
    color: #92400e;

    i {
      color: #f59e0b;
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  &__new-key-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    padding: 8px 10px;
    margin-top: 8px;

    code {
      flex: 1;
      font-size: 12px;
      word-break: break-all;
      color: #374151;
    }
  }

  &__docs {
    margin-bottom: 24px;
  }

  &__docs-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary, #1a1a2e);
    margin: 0 0 14px;
  }

  &__docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  &__doc-block {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 10px;
    padding: 14px 16px;
  }

  &__doc-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__code {
    font-size: 12px;
    font-family: monospace;
    background: #f9fafb;
    border-radius: 6px;
    padding: 8px 10px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    margin-top: 12px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
