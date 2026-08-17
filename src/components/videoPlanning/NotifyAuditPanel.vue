<script setup lang="ts">
import { computed } from 'vue'
import type { HistorialAvisos } from '@/types/videoPlanning'

const props = defineProps<{
  historial: HistorialAvisos | null
  loading: boolean
}>()

const resumen = computed(() => props.historial?.resumen ?? null)

/**
 * Los registros más nuevos arriba: lo que se quiere saber al abrir esto es
 * "¿salió el último?", no cómo empezó todo hace tres semanas.
 */
const registros = computed(() =>
  [...(props.historial?.notificaciones ?? [])].reverse(),
)

/**
 * Aperturas y clics viajan por el webhook de Resend. Si nunca se dio de alta,
 * los contadores se quedan en cero para siempre y eso se lee como "nadie lo
 * abrió", que es una conclusión falsa y cara.
 */
const webhookSinDatos = computed(
  () => !!resumen.value && resumen.value.email > 0 && resumen.value.aperturas === 0,
)

function fecha(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="audit">
    <p v-if="loading" class="audit__loading">
      <i class="fa-solid fa-circle-notch fa-spin" /> Cargando historial…
    </p>

    <template v-else-if="resumen">
      <div class="audit__cards">
        <div class="audit__card">
          <i class="fa-brands fa-whatsapp audit__icon audit__icon--wa" />
          <strong>{{ resumen.whatsapp }}</strong>
          <span>WhatsApp enviados</span>
        </div>
        <div class="audit__card">
          <i class="fa-solid fa-envelope audit__icon" />
          <strong>{{ resumen.email }}</strong>
          <span>Correos enviados</span>
        </div>
        <div class="audit__card">
          <i class="fa-solid fa-envelope-open audit__icon" />
          <strong>{{ resumen.aperturas }}</strong>
          <span>Aperturas</span>
        </div>
        <div class="audit__card">
          <i class="fa-solid fa-hand-pointer audit__icon" />
          <strong>{{ resumen.clics }}</strong>
          <span>Clics</span>
        </div>
      </div>

      <p v-if="webhookSinDatos" class="audit__note">
        <i class="fa-solid fa-circle-info" />
        Aperturas y clics llegan por el webhook de Resend. Mientras no esté dado de
        alta en el panel de Resend (<code>email.opened</code> y
        <code>email.clicked</code>), estos dos contadores van a marcar cero aunque
        el cliente sí haya abierto el correo.
      </p>

      <p v-if="!registros.length" class="audit__empty">
        Todavía no se ha enviado ningún aviso de esta planificación.
      </p>

      <ul v-else class="audit__list">
        <li v-for="(r, i) in registros" :key="i" class="audit__row">
          <span class="audit__row-canal" :class="`audit__row-canal--${r.canal}`">
            <i :class="r.canal === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-envelope'" />
          </span>
          <div class="audit__row-body">
            <p class="audit__row-title">
              {{ r.exito ? 'Enviado' : 'Falló' }}
              <span v-if="r.porNombre" class="audit__row-by">· por {{ r.porNombre }}</span>
            </p>
            <p v-if="r.error" class="audit__row-error">{{ r.error }}</p>
            <p v-if="r.abiertoEn || r.clicEn" class="audit__row-meta">
              <span v-if="r.abiertoEn">Abierto {{ fecha(r.abiertoEn) }}</span>
              <span v-if="r.clicEn">· Clic {{ fecha(r.clicEn) }}</span>
            </p>
          </div>
          <div class="audit__row-right">
            <span class="audit__row-date">{{ fecha(r.enviadoEn) }}</span>
            <i
              class="audit__row-flag"
              :class="r.exito ? 'fa-solid fa-circle-check audit__row-flag--ok' : 'fa-solid fa-circle-xmark audit__row-flag--bad'"
            />
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.audit {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__loading,
  &__empty {
    text-align: center;
    color: rgba($primary-dark, 0.6);
    font-size: 0.9rem;
    padding: 1.5rem 0;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  &__card {
    background: rgba($primary-dark, 0.03);
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;

    strong { font-size: 1.4rem; color: $primary-dark; }
    span { font-size: 0.72rem; color: rgba($primary-dark, 0.6); text-align: center; }
  }

  &__icon {
    font-size: 0.95rem;
    color: rgba($primary-dark, 0.45);

    &--wa { color: #25d366; }
  }

  &__note {
    display: flex;
    gap: 0.5rem;
    font-size: 0.78rem;
    line-height: 1.45;
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 0.65rem 0.8rem;

    code {
      background: rgba($primary-dark, 0.06);
      padding: 0 0.25rem;
      border-radius: 4px;
    }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    padding: 0.6rem 0.75rem;

    &-canal {
      width: 30px;
      height: 30px;
      flex-shrink: 0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba($primary-dark, 0.05);
      color: rgba($primary-dark, 0.6);
      font-size: 0.8rem;

      &--whatsapp { background: rgba(#25d366, 0.12); color: #128c3f; }
    }

    &-body { flex: 1; min-width: 0; }

    &-title { margin: 0; font-size: 0.85rem; font-weight: 600; color: $primary-dark; }
    &-by { font-weight: 400; color: rgba($primary-dark, 0.55); }
    &-error { margin: 0.15rem 0 0; font-size: 0.75rem; color: #b91c1c; }
    &-meta { margin: 0.15rem 0 0; font-size: 0.72rem; color: rgba($primary-dark, 0.55); }

    &-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    &-date { font-size: 0.72rem; color: rgba($primary-dark, 0.5); }

    &-flag {
      font-size: 0.9rem;
      &--ok { color: #16a34a; }
      &--bad { color: #dc2626; }
    }
  }
}
</style>
