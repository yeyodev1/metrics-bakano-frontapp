<script setup lang="ts">
/**
 * Antes de planificar: si el cliente está al día (si debe, no verá los
 * guiones hasta pagar) y qué quiere destacar. Así contenido no tiene que ir a
 * preguntar a quién le toca ni qué promocionar.
 */
import { onMounted, ref } from 'vue'
import { contextoClienteService, type ContextoCliente } from '@/services/contextoCliente.service'

const props = defineProps<{ workspaceId: string }>()
const contexto = ref<ContextoCliente | null>(null)

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric', month: 'short' })
}

onMounted(async () => {
  try {
    contexto.value = await contextoClienteService.ver(props.workspaceId)
  } catch {
    contexto.value = null
  }
})
</script>

<template>
  <div v-if="contexto" class="ctx">
    <span v-if="!contexto.pago.vinculado" class="ctx__chip" title="No tiene facturación vinculada en Finanzas: no se le bloquea nada">
      <i class="fa-solid fa-circle-question" /> Sin facturación vinculada
    </span>
    <span v-else-if="contexto.pago.alDia" class="ctx__chip ctx__chip--ok">
      <i class="fa-solid fa-circle-check" /> Al día con los pagos
    </span>
    <span v-else class="ctx__chip ctx__chip--bad">
      <i class="fa-solid fa-circle-exclamation" />
      Debe {{ contexto.pago.deudaTexto }}: no verá ni aprobará los guiones hasta pagar
    </span>

    <span v-if="contexto.destacar" class="ctx__destacar">
      <i class="fa-solid fa-bullhorn" />
      <b>Quiere destacar:</b> {{ contexto.destacar.texto }}
      <em>· {{ fecha(contexto.destacar.en) }}</em>
    </span>
    <span v-else class="ctx__destacar ctx__destacar--vacio">
      <i class="fa-solid fa-bullhorn" /> Todavía no contó qué quiere destacar
    </span>
  </div>
</template>

<style lang="scss" scoped>
.ctx {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 2.5rem 0;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem 0;
  }
}

.ctx__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: rgba(100, 100, 110, 0.1);
  color: $text-secondary;

  &--ok { background: rgba(#16a34a, 0.1); color: #15803d; }
  &--bad { background: rgba(#e6285c, 0.1); color: #c01e4b; }
}

.ctx__destacar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: $text-secondary;
  min-width: 0;

  i { color: #85529c; }
  b { color: $primary-dark; }
  em { font-style: normal; opacity: 0.75; }

  &--vacio { opacity: 0.75; }
}
</style>
