<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import integracionesService, {
  REVISION_LIMITES,
  type CrmRevisionConfig,
  type CrmVista,
} from '@/services/integraciones.service'
import { useToast } from '@/composables/useToast'

/** Cómo revisa Bakano el CRM cada día: switch y tres ventanas en días. */
const props = defineProps<{ workspaceId: string; crm: CrmVista }>()
const emit = defineEmits<{ 'update:crm': [crm: CrmVista] }>()

const { addToast } = useToast()

type CampoDias = keyof typeof REVISION_LIMITES

const CAMPOS: Array<{ key: CampoDias; label: string; hint: string }> = [
  {
    key: 'diasConversaciones',
    label: 'Revisar conversaciones de los últimos N días',
    hint: 'Cuántos días hacia atrás leemos los chats cada mañana.',
  },
  {
    key: 'diasOportunidades',
    label: 'Revisar oportunidades movidas en los últimos N días',
    hint: 'Solo miramos oportunidades que cambiaron de etapa en ese rango.',
  },
  {
    key: 'diasEstancada',
    label: 'Marcar una oportunidad como estancada después de N días sin moverse',
    hint: 'Pasado ese tiempo sin cambios, la avisamos como estancada.',
  },
]

const form = reactive<CrmRevisionConfig>({ ...props.crm.revision })
const saving = ref(false)
const saveError = ref('')

// Si el padre recibe una vista nueva (guardado, prueba), el formulario la sigue.
watch(
  () => props.crm.revision,
  (revision) => Object.assign(form, revision),
  { deep: true }
)

function errorDe(key: CampoDias): string {
  const value = form[key]
  const { min, max } = REVISION_LIMITES[key]
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'Escribe un número entero.'
  if (value < min || value > max) return `Debe estar entre ${min} y ${max}.`
  return ''
}

const errores = computed(() => Object.fromEntries(CAMPOS.map((c) => [c.key, errorDe(c.key)])) as Record<CampoDias, string>)
const valido = computed(() => CAMPOS.every((c) => !errores.value[c.key]))
const cambios = computed(() => {
  const original = props.crm.revision
  const diff: Partial<CrmRevisionConfig> = {}
  if (form.activa !== original.activa) diff.activa = form.activa
  for (const { key } of CAMPOS) if (form[key] !== original[key]) diff[key] = form[key]
  return diff
})
const hayCambios = computed(() => Object.keys(cambios.value).length > 0)

async function onSave() {
  if (!valido.value || !hayCambios.value || saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    const crm = await integracionesService.actualizarRevision(props.workspaceId, cambios.value)
    emit('update:crm', crm)
    addToast({ type: 'success', message: 'Configuración de la revisión guardada.' })
  } catch (error) {
    const e = error as { status?: number; message?: string }
    saveError.value =
      e?.status === 403
        ? 'Solo el equipo de Bakano puede cambiar la revisión.'
        : e?.message || 'No pudimos guardar la configuración.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="cfg" novalidate @submit.prevent="onSave">
    <h3 class="cfg__title">Configuración</h3>

    <button
      type="button"
      role="switch"
      class="cfg__switch"
      :aria-checked="form.activa"
      :disabled="saving"
      @click="form.activa = !form.activa"
    >
      <span class="cfg__track" :class="{ 'is-on': form.activa }" aria-hidden="true"><span class="cfg__thumb" /></span>
      <span class="cfg__switch-text">
        <strong>Revisión diaria activa</strong>
        <small>{{ form.activa ? 'Bakano revisa este CRM cada día.' : 'Apagada: no se revisa hasta que la actives.' }}</small>
      </span>
    </button>

    <div v-for="campo in CAMPOS" :key="campo.key" class="cfg__field">
      <label :for="`rev-${campo.key}`">{{ campo.label }}</label>
      <div class="cfg__input-row">
        <input
          :id="`rev-${campo.key}`"
          v-model.number="form[campo.key]"
          type="number"
          inputmode="numeric"
          :min="REVISION_LIMITES[campo.key].min"
          :max="REVISION_LIMITES[campo.key].max"
          step="1"
          :disabled="saving"
          :aria-invalid="!!errores[campo.key]"
          :aria-describedby="`rev-${campo.key}-hint`"
        />
        <span class="cfg__unit">días</span>
      </div>
      <p :id="`rev-${campo.key}-hint`" class="cfg__hint" :class="{ 'is-error': errores[campo.key] }">
        {{ errores[campo.key] || `${campo.hint} Entre ${REVISION_LIMITES[campo.key].min} y ${REVISION_LIMITES[campo.key].max}.` }}
      </p>
    </div>

    <p v-if="saveError" class="cfg__error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ saveError }}
    </p>

    <button type="submit" class="cfg__save" :disabled="!valido || !hayCambios || saving">
      <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true" />
      {{ saving ? 'Guardando…' : 'Guardar' }}
    </button>
  </form>
</template>

<style lang="scss" scoped>
.cfg { display: flex; flex-direction: column; gap: 0.95rem; }

.cfg__title { font-size: 0.88rem; font-weight: 800; color: $primary-dark; margin: 0; }

.cfg__switch {
  display: flex; align-items: center; gap: 0.75rem; width: 100%;
  min-height: 52px; padding: 0.6rem 0.75rem; border-radius: 12px;
  background: rgba($primary-dark, 0.03); border: 1px solid rgba($primary-dark, 0.08);
  font-family: inherit; text-align: left; cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid $secondary; outline-offset: 2px; }
}

.cfg__track {
  flex-shrink: 0; width: 44px; height: 26px; border-radius: 999px; padding: 3px;
  display: flex; background: rgba($primary-dark, 0.2); transition: background 0.15s ease;

  &.is-on { background: $alert-success; justify-content: flex-end; }
}

.cfg__thumb { width: 20px; height: 20px; border-radius: 50%; background: $white; box-shadow: 0 1px 2px rgba($primary-dark, 0.25); }

.cfg__switch-text {
  display: flex; flex-direction: column; gap: 0.1rem; min-width: 0;
  strong { font-size: 0.86rem; color: $primary-dark; }
  small { font-size: 0.74rem; color: $text-secondary; }
}

.cfg__field {
  display: flex; flex-direction: column; gap: 0.35rem;
  label { font-size: 0.8rem; font-weight: 700; color: $primary-dark; line-height: 1.35; }
}

.cfg__input-row { display: flex; align-items: center; gap: 0.5rem; }

.cfg__input-row input {
  width: 96px; min-height: 46px; padding: 0.55rem 0.7rem;
  border: 1px solid rgba($primary-dark, 0.16); border-radius: 10px;
  // 16px evita que iOS haga zoom al enfocar el campo.
  font-family: inherit; font-size: 16px; color: $primary-dark; background: $white;

  &:focus { outline: none; border-color: $secondary; box-shadow: 0 0 0 3px $overlay-purple; }
  &[aria-invalid='true'] { border-color: $alert-error; }
  &:disabled { background: rgba($primary-dark, 0.03); }
}

.cfg__unit { font-size: 0.8rem; color: $text-secondary; }

.cfg__hint {
  margin: 0; font-size: 0.72rem; line-height: 1.4; color: $text-secondary;
  &.is-error { color: $alert-error; font-weight: 600; }
}

.cfg__error {
  margin: 0; padding: 0.65rem 0.8rem; border-radius: 10px;
  background: $alert-error-bg; color: $alert-error; font-size: 0.8rem; line-height: 1.45;
}

.cfg__save {
  min-height: 46px; padding: 0.6rem 1.2rem; border-radius: 10px; border: none;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: $secondary; color: $white;
  font-family: inherit; font-size: 0.86rem; font-weight: 700; cursor: pointer;

  &:hover:not(:disabled) { background: $secondary-dark; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid $secondary; outline-offset: 2px; }

  @media (min-width: 561px) { align-self: flex-start; }
}
</style>
