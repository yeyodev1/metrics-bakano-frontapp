<template>
  <Teleport to="body">
    <Transition name="csm-fade">
      <div v-if="show" class="csm__overlay" @click.self="cerrar">
        <div class="csm" role="dialog" aria-labelledby="csm-titulo">
          <header class="csm__head">
            <i class="fa-solid fa-diagram-project" aria-hidden="true" />
            <div>
              <h3 id="csm-titulo">Subcuenta del CRM</h3>
              <p>El ID de la subcuenta de GoHighLevel de <b>{{ nombre }}</b>. Con él reconocemos al negocio en el CRM.</p>
            </div>
          </header>

          <div class="csm__body">
            <p v-if="cargando" class="csm__muted"><i class="fa-solid fa-spinner fa-spin" /> Cargando…</p>

            <template v-else>
              <div v-if="actual?.locationId" class="csm__estado">
                <span class="csm__estado-id"><i class="fa-solid fa-link" /> {{ actual.locationId }}</span>
                <span v-if="actual.crmConectado" class="csm__chip csm__chip--ok">
                  <i class="fa-solid fa-circle-check" /> Metrics lee este CRM
                </span>
                <span v-else class="csm__chip csm__chip--warn">
                  <i class="fa-solid fa-triangle-exclamation" /> Vinculado, sin lectura
                </span>
                <small v-if="actual.vinculadoPorNombre">
                  Lo vinculó {{ actual.vinculadoPorNombre }}<template v-if="actual.vinculadoEn"> el {{ fecha(actual.vinculadoEn) }}</template>
                </small>
              </div>

              <label class="csm__campo">
                <span>ID de la subcuenta (Location ID)</span>
                <input
                  ref="inputRef"
                  v-model="nuevo"
                  type="text"
                  maxlength="100"
                  placeholder="Ej: pEFChujwCCaMWBNbZYD1"
                  spellcheck="false"
                  autocomplete="off"
                  @keyup.enter="guardar"
                />
                <small>En GoHighLevel: entra a la subcuenta → Configuración → Perfil de la empresa → Location ID.</small>
              </label>

              <p v-if="!actual?.agenciaDisponible" class="csm__nota">
                <i class="fa-solid fa-circle-info" />
                El ID queda guardado. Para que Metrics y Lucas lean ese CRM falta el token de agencia de GoHighLevel en el servidor,
                o que el cliente conecte su token en Integraciones.
              </p>
              <p v-if="nota" class="csm__nota csm__nota--warn"><i class="fa-solid fa-circle-info" /> {{ nota }}</p>
              <p v-if="error" class="csm__error">{{ error }}</p>
            </template>
          </div>

          <footer class="csm__foot">
            <button type="button" class="csm__btn" :disabled="guardando" @click="cerrar">Cerrar</button>
            <button
              type="button"
              class="csm__btn csm__btn--primary"
              :disabled="!puedeGuardar || guardando || cargando"
              @click="guardar"
            >
              {{ guardando ? 'Guardando…' : actual?.locationId ? 'Cambiar ID' : 'Vincular' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { workspaceService, type CrmSubcuenta } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ show: boolean; workspaceId: string; nombre: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'guardado', locationId: string, conectado: boolean): void
}>()

const toast = useToast()
const actual = ref<CrmSubcuenta | null>(null)
const nuevo = ref('')
const error = ref('')
const nota = ref('')
const cargando = ref(false)
const guardando = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.show,
  async (abierto) => {
    if (!abierto) return
    error.value = ''
    nota.value = ''
    nuevo.value = ''
    cargando.value = true
    try {
      actual.value = await workspaceService.getCrmSubcuenta(props.workspaceId)
      nuevo.value = actual.value.locationId || ''
    } catch (e: any) {
      error.value = e?.message || 'No pude leer la subcuenta.'
    } finally {
      cargando.value = false
    }
    await nextTick()
    inputRef.value?.focus()
  },
  { immediate: true }
)

const limpio = computed(() => nuevo.value.trim())
const puedeGuardar = computed(() => /^[A-Za-z0-9_-]{6,100}$/.test(limpio.value) && limpio.value !== (actual.value?.locationId || ''))

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

function cerrar() {
  if (guardando.value) return
  emit('close')
}

async function guardar() {
  if (!puedeGuardar.value || guardando.value) return
  guardando.value = true
  error.value = ''
  nota.value = ''
  try {
    const r = await workspaceService.setCrmSubcuenta(props.workspaceId, limpio.value)
    actual.value = r
    if (r.nota) nota.value = r.nota
    toast.success(r.crmConectado ? 'Subcuenta vinculada y CRM conectado' : 'Subcuenta vinculada')
    emit('guardado', limpio.value, r.crmConectado)
  } catch (e: any) {
    error.value = e?.message || 'No pude guardar el ID.'
  } finally {
    guardando.value = false
  }
}
</script>

<style lang="scss" scoped>
.csm__overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba($primary-dark, 0.6);
}

.csm {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  background: $white;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba($primary-dark, 0.28);
}

.csm__head {
  display: flex;
  gap: 0.8rem;
  padding: 1.1rem 1.2rem 0.8rem;
  border-bottom: 1px solid rgba($primary-dark, 0.07);

  i { color: $primary; font-size: 1.1rem; margin-top: 0.15rem; }
  h3 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.2rem 0 0; font-size: 0.78rem; color: $text-secondary; }
}

.csm__body { display: flex; flex-direction: column; gap: 0.8rem; padding: 1rem 1.2rem; }

.csm__muted { margin: 0; font-size: 0.82rem; color: $text-secondary; }

.csm__estado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: rgba($primary-dark, 0.03);

  small { width: 100%; font-size: 0.72rem; color: $text-secondary; }
}

.csm__estado-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
  font-weight: 700;
  color: $primary-dark;
  word-break: break-all;

  i { color: $primary; margin-right: 0.25rem; }
}

.csm__chip {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;

  &--ok { background: rgba($alert-success, 0.12); color: darken($alert-success, 8%); }
  &--warn { background: rgba(#d97706, 0.12); color: #b45309; }
}

.csm__campo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  span { font-size: 0.74rem; font-weight: 700; color: $text-secondary; }
  small { font-size: 0.72rem; color: $text-secondary; }

  input {
    border: 1.5px solid rgba($primary-dark, 0.14);
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.86rem;
    color: $primary-dark;
    background: $white;

    &:focus { outline: none; border-color: $primary; }
  }
}

.csm__nota {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.5;
  color: $text-secondary;

  i { color: $primary; margin-right: 0.2rem; }

  &--warn { color: #b45309; i { color: #d97706; } }
}

.csm__error { margin: 0; font-size: 0.76rem; font-weight: 600; color: $alert-error; }

.csm__foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.9rem 1.2rem 1.1rem;
  border-top: 1px solid rgba($primary-dark, 0.07);
}

.csm__btn {
  border: 1.5px solid rgba($primary-dark, 0.14);
  background: $white;
  color: $primary-dark;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba($primary-dark, 0.04); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: $primary;
    border-color: $primary;
    color: $white;

    &:hover:not(:disabled) { filter: brightness(1.05); background: $primary; }
  }
}

.csm-fade-enter-active,
.csm-fade-leave-active { transition: opacity 0.15s ease; }
.csm-fade-enter-from,
.csm-fade-leave-to { opacity: 0; }
</style>
