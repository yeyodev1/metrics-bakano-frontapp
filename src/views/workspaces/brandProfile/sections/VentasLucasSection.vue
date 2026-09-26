<script setup lang="ts">
/**
 * Ventas por WhatsApp: precios y condiciones, datos de pago y reglas de venta.
 *
 * Es la misma información que el negocio le cuenta a Lucas con /negocio,
 * /pago y /regla. Lo que se guarda aquí lo usa Lucas, y lo que el cliente le
 * escribe a Lucas aparece aquí: se edita en cualquiera de los dos lados.
 */
import { ref, watch, computed } from 'vue'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile } from '@/types'

const props = defineProps<{
  workspaceId: string
  profile: Partial<BrandProfile>
}>()

const infoVentas = ref('')
const datosPago = ref('')
const reglas = ref<string[]>([])
const nuevaRegla = ref('')
const guardando = ref(false)
const guardado = ref(false)
const error = ref('')

function cargar(p: Partial<BrandProfile>) {
  infoVentas.value = p.infoVentas || ''
  datosPago.value = p.datosPago || ''
  reglas.value = [...(p.reglasVenta || [])]
}
watch(() => props.profile, (p) => cargar(p || {}), { immediate: true })

const actualizado = computed(() => {
  const en = props.profile?.ventasActualizadoEn
  if (!en) return ''
  const fecha = new Date(en).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
  return `${props.profile?.ventasFuente === 'lucas' ? 'Lo contó el cliente a Lucas' : 'Editado en Metrics'} · ${fecha}`
})

function agregarRegla() {
  const r = nuevaRegla.value.trim()
  if (!r) return
  reglas.value.push(r)
  nuevaRegla.value = ''
}

async function guardar() {
  guardando.value = true
  error.value = ''
  try {
    const bp = await brandProfileService.upsert(props.workspaceId, {
      infoVentas: infoVentas.value,
      datosPago: datosPago.value,
      reglasVenta: reglas.value,
    })
    Object.assign(props.profile, {
      ventasActualizadoEn: bp?.ventasActualizadoEn,
      ventasFuente: bp?.ventasFuente,
    })
    guardado.value = true
    setTimeout(() => { guardado.value = false }, 2500)
  } catch {
    error.value = 'No se pudo guardar. Intenta de nuevo.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <section class="ventas">
    <header class="ventas__head">
      <div>
        <h3 class="ventas__titulo"><i class="fa-brands fa-whatsapp" /> Ventas por WhatsApp</h3>
        <p class="ventas__sub">
          Lo mismo que el negocio le cuenta a Lucas (<code>/negocio</code>, <code>/pago</code>, <code>/regla</code>).
          Lo que cambies aquí lo usa Lucas, y lo que le escriban a Lucas aparece aquí.
        </p>
      </div>
      <span v-if="actualizado" class="ventas__meta">{{ actualizado }}</span>
    </header>

    <label class="ventas__campo">
      <span>Precios y condiciones</span>
      <textarea
        v-model="infoVentas"
        rows="4"
        placeholder="Qué vende, precios, cómo entrega, horarios, zonas, garantías…"
      />
    </label>

    <label class="ventas__campo">
      <span>Datos de pago</span>
      <textarea
        v-model="datosPago"
        rows="3"
        placeholder="Cuentas, link de pago, De Una, efectivo contra entrega…"
      />
    </label>

    <div class="ventas__campo">
      <span>Reglas de venta</span>
      <ol v-if="reglas.length" class="ventas__reglas">
        <li v-for="(r, i) in reglas" :key="i">
          <span>{{ r }}</span>
          <button type="button" class="ventas__quitar" :aria-label="`Quitar regla ${i + 1}`" @click="reglas.splice(i, 1)">
            <i class="fa-solid fa-xmark" />
          </button>
        </li>
      </ol>
      <p v-else class="ventas__vacio">Sin reglas todavía.</p>
      <div class="ventas__nueva">
        <input
          v-model="nuevaRegla"
          type="text"
          placeholder="Ej: no se envían proformas para montos menores a $500"
          @keydown.enter.prevent="agregarRegla"
        />
        <button type="button" class="ventas__btn ventas__btn--plano" @click="agregarRegla">Agregar</button>
      </div>
    </div>

    <p v-if="error" class="ventas__error">{{ error }}</p>

    <div class="ventas__acciones">
      <button type="button" class="ventas__btn" :disabled="guardando" @click="guardar">
        <i :class="guardado ? 'fa-solid fa-check' : guardando ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
        {{ guardado ? 'Guardado' : guardando ? 'Guardando…' : 'Guardar ventas' }}
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.ventas {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__titulo {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
    color: #111827;

    i { color: #16a34a; }
  }

  &__sub {
    margin: 0;
    color: #6b7280;
    font-size: 0.85rem;
    line-height: 1.5;

    code {
      background: #f3f4f6;
      padding: 0 0.3rem;
      border-radius: 4px;
    }
  }

  &__meta {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
  }

  &__campo {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    > span {
      font-weight: 600;
      font-size: 0.9rem;
      color: #374151;
    }

    textarea,
    input {
      width: 100%;
      padding: 0.7rem 0.85rem;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      font-size: 0.9rem;
      resize: vertical;

      &:focus {
        outline: 2px solid rgba(201, 30, 76, 0.25);
        border-color: #c91e4c;
      }
    }
  }

  &__reglas {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    li {
      font-size: 0.9rem;
      color: #111827;

      span { margin-right: 0.5rem; }
    }
  }

  &__quitar {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.1rem 0.3rem;

    &:hover { color: #ef4444; }
  }

  &__vacio {
    margin: 0;
    font-size: 0.85rem;
    color: #9ca3af;
  }

  &__nueva {
    display: flex;
    gap: 0.5rem;

    @media (max-width: 600px) { flex-direction: column; }
  }

  &__error {
    margin: 0;
    color: #b91c1c;
    font-size: 0.85rem;
  }

  &__acciones {
    display: flex;
    justify-content: flex-end;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.2rem;
    border-radius: 10px;
    border: none;
    background: #c91e4c;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;

    &:disabled { opacity: 0.6; cursor: not-allowed; }

    &--plano {
      background: #fff;
      color: #374151;
      border: 1px solid #d1d5db;
    }
  }
}
</style>
