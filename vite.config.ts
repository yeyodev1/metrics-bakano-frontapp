import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'

function generateVersion() {
  return {
    name: 'generate-version',
    buildStart() {
      const dir = './public'
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync('./public/version.json', JSON.stringify({ version: Date.now() }))
    }
  }
}

export default defineConfig({
  plugins: [vue(), generateVersion()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/index.scss" as *;`,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // El punto inicial = cualquier subdominio de bakano.ec. Así un túnel nuevo
    // no obliga a tocar este archivo.
    allowedHosts: [".bakano.ec"],
  },
  build: {
    target: 'esnext',
  },
})
