<script setup lang="ts">
/**
 * Contrato modelo para leer antes de contratar. Sin login, sin datos de nadie
 * y sin firma: el prospecto lo revisa con calma y, si tiene dudas, pregunta.
 * El texto sale del servidor, el mismo con el que se arma el PDF que firmará.
 */
import { ref, onMounted } from 'vue'
import { onboardingService } from '@/services/onboarding.service'
import { apiBaseUrl } from '@/config/api'
import type { TextoContrato } from '@/types'

const contrato = ref<(TextoContrato & { version: number }) | null>(null)
const cargando = ref(true)
const error = ref(false)
const pdfUrl = `${apiBaseUrl()}/contrato/modelo.pdf`
const BOT_URL = 'https://t.me/BakanoAgencyBot'

onMounted(async () => {
  try {
    contrato.value = await onboardingService.contratoModelo()
  } catch {
    error.value = true
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <div class="modelo">
    <header class="modelo__cabeza">
      <img src="/email/bakano-logo-dark.png" alt="Bakano" class="modelo__logo" width="120" />
      <a class="modelo__pdf" :href="pdfUrl" target="_blank" rel="noopener">
        <i class="fa-solid fa-file-pdf" /> Descargar PDF
      </a>
    </header>

    <main class="modelo__caja">
      <p class="modelo__etiqueta"><i class="fa-solid fa-file-contract" /> Contrato de servicios</p>
      <h1 class="modelo__titulo">Revisa nuestro contrato antes de empezar</h1>
      <p class="modelo__intro">
        Es el mismo contrato que firmarás. Tus datos (nombre o razón social, RUC e inversión en anuncios)
        se completan cuando contratas, y lo firmas en línea con el dedo.
      </p>

      <div v-if="cargando" class="modelo__skel">
        <span v-for="n in 6" :key="n" class="skel" />
      </div>
      <p v-else-if="error" class="modelo__error">
        No pudimos cargar el contrato. <a :href="pdfUrl" target="_blank" rel="noopener">Descárgalo en PDF</a>.
      </p>
      <article v-else-if="contrato" class="modelo__texto">
        <h2>{{ contrato.titulo }}</h2>
        <section v-for="c in contrato.clausulas" :key="c.titulo" class="modelo__clausula">
          <h3>{{ c.titulo }}</h3>
          <p>{{ c.texto }}</p>
        </section>
      </article>

      <aside class="modelo__dudas">
        <i class="fa-solid fa-circle-question" />
        <div>
          <strong>¿Dudas sobre alguna cláusula?</strong>
          <p>Escríbenos y te la explicamos antes de firmar.</p>
        </div>
        <a class="modelo__boton" :href="BOT_URL" target="_blank" rel="noopener">
          <i class="fa-brands fa-telegram" /> Escribir a Bakano
        </a>
      </aside>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.modelo {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f5ff 0%, #f0ebff 60%, #e8e0ff 100%);
  padding: 1.25rem 1rem 3rem;
  font-family: 'Inter', system-ui, sans-serif;

  &__cabeza {
    max-width: 860px;
    margin: 0 auto 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__logo { height: auto; }

  &__pdf {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: $white;
    color: $secondary;
    border: 1px solid rgba($text-secondary, 0.2);
    border-radius: 10px;
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
  }

  &__caja {
    max-width: 860px;
    margin: 0 auto;
    background: $white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 16px 40px rgba(25, 20, 35, 0.06);
    display: grid;
    gap: 1rem;

    @media (max-width: 640px) { padding: 1.25rem; border-radius: 16px; }
  }

  &__etiqueta {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $secondary;

    i { margin-right: 0.3rem; }
  }

  &__titulo {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: $primary-dark;
    text-wrap: balance;
  }

  &__intro {
    margin: 0;
    color: $text-secondary;
    line-height: 1.6;
  }

  &__texto {
    border-top: 1px solid rgba($text-secondary, 0.15);
    padding-top: 1rem;

    h2 {
      margin: 0 0 1rem;
      font-size: 1rem;
      text-align: center;
      color: $primary-dark;
    }
  }

  &__clausula {
    margin-bottom: 1.1rem;

    h3 {
      margin: 0 0 0.3rem;
      font-size: 0.9rem;
      color: $primary-dark;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.65;
      color: #374151;
      white-space: pre-line;
    }
  }

  &__dudas {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
    background: $primary-light;
    border-radius: 14px;
    padding: 1rem 1.1rem;

    > i { font-size: 1.4rem; color: $secondary; }
    div { flex: 1; min-width: 200px; }
    strong { color: $primary-dark; }
    p { margin: 0.15rem 0 0; font-size: 0.88rem; color: $text-secondary; }
  }

  &__boton {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(135deg, $primary, $secondary);
    color: $white;
    border-radius: 11px;
    padding: 0.65rem 1.1rem;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
  }

  &__error { color: $alert-error; }

  &__skel {
    display: grid;
    gap: 0.6rem;
  }
}

.skel {
  display: block;
  height: 56px;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(133, 82, 156, 0.08) 25%, rgba(133, 82, 156, 0.16) 50%, rgba(133, 82, 156, 0.08) 75%);
  background-size: 200% 100%;
  animation: brillo 1.2s ease-in-out infinite;
}

@keyframes brillo {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
