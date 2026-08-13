import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from '@/stores/user'
import { useViewAsStore } from '@/stores/viewAs'
import { useSoundStore } from '@/stores/sound'
import { initSound } from '@/plugins/sound'
import '@/styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Restore session from localStorage before any route guard fires
useUserStore().hydrate()

// Sound preference must be applied before the first cue can fire.
useSoundStore().hydrate()

// "Ver como" sobrevive al refresco: si no, se pierde en cada recarga y el aviso
// del menú no cuadraría con lo que se está viendo.
useViewAsStore().hidratar()

app.mount('#app')

// Annotate after mount so the initial tree is already in the DOM.
initSound()
