<template>
  <div class="lote" role="status" aria-live="polite">
    <span class="lote__marca" aria-hidden="true">
      <span class="lote__pulso" />
      <i class="fa-solid fa-bullseye" />
    </span>

    <div class="lote__texto">
      <p class="lote__titulo">
        Cargando entornos
        <strong>{{ listos }} de {{ total }}</strong>
      </p>
      <p class="lote__sub">
        <template v-if="faltan">Faltan {{ faltan }} por cargar</template>
        <template v-else>Listo</template>
      </p>
    </div>

    <div class="lote__barra" role="progressbar" :aria-valuenow="porcentaje" aria-valuemin="0" aria-valuemax="100">
      <div class="lote__relleno" :style="{ width: `${porcentaje}%` }" />
    </div>

    <span class="lote__pct">{{ porcentaje }}%</span>
  </div>
</template>

<script setup lang="ts">
/**
 * El lote en curso, dicho con números. Sustituye a los diez esqueletos mudos:
 * lo que angustia no es esperar, es no saber cuánto falta.
 */
defineProps<{ listos: number; total: number; faltan: number; porcentaje: number }>()
</script>

<style lang="scss" scoped>
.lote {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.9rem;
  margin-bottom: 12px;
  background: $white;
  border: 1.5px solid rgba($primary, 0.28);
  border-radius: 12px;
}

.lote__marca {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba($primary, 0.12);
  color: $primary;
  font-size: 0.85rem;
}

/* Un halo lento: dice "trabajando", no "apúrate". */
.lote__pulso {
  position: absolute;
  inset: -4px;
  border-radius: 12px;
  border: 2px solid rgba($primary, 0.45);
  animation: loteHalo 1.8s ease-out infinite;
}

.lote__texto {
  flex: 1 1 auto;
  min-width: 0;
}

.lote__titulo {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: $primary-dark;

  strong { color: $primary; font-variant-numeric: tabular-nums; }
}

.lote__sub {
  margin: 0;
  font-size: 0.72rem;
  color: $text-secondary;
}

.lote__barra {
  flex: 0 1 180px;
  height: 6px;
  border-radius: 100px;
  background: rgba($primary-dark, 0.1);
  overflow: hidden;
}

.lote__relleno {
  height: 100%;
  border-radius: 100px;
  background: $primary;
  transition: width 0.3s ease;
}

.lote__pct {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 800;
  color: $primary;
  font-variant-numeric: tabular-nums;
}

@keyframes loteHalo {
  0%   { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.3); opacity: 0; }
}

@media (max-width: 640px) {
  .lote__barra { flex-basis: 80px; }
}

@media (prefers-reduced-motion: reduce) {
  .lote__pulso { animation: none; }
  .lote__relleno { transition: none; }
}
</style>
