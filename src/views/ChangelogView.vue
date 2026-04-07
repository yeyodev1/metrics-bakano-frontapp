<template>
  <div class="changelog-view">

    <!-- Header -->
    <div class="changelog-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fa-solid fa-rocket" />
        </div>
        <div>
          <h1>Novedades de la Plataforma</h1>
          <p class="header-sub">Historial de versiones y cambios</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>Cargando changelog...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box error">
      <i class="fa-solid fa-circle-exclamation" />
      <p>{{ error }}</p>
    </div>

    <template v-else-if="changelog">
      <!-- Send panel (superadmin only) -->
      <div v-if="userStore.role === 'superadmin'" class="send-panel">
        <div class="send-panel__left">
          <div class="send-panel__icon"><i class="fa-solid fa-paper-plane" /></div>
          <div>
            <h3>Notificar a todos los usuarios</h3>
            <p>Se enviará la versión <strong>v{{ changelog.versions[selectedVersion]?.version }}</strong> a todos los usuarios activos de la plataforma.</p>
          </div>
        </div>
        <div class="send-panel__right">
          <select v-if="changelog.versions.length > 1" v-model="selectedVersion" class="version-select">
            <option v-for="(v, idx) in changelog.versions" :key="v.version" :value="idx">
              v{{ v.version }} — {{ v.title }}
            </option>
          </select>
          <button class="btn-send" :disabled="sending" @click="handleSend">
            <div v-if="sending" class="btn-spinner" />
            <template v-else>
              <i class="fa-solid fa-paper-plane" />
              Enviar a todos
            </template>
          </button>
        </div>
      </div>

      <!-- Success toast -->
      <Transition name="toast-fade">
        <div v-if="sendResult" class="send-result">
          <i class="fa-solid fa-circle-check" />
          <div>
            <strong>¡Enviado!</strong> {{ sendResult.sent }} de {{ sendResult.total }} usuarios recibieron el email.
            <span v-if="sendResult.failed > 0" class="failed-count"> ({{ sendResult.failed }} fallaron)</span>
          </div>
        </div>
      </Transition>

      <!-- Versions -->
      <div class="versions-list">
        <div
          v-for="(version, idx) in changelog.versions"
          :key="version.version"
          class="version-card"
          :class="{ 'version-card--latest': idx === 0 }"
        >
          <!-- Version header -->
          <div class="version-card__header">
            <div class="version-card__header-left">
              <span class="version-badge" :class="idx === 0 ? 'version-badge--latest' : ''">
                v{{ version.version }}
              </span>
              <span v-if="idx === 0" class="latest-tag"><i class="fa-solid fa-star" /> Última versión</span>
            </div>
            <span class="version-date">
              <i class="fa-solid fa-calendar-days" />
              {{ formatDate(version.date) }}
            </span>
          </div>

          <h2 class="version-title">{{ version.title }}</h2>
          <p class="version-summary">{{ version.summary }}</p>

          <!-- Changes -->
          <div class="changes-list">
            <div
              v-for="(change, ci) in version.changes"
              :key="ci"
              class="change-item"
            >
              <span class="change-badge" :class="`change-badge--${change.type}`">
                {{ typeLabel(change.type) }}
              </span>
              <span class="change-text">{{ change.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { changelogService, type ChangelogData } from '@/services/changelog.service'

const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const changelog = ref<ChangelogData | null>(null)
const sending = ref(false)
const sendResult = ref<{ sent: number; failed: number; total: number } | null>(null)
const selectedVersion = ref(0)

async function load() {
  loading.value = true
  error.value = ''
  try {
    changelog.value = await changelogService.getChangelog()
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar el changelog'
  } finally {
    loading.value = false
  }
}

async function handleSend() {
  if (sending.value) return
  sending.value = true
  sendResult.value = null
  try {
    const result = await changelogService.sendChangelog(selectedVersion.value)
    sendResult.value = result
    setTimeout(() => (sendResult.value = null), 8000)
  } catch (e: any) {
    error.value = e?.message || 'Error al enviar el changelog'
    setTimeout(() => (error.value = ''), 5000)
  } finally {
    sending.value = false
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Guayaquil'
  })
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    new: 'Nuevo',
    improved: 'Mejora',
    fix: 'Corrección',
    removed: 'Eliminado',
  }
  return map[type] || type
}

onMounted(load)
</script>

<style scoped lang="scss">
.changelog-view {
  padding: 28px 32px 80px;
  max-width: 860px;
  width: 100%;
}

// ── Header ───────────────────────────────────────────────
.changelog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;

  h1 {
    margin: 0 0 3px;
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .header-sub {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
}

.header-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

// ── Send panel ────────────────────────────────────────────
.send-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    color: #fff;

    h3 {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;

      strong { color: rgba(255, 255, 255, 0.9); }
    }
  }

  &__icon {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.version-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  font-family: inherit;

  option { background: #1e293b; color: #fff; }
}

.btn-send {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  white-space: nowrap;

  i { font-size: 12px; }

  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

// ── Send result ───────────────────────────────────────────
.send-result {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #d1fae5;
  border: 1.5px solid #6ee7b7;
  border-radius: 10px;
  padding: 12px 18px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #065f46;

  i { color: #059669; font-size: 16px; flex-shrink: 0; }
  .failed-count { color: #d97706; font-weight: 600; }
}

// ── Versions list ─────────────────────────────────────────
.versions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.version-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px 28px;

  &--latest {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 10px;
    flex-wrap: wrap;

    &-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}

.version-badge {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 20px;
  font-family: monospace;

  &--latest {
    background: #ede9fe;
    color: #7c3aed;
  }
}

.latest-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i { font-size: 9px; }
}

.version-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;

  i { font-size: 11px; }
}

.version-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.version-summary {
  margin: 0 0 20px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

// ── Changes ───────────────────────────────────────────────
.changes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.change-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.change-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-top: 1px;

  &--new      { background: #d1fae5; color: #059669; }
  &--improved { background: #dbeafe; color: #1d4ed8; }
  &--fix      { background: #fef3c7; color: #d97706; }
  &--removed  { background: #fee2e2; color: #dc2626; }
}

.change-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

// ── State ─────────────────────────────────────────────────
.state-box {
  text-align: center;
  padding: 56px 24px;
  color: #64748b;

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: 0 auto 16px;
  }

  p { font-size: 14px; margin: 0; }

  &.error { color: #dc2626; i { font-size: 32px; display: block; margin-bottom: 12px; } }
}

// ── Toast transition ──────────────────────────────────────
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(-6px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
