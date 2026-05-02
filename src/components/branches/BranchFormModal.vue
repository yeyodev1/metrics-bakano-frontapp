<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-header-icon">
            <i class="fa-solid" :class="editMode ? 'fa-store' : 'fa-plus'" />
          </div>
          <div class="modal-header-text">
            <h2>{{ editMode ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h2>
            <p class="modal-subtitle">Configura el nombre de tu sede</p>
          </div>
          <button class="modal-close" @click="handleClose" :disabled="loading">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label class="field-label">Nombre de la Sucursal</label>
            <input
              v-model="localName"
              type="text"
              placeholder="Ej: Sede Norte, Local Centro..."
              class="input-text"
              @keyup.enter="handleConfirm"
              autofocus
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleClose" :disabled="loading">
            Cancelar
          </button>
          <button
            class="btn-save"
            :disabled="!canSave || loading"
            @click="handleConfirm"
          >
            <div v-if="loading" class="spinner" />
            <template v-else>
              <i class="fa-solid fa-floppy-disk" />
              {{ editMode ? 'Actualizar' : 'Guardar' }}
            </template>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
  editMode?: boolean
  existingName?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirmed', payload: { name: string }): void
}>()

const localName = ref('')

const canSave = computed(() => {
  return localName.value.trim().length > 0
})

function handleClose() {
  if (props.loading) return
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!canSave.value || props.loading) return
  emit('confirmed', { name: localName.value.trim() })
}

watch(() => props.modelValue, (val) => {
  if (val) {
    localName.value = props.existingName || ''
  }
})
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 23, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(3px);
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  padding: 22px 24px;
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.modal-header-text {
  flex: 1;

  h2 {
    margin: 0 0 2px;
    color: #fff;
    font-size: 17px;
    font-weight: 800;
  }
}

.modal-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 500;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.input-text {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #3b82f6;
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fafafa;
}

.btn-cancel {
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #f3f4f6; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-save {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: #2563eb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
