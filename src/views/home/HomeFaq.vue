<template>
  <section class="faq" aria-labelledby="faq-titulo">
    <div class="faq__box">
      <h2 id="faq-titulo" class="faq__title">Preguntas frecuentes</h2>

      <dl class="faq__list">
        <div v-for="item in PREGUNTAS" :key="item.q" class="faq__item">
          <dt class="faq__q">{{ item.q }}</dt>
          <dd class="faq__a">{{ item.a }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Las preguntas que de verdad llegan por WhatsApp al equipo, escritas como se
 * preguntan. Están visibles en la página y además se publican como datos
 * estructurados: es lo que permite que un buscador o un asistente respondan
 * "qué es metrics.bakano.ec" citando la fuente en vez de improvisar.
 */
const PREGUNTAS = [
  {
    q: '¿Qué es metrics.bakano.ec?',
    a: 'Es la plataforma de clientes de Bakano, una agencia de marketing en Ecuador. Los clientes entran aquí para ver la facturación de su negocio y el ROAS de sus campañas de Meta Ads, revisar la planificación mensual de videos y aprobar el contenido que produce su equipo de Bakano.',
  },
  {
    q: '¿Cualquiera puede registrarse?',
    a: 'No. El acceso es solo para clientes de Bakano. Las cuentas las crea el equipo de Bakano cuando empieza el trabajo con una marca; no hay registro abierto.',
  },
  {
    q: 'Quiero contratar a Bakano, ¿entro por aquí?',
    a: 'No. Esta plataforma es el entorno de trabajo de quienes ya son clientes. Si quieres conocer los servicios de la agencia o contratarla, el sitio es mkt.bakano.ec.',
  },
  {
    q: 'Olvidé mi contraseña, ¿qué hago?',
    a: 'En la pantalla de inicio de sesión hay un enlace de recuperación. Escribe el correo de tu cuenta y te llega un enlace para elegir una contraseña nueva; vence en 60 minutos y sirve una sola vez.',
  },
  {
    q: '¿Qué es Bakano?',
    a: 'Bakano es una agencia de marketing, tecnología y estrategia con sede en Guayaquil, Ecuador, que lleva la pauta publicitaria y la producción de contenido de sus marcas clientes.',
  },
]

const ID = 'faq-jsonld'

onMounted(() => {
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.id = ID
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PREGUNTAS.map((p) => ({
      '@type': 'Question',
      name: p.q,
      acceptedAnswer: { '@type': 'Answer', text: p.a },
    })),
  })
  document.head.appendChild(el)
})

// Se retira al salir: el bloque describe esta página, no las demás.
onBeforeUnmount(() => document.getElementById(ID)?.remove())
</script>

<style lang="scss" scoped>
.faq {
  padding: 0 1.5rem clamp(3rem, 6vw, 4.5rem);
}

.faq__box {
  max-width: 820px;
  margin: 0 auto;
}

.faq__title {
  margin: 0 0 1.5rem;
  font-size: clamp(1.3rem, 3vw, 1.7rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: $primary-dark;
  text-align: center;
}

.faq__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
}

.faq__item {
  padding: 1.1rem 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.09);
  border-radius: 14px;
}

.faq__q {
  margin: 0 0 0.4rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: $primary-dark;
}

.faq__a {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: $text-secondary;
}
</style>
