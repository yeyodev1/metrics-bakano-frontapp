<script setup lang="ts">
import { toRef } from 'vue'
import { useUnsavedCloseGuard } from '@/composables/useUnsavedCloseGuard'
import type { BrandProfile } from '@/types'
import { useBrandStrategyForm, type BrandStrategyPayload } from './brandStrategy/useBrandStrategyForm'
import StrategyTextList from './brandStrategy/StrategyTextList.vue'
import StrategySegmentos from './brandStrategy/StrategySegmentos.vue'
import StrategyCasos from './brandStrategy/StrategyCasos.vue'

const props = defineProps<{
  show: boolean
  profile: BrandProfile
  isSaving: boolean
  /** Nombre del workspace; encabeza el documento. */
  marca?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'finish', data: BrandStrategyPayload): void
}>()

const {
  propuestaValor, segmentos, canales, actividades, casos,
  puedeGuardar,
  addSegmento, removeSegmento,
  addCanal, removeCanal,
  addActividad, removeActividad,
  addCaso, removeCaso,
  payload,
} = useBrandStrategyForm(toRef(props, 'profile'), toRef(props, 'show'))

// Nada se guarda hasta confirmar: cerrar por error borra todo el documento, así
// que las salidas pasan por el guardia compartido.
const { isDirty, requestClose } = useUnsavedCloseGuard({
  show: toRef(props, 'show'),
  state: () => ({
    propuestaValor: propuestaValor.value,
    segmentos: segmentos.value,
    canales: canales.value,
    actividades: actividades.value,
    casos: casos.value,
  }),
  isBusy: toRef(props, 'isSaving'),
  onClose: () => emit('close'),
  title: '¿Salir de la estrategia?',
  message:
    'Lo que escribiste todavía no se ha guardado. Si sales ahora se pierde y hay que llenarlo de nuevo.',
})

function finish() {
  emit('finish', payload())
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bsw-fade">
      <div v-if="show" class="bsw-overlay" @click.self="requestClose">
        <div class="bsw-modal">
          <header class="bsw-header">
            <div class="bsw-header__title">
              <i class="fa-solid fa-compass-drafting" />
              <div>
                <h3>Estrategia de Marca</h3>
                <p>Llena el documento completo: propuesta, mercado, canales y Customer Journey.</p>
              </div>
            </div>
            <button
              class="bsw-close"
              :disabled="isSaving"
              :title="isDirty ? 'Cerrar (te pedirá confirmación)' : 'Cerrar'"
              aria-label="Cerrar"
              @click="requestClose"
            >
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <div class="bsw-body">
            <!-- Un solo documento: se llena de arriba a abajo, sin pasos. -->
            <article class="bsw-doc">
              <h2 v-if="marca" class="bsw-doc__marca">{{ marca }}</h2>

              <section class="bsw-sec">
                <h3 class="bsw-sec__titulo">Propuesta de valor:</h3>
                <p class="bsw-sec__ayuda">
                  ¿Qué te diferencia? La promesa central que hace única a tu marca.
                </p>
                <textarea
                  v-model="propuestaValor"
                  rows="5"
                  class="bsw-doc__textarea"
                  placeholder="Ej: Servicios aduaneros para empresas de importación con seguimiento proactivo en tiempo real y soporte constante como diferenciador..."
                />
              </section>

              <section class="bsw-sec">
                <h3 class="bsw-sec__titulo">Segmento de mercado:</h3>
                <p class="bsw-sec__ayuda">
                  Los tipos de empresas o personas que forman tu mercado objetivo.
                </p>
                <StrategySegmentos
                  v-model="segmentos"
                  @add="addSegmento"
                  @remove="removeSegmento"
                />
              </section>

              <section class="bsw-sec">
                <h3 class="bsw-sec__titulo">Canales:</h3>
                <p class="bsw-sec__ayuda">
                  ¿Dónde vas a captar y convertir? Ej: Redes Sociales, WhatsApp, punto físico...
                </p>
                <StrategyTextList
                  v-model="canales"
                  placeholder="Ej: WhatsApp (llevar a que pregunten por el taller)..."
                  add-label="Agregar canal"
                  @add="addCanal"
                  @remove="removeCanal"
                />
              </section>

              <section class="bsw-sec">
                <h3 class="bsw-sec__titulo">Actividades clave:</h3>
                <p class="bsw-sec__ayuda">
                  Las tareas indispensables para que la estrategia funcione.
                </p>
                <StrategyTextList
                  v-model="actividades"
                  placeholder="Ej: Creación de guiones..."
                  add-label="Agregar actividad"
                  @add="addActividad"
                  @remove="removeActividad"
                />
              </section>

              <section class="bsw-sec">
                <h3 class="bsw-sec__titulo">Customer Journey:</h3>
                <p class="bsw-sec__ayuda">
                  Por cada caso: quién es, cómo se siente al ver el anuncio y qué obtenemos.
                </p>
                <StrategyCasos
                  v-model="casos"
                  @add="addCaso"
                  @remove="removeCaso"
                />
              </section>
            </article>
          </div>

          <footer class="bsw-footer">
            <button type="button" class="bsw-btn-ghost" :disabled="isSaving" @click="requestClose">
              Cancelar
            </button>
            <span class="bsw-footer__estado">
              <em v-if="isDirty" class="bsw-unsaved">
                <i class="fa-solid fa-circle" /> Sin guardar
              </em>
              <em v-else class="bsw-saved">Sin cambios</em>
            </span>
            <button
              type="button"
              class="bsw-btn-primary"
              :disabled="isSaving || !puedeGuardar"
              :title="puedeGuardar ? '' : 'Escribe al menos la propuesta de valor'"
              @click="finish"
            >
              <i :class="isSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-circle-check'" />
              {{ isSaving ? 'Guardando...' : 'Guardar estrategia' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.bsw-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(#0f172a, 0.68);
  backdrop-filter: blur(6px);
}

.bsw-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 44rem;
  max-height: 92vh;
  background: $white;
  border-radius: 20px;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.bsw-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.75rem 1.15rem;
  background: linear-gradient(135deg, rgba(#a855f7, 0.1), rgba(#7c3aed, 0.04));
  border-bottom: 1px solid rgba($primary-dark, 0.08);
}

.bsw-header__title {
  display: flex;
  align-items: center;
  gap: 0.9rem;

  i { font-size: 1.6rem; color: #a855f7; flex-shrink: 0; }
  h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.2rem 0 0; font-size: 0.82rem; color: $text-secondary; }
}

.bsw-close {
  border: 0;
  background: transparent;
  color: $text-secondary;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  &:hover { color: #ef4444; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.bsw-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.35rem 1.75rem;
  background: rgba($primary-dark, 0.02);
}

// Se llena como un documento, no como un formulario por pasos.
.bsw-doc {
  padding: 1.6rem 1.8rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  color: $primary-dark;
  line-height: 1.55;

  &__marca {
    margin: 0 0 1.3rem;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  &__textarea {
    width: 100%;
    padding: 0.55rem 0.7rem;
    font-family: inherit;
    font-size: 0.87rem;
    line-height: 1.6;
    color: $primary-dark;
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.09);
    border-radius: 8px;
    outline: none;
    resize: vertical;

    &:focus { border-color: #a855f7; }
    &::placeholder { color: rgba($primary-dark, 0.3); }
  }
}

.bsw-sec {
  & + & { margin-top: 1.6rem; }

  &__titulo {
    margin: 0 0 0.15rem;
    font-size: 0.95rem;
    font-weight: 700;
  }

  &__ayuda {
    margin: 0 0 0.55rem;
    font-size: 0.76rem;
    color: $text-secondary;
  }
}

.bsw-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.1rem 1.75rem;
  border-top: 1px solid rgba($primary-dark, 0.08);
  background: rgba($primary-dark, 0.015);
}

.bsw-footer__estado {
  font-size: 0.78rem;
  font-weight: 700;
  color: $text-secondary;
}

.bsw-unsaved {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 800;
  color: #d97706;

  i { font-size: 0.4rem; }
}

.bsw-saved {
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 700;
  color: rgba($primary-dark, 0.35);
}

.bsw-btn-ghost, .bsw-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  border: 0;
  transition: all 0.2s;
}

.bsw-btn-ghost {
  background: transparent;
  color: $text-secondary;
  border: 1px solid rgba($primary-dark, 0.15);
  &:hover { background: rgba($primary-dark, 0.04); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.bsw-btn-primary {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: $white;
  box-shadow: 0 4px 14px rgba(#a855f7, 0.3);
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(#a855f7, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
}

.bsw-fade-enter-active, .bsw-fade-leave-active {
  transition: opacity 0.25s ease;
  .bsw-modal { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease; }
}
.bsw-fade-enter-from, .bsw-fade-leave-to {
  opacity: 0;
  .bsw-modal { opacity: 0; transform: scale(0.94) translateY(16px); }
}

@media (max-width: 640px) {
  .bsw-doc { padding: 1.1rem 1rem; }
  .bsw-body { padding: 1rem; }
}
</style>
