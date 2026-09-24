<script setup lang="ts">
/**
 * Aviso de que el bot de Telegram ya está disponible.
 *
 * No se cierra solo ni se guarda en el navegador: el cliente tiene que tocar
 * "Ya lo vi" y eso queda en su usuario. Un aviso que se cierra solo es un
 * aviso que nadie leyó, y aquí lo que importa es saber quién se enteró.
 */
import { computed, onMounted, ref } from 'vue'
import { authService } from '@/services/auth.service'
import { useUserStore } from '@/stores/user'

const BOT_URL = 'https://t.me/BakanoAgencyBot'

const userStore = useUserStore()
const visto = ref(true)
const guardando = ref(false)

const correo = computed(() => userStore.email || '')

onMounted(async () => {
  // Solo al cliente: el equipo interno ya lo conoce.
  if (userStore.isInternal || userStore.role === 'superadmin') return
  try {
    const { user } = await authService.me()
    visto.value = Boolean((user as any)?.avisoBotVistoEn)
  } catch {
    visto.value = true
  }
})

async function marcarVisto(): Promise<void> {
  guardando.value = true
  try {
    await authService.marcarAvisoBotVisto()
    visto.value = true
  } catch {
    // Si falla, se queda visible: es preferible repetirlo a perderlo.
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div v-if="!visto" class="aviso-bot">
    <div class="aviso-bot__icono"><i class="fa-brands fa-telegram" /></div>

    <div class="aviso-bot__texto">
      <p class="aviso-bot__titulo">Ahora puedes hablar con Bakano por Telegram</p>
      <p class="aviso-bot__detalle">
        Tus citas, tus guiones, agendar tu producción, registrar tu facturación o escribirle a tu
        equipo: todo por chat, sin entrar aquí a buscarlo.
        <span v-if="correo">Entras con tu correo <strong>{{ correo }}</strong> y un código de 6 números.</span>
      </p>
    </div>

    <div class="aviso-bot__acciones">
      <a class="aviso-bot__btn" :href="BOT_URL" target="_blank" rel="noopener">
        <i class="fa-brands fa-telegram" /> Abrir el chat
      </a>
      <button class="aviso-bot__btn aviso-bot__btn--plano" :disabled="guardando" @click="marcarVisto">
        {{ guardando ? 'Guardando…' : 'Ya lo vi' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.aviso-bot {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.9rem 1.25rem;
  background: linear-gradient(135deg, #e6285c 0%, #85529c 100%);
  color: #fff;

  &__icono {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.18);
    font-size: 1.25rem;
  }

  &__texto {
    flex: 1 1 320px;
    min-width: 0;
  }

  &__titulo {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
  }

  &__detalle {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.92);
  }

  &__acciones {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 1rem;
    border: 1.5px solid rgba(255, 255, 255, 0.45);
    border-radius: 10px;
    background: #fff;
    color: #e6285c;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;

    &--plano {
      background: transparent;
      color: #fff;
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }
}
</style>
