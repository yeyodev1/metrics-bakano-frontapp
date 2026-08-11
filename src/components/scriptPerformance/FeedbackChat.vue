<template>
  <section class="fbc">
    <header class="fbc__header">
      <div class="fbc__title">
        <i class="fa-solid fa-comments" />
        <h3>Notas del equipo</h3>
      </div>
      <p class="fbc__subtitle">
        Lo que ustedes ven y los números no dicen: qué video pegó, qué gancho
        funcionó, qué pidió el cliente. Se guarda y alimenta a la IA al generar guiones.
      </p>
    </header>

    <div ref="listEl" class="fbc__list">
      <div v-if="loading" class="fbc__state">
        <i class="fa-solid fa-spinner fa-spin" /> Cargando notas…
      </div>

      <p v-else-if="!messages.length" class="fbc__state fbc__state--empty">
        <i class="fa-regular fa-comment-dots" />
        Todavía no hay notas. Escribe la primera: qué video está funcionando y por qué.
      </p>

      <article v-for="m in messages" :key="m._id" class="fbc__msg">
        <div class="fbc__avatar">{{ initials(m.authorName) }}</div>

        <div class="fbc__bubble">
          <div class="fbc__meta">
            <strong>{{ m.authorName }}</strong>
            <span class="fbc__time">{{ timeLabel(m.createdAt) }}</span>
            <span v-if="m.videoTema" class="fbc__ref">
              <i class="fa-solid fa-film" /> {{ m.videoTema }}
            </span>
            <button
              v-if="canDelete(m)"
              type="button"
              class="fbc__delete"
              title="Eliminar nota"
              @click="remove(m)"
            >
              <i class="fa-solid fa-trash" />
            </button>
          </div>
          <p class="fbc__text">{{ m.texto }}</p>
        </div>
      </article>
    </div>

    <form class="fbc__composer" @submit.prevent="send">
      <!-- Attaching a script is what makes the note usable later -->
      <select v-model="attachedItemId" class="fbc__attach" :disabled="sending">
        <option value="">Nota general</option>
        <option v-for="i in items" :key="i._id" :value="i._id">
          #{{ i.numero }} · {{ i.tema }}
        </option>
      </select>

      <div class="fbc__input-row">
        <textarea
          v-model="draft"
          rows="2"
          :disabled="sending"
          placeholder="Ej: el video del combo pegó por el precio en el gancho, no por el producto…"
          @keydown.enter.exact.prevent="send"
        />
        <button type="submit" class="fbc__send" :disabled="!draft.trim() || sending">
          <i :class="sending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" />
        </button>
      </div>
      <span class="fbc__hint">Enter envía · Shift+Enter salta de línea</span>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/user'
import { scriptFeedbackService, type ScriptFeedback } from '@/services/scriptFeedback.service'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'

const props = defineProps<{ workspaceId: string; items: WorkspaceVideoItem[] }>()

const toast = useToast()
const userStore = useUserStore()

const messages = ref<ScriptFeedback[]>([])
const loading = ref(false)
const sending = ref(false)
const draft = ref('')
const attachedItemId = ref('')
const listEl = ref<HTMLElement | null>(null)

async function load() {
  if (!props.workspaceId) return
  loading.value = true
  try {
    messages.value = await scriptFeedbackService.list(props.workspaceId)
    await scrollToBottom()
  } catch {
    toast.error('No se pudieron cargar las notas del equipo.')
  } finally {
    loading.value = false
  }
}

async function scrollToBottom() {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

async function send() {
  const texto = draft.value.trim()
  if (!texto || sending.value) return

  sending.value = true
  try {
    const item = props.items.find((i) => i._id === attachedItemId.value)
    const created = await scriptFeedbackService.create(props.workspaceId, {
      texto,
      tipo: item ? 'video' : 'general',
      videoItemId: item?._id,
      planningId: item?.planningId,
      videoTema: item ? `#${item.numero} · ${item.tema}` : undefined,
    })
    messages.value.push(created)
    draft.value = ''
    await scrollToBottom()
  } catch (err: any) {
    toast.error(err?.message ?? 'No se pudo guardar la nota.')
  } finally {
    sending.value = false
  }
}

/** Own notes, or anything if superadmin. */
function canDelete(m: ScriptFeedback) {
  return m.authorId === userStore.id || userStore.role === 'superadmin'
}

async function remove(m: ScriptFeedback) {
  const previous = messages.value
  messages.value = messages.value.filter((x) => x._id !== m._id)
  try {
    await scriptFeedbackService.remove(props.workspaceId, m._id)
  } catch {
    messages.value = previous
    toast.error('No se pudo eliminar la nota.')
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function timeLabel(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-EC', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(() => props.workspaceId, load)
onMounted(load)
</script>

<style scoped lang="scss">
.fbc {
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

.fbc__header { display: flex; flex-direction: column; gap: 0.3rem; }

.fbc__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i { color: $BAKANO-GREEN; }
  h3 { margin: 0; font-size: 1rem; color: $primary-dark; }
}

.fbc__subtitle {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: $text-secondary;
}

.fbc__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 24rem;
  padding-right: 0.25rem;
  overflow-y: auto;
}

.fbc__state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 1rem;
  font-size: 0.82rem;
  color: $text-secondary;
  background: rgba($text-secondary, 0.05);
  border-radius: 10px;

  &--empty { align-items: flex-start; line-height: 1.45; }
}

.fbc__msg { display: flex; gap: 0.6rem; }

.fbc__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 0.68rem;
  font-weight: 800;
  color: $secondary-dark;
  background: $overlay-purple;
  border-radius: 50%;
}

.fbc__bubble {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.6rem 0.8rem;
  background: rgba($primary-dark, 0.03);
  border-radius: 10px;
}

.fbc__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  color: $text-secondary;

  strong { color: $primary-dark; }
}

.fbc__time { opacity: 0.8; }

.fbc__ref {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.05rem 0.4rem;
  font-weight: 700;
  color: $secondary-dark;
  background: $overlay-purple;
  border-radius: 20px;
}

.fbc__delete {
  margin-left: auto;
  padding: 0;
  font-size: 0.68rem;
  color: $text-secondary;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;

  .fbc__msg:hover & { opacity: 1; }
  &:hover { color: $alert-error; }
}

.fbc__text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: $primary-dark;
  white-space: pre-wrap;
}

.fbc__composer {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba($text-secondary, 0.12);
}

.fbc__attach {
  align-self: flex-start;
  max-width: 100%;
  padding: 0.35rem 0.6rem;
  font-family: inherit;
  font-size: 0.76rem;
  color: $primary-dark;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 8px;
}

.fbc__input-row { display: flex; gap: 0.5rem; }

.fbc__input-row textarea {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  color: $primary-dark;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;
  resize: vertical;
  outline: none;

  &:focus { border-color: rgba($BAKANO-GREEN, 0.5); }
}

.fbc__send {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  color: $white;
  background: $BAKANO-GREEN;
  border: none;
  border-radius: 10px;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.fbc__hint { font-size: 0.7rem; color: $text-secondary; }
</style>
