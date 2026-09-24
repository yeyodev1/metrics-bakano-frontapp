<script setup lang="ts">
/**
 * La columna de la izquierda del onboarding del cliente.
 *
 * Antes era un bloque de color con un titulo flotando en el medio: ocupaba
 * 320px para no decir nada. Ahora muestra los cuatro pasos, cual esta hecho y
 * en cual esta parado, que es lo unico que el cliente quiere saber mientras
 * llena un formulario largo.
 */
const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['logout'])

const PASOS = [
  { n: 1, emoji: '🎬', titulo: 'Cómo trabajamos', detalle: 'Alineamos expectativas' },
  { n: 2, emoji: '📝', titulo: 'Tu contrato', detalle: 'Datos y firma' },
  { n: 3, emoji: '📅', titulo: 'Tu bienvenida', detalle: 'Agenda con el equipo' },
  { n: 4, emoji: '🚀', titulo: 'Listo', detalle: 'Arrancamos' },
]

const TITULOS: Record<number, { titulo: string; sub: string }> = {
  1: { titulo: 'Tu viaje comienza aquí', sub: 'Alineemos expectativas para garantizar tu éxito.' },
  2: { titulo: 'Formalicemos el acuerdo', sub: 'Ingresa los datos para generar tu contrato de servicios.' },
  3: { titulo: 'Conecta con el equipo', sub: 'Agenda tu bienvenida de 15 minutos.' },
  4: { titulo: '¡Bienvenido a bordo!', sub: 'Tu entorno de trabajo está listo.' },
}

function onLogout() {
  emit('logout')
}
</script>

<template>
  <aside class="lado">
    <button class="lado__salir" title="Cerrar sesión" @click="onLogout">
      <i class="fa-solid fa-right-from-bracket" /> Salir
    </button>

    <Transition name="slide-up" mode="out-in">
      <div :key="currentStep" class="lado__intro">
        <h2 class="lado__titulo">{{ TITULOS[currentStep]?.titulo }}</h2>
        <p class="lado__sub">{{ TITULOS[currentStep]?.sub }}</p>
      </div>
    </Transition>

    <ol class="lado__pasos">
      <li
        v-for="paso in PASOS"
        :key="paso.n"
        class="lado__paso"
        :class="{
          'lado__paso--hecho': paso.n < currentStep,
          'lado__paso--actual': paso.n === currentStep,
        }"
      >
        <span class="lado__marca">
          <template v-if="paso.n < currentStep">✅</template>
          <template v-else>{{ paso.emoji }}</template>
        </span>
        <span class="lado__texto">
          <b>{{ paso.titulo }}</b>
          <small>{{ paso.detalle }}</small>
        </span>
      </li>
    </ol>

    <div class="lado__progreso">
      <div class="lado__barra"><span :style="{ width: `${(currentStep / 4) * 100}%` }" /></div>
      <span class="lado__paso-texto">Paso {{ currentStep }} de 4</span>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.lado {
  flex: 0 0 300px;
  background: linear-gradient(160deg, $primary-dark 0%, $secondary-dark 55%, $primary 100%);
  color: $white;
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;

  @media (max-width: 992px) {
    flex: 1 1 auto;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  &__salir {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: $white;
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;

    &:hover { background: rgba(255, 255, 255, 0.2); }
  }

  &__titulo {
    font-size: 1.6rem;
    font-weight: 800;
    line-height: 1.15;
    margin: 0;
    text-wrap: balance;
  }

  &__sub {
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.82);
  }

  &__pasos {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
  }

  &__paso {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 0.7rem;
    border-radius: 10px;
    opacity: 0.6;

    &--hecho { opacity: 0.9; }

    &--actual {
      opacity: 1;
      background: rgba(255, 255, 255, 0.14);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
    }
  }

  &__marca {
    font-size: 1.05rem;
    width: 26px;
    text-align: center;
    flex: 0 0 26px;
  }

  &__texto {
    display: grid;
    line-height: 1.3;
    min-width: 0;

    b { font-size: 0.9rem; font-weight: 700; }
    small { font-size: 0.75rem; color: rgba(255, 255, 255, 0.75); }
  }

  &__progreso { margin-top: auto; }

  &__barra {
    height: 6px;
    background: rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 0.6rem;

    span {
      display: block;
      height: 100%;
      background: $white;
      border-radius: 999px;
      transition: width 0.5s ease-out;
    }
  }

  &__paso-texto {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
  }
}

.slide-up-enter-active,
.slide-up-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(8px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
