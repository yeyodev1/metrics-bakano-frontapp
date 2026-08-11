<template>
  <!-- Se controla con hasLoaded y no con `loading`: AppLayout remonta la vista
       en cada navegación y un chequeo sobre `loading` deja el skeleton eterno. -->
  <ResourcesSkeleton v-if="!res.hasLoaded.value" />

  <div v-else class="rv">
    <ResourcesHeader :total="res.total.value" :missing="res.missing.value" />

    <ResourceSection
      categoria="logo"
      title="Logo"
      description="La marca en sus versiones oficiales."
      icon="fa-solid fa-shapes"
      drop-title="Arrastra el logo o haz clic"
      hint="PNG, JPG, WEBP, SVG o AVIF · hasta 25 MB"
      empty-text="Todavía no hay ningún logo cargado."
      :items="res.logos.value"
      :busy="res.uploading.value === 'logo'"
      @file="res.upload($event, 'logo')"
      @view="viewing = $event"
      @remove="confirmRemove"
    />

    <ResourceSection
      categoria="linea_grafica"
      title="Línea gráfica"
      description="Colores, tipografías y ejemplos de piezas."
      icon="fa-solid fa-palette"
      drop-title="Arrastra el manual o haz clic"
      hint="Imágenes o PDF · hasta 25 MB"
      empty-text="Sin manual de marca, colores ni tipografías."
      :items="res.lineas.value"
      :busy="res.uploading.value === 'linea_grafica'"
      @file="res.upload($event, 'linea_grafica')"
      @view="viewing = $event"
      @remove="confirmRemove"
    />

    <ResourceSection
      categoria="catalogo"
      title="Catálogo"
      description="Qué vende la marca, con precios y nombres reales."
      icon="fa-solid fa-book"
      drop-title="Arrastra el catálogo o haz clic"
      hint="Imágenes o PDF · hasta 25 MB"
      empty-text="Sin catálogo, la IA no sabe qué vende la marca."
      :items="res.catalogs.value"
      :busy="res.uploading.value === 'catalogo'"
      @file="res.upload($event, 'catalogo')"
      @view="viewing = $event"
      @remove="confirmRemove"
    >
      <!-- Dentro de la sección, no como caja aparte: escribirlo a mano es otra
           forma de cargar el catálogo, no un tema distinto. -->
      <CatalogTextPanel
        ref="catalogPanel"
        :saving="res.savingText.value"
        @save="handleSaveText"
      />
    </ResourceSection>

    <ResourceViewerModal :resource="viewing" @close="viewing = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'
import ResourcesHeader from './components/ResourcesHeader.vue'
import ResourcesSkeleton from './components/ResourcesSkeleton.vue'
import ResourceSection from './components/ResourceSection.vue'
import CatalogTextPanel from './components/CatalogTextPanel.vue'
import ResourceViewerModal from './components/ResourceViewerModal.vue'
import { useResources } from './useResources'
import type { Resource } from '@/types'

const route = useRoute()
const { confirm } = useConfirm()

const workspaceId = computed(() => route.params.workspaceId as string)
const res = useResources(workspaceId)

const viewing = ref<Resource | null>(null)
const catalogPanel = ref<InstanceType<typeof CatalogTextPanel> | null>(null)

/** Borrar es irreversible y el archivo puede ser el único logo de la marca. */
async function confirmRemove(resource: Resource) {
  const ok = await confirm({
    title: 'Eliminar recurso',
    message: `Se eliminará "${resource.nombre}" de forma permanente. ¿Continuar?`,
    confirmText: 'Eliminar',
  })
  if (ok) await res.remove(resource)
}

/** El texto solo se limpia si de verdad se guardó. */
async function handleSaveText(text: string) {
  const saved = await res.saveCatalogText(text)
  if (saved) catalogPanel.value?.reset()
}
</script>

<style scoped lang="scss">
.rv {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  padding: 1.5rem;
}
</style>
