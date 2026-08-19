<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDriveUploads } from '@/composables/useDriveUploads'

/**
 * Panel flotante de subidas a Drive (como el de Google Drive): muestra las
 * que suben, las que esperan turno y las terminadas, sin importar en que
 * pantalla este el editor. Vive en el layout para que navegar dentro de la
 * app no lo desmonte.
 */
const { subidas, hayActivas, reintentar, limpiarTerminadas } = useDriveUploads()

const colapsado = ref(false)

const visibles = computed(() => subidas.value.length > 0)
const activasCount = computed(
  () => subidas.value.filter((s) => s.estado === 'subiendo' || s.estado === 'pendiente').length,
)
const resumen = computed(() =>
  activasCount.value > 0
    ? `Subiendo ${activasCount.value} a Drive…`
    : 'Subidas a Drive completadas',
)
</script>

<template>
  <div v-if="visibles" class="dut">
    <button type="button" class="dut__head" @click="colapsado = !colapsado">
      <span class="dut__head-icon">
        <i v-if="activasCount > 0" class="fa-solid fa-cloud-arrow-up" />
        <i v-else class="fa-solid fa-circle-check" />
      </span>
      <span class="dut__head-text">{{ resumen }}</span>
      <i class="fa-solid" :class="colapsado ? 'fa-chevron-up' : 'fa-chevron-down'" />
    </button>

    <div v-if="!colapsado" class="dut__body">
      <div v-for="s in subidas" :key="s.id" class="dut__row">
        <span class="dut__row-icon" :class="`dut__row-icon--${s.estado}`">
          <i v-if="s.estado === 'listo'" class="fa-solid fa-check" />
          <i v-else-if="s.estado === 'error'" class="fa-solid fa-triangle-exclamation" />
          <i v-else-if="s.estado === 'pendiente'" class="fa-regular fa-clock" />
          <i v-else class="fa-solid fa-arrow-up" />
        </span>
        <div class="dut__row-info">
          <span class="dut__row-title">{{ s.titulo }}</span>
          <span v-if="s.estado === 'error'" class="dut__row-sub dut__row-sub--error">{{ s.error }}</span>
          <span v-else-if="s.estado === 'pendiente'" class="dut__row-sub">En cola</span>
          <span v-else-if="s.estado === 'listo'" class="dut__row-sub">
            Listo<template v-if="s.driveLink"> · <a :href="s.driveLink" target="_blank" rel="noopener">Ver en Drive</a></template>
          </span>
          <div v-else class="dut__row-bar">
            <div class="dut__row-fill" :style="{ width: s.pct + '%' }" />
          </div>
        </div>
        <span v-if="s.estado === 'subiendo'" class="dut__row-pct">{{ s.pct }}%</span>
        <button
          v-if="s.estado === 'error'"
          type="button"
          class="dut__retry"
          @click="reintentar(s.id)"
        >
          <i class="fa-solid fa-rotate" />
        </button>
      </div>

      <button
        v-if="!hayActivas"
        type="button"
        class="dut__clear"
        @click="limpiarTerminadas"
      >Limpiar</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dut {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1400;
  width: min(340px, calc(100vw - 2rem));
  background: $white;
  border: 1px solid rgba($primary-dark, 0.12);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba($primary-dark, 0.2);
  overflow: hidden;
}

.dut__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: $primary-dark;
  color: $white;
  border: none;
  padding: 0.7rem 0.9rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  > i { color: rgba($white, 0.6); font-size: 0.7rem; }
}

.dut__head-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: rgba(#1ea362, 0.25);
  color: #6ee7b7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.dut__head-text { flex: 1; text-align: left; }

.dut__body {
  max-height: 260px;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dut__row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.5rem;
  border-radius: 9px;

  &:hover { background: rgba($primary-dark, 0.03); }
}

.dut__row-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  flex-shrink: 0;

  &--listo { background: rgba($alert-success, 0.12); color: $alert-success; }
  &--error { background: $alert-error-bg; color: $alert-error; }
  &--pendiente { background: rgba($primary-dark, 0.06); color: $text-secondary; }
  &--subiendo { background: rgba(#1ea362, 0.12); color: #1ea362; }
}

.dut__row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dut__row-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dut__row-sub {
  font-size: 0.68rem;
  color: $text-secondary;

  a { color: #1ea362; font-weight: 700; }
  &--error { color: $alert-error; }
}

.dut__row-bar {
  height: 5px;
  background: rgba($primary-dark, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.dut__row-fill {
  height: 100%;
  background: #1ea362;
  border-radius: 99px;
  transition: width 0.2s;
}

.dut__row-pct {
  font-size: 0.7rem;
  font-weight: 800;
  color: #1ea362;
  flex-shrink: 0;
}

.dut__retry {
  border: none;
  background: rgba($primary-dark, 0.05);
  color: $text-secondary;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover { color: $primary-dark; }
}

.dut__clear {
  align-self: flex-end;
  border: none;
  background: none;
  color: $text-secondary;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.5rem;
  cursor: pointer;

  &:hover { color: $primary-dark; }
}
</style>
