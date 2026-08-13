<template>
  <div class="tcx">
    <p class="tcx__titulo">
      <i class="fa-solid fa-plug-circle-exclamation" aria-hidden="true" />
      Falta completar la conexión con Meta
    </p>

    <ul class="tcx__piezas">
      <li v-for="pieza in PIEZAS" :key="pieza.clave" :class="{ 'is-falta': falta(pieza.clave) }">
        <i :class="falta(pieza.clave) ? 'fa-solid fa-xmark' : 'fa-solid fa-check'" aria-hidden="true" />
        <span>
          <strong>{{ pieza.label }}</strong>
          <small>{{ falta(pieza.clave) ? pieza.consecuencia : 'Conectada' }}</small>
        </span>
      </li>
    </ul>

    <button type="button" class="tcx__btn" @click="emit('conectar')">
      <i class="fa-brands fa-meta" aria-hidden="true" /> Completar conexión
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ faltan: string[] }>()
const emit = defineEmits<{ (e: 'conectar'): void }>()

/**
 * Cada pieza con su consecuencia: sin decir qué se rompe, "falta Instagram"
 * no le dice nada a quien tiene que decidir si vale la pena arreglarlo.
 */
const PIEZAS = [
  { clave: 'página de Facebook', label: 'Página de Facebook', consecuencia: 'Sin ella no se leen las publicaciones orgánicas.' },
  { clave: 'cuenta publicitaria', label: 'Cuenta publicitaria', consecuencia: 'Sin ella no hay inversión ni ROAS.' },
  { clave: 'cuenta de Instagram', label: 'Cuenta de Instagram', consecuencia: 'Sin ella no se pueden vincular reels.' },
]

const falta = (clave: string) => props.faltan.includes(clave)
</script>

<style lang="scss" scoped>
.tcx {
  padding: 0.9rem 1rem;
  margin-top: 0.9rem;
  background: rgba(#d97706, 0.06);
  border: 1px solid rgba(#d97706, 0.28);
  border-radius: 10px;
}

.tcx__titulo {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.7rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: #b45309;
}

.tcx__piezas {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0 0 0.9rem;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.78rem;
    color: $text-secondary;

    > i { margin-top: 0.15rem; color: #15803d; }
    &.is-falta > i { color: #b91c1c; }

    span { display: flex; flex-direction: column; }
    strong { font-size: 0.8rem; color: $primary-dark; }
    small { font-size: 0.72rem; }
  }
}

.tcx__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: $white;
  background: #d97706;
  border: none;
  border-radius: 9px;
  cursor: pointer;

  &:hover { filter: brightness(1.06); }
}
</style>
