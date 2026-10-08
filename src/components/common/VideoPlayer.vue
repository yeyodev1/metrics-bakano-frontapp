<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { drivePreviewUrl, esVideoDirecto } from '@/utils/driveVideo'

/**
 * Reproduce el video dentro de metrics. Recibe los links en orden de
 * preferencia (ej. linkVideo y luego driveLink) y usa el primero que se pueda
 * reproducir: archivo directo con <video>, o Drive con su reproductor
 * embebido. Si el archivo directo falla, pasa al siguiente link.
 *
 * El contenedor decide el tamaño: el reproductor llena el 100% del padre.
 */
const props = defineProps<{ links: (string | null | undefined)[] }>()

const fallidos = ref(new Set<string>())
watch(() => props.links.join('|'), () => { fallidos.value = new Set() })

const fuente = computed<{ tipo: 'video' | 'drive'; url: string } | null>(() => {
  for (const link of props.links) {
    if (!link || fallidos.value.has(link)) continue
    if (esVideoDirecto(link)) return { tipo: 'video', url: link }
    const preview = drivePreviewUrl(link)
    if (preview) return { tipo: 'drive', url: preview }
  }
  return null
})

/** Si nada se puede embeber, al menos un link para abrirlo afuera. */
const enlaceExterno = computed(() => props.links.find((l) => !!l) || null)

function marcarFallo(url: string) {
  fallidos.value = new Set([...fallidos.value, url])
}
</script>

<template>
  <div class="vp">
    <video
      v-if="fuente?.tipo === 'video'"
      :key="fuente.url"
      :src="fuente.url"
      controls
      playsinline
      preload="metadata"
      class="vp__media"
      @error="marcarFallo(fuente.url)"
    />
    <iframe
      v-else-if="fuente?.tipo === 'drive'"
      :key="fuente.url"
      :src="fuente.url"
      class="vp__media vp__media--frame"
      allow="autoplay; fullscreen"
      allowfullscreen
      loading="lazy"
      title="Reproductor de video"
    />
    <div v-else class="vp__vacio">
      <i class="fa-solid fa-film" />
      <span>Sin preview reproducible</span>
      <a v-if="enlaceExterno" :href="enlaceExterno" target="_blank" rel="noopener">Abrir el enlace</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vp {
  width: 100%;
  height: 100%;
  background: $primary-dark;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vp__media {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;

  &--frame { border: 0; }
}

.vp__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: rgba($white, 0.55);
  font-size: 0.8rem;

  i { font-size: 1.4rem; }
  a { color: #6ee7b7; font-weight: 700; font-size: 0.78rem; }
}
</style>
