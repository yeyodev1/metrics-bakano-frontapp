<template>
  <section class="snd">
    <!-- The state is the headline: you should know if it's on before reading anything -->
    <header class="snd__hero" :class="{ 'is-on': sound.enabled }">
      <div class="snd__hero-icon">
        <i :class="sound.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'" />
      </div>

      <div class="snd__hero-text">
        <h3>Sonido de la interfaz</h3>
        <p>
          {{ sound.enabled
            ? 'Activado. Escucharás un sonido al navegar, hacer clic y recibir avisos.'
            : 'Silenciado. La app no emitirá ningún sonido.' }}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        :aria-checked="sound.enabled"
        :aria-label="sound.enabled ? 'Silenciar sonido' : 'Activar sonido'"
        :class="['snd__switch', { 'is-on': sound.enabled }]"
        data-no-sound
        @click="onToggle"
      >
        <span class="snd__switch-track">
          <span class="snd__switch-knob" />
        </span>
        <span class="snd__switch-label">{{ sound.enabled ? 'Activado' : 'Silenciado' }}</span>
      </button>
    </header>

    <!-- Volume is meaningless while muted, so it collapses away -->
    <div v-if="sound.enabled" class="snd__volume">
      <div class="snd__volume-head">
        <span class="snd__volume-title">Volumen</span>
        <span class="snd__volume-value">{{ volumePercent }}%</span>
      </div>

      <div class="snd__volume-row">
        <button type="button" class="snd__step" aria-label="Bajar volumen" data-no-sound @click="step(-10)">
          <i class="fa-solid fa-volume-low" />
        </button>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          :value="volumePercent"
          aria-label="Volumen del sonido de la interfaz"
          data-no-sound
          @input="onVolume"
        />

        <button type="button" class="snd__step" aria-label="Subir volumen" data-no-sound @click="step(10)">
          <i class="fa-solid fa-volume-high" />
        </button>
      </div>

      <div class="snd__presets">
        <button
          v-for="preset in PRESETS"
          :key="preset.value"
          type="button"
          :class="['snd__preset', { 'is-active': volumePercent === preset.value }]"
          data-no-sound
          @click="sound.setVolume(preset.value / 100)"
        >
          {{ preset.label }}
        </button>
        <button type="button" class="snd__try" data-no-sound @click="preview">
          <i class="fa-solid fa-play" /> Probar
        </button>
      </div>

      <p v-if="volumePercent === 0" class="snd__warn">
        <i class="fa-solid fa-triangle-exclamation" />
        El volumen está en 0: no oirás nada aunque el sonido esté activado.
      </p>
    </div>

    <footer class="snd__footer">
      <p class="snd__note">
        <i class="fa-solid fa-circle-info" />
        <span>
          El sonido viene activado para todos al 25%. Lo que cambies aquí se
          guarda solo en este navegador y manda sobre el valor por defecto.
          También puedes silenciarlo desde el icono de la barra superior.
        </span>
      </p>

      <button
        v-if="!sound.isDefault"
        type="button"
        class="snd__reset"
        data-no-sound
        @click="reset"
      >
        <i class="fa-solid fa-rotate-left" /> Restablecer
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { play } from 'cuelume'
import { useSoundStore } from '@/stores/sound'

const sound = useSoundStore()

// 25 is the shipped default, so it gets its own preset — otherwise going back
// to it means hunting for the exact notch on the slider.
const PRESETS = [
  { label: 'Suave', value: 25 },
  { label: 'Medio', value: 60 },
  { label: 'Alto', value: 100 },
]

const volumePercent = computed(() => Math.round(sound.volume * 100))

function onToggle() {
  sound.toggle()
  // Confirm audibly only when turning it on — muting should be silent.
  if (sound.enabled) play('toggle')
}

function onVolume(event: Event) {
  sound.setVolume(Number((event.target as HTMLInputElement).value) / 100)
}

function step(delta: number) {
  sound.setVolume(Math.min(100, Math.max(0, volumePercent.value + delta)) / 100)
  play('tick')
}

function preview() {
  play('chime')
}

function reset() {
  sound.resetToDefault()
  play('toggle')
}
</script>

<style lang="scss" scoped>
.snd {
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

.snd__hero {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  background: rgba($text-secondary, 0.06);
  border: 1px solid rgba($text-secondary, 0.12);
  border-radius: 10px;
  transition: background 0.2s, border-color 0.2s;

  &.is-on {
    background: rgba($BAKANO-GREEN, 0.08);
    border-color: rgba($BAKANO-GREEN, 0.3);
  }
}

.snd__hero-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 1.05rem;
  color: $text-secondary;
  background: $white;
  border-radius: 12px;

  .is-on & { color: $BAKANO-GREEN; }
}

.snd__hero-text {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0 0 0.2rem;
    font-size: 1rem;
    color: $primary-dark;
  }

  p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: $text-secondary;
  }
}

.snd__switch {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.6rem;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.snd__switch-track {
  display: flex;
  align-items: center;
  width: 52px;
  height: 28px;
  padding: 3px;
  background: rgba($text-secondary, 0.4);
  border-radius: 999px;
  transition: background 0.22s;

  .snd__switch.is-on & { background: $BAKANO-GREEN; }
}

.snd__switch-knob {
  width: 22px;
  height: 22px;
  background: $white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.22s;

  .snd__switch.is-on & { transform: translateX(24px); }
}

.snd__switch-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: $text-secondary;

  .snd__switch.is-on & { color: $BAKANO-GREEN; }
}

.snd__volume {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.snd__volume-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.snd__volume-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: $primary-dark;
}

.snd__volume-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: $secondary;
}

.snd__volume-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  input[type='range'] {
    flex: 1;
    min-width: 0;
    height: 6px;
    accent-color: $secondary;
    cursor: pointer;
  }
}

.snd__step {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
  color: $secondary-dark;
  background: $overlay-purple;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.15s;

  &:hover { filter: brightness(0.95); }
}

.snd__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.snd__preset {
  padding: 0.35rem 0.8rem;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  color: $text-secondary;
  background: $white;
  border: 1.5px solid rgba($text-secondary, 0.2);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { color: $secondary; border-color: rgba($secondary, 0.5); }

  &.is-active {
    color: $white;
    background: $secondary;
    border-color: $secondary;
  }
}

.snd__try {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  padding: 0.35rem 0.85rem;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  color: $white;
  background: $secondary;
  border: none;
  border-radius: 999px;
  cursor: pointer;

  &:hover { filter: brightness(1.08); }
}

.snd__warn {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  padding: 0.55rem 0.7rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: $primary-dark;
  background: $alert-warning-bg;
  border-radius: 8px;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-warning; }
}

.snd__footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba($text-secondary, 0.12);
}

.snd__note {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: $text-secondary;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-info; }
}

.snd__reset {
  display: inline-flex;
  flex-shrink: 0;
  align-self: flex-start;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-secondary;
  background: transparent;
  border: 1.5px solid rgba($text-secondary, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: $primary-dark;
    border-color: rgba($primary-dark, 0.35);
  }
}

@media (min-width: 620px) {
  .snd__hero {
    flex-direction: row;
    align-items: center;
  }
}
</style>
