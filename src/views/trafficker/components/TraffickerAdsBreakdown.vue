<template>
  <div class="tab-ads">
    <p class="tab-ads__titulo">Anuncios</p>
    <p v-if="cargando" class="tab-ads__nota">Cargando anuncios…</p>
    <p v-else-if="!anuncios.length" class="tab-ads__nota">Sin anuncios en esta cuenta.</p>
    <ul v-else class="tab-ads__lista">
      <li v-for="ad in anuncios" :key="ad.id" class="tab-ads__item">
        <img v-if="ad.thumbnailUrl" :src="ad.thumbnailUrl" alt="" loading="lazy" />
        <span v-else class="tab-ads__sinimg"><i class="fa-solid fa-image" aria-hidden="true" /></span>
        <span class="tab-ads__info">
          <strong>{{ ad.name }}</strong>
          <small>
            <span :class="ad.status === 'ACTIVE' ? 'is-activo' : 'is-pausado'">
              {{ ad.status === 'ACTIVE' ? 'Activo' : 'Pausado' }}
            </span>
            · {{ money(ad.spend) }} · {{ num(ad.impressions) }} impr. · {{ num(ad.clicks) }} clics
          </small>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'

const props = defineProps<{ workspaceId: string; activo: boolean; conexionCompleta: boolean }>()

const num = (n: number) => new Intl.NumberFormat('es-EC').format(n || 0)
const money = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

// Se pide al abrir la fila, no antes: con diez filas serían diez llamadas a
// Meta para algo que casi nunca se mira entero.
const anuncios = ref<any[]>([])
const cargando = ref(false)
let pedido = false

watch(
  () => props.activo,
  async (abierta) => {
    if (!abierta || pedido || !props.conexionCompleta) return
    pedido = true
    cargando.value = true
    try {
      const res = await videoPlanningService.getWorkspaceAds(props.workspaceId, { limit: 5 })
      anuncios.value = res.ads ?? []
    } catch {
      anuncios.value = []
    } finally {
      cargando.value = false
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.tab-ads { margin-top: 0.9rem; }

.tab-ads__titulo {
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: $primary-dark;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tab-ads__nota { margin: 0; font-size: 0.8rem; color: $text-secondary; }

.tab-ads__lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tab-ads__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  img, .tab-ads__sinimg {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 7px;
  }

  .tab-ads__sinimg {
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    background: rgba($primary-dark, 0.06);
  }
}

.tab-ads__info {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    overflow: hidden;
    font-size: 0.82rem;
    color: $primary-dark;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small { font-size: 0.72rem; color: $text-secondary; }

  .is-activo { font-weight: 800; color: #15803d; }
  .is-pausado { font-weight: 800; color: $text-secondary; }
}
</style>
