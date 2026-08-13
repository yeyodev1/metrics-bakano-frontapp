<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { DestinatariosAviso, UsuarioAviso } from '@/types/videoPlanning'

const props = defineProps<{ planningId: string; data: DestinatariosAviso | null }>()
const emit = defineEmits<{ (e: 'updated', usuario: UsuarioAviso): void }>()

/** Borradores por usuario: la lista no se toca hasta que el guardado responde. */
const editando = ref<Record<string, { numero: string; prefijo: string }>>({})
const guardando = ref<Record<string, boolean>>({})
const errorTel = ref<Record<string, string>>({})

const conTelefono = computed(() => (props.data?.whatsapp ?? []).filter((u) => u.telefonoE164))
const sinTelefono = computed(() => (props.data?.whatsapp ?? []).filter((u) => !u.telefonoE164))

function abrirEdicion(u: UsuarioAviso) {
  editando.value[u.id] = { numero: u.telefono || '', prefijo: u.extension || '593' }
}

function cerrarEdicion(id: string) {
  delete editando.value[id]
  errorTel.value[id] = ''
}

/**
 * `on-input` entrega el número ya partido. Se manda el nacional y el prefijo
 * por separado porque el backend normaliza con esos dos: pasarle el
 * internacional entero le obliga a adivinar dónde termina el país.
 */
function onTel(id: string, _valor: string, obj: any) {
  const draft = editando.value[id]
  if (!draft) return
  draft.numero = obj?.nationalNumber || obj?.number || ''
  if (obj?.countryCallingCode) draft.prefijo = String(obj.countryCallingCode)
}

async function guardar(u: UsuarioAviso) {
  const draft = editando.value[u.id]
  if (!draft?.numero) {
    errorTel.value[u.id] = 'Escribe un número.'
    return
  }
  guardando.value[u.id] = true
  errorTel.value[u.id] = ''
  try {
    const actualizado = await videoPlanningService.guardarTelefonoDestinatario(
      props.planningId,
      u.id,
      { phoneNumber: draft.numero, phoneExtension: draft.prefijo },
    )
    emit('updated', actualizado)
    cerrarEdicion(u.id)
  } catch (e: any) {
    errorTel.value[u.id] = e?.response?.data?.message || 'No se pudo guardar.'
  } finally {
    guardando.value[u.id] = false
  }
}
</script>

<template>
  <div class="rec">
    <section class="rec__group">
      <h3><i class="fa-brands fa-whatsapp" /> WhatsApp — solo administradores</h3>
      <p class="rec__hint">
        Son quienes aprueban. Un colaborador no decide, y llenarle el chat de recordatorios
        que no puede atender es la forma más rápida de que silencien el canal.
      </p>

      <p v-if="!data?.whatsapp.length" class="rec__empty">
        Este entorno no tiene ningún administrador cargado, así que no saldrá ningún WhatsApp.
      </p>

      <ul v-else class="rec__list">
        <li v-for="u in conTelefono" :key="u.id" class="rec__item">
          <div class="rec__item-main">
            <strong>{{ u.nombre }} {{ u.apellido }}</strong>
            <span>{{ u.correo }}</span>
          </div>
          <span class="rec__tel">+{{ u.telefonoE164 }}</span>
          <button v-if="!editando[u.id]" class="rec__link" @click="abrirEdicion(u)">Cambiar</button>
        </li>

        <li v-for="u in sinTelefono" :key="u.id" class="rec__item rec__item--falta">
          <div class="rec__item-main">
            <strong>{{ u.nombre }} {{ u.apellido }}</strong>
            <span>{{ u.correo }}</span>
          </div>
          <span class="rec__falta">Sin teléfono — no recibirá WhatsApp</span>
          <button v-if="!editando[u.id]" class="rec__link" @click="abrirEdicion(u)">Cargar número</button>
        </li>
      </ul>

      <div v-for="u in data?.whatsapp ?? []" :key="`ed-${u.id}`">
        <div v-if="editando[u.id]" class="rec__editor">
          <label>Teléfono de {{ u.nombre }}</label>
          <VueTelInput
            :model-value="editando[u.id].numero"
            mode="international"
            :auto-format="true"
            :input-options="{ placeholder: 'Ej: 99 525 4965' }"
            :dropdown-options="{
              showSearchBox: true,
              showFlags: true,
              showDialCodeInList: true,
              showDialCodeInSelection: true,
            }"
            @on-input="(v: string, o: any) => onTel(u.id, v, o)"
          />
          <p class="rec__editor-hint">
            Se guarda en su ficha, así que queda cargado para los próximos avisos y para el mes que viene.
          </p>
          <p v-if="errorTel[u.id]" class="rec__error">{{ errorTel[u.id] }}</p>
          <div class="rec__editor-actions">
            <button class="rec__btn-ghost" @click="cerrarEdicion(u.id)">Cancelar</button>
            <button class="rec__btn-primary" :disabled="guardando[u.id]" @click="guardar(u)">
              {{ guardando[u.id] ? 'Guardando…' : 'Guardar teléfono' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="rec__group">
      <h3><i class="fa-solid fa-envelope" /> Correo — todos los usuarios del entorno</h3>
      <p class="rec__hint">
        Leer un correo no obliga a nadie a hacer nada, así que aquí sí va el equipo completo del cliente.
      </p>
      <p v-if="!data?.correo.length" class="rec__empty">Este entorno no tiene usuarios cliente.</p>
      <ul v-else class="rec__list">
        <li v-for="u in data?.correo ?? []" :key="`m-${u.id}`" class="rec__item">
          <div class="rec__item-main">
            <strong>{{ u.nombre }} {{ u.apellido }}</strong>
            <span>{{ u.correo }}</span>
          </div>
          <span v-if="u.esAdmin" class="rec__admin">Admin</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.rec {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__group h3 {
    margin: 0;
    font-size: 0.9rem;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__hint {
    margin: 0.25rem 0 0.6rem;
    font-size: 0.76rem;
    color: rgba($primary-dark, 0.55);
    line-height: 1.4;
  }

  &__empty {
    margin: 0;
    font-size: 0.85rem;
    color: rgba($primary-dark, 0.6);
    padding: 0.5rem 0;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    padding: 0.55rem 0.7rem;
    flex-wrap: wrap;

    &--falta { border-color: #fde68a; background: #fffbeb; }

    &-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    &-main strong { font-size: 0.85rem; color: $primary-dark; }
    &-main span { font-size: 0.75rem; color: rgba($primary-dark, 0.55); }
  }

  &__tel { font-size: 0.8rem; font-weight: 600; color: #128c3f; }
  &__falta { font-size: 0.72rem; color: #92400e; }

  &__admin {
    font-size: 0.68rem;
    background: rgba($primary-dark, 0.07);
    color: rgba($primary-dark, 0.7);
    border-radius: 20px;
    padding: 0.1rem 0.5rem;
  }

  &__link {
    border: none;
    background: none;
    color: $primary-dark;
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }

  &__editor {
    margin-top: 0.6rem;
    border: 1px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    padding: 0.75rem;

    label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      color: $primary-dark;
    }

    &-hint { margin: 0.35rem 0 0; font-size: 0.72rem; color: rgba($primary-dark, 0.5); }
    &-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.6rem; }
  }

  &__error { margin: 0.35rem 0 0; font-size: 0.78rem; color: #b91c1c; }

  &__btn-ghost, &__btn-primary {
    border-radius: 10px;
    padding: 0.5rem 0.9rem;
    font-size: 0.83rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }

  &__btn-ghost { background: none; border-color: rgba($primary-dark, 0.15); color: $primary-dark; }
  &__btn-primary { background: $primary-dark; color: $white; }
}

:deep(.vue-tel-input) { border-radius: 8px; border: 1px solid rgba($primary-dark, 0.15); }
</style>
