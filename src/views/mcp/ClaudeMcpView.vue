<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { mcpService, type MiConexionMcp } from '@/services/mcp.service'

const data = ref<MiConexionMcp | null>(null)
const cargando = ref(true)
const error = ref('')
const copiado = ref<'' | 'url' | 'comando'>('')
const desconectando = ref('')

const comando = computed(() => (data.value ? `claude mcp add --transport http bakano ${data.value.url}` : ''))
const lee = computed(() => data.value?.herramientas.filter((h) => !h.escribe) ?? [])
const hace = computed(() => data.value?.herramientas.filter((h) => h.escribe) ?? [])

function fecha(iso: string | null): string {
  if (!iso) return 'todavía no'
  return new Date(iso).toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    data.value = await mcpService.miConexion()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar tu conexión.'
  } finally {
    cargando.value = false
  }
}

async function copiar(que: 'url' | 'comando') {
  const texto = que === 'url' ? data.value?.url : comando.value
  if (!texto) return
  try {
    await navigator.clipboard.writeText(texto)
    copiado.value = que
    setTimeout(() => (copiado.value = ''), 1800)
  } catch {
    // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
  }
}

async function desconectar(id: string, app: string) {
  if (!confirm(`¿Desconectar ${app}? Tendrás que volver a entrar con tu correo desde esa app.`)) return
  desconectando.value = id
  try {
    await mcpService.desconectar(id)
    if (data.value) data.value.conexiones = data.value.conexiones.filter((c) => c.id !== id)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo desconectar.'
  } finally {
    desconectando.value = ''
  }
}

onMounted(cargar)
</script>

<template>
  <div class="mcp">
    <header class="mcp__head">
      <h1 class="mcp__title">Claude (MCP)</h1>
      <p class="mcp__sub">Usa Bakano desde Claude: pendientes, clientes, Telegram y fechas, según tu rol.</p>
    </header>

    <p v-if="cargando" class="mcp__vacio"><i class="fa-solid fa-spinner fa-spin" /> Cargando…</p>
    <p v-else-if="error && !data" class="mcp__error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</p>

    <template v-else-if="data">
      <section class="mcp__hero">
        <span class="mcp__perfil"><i class="fa-solid fa-user-shield" /> Tu perfil: {{ data.perfilNombre }}</span>
        <h2>Conéctalo una vez y pregúntale lo que necesites.</h2>
        <p>En Claude: Configuración → Conectores → Agregar conector personalizado. Nombre “Bakano” y esta dirección:</p>
        <div class="mcp__copia">
          <code>{{ data.url }}</code>
          <button type="button" @click="copiar('url')">
            <i :class="copiado === 'url' ? 'fa-solid fa-check' : 'fa-regular fa-copy'" />
            {{ copiado === 'url' ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <p class="mcp__nota">Entras con tu correo (te llega un enlace), sin contraseña.</p>
        <div class="mcp__acciones">
          <a :href="data.guia" target="_blank" rel="noopener" class="mcp__btn">
            <i class="fa-solid fa-book-open" /> Ver la guía completa
          </a>
          <button type="button" class="mcp__btn mcp__btn--ghost" @click="copiar('comando')">
            <i class="fa-solid fa-terminal" />
            {{ copiado === 'comando' ? 'Comando copiado' : 'Copiar comando para Claude Code' }}
          </button>
        </div>
      </section>

      <div class="mcp__grid">
        <section class="mcp__card">
          <h3><i class="fa-solid fa-wand-magic-sparkles" /> Lo que puedes pedirle</h3>
          <ul class="mcp__lista">
            <li v-for="h in lee" :key="h.nombre">{{ h.titulo }}</li>
          </ul>
          <template v-if="hace.length">
            <h4>Y con tu confirmación <span class="mcp__chip">Hace cambios</span></h4>
            <ul class="mcp__lista">
              <li v-for="h in hace" :key="h.nombre">{{ h.titulo }}</li>
            </ul>
          </template>
        </section>

        <section class="mcp__card">
          <h3><i class="fa-solid fa-plug" /> Tus conexiones</h3>
          <p v-if="!data.conexiones.length" class="mcp__vacio">Todavía no conectas ninguna app.</p>
          <ul v-else class="mcp__conexiones">
            <li v-for="c in data.conexiones" :key="c.id">
              <div>
                <strong>{{ c.app }}</strong>
                <span>Desde {{ fecha(c.desde) }} · último uso {{ fecha(c.ultimoUso) }}</span>
              </div>
              <button type="button" :disabled="desconectando === c.id" @click="desconectar(c.id, c.app)">
                Desconectar
              </button>
            </li>
          </ul>
          <p v-if="error" class="mcp__error">{{ error }}</p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.mcp {
  padding: 1.5rem;
  max-width: 980px;

  &__head { margin-bottom: 1.25rem; }
  &__title { font-size: 1.5rem; font-weight: 700; margin: 0; }
  &__sub { color: $text-secondary; margin: 0.25rem 0 0; font-size: 0.9rem; }
  &__vacio { color: $text-secondary; font-size: 0.9rem; }
  &__error { color: #b91c1c; font-size: 0.9rem; display: flex; gap: 0.4rem; align-items: center; }

  &__hero {
    position: relative;
    overflow: hidden;
    background: $primary-dark;
    color: $white;
    border-radius: 16px;
    padding: 1.75rem;
    margin-bottom: 1.25rem;

    &::before {
      content: '';
      position: absolute;
      width: 320px;
      height: 320px;
      top: -140px;
      right: -80px;
      border-radius: 50%;
      background: rgba($primary, 0.35);
      filter: blur(80px);
    }

    > * { position: relative; }
    h2 { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; margin: 0.9rem 0 0.4rem; }
    p { color: rgba($white, 0.7); font-size: 0.9rem; margin: 0; line-height: 1.55; }
  }

  &__perfil {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $primary;
    background: rgba($primary, 0.12);
    border: 1px solid rgba($primary, 0.3);
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
  }

  &__copia {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.9rem 0 0.6rem;
    max-width: 520px;
    padding: 0.35rem 0.35rem 0.35rem 0.9rem;
    border-radius: 12px;
    background: rgba($white, 0.06);
    border: 1.5px solid rgba($white, 0.14);

    code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; font-size: 0.85rem; color: $white; }

    button {
      flex-shrink: 0;
      display: inline-flex;
      gap: 0.4rem;
      align-items: center;
      border: 0;
      border-radius: 9px;
      padding: 0.5rem 0.8rem;
      background: $primary;
      color: $white;
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
    }
  }

  &__hero &__nota { font-size: 0.8rem; color: rgba($white, 0.5); }

  &__acciones { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.1rem; }

  &__btn {
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    padding: 0.65rem 1rem;
    border-radius: 10px;
    border: 0;
    background: $primary;
    color: $white;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: filter 0.15s ease, transform 0.15s ease;

    &:hover { filter: brightness(1.08); transform: translateY(-1px); }

    &--ghost { background: rgba($white, 0.08); border: 1px solid rgba($white, 0.16); }
  }

  &__grid { display: flex; flex-wrap: wrap; gap: 1.25rem; }

  &__card {
    flex: 1 1 320px;
    min-width: 0;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 16px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    padding: 1.25rem 1.4rem;

    h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem; display: flex; gap: 0.5rem; align-items: center; i { color: $primary; } }
    h4 { font-size: 0.85rem; font-weight: 700; margin: 1rem 0 0.5rem; display: flex; gap: 0.5rem; align-items: center; }
  }

  &__lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;

    li { font-size: 0.8rem; padding: 0.35rem 0.65rem; border-radius: 8px; background: #f8f7f5; color: $primary-dark; }
  }

  &__chip {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #b45309;
    background: rgba(#f59e0b, 0.14);
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
  }

  &__conexiones {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 0.9rem;
      border-radius: 12px;
      background: #f8f7f5;

      div { display: flex; flex-direction: column; min-width: 0; }
      strong { font-size: 0.9rem; }
      span { font-size: 0.78rem; color: $text-secondary; }
    }

    button {
      flex-shrink: 0;
      border: 1px solid rgba(#ef4444, 0.35);
      background: $white;
      color: #b91c1c;
      border-radius: 8px;
      padding: 0.4rem 0.7rem;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;

      &:disabled { opacity: 0.5; cursor: default; }
    }
  }
}
</style>
