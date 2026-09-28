<script setup lang="ts">
/**
 * Firmar en un solo paso: dibuja con el dedo, escribe su nombre y firma.
 *
 * Antes había que marcar una casilla para que se habilitara la firma y luego
 * pasar por una "previsualización" antes de confirmar. Eran dos pasos que no
 * agregaban nada: el contrato completo se lee aquí mismo, y al firmar ya dice
 * a qué correo le llega.
 */
import { ref, computed, type PropType } from 'vue'
import SignaturePad from '@/components/common/SignaturePad.vue'
import type { TextoContrato } from '@/types'

const props = defineProps({
  contractData: { type: Object, required: true },
  contrato: { type: Object as PropType<TextoContrato | null>, default: null },
  pdfUrl: { type: String, required: true },
  isSubmitting: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'firmar', payload: { signatureBase64: string; nombreFirmado: string; correoEnvio: string }): void
}>()

const signaturePadRef = ref<InstanceType<typeof SignaturePad> | null>(null)
const hasDrawnSignature = ref(false)
const nombre = ref('')
const verContrato = ref(false)

const correo = ref(String(props.contractData.email || ''))
const editandoCorreo = ref(false)
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const correoValido = computed(() => CORREO_RE.test(correo.value.trim()))

const nombreCoincide = computed(() => {
  const objetivo = String(props.contractData.representanteCliente || '').replace(/\s+/g, '').toLowerCase()
  return Boolean(objetivo) && nombre.value.replace(/\s+/g, '').toLowerCase() === objetivo
})

const pautaTexto = computed(() => {
  const n = Number(props.contractData.presupuestoPauta)
  return n > 0 ? `$${n.toLocaleString('en-US')} al mes` : '—'
})

/** Lo que falta, en palabras, para que el botón no sea un misterio. */
const queFalta = computed(() => {
  const faltan: string[] = []
  if (!hasDrawnSignature.value) faltan.push('dibujar tu firma')
  if (!nombreCoincide.value) faltan.push(`escribir tu nombre: ${props.contractData.representanteCliente || ''}`)
  if (!correoValido.value) faltan.push('un correo válido')
  return faltan
})

function limpiarFirma() {
  signaturePadRef.value?.clear()
  hasDrawnSignature.value = false
}

function firmar() {
  if (queFalta.value.length || props.isSubmitting) return
  emit('firmar', {
    signatureBase64: signaturePadRef.value?.getSignatureImage() || '',
    nombreFirmado: nombre.value.trim(),
    correoEnvio: correo.value.trim().toLowerCase(),
  })
}
</script>

<template>
  <div class="contrato">
    <header class="contrato__cabeza">
      <h1 class="contrato__titulo">Firma tu contrato</h1>
      <p class="contrato__sub">Dibuja tu firma, escribe tu nombre y listo. Te llega firmado a tu correo al instante.</p>
    </header>

    <!-- Los datos vienen del chat de Telegram: aquí solo se muestran. -->
    <dl class="contrato__datos">
      <div><dt>Contratas con</dt><dd>{{ contractData.razonSocialBakano }} · RUC {{ contractData.rucBakano }}</dd></div>
      <div><dt>A nombre de</dt><dd>{{ contractData.nombreCliente }} · {{ contractData.rucCliente }}</dd></div>
      <div><dt>Representante legal</dt><dd>{{ contractData.representanteCliente }}</dd></div>
      <div><dt>Inversión en anuncios</dt><dd>{{ pautaTexto }} <span class="contrato__nota">sin impuestos, mínimo $300</span></dd></div>
    </dl>

    <div class="contrato__leer">
      <button type="button" class="contrato__link" @click="verContrato = !verContrato">
        <i class="fa-solid" :class="verContrato ? 'fa-chevron-up' : 'fa-file-lines'" />
        {{ verContrato ? 'Ocultar el contrato' : 'Leer el contrato completo' }}
      </button>
      <a class="contrato__link" :href="pdfUrl" target="_blank" rel="noopener">
        <i class="fa-solid fa-file-pdf" /> Descargar PDF
      </a>
    </div>
    <div v-if="verContrato" class="contrato__texto">
      <template v-if="contrato">
        <h3>{{ contrato.titulo }}</h3>
        <p v-for="c in contrato.clausulas" :key="c.titulo">
          <strong>{{ c.titulo }}</strong><br />{{ c.texto }}
        </p>
      </template>
      <p v-else>No pudimos cargar el texto aquí. Descarga el PDF para leerlo.</p>
    </div>

    <section class="contrato__firma">
      <div class="contrato__paso">
        <div class="contrato__paso-cabeza">
          <label><span class="contrato__num">1</span> Dibuja tu firma con el dedo</label>
          <button v-if="hasDrawnSignature" type="button" class="contrato__borrar" @click="limpiarFirma">
            <i class="fa-solid fa-rotate-left" /> Borrar
          </button>
        </div>
        <SignaturePad ref="signaturePadRef" v-model="hasDrawnSignature" />
      </div>

      <div class="contrato__paso">
        <label for="nombre-firma"><span class="contrato__num">2</span> Escribe tu nombre: <strong>{{ contractData.representanteCliente }}</strong></label>
        <div class="contrato__campo" :class="{ 'is-ok': nombreCoincide }">
          <input
            id="nombre-firma"
            v-model="nombre"
            type="text"
            autocomplete="name"
            :placeholder="contractData.representanteCliente"
          />
          <i v-if="nombreCoincide" class="fa-solid fa-circle-check" />
        </div>
      </div>

      <div class="contrato__correo">
        <i class="fa-solid fa-envelope" />
        <template v-if="!editandoCorreo">
          <span>Te llega firmado a <strong>{{ correo }}</strong></span>
          <button type="button" class="contrato__link" @click="editandoCorreo = true">Cambiar</button>
        </template>
        <template v-else>
          <input v-model="correo" type="email" autocomplete="email" class="contrato__correo-input" @keyup.enter="editandoCorreo = !correoValido" />
          <button type="button" class="contrato__link" :disabled="!correoValido" @click="editandoCorreo = false">Listo</button>
        </template>
      </div>

      <button type="button" class="contrato__boton" :disabled="!!queFalta.length || isSubmitting" @click="firmar">
        <i class="fa-solid" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-signature'" />
        {{ isSubmitting ? 'Firmando y enviando…' : 'Firmar contrato' }}
      </button>
      <p v-if="queFalta.length" class="contrato__falta">Te falta {{ queFalta.join(', ') }}.</p>
      <p v-else class="contrato__legal">Al firmar aceptas el contrato de prestación de servicios con Bakano.</p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.contrato {
  display: grid;
  gap: 1.25rem;

  &__titulo {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: $primary-dark;
  }

  &__sub {
    margin: 0.35rem 0 0;
    color: $text-secondary;
    line-height: 1.55;
  }

  &__datos {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;

    div {
      background: $primary-light;
      border-radius: 12px;
      padding: 0.7rem 0.9rem;
    }

    dt {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $text-secondary;
    }

    dd {
      margin: 0.2rem 0 0;
      font-weight: 600;
      color: $primary-dark;
      overflow-wrap: anywhere;
    }
  }

  &__nota {
    display: block;
    font-size: 0.75rem;
    font-weight: 400;
    color: $text-secondary;
  }

  &__leer {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  &__link {
    background: none;
    border: none;
    padding: 0;
    color: $secondary;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &:disabled { opacity: 0.5; cursor: default; }
  }

  &__texto {
    max-height: 340px;
    overflow-y: auto;
    border: 1px solid rgba($text-secondary, 0.2);
    border-radius: 12px;
    padding: 1rem 1.1rem;
    font-size: 0.85rem;
    line-height: 1.6;
    color: #374151;
    white-space: pre-line;

    h3 { margin: 0 0 0.75rem; font-size: 0.95rem; }
  }

  &__firma {
    display: grid;
    gap: 1rem;
    border-top: 1px solid rgba($text-secondary, 0.15);
    padding-top: 1.25rem;
  }

  &__paso {
    display: grid;
    gap: 0.5rem;

    label { font-weight: 600; color: $primary-dark; }
  }

  &__paso-cabeza {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__num {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    margin-right: 0.35rem;
    border-radius: 50%;
    background: $secondary;
    color: $white;
    font-size: 0.75rem;
    font-weight: 800;
  }

  &__borrar {
    background: none;
    border: none;
    color: $text-secondary;
    font-size: 0.85rem;
    cursor: pointer;
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
  }

  &__campo {
    position: relative;

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.8rem 2.5rem 0.8rem 0.9rem;
      border: 1.5px solid rgba($text-secondary, 0.3);
      border-radius: 12px;
      font-size: 1rem;

      &:focus { outline: none; border-color: $secondary; }
    }

    i {
      position: absolute;
      right: 0.9rem;
      top: 50%;
      transform: translateY(-50%);
      color: $alert-success;
    }

    &.is-ok input { border-color: $alert-success; }
  }

  &__correo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    background: $alert-info-bg;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    color: $primary-dark;
    font-size: 0.92rem;

    > i { color: $alert-info; }
    strong { overflow-wrap: anywhere; }
  }

  &__correo-input {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem 0.7rem;
    border: 1.5px solid rgba($text-secondary, 0.3);
    border-radius: 9px;
    font-size: 0.95rem;
  }

  &__boton {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.95rem 1.4rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, $primary, $secondary);
    color: $white;
    font-size: 1.05rem;
    font-weight: 800;
    cursor: pointer;

    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &__falta,
  &__legal {
    margin: -0.4rem 0 0;
    text-align: center;
    font-size: 0.82rem;
    color: $text-secondary;
  }
}
</style>
