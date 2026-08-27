<template>
  <div class="igf">
    <label class="igf__label">
      Guión
      <span v-if="texto" class="igf__hint">
        editable por bloques · **negritas** con dobles asteriscos
      </span>
      <button v-if="texto" type="button" class="igf__modo" @click="porBloques = !porBloques">
        <i :class="porBloques ? 'fa-solid fa-align-left' : 'fa-solid fa-list'" />
        {{ porBloques ? 'Editar como texto completo' : 'Editar por bloques' }}
      </button>
    </label>

    <!--
      Lo editado a mano no se pisa solo, y ya no es todo o nada: la content
      manager reemplaza únicamente el bloque que quiere del guión nuevo.
    -->
    <GuionPendiente
      v-if="pendiente"
      :bloques="bloquesPendientes"
      :rotulos="rotulosPendientes"
      :actuales="textosActuales"
      @aplicar="emit('aplicar')"
      @descartar="emit('descartar')"
      @aplicar-bloque="reemplazar"
    />

    <GuionBloques
      v-if="porBloques && bloques.length"
      v-model="bloques"
      :rotulos="rotulos"
      @cambio="sincronizar"
      @agregar="agregar"
      @quitar="quitar"
      @mover="mover"
    />

    <textarea
      v-else
      v-model="texto"
      rows="8"
      placeholder="Se completará automáticamente al generar con IA, o escribe aquí manualmente..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useGuionBloques,
  partirGuion,
  rotulosDe,
} from '@/composables/useGuionBloques'
import type { GuionIA } from '@/types/videoPlanning'
import GuionBloques from './guion/GuionBloques.vue'
import GuionPendiente from './guion/GuionPendiente.vue'

const props = defineProps<{
  /** Guión recién generado esperando permiso para reemplazar al editado a mano. */
  pendiente: string | null
  /** Da nombre a cada bloque (Hook, Cuerpo, Cierre) cuando el guión vino de la IA. */
  guionIA?: GuionIA | null
}>()

const emit = defineEmits<{ (e: 'aplicar'): void; (e: 'descartar'): void }>()

const texto = defineModel<string>({ required: true })

/** Por bloques por defecto: es lo que se pidió para poder tocar una sola parte. */
const porBloques = ref(true)

const { bloques, sincronizar, agregar, quitar, mover, reemplazar } = useGuionBloques(texto)

const textosActuales = computed(() => bloques.value.map((b) => b.texto))
const rotulos = computed(() => rotulosDe(props.guionIA, bloques.value.length))

const bloquesPendientes = computed(() => (props.pendiente ? partirGuion(props.pendiente) : []))
const rotulosPendientes = computed(() =>
  rotulosDe(props.guionIA, bloquesPendientes.value.length)
)
</script>

<style lang="scss" scoped>
.igf {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &__label {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__hint {
    font-size: 0.68rem;
    font-weight: 500;
    color: $text-secondary;
  }

  &__modo {
    margin-left: auto;
    padding: 0.2rem 0;
    font-size: 0.7rem;
    font-weight: 700;
    color: $primary;
    background: none;
    border: none;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }

  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    font-family: inherit;
    font-size: 0.85rem;
    line-height: 1.55;
    color: $primary-dark;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    resize: vertical;
    transition: border-color 0.18s;

    &:focus {
      border-color: $primary;
      outline: none;
    }
  }
}
</style>
