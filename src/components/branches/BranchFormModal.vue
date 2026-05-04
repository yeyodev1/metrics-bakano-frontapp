<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="handleClose">
        <div class="modal-container" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-icon">
              <i class="fa-solid fa-store" />
            </div>
            <div class="modal-header-text">
              <h2>{{ editMode ? 'Editar sucursal' : 'Nueva sucursal' }}</h2>
              <p>{{ editMode ? 'Modifica el nombre de la sede' : 'Crea una nueva sede para este workspace' }}</p>
            </div>
            <button class="modal-close" @click="handleClose">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Live preview -->
            <div class="branch-preview">
              <div class="preview-avatar">
                {{ localName.trim() ? localName.trim().substring(0, 2).toUpperCase() : '?' }}
              </div>
              <div class="preview-info">
                <span class="preview-name" :class="{ 'preview-name--placeholder': !localName.trim() }">
                  {{ localName.trim() || 'Nombre de la sucursal' }}
                </span>
                <span class="preview-status">
                  <span class="preview-dot" />
                  Activa
                </span>
              </div>
            </div>

            <!-- Input -->
            <div class="form-field">
              <label class="form-label" for="branch-name">Nombre de la sucursal</label>
              <input
                id="branch-name"
                v-model="localName"
                class="form-input"
                type="text"
                placeholder="Ej: Sucursal Norte, Local Centro…"
                maxlength="80"
                autofocus
                @keydown.enter="canSave && handleConfirm()"
              />
              <span class="form-hint">{{ localName.trim().length }} / 80 caracteres</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" :disabled="loading" @click="handleClose">
              Cancelar
            </button>
            <button class="btn-save" :disabled="!canSave || loading" @click="handleConfirm">
              <i v-if="loading" class="fa-solid fa-spinner fa-spin" />
              <i v-else :class="editMode ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-plus'" />
              {{ editMode ? 'Guardar cambios' : 'Crear sucursal' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  loading?: boolean
  editMode?: boolean
  existingName?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  editMode: false,
  existingName: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmed', payload: { name: string }): void
}>()

const localName = ref('')

const canSave = computed(() => {
  const trimmed = localName.value.trim()
  if (!trimmed) return false
  if (props.editMode && trimmed === props.existingName?.trim()) return false
  return true
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      localName.value = props.existingName ?? ''
    }
  },
)

function handleClose() {
  if (props.loading) return
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!canSave.value || props.loading) return
  emit('confirmed', { name: localName.value.trim() })
}
</script>

<style scoped lang="scss">
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(2px);
}

/* Container */
.modal-container {
  width: 100%;
  max-width: 460px;
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 20px 18px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  position: relative;
}

.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #60a5fa;
  flex-shrink: 0;
}

.modal-header-text {
  flex: 1;
  min-width: 0;

  h2 {
    margin: 0 0 3px;
    font-size: 17px;
    font-weight: 700;
    color: #f1f5f9;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #f1f5f9;
  }
}

/* Body */
.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Preview */
.branch-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
}

.preview-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
  transition: all 0.15s;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.preview-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--placeholder {
    font-style: italic;
    color: #94a3b8;
    font-weight: 500;
  }
}

.preview-status {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #059669;
}

.preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #059669;
  display: inline-block;
  margin-right: 4px;
}

/* Form */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  font-size: 15px;
  color: #1e293b;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;

  &::placeholder {
    color: #cbd5e1;
  }

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
}

.form-hint {
  font-size: 11px;
  color: #94a3b8;
  text-align: right;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel {
  padding: 9px 18px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #f1f5f9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border-radius: 10px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;

  .modal-container {
    transition: transform 0.2s;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.96) translateY(8px);
  }
}
</style>
