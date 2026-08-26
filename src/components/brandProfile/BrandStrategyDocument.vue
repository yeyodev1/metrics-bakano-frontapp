<template>
  <div class="bsd">
    <p class="bsd__note">
      <i class="fa-solid fa-circle-info" />
      <span>
        Así queda la estrategia. Revísala como un documento y usa
        <strong>Editar</strong> si algo no está bien; nada se guarda hasta que confirmes.
      </span>
    </p>

    <article class="bsd__doc">
      <h2 v-if="marca" class="bsd__marca">{{ marca }}</h2>

      <section class="bsd__section">
        <h3 class="bsd__titulo">
          Propuesta de valor:
          <button type="button" class="bsd__edit" @click="emit('editar', 1)">Editar</button>
        </h3>
        <p v-if="propuestaValor.trim()" class="bsd__parrafo">{{ propuestaValor.trim() }}</p>
        <p v-else class="bsd__vacio">Sin propuesta de valor — no se guardará nada aquí.</p>
      </section>

      <section class="bsd__section">
        <h3 class="bsd__titulo">
          Segmento de mercado:
          <button type="button" class="bsd__edit" @click="emit('editar', 2)">Editar</button>
        </h3>
        <ul v-if="segmentos.length" class="bsd__lista">
          <li v-for="(seg, idx) in segmentos" :key="idx">
            <strong v-if="seg.nombre.trim()">{{ seg.nombre.trim() }}:</strong>
            {{ seg.descripcion.trim() }}
          </li>
        </ul>
        <p v-else class="bsd__vacio">Sin segmentos — no se guardará nada aquí.</p>
      </section>

      <section class="bsd__section">
        <h3 class="bsd__titulo">
          Canales:
          <button type="button" class="bsd__edit" @click="emit('editar', 3)">Editar</button>
        </h3>
        <ul v-if="canales.length" class="bsd__lista">
          <li v-for="(canal, idx) in canales" :key="idx">{{ canal.trim() }}</li>
        </ul>
        <p v-else class="bsd__vacio">Sin canales — no se guardará nada aquí.</p>
      </section>

      <section class="bsd__section">
        <h3 class="bsd__titulo">
          Actividades clave:
          <button type="button" class="bsd__edit" @click="emit('editar', 4)">Editar</button>
        </h3>
        <ul v-if="actividades.length" class="bsd__lista">
          <li v-for="(act, idx) in actividades" :key="idx">{{ act.trim() }}</li>
        </ul>
        <p v-else class="bsd__vacio">Sin actividades — no se guardará nada aquí.</p>
      </section>

      <section class="bsd__section">
        <h3 class="bsd__titulo">
          Customer Journey:
          <button type="button" class="bsd__edit" @click="emit('editar', 5)">Editar</button>
        </h3>
        <div v-if="casos.length" class="bsd__casos">
          <div v-for="(caso, idx) in casos" :key="idx" class="bsd__caso">
            <h4 class="bsd__caso-titulo">
              Caso {{ caso.casoNumero
              }}{{ caso.nombreCaso?.trim() ? ` — ${caso.nombreCaso.trim()}` : '' }}
            </h4>
            <p v-if="caso.potencialCliente.trim()">
              <strong>¿Quién es?</strong> {{ caso.potencialCliente.trim() }}
            </p>
            <p v-if="caso.efectoAnuncio.trim()">
              <strong>Al ver el anuncio:</strong> {{ caso.efectoAnuncio.trim() }}
            </p>
            <p v-if="caso.accionEsperada.trim()">
              <strong>Acción esperada:</strong> {{ caso.accionEsperada.trim() }}
            </p>
          </div>
        </div>
        <p v-else class="bsd__vacio">Sin casos — no se guardará nada aquí.</p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { SegmentoMercado, CustomerJourneyCase } from '@/types'

defineProps<{
  /** Nombre del workspace: encabeza el documento como en el ejemplo de contenido. */
  marca?: string
  propuestaValor: string
  segmentos: SegmentoMercado[]
  canales: string[]
  actividades: string[]
  casos: CustomerJourneyCase[]
}>()

/** Devuelve al paso del wizard que llena esa sección. */
const emit = defineEmits<{ (e: 'editar', paso: number): void }>()
</script>

<style lang="scss" scoped>
.bsd {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  &__note {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0;
    padding: 0.7rem 0.85rem;
    font-size: 0.78rem;
    line-height: 1.45;
    color: $text-secondary;
    background: rgba($primary, 0.06);
    border-radius: 10px;

    i { margin-top: 0.15rem; color: $primary; }
    strong { color: $primary-dark; }
  }

  // Se lee como un documento, no como un formulario: sin tarjetas ni chips,
  // el mismo formato en el que contenido ya revisa las estrategias.
  &__doc {
    padding: 1.6rem 1.8rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 12px;
    color: $primary-dark;
    line-height: 1.55;
  }

  &__marca {
    margin: 0 0 1.3rem;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: $primary-dark;
  }

  &__section + &__section { margin-top: 1.5rem; }

  &__titulo {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin: 0 0 0.5rem;
    font-size: 0.95rem;
    font-weight: 700;
  }

  &__edit {
    padding: 0;
    font-size: 0.72rem;
    font-weight: 600;
    color: $primary;
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    opacity: 0.75;
    transition: opacity 0.18s;

    &:hover { opacity: 1; }
  }

  &__parrafo {
    margin: 0;
    font-size: 0.87rem;
    white-space: pre-line;
  }

  &__lista {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.87rem;

    li + li { margin-top: 0.7rem; }
    strong { font-weight: 700; }
  }

  &__casos {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  &__caso {
    p {
      margin: 0.3rem 0 0;
      font-size: 0.87rem;
    }
    strong { font-weight: 700; }
  }

  &__caso-titulo {
    margin: 0;
    font-size: 0.87rem;
    font-weight: 700;
  }

  &__vacio {
    margin: 0;
    font-size: 0.82rem;
    font-style: italic;
    color: $text-secondary;
  }
}

@media (max-width: 640px) {
  .bsd__doc { padding: 1.1rem 1rem; }
}
</style>
