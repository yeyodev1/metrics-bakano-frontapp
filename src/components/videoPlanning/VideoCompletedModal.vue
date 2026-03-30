<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'
import { planningService } from '@/services/planning.service'

const props = defineProps<{
  show: boolean
  item: VideoItem | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save-link', itemId: string, payload: {
    linkVideo: string
    fechaPublicacion: string
    copyPublicacion: string
    estadoPublicacion?: string
    publishToInstagram?: boolean
    publishToFacebook?: boolean
  }): void
}>()

const localLink = ref('')
const localFecha = ref('')
const localHora = ref('12:00')
const localCopy = ref('')
const publishToInstagram = ref(false)
const publishToFacebook = ref(false)
const scheduleWarning = ref<string | null>(null)

// ── Ecuador timezone (UTC-5) helpers ─────────────────────────
const EC_OFFSET_MS = -5 * 60 * 60 * 1000

function utcIsoToEcuador(isoString: string): { date: string; time: string } {
  const utcMs = new Date(isoString).getTime()
  const ecDate = new Date(utcMs + EC_OFFSET_MS)
  const iso = ecDate.toISOString()
  return { date: iso.split('T')[0], time: iso.split('T')[1].slice(0, 5) }
}

function ecuadorToUtcIso(date: string, time: string): string {
  const naiveMs = new Date(`${date}T${time}:00.000Z`).getTime()
  return new Date(naiveMs - EC_OFFSET_MS).toISOString()
}

const ERROR_LABELS: Record<string, string> = {
  SCHEDULE_TOO_SOON: 'La hora debe ser al menos 10 min en el futuro',
  SCHEDULE_TOO_FAR: 'No se puede programar con más de 75 días de anticipación',
  NO_IG_ACCOUNT: 'El workspace no tiene Instagram Business vinculado',
}

function friendlyError(err?: string) {
  if (!err) return 'Error desconocido'
  return ERROR_LABELS[err] ?? err
}

const scheduledLabel = computed(() => {
  if (!props.item?.fechaPublicacion || props.item.estadoPublicacion !== 'PROGRAMADO') return null
  const { date, time } = utcIsoToEcuador(props.item.fechaPublicacion)
  const [y, m, d] = date.split('-')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d} de ${months[parseInt(m) - 1]} ${y} · ${time} (hora Ecuador)`
})

// ── Media upload ─────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string | null>(null)
const uploadedMedia = ref<{ url: string; mediaType: 'video' | 'image'; name: string } | null>(null)

watch(() => props.show, (isShown) => {
  if (isShown && props.item) {
    localLink.value = props.item.linkVideo || ''
    localCopy.value = props.item.copyPublicacion || ''
    uploadedMedia.value = null
    uploadError.value = null
    publishToInstagram.value = false
    publishToFacebook.value = false
    if (props.item.fechaPublicacion) {
      const { date, time } = utcIsoToEcuador(props.item.fechaPublicacion)
      localFecha.value = date
      localHora.value = time
    } else {
      localFecha.value = ''
      localHora.value = '12:00'
    }
  }
})

const hasUploadedFile = computed(() => !!uploadedMedia.value)

async function handleFileSelected(files: FileList | null) {
  if (!files || files.length === 0 || !props.item) return
  const file = files[0]

  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  if (!isVideo && !isImage) {
    uploadError.value = 'Solo se permiten videos e imágenes.'
    return
  }

  uploading.value = true
  uploadError.value = null
  uploadProgress.value = 0

  // Simulate progress during upload
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 85) uploadProgress.value += 5
  }, 400)

  try {
    const result = await planningService.uploadItemMedia(props.item._id, file)
    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadedMedia.value = { url: result.url, mediaType: result.mediaType, name: file.name }
    localLink.value = result.url
  } catch (err: any) {
    clearInterval(progressInterval)
    uploadError.value = err?.response?.data?.message || 'Error al subir el archivo. Intenta de nuevo.'
  } finally {
    uploading.value = false
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFileSelected(e.dataTransfer?.files || null)
}

const MIN_SCHEDULE_MS = 10 * 60 * 1000   // 10 min
const MAX_SCHEDULE_MS = 75 * 24 * 60 * 60 * 1000 // 75 days

function handleSave() {
  if (!props.item) return
  scheduleWarning.value = null
  const fechaISO = localFecha.value ? ecuadorToUtcIso(localFecha.value, localHora.value || '12:00') : ''
  const wantsSchedule = publishToInstagram.value || publishToFacebook.value

  // Validate schedule time when user wants to post to social media
  if (wantsSchedule && fechaISO) {
    const diff = new Date(fechaISO).getTime() - Date.now()
    if (diff < MIN_SCHEDULE_MS) {
      scheduleWarning.value = 'La hora de publicación debe ser al menos 10 minutos en el futuro para programar en redes sociales.'
      return
    }
    if (diff > MAX_SCHEDULE_MS) {
      scheduleWarning.value = 'No se puede programar con más de 75 días de anticipación.'
      return
    }
  }

  emit('save-link', props.item._id, {
    linkVideo: localLink.value,
    fechaPublicacion: fechaISO,
    copyPublicacion: localCopy.value,
    ...(fechaISO ? { estadoPublicacion: 'PROGRAMADO' } : {}),
    ...(wantsSchedule ? {
      publishToInstagram: publishToInstagram.value,
      publishToFacebook: publishToFacebook.value,
    } : {}),
  })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show && item" class="vcm">
      <div class="vcm__overlay" @click="emit('close')" />
      <div class="vcm__container">
        <!-- Celebration header -->
        <div class="vcm__header">
          <div class="vcm__celebration">
            <div class="vcm__icon-ring">
              <i class="fa-solid fa-clapperboard" />
            </div>
            <div class="vcm__sparkles">
              <span /><span /><span /><span />
            </div>
          </div>
          <h2 class="vcm__title">¡Video listo!</h2>
          <p class="vcm__subtitle">El video <strong>fue marcado como editado</strong></p>
          <button class="vcm__close" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Video info card -->
        <div class="vcm__card">
          <div class="vcm__card-num">#{{ item.numero }}</div>
          <div class="vcm__card-info">
            <span class="vcm__card-tema">{{ item.tema }}</span>
            <span v-if="item.tipo" class="vcm__card-tipo">{{ item.tipo }}</span>
          </div>
          <div class="vcm__status-chips">
            <span class="vcm__chip vcm__chip--done">
              <i class="fa-solid fa-scissors" /> Editado
            </span>
          </div>
        </div>

        <!-- Form inputs -->
        <div class="vcm__form-section">

          <!-- ── Media upload zone ──────────────────────────────── -->
          <div class="vcm__upload-section">
            <label class="vcm__form-label">
              <i class="fa-solid fa-cloud-arrow-up" /> Subir video o foto
            </label>

            <!-- Uploaded file preview -->
            <div v-if="hasUploadedFile && !uploading" class="vcm__upload-success">
              <div class="vcm__upload-success-icon">
                <i :class="uploadedMedia!.mediaType === 'video' ? 'fa-solid fa-film' : 'fa-solid fa-image'" />
              </div>
              <div class="vcm__upload-success-info">
                <span class="vcm__upload-filename">{{ uploadedMedia!.name }}</span>
                <a :href="uploadedMedia!.url" target="_blank" class="vcm__upload-view">
                  <i class="fa-solid fa-arrow-up-right-from-square" /> Ver en Cloudinary
                </a>
              </div>
              <button class="vcm__upload-replace" type="button" @click="fileInputRef?.click()">
                <i class="fa-solid fa-rotate" /> Reemplazar
              </button>
            </div>

            <!-- Upload progress -->
            <div v-else-if="uploading" class="vcm__upload-progress">
              <div class="vcm__progress-bar">
                <div class="vcm__progress-fill" :style="{ width: uploadProgress + '%' }" />
              </div>
              <span>Subiendo... {{ uploadProgress }}%</span>
            </div>

            <!-- Dropzone -->
            <div
              v-else
              class="vcm__dropzone"
              :class="{ 'is-dragging': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="onDrop"
              @click="fileInputRef?.click()"
            >
              <i class="fa-solid fa-cloud-arrow-up vcm__dropzone-icon" />
              <p class="vcm__dropzone-text">Arrastra tu video o foto aquí</p>
              <span class="vcm__dropzone-hint">o haz clic para seleccionar · MP4, MOV, JPG, PNG · máx. 200MB</span>
            </div>

            <div v-if="uploadError" class="vcm__upload-error">
              <i class="fa-solid fa-triangle-exclamation" /> {{ uploadError }}
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="video/*,image/*"
              style="display:none"
              @change="handleFileSelected(($event.target as HTMLInputElement).files)"
            />
          </div>

          <!-- Divider -->
          <div class="vcm__divider">
            <span>o usa un link externo</span>
          </div>

          <!-- Link -->
          <div class="vcm__form-group">
            <label class="vcm__form-label">
              <i class="fa-solid fa-link" /> Link del video final
            </label>
            <div class="vcm__input-row">
              <input
                v-model="localLink"
                type="url"
                class="vcm__input"
                placeholder="https://drive.google.com/..."
                @keydown.enter.prevent="handleSave"
              />
              <a
                v-if="localLink"
                :href="localLink"
                target="_blank"
                rel="noopener"
                class="vcm__link-preview"
                title="Abrir link"
              >
                <i class="fa-solid fa-arrow-up-right-from-square" />
              </a>
            </div>
            <span class="vcm__form-hint">Proporciona el enlace de Drive, Dropbox, etc.</span>
          </div>

          <!-- Scheduled confirmation badge -->
          <div v-if="scheduledLabel" class="vcm__scheduled-badge">
            <div class="vcm__scheduled-icon">
              <i class="fa-solid fa-calendar-check" />
            </div>
            <div class="vcm__scheduled-info">
              <span class="vcm__scheduled-label">Programado para publicar</span>
              <span class="vcm__scheduled-time">{{ scheduledLabel }}</span>
              <div class="vcm__scheduled-links">
                <a
                  v-if="item.linkVideo"
                  :href="item.linkVideo"
                  target="_blank"
                  rel="noopener"
                  class="vcm__scheduled-link"
                >
                  <i class="fa-solid fa-arrow-up-right-from-square" /> Ver contenido
                </a>
                <span v-if="item.igScheduleStatus === 'SCHEDULED'" class="vcm__ig-chip vcm__ig-chip--ok">
                  <i class="fa-brands fa-instagram" /> Instagram
                </span>
                <span v-else-if="item.igScheduleStatus === 'FAILED'" class="vcm__ig-chip vcm__ig-chip--fail" :title="friendlyError(item.igScheduleError)">
                  <i class="fa-brands fa-instagram" /> IG: {{ friendlyError(item.igScheduleError) }}
                </span>
                <span v-if="item.fbScheduleStatus === 'SCHEDULED'" class="vcm__ig-chip vcm__ig-chip--fb">
                  <i class="fa-brands fa-facebook" /> Facebook
                </span>
                <span v-else-if="item.fbScheduleStatus === 'FAILED'" class="vcm__ig-chip vcm__ig-chip--fail" :title="friendlyError(item.fbScheduleError)">
                  <i class="fa-brands fa-facebook" /> FB: {{ friendlyError(item.fbScheduleError) }}
                </span>
              </div>
            </div>
            <span class="vcm__scheduled-chip">PROGRAMADO</span>
          </div>

          <!-- Date + Time -->
          <div class="vcm__form-group">
            <label class="vcm__form-label">
              <i class="fa-regular fa-calendar" /> Fecha y hora de publicación
            </label>
            <div class="vcm__datetime-row">
              <input
                v-model="localFecha"
                type="date"
                class="vcm__input"
                @keydown.enter.prevent="handleSave"
              />
              <input
                v-model="localHora"
                type="time"
                class="vcm__input vcm__input--time"
                @keydown.enter.prevent="handleSave"
              />
            </div>
            <span class="vcm__form-hint">Hora en <strong>tiempo Ecuador (UTC-5)</strong> — se guarda en UTC automáticamente.</span>
          </div>

          <!-- Platform selector -->
          <div v-if="localFecha" class="vcm__form-group">
            <label class="vcm__form-label">
              <i class="fa-solid fa-share-nodes" /> Programar también en redes
            </label>
            <div class="vcm__platform-row">
              <div class="vcm__platform-soon">
                <i class="fa-brands fa-instagram" />
                <span>Instagram</span>
                <span class="vcm__soon-chip">Próximamente</span>
              </div>
              <button
                type="button"
                class="vcm__platform-btn"
                :class="{ 'is-active is-active--fb': publishToFacebook }"
                @click="publishToFacebook = !publishToFacebook"
              >
                <i class="fa-brands fa-facebook" />
                <span>Facebook</span>
                <i v-if="publishToFacebook" class="fa-solid fa-check vcm__platform-check" />
              </button>
            </div>
            <span class="vcm__form-hint">Opcional — requiere que el workspace tenga Meta conectado.</span>
          </div>

          <!-- Copy -->
          <div class="vcm__form-group">
            <label class="vcm__form-label">
              <i class="fa-solid fa-pen-to-square" /> Copy de publicación
            </label>
            <textarea
              v-model="localCopy"
              class="vcm__input vcm__textarea"
              placeholder="Escribe el caption, hashtags y texto que acompañará la publicación..."
              rows="4"
            />
            <span class="vcm__form-hint">Texto que el community manager usará al publicar en redes sociales.</span>
          </div>
        </div>

        <!-- Schedule warning -->
        <div v-if="scheduleWarning" class="vcm__schedule-warning">
          <i class="fa-solid fa-triangle-exclamation" />
          {{ scheduleWarning }}
        </div>

        <!-- Footer -->
        <div class="vcm__footer">
          <button class="vcm__btn-ghost" @click="emit('close')">
            Cerrar sin guardar
          </button>
          <button
            class="vcm__btn-primary"
            :disabled="isSaving"
            @click="handleSave"
          >
            <span v-if="isSaving" class="vcm__spinner" />
            <i v-else class="fa-solid fa-floppy-disk" />
            <span>{{ localLink || localFecha || localCopy ? 'Guardar datos' : 'Marcar sin detalles' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.vcm {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  z-index: 1200; padding: 1.5rem;

  &__overlay { position: absolute; inset: 0; background: rgba($primary-dark, 0.55); backdrop-filter: blur(10px); }

  &__container {
    position: relative; background: $white; width: 100%; max-width: 460px;
    border-radius: 24px; box-shadow: 0 30px 60px -10px rgba(0,0,0,0.3);
    animation: popIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; flex-direction: column;
    max-height: calc(100vh - 2.5rem);
    overflow: hidden;
  }

  &__header {
    padding: 2.5rem 2rem 1.5rem;
    background: linear-gradient(160deg, #f0fdf4 0%, #dcfce7 100%);
    text-align: center; position: relative;
    flex-shrink: 0;
  }

  &__celebration {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 1rem;
  }

  &__icon-ring {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(#16a34a, 0.4);
    i { font-size: 2rem; color: #fff; }
  }

  &__sparkles {
    position: absolute; inset: -12px;
    span {
      position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #16a34a;
      opacity: 0.7;
      // top/bottom sparks: centered horizontally
      &:nth-child(1) { top: -2px; left: 50%; animation: sparkleH 1.8s ease-in-out 0s infinite; }
      &:nth-child(3) { bottom: -2px; left: 50%; animation: sparkleH 1.8s ease-in-out 0.9s infinite; }
      // left/right sparks: centered vertically
      &:nth-child(2) { right: -2px; top: 50%; animation: sparkleV 1.8s ease-in-out 0.45s infinite; }
      &:nth-child(4) { left: -2px; top: 50%; animation: sparkleV 1.8s ease-in-out 1.35s infinite; }
    }
  }

  &__title {
    margin: 0 0 0.35rem; font-size: 1.5rem; font-weight: 900; color: #14532d;
  }
  &__subtitle {
    margin: 0; font-size: 0.88rem; color: #166534;
    strong { font-weight: 800; }
  }

  &__close {
    position: absolute; top: 1rem; right: 1rem;
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: rgba(#14532d, 0.08); color: #166534; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    &:hover { background: rgba(#14532d, 0.15); }
  }

  &__card {
    margin: 1.25rem 1.5rem; padding: 1rem 1.25rem;
    background: rgba($primary, 0.04); border: 1.5px solid rgba($primary, 0.1);
    border-radius: 14px; display: flex; align-items: center; gap: 1rem;
  }

  &__card-num {
    font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: $text-secondary;
    background: rgba($primary-dark, 0.06); padding: 0.25rem 0.6rem; border-radius: 8px;
    white-space: nowrap; flex-shrink: 0;
  }

  &__card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
  &__card-tema { font-size: 0.95rem; font-weight: 700; color: $primary-dark; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__card-tipo { font-size: 0.65rem; font-weight: 700; color: $primary; background: rgba($primary, 0.1); border-radius: 6px; padding: 0.1rem 0.45rem; display: inline-block; width: fit-content; }

  &__status-chips { display: flex; gap: 0.4rem; flex-shrink: 0; }
  &__chip {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 20px;
    &--done { background: #dcfce7; color: #166534; }
  }

  &__form-section {
    padding: 0 1.5rem 1.25rem;
    display: flex; flex-direction: column; gap: 1rem;
    overflow-y: auto; flex: 1;
  }

  &__form-group {
    display: flex; flex-direction: column; gap: 0.4rem;
  }

  &__form-label {
    font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    color: $primary-dark; opacity: 0.8; display: flex; align-items: center; gap: 0.45rem;
    i { color: $primary; }
  }

  &__form-hint { font-weight: 400; font-size: 0.72rem; color: $text-secondary; }

  &__input-row { display: flex; gap: 0.5rem; }

  &__input {
    flex: 1; padding: 0.75rem 1rem; border-radius: 12px;
    border: 1.5px solid rgba($primary-dark, 0.12); background: rgba($primary-dark, 0.02);
    font-family: inherit; font-size: 0.9rem; transition: all 0.2s;
    &:focus { outline: none; border-color: $primary; background: $white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  }

  &__textarea {
    resize: vertical; min-height: 100px; line-height: 1.5;
  }

  &__link-preview {
    width: 44px; height: 44px; border-radius: 12px; background: rgba($primary, 0.08);
    color: $primary; display: flex; align-items: center; justify-content: center;
    text-decoration: none; font-size: 0.85rem; transition: all 0.2s; flex-shrink: 0;
    &:hover { background: $primary; color: $white; }
  }

  &__schedule-warning {
    margin: 0 1.5rem; padding: 0.65rem 0.85rem;
    background: rgba(#f59e0b, 0.1); border: 1.5px solid rgba(#f59e0b, 0.3);
    border-radius: 10px; font-size: 0.78rem; color: #92400e;
    display: flex; align-items: flex-start; gap: 0.45rem;
    flex-shrink: 0;
    i { margin-top: 0.1rem; flex-shrink: 0; color: #f59e0b; }
  }

  &__footer {
    padding: 1rem 1.5rem 1.75rem; border-top: 1px solid rgba($primary-dark, 0.05);
    display: flex; justify-content: flex-end; gap: 0.75rem;
    flex-shrink: 0;
  }

  &__btn-ghost {
    background: transparent; border: none; color: $text-secondary; font-weight: 700;
    padding: 0.75rem 1.25rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba($primary-dark, 0.05); }
  }

  &__btn-primary {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: $white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px;
    font-weight: 700; cursor: pointer; box-shadow: 0 6px 16px rgba(#16a34a, 0.3);
    display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    &:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(#16a34a, 0.4); }
    &:disabled { background: #d1d5db; box-shadow: none; cursor: not-allowed; transform: none; }
  }

  &__spinner {
    width: 18px; height: 18px; border: 2px solid rgba($white, 0.3);
    border-top-color: $white; border-radius: 50%; animation: spin 0.8s linear infinite;
  }

  &__upload-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__dropzone {
    border: 2px dashed rgba($primary-dark, 0.2);
    border-radius: 14px;
    padding: 2rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba($primary, 0.02);

    &:hover, &.is-dragging {
      border-color: $primary;
      background: rgba($primary, 0.05);
    }
  }

  &__dropzone-icon {
    font-size: 2rem;
    color: $primary;
    margin-bottom: 0.5rem;
  }

  &__dropzone-text {
    font-size: 0.9rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 0.25rem;
  }

  &__dropzone-hint {
    font-size: 0.72rem;
    color: $text-secondary;
  }

  &__upload-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba($primary, 0.04);
    border-radius: 10px;
    font-size: 0.8rem;
    color: $text-secondary;
  }

  &__progress-bar {
    height: 6px;
    background: rgba($primary-dark, 0.1);
    border-radius: 99px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary, #a855f7);
    border-radius: 99px;
    transition: width 0.3s;
  }

  &__upload-success {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: rgba(#22c55e, 0.08);
    border: 1.5px solid rgba(#22c55e, 0.25);
    border-radius: 12px;
  }

  &__upload-success-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: rgba(#22c55e, 0.15);
    color: #16a34a;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  &__upload-success-info {
    flex: 1;
    display: flex; flex-direction: column; gap: 0.2rem;
  }

  &__upload-filename {
    font-size: 0.8rem; font-weight: 700; color: $primary-dark;
  }

  &__upload-view {
    font-size: 0.72rem; color: $primary; text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  &__upload-replace {
    font-size: 0.72rem; font-weight: 600; color: $text-secondary;
    background: transparent; border: 1px solid rgba($primary-dark, 0.15);
    border-radius: 8px; padding: 0.3rem 0.65rem; cursor: pointer;
    &:hover { border-color: $primary; color: $primary; }
  }

  &__upload-error {
    font-size: 0.78rem; color: #dc2626;
    background: rgba(#dc2626, 0.07);
    padding: 0.5rem 0.75rem; border-radius: 8px;
    display: flex; align-items: center; gap: 0.4rem;
  }

  &__divider {
    display: flex; align-items: center; gap: 0.75rem;
    margin: 0.25rem 0;
    color: $text-secondary; font-size: 0.72rem;
    &::before, &::after {
      content: '';
      flex: 1; height: 1px;
      background: rgba($primary-dark, 0.1);
    }
  }

  &__datetime-row {
    display: flex; gap: 0.5rem;
    input:first-child { flex: 1; }
  }

  &__input--time {
    width: 120px; flex-shrink: 0;
  }

  &__scheduled-badge {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: linear-gradient(135deg, rgba($primary, 0.06), rgba(#a855f7, 0.06));
    border: 1.5px solid rgba($primary, 0.2);
    border-radius: 14px;
  }

  &__scheduled-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba($primary, 0.12);
    color: $primary;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; flex-shrink: 0;
  }

  &__scheduled-info {
    flex: 1; display: flex; flex-direction: column; gap: 0.15rem;
  }

  &__scheduled-label {
    font-size: 0.72rem; font-weight: 700; color: $text-secondary;
    text-transform: uppercase; letter-spacing: 0.04em;
  }

  &__scheduled-time {
    font-size: 0.88rem; font-weight: 700; color: $primary-dark;
  }

  &__scheduled-links {
    display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
    margin-top: 0.15rem;
  }

  &__scheduled-link {
    font-size: 0.72rem; color: $primary; text-decoration: none; font-weight: 600;
    display: inline-flex; align-items: center; gap: 0.3rem;
    &:hover { text-decoration: underline; }
  }

  &__ig-chip {
    display: inline-flex; align-items: center; gap: 0.25rem;
    font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.5rem;
    border-radius: 99px; letter-spacing: 0.02em;

    &--ok {
      background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
      color: #fff;
    }
    &--fb {
      background: #1877f2;
      color: #fff;
    }
    &--fail {
      background: rgba(#dc2626, 0.1); color: #dc2626;
      border: 1px solid rgba(#dc2626, 0.2);
      cursor: help;
    }
  }

  &__platform-row {
    display: flex; gap: 0.5rem;
  }

  &__platform-soon {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    padding: 0.6rem 0.75rem; border-radius: 10px;
    border: 1.5px dashed rgba($primary-dark, 0.12);
    background: rgba($primary-dark, 0.02); color: rgba($primary-dark, 0.3);
    font-size: 0.8rem; font-weight: 600; cursor: not-allowed;
    user-select: none;
  }

  &__soon-chip {
    font-size: 0.6rem; font-weight: 800; letter-spacing: 0.05em;
    padding: 0.1rem 0.45rem; border-radius: 99px;
    background: rgba($primary-dark, 0.07); color: rgba($primary-dark, 0.4);
    text-transform: uppercase;
  }

  &__platform-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    padding: 0.6rem 0.75rem; border-radius: 10px; border: 1.5px solid rgba($primary-dark, 0.12);
    background: rgba($primary-dark, 0.02); color: $text-secondary;
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.18s;

    &:hover { border-color: rgba($primary-dark, 0.25); color: $primary-dark; }

    &.is-active--ig {
      background: linear-gradient(135deg, rgba(#f58529,0.12), rgba(#dd2a7b,0.12), rgba(#8134af,0.12));
      border-color: #dd2a7b; color: #8134af;
    }
    &.is-active--fb {
      background: rgba(#1877f2, 0.08);
      border-color: #1877f2; color: #1877f2;
    }
  }

  &__platform-check {
    font-size: 0.65rem; margin-left: 0.15rem;
  }

  &__scheduled-chip {
    font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em;
    padding: 0.2rem 0.6rem; border-radius: 99px;
    background: rgba($primary, 0.12); color: $primary;
    flex-shrink: 0;
  }
}

@keyframes popIn {
  from { transform: scale(0.88) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes sparkleH {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
  50% { transform: translateX(-50%) scale(1.6); opacity: 0.15; }
}

@keyframes sparkleV {
  0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.7; }
  50% { transform: translateY(-50%) scale(1.6); opacity: 0.15; }
}

@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
