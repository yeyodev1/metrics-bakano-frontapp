<script setup lang="ts">
import { computed } from 'vue'
import type { WorkspaceUser } from '@/types'

const props = defineProps<{
  users: WorkspaceUser[]
}>()

/**
 * El rol interno solo aplica al equipo de Bakano. En la vista de usuarios de
 * cuenta la columna salia con un guion en todas las filas: ocupaba ~150px de
 * ancho para no decir nada, y empujaba "Estado" fuera del borde de la tarjeta.
 */
const muestraRolInterno = computed(() =>
  props.users.some((u) => u.isInternal && u.internalRole)
)

const ROLES_INTERNOS: Record<string, string> = {
  director: 'Director',
  estratega: 'Estratega',
  project_manager: 'Project Manager',
  content_manager: 'Content Manager',
  account_manager: 'Account Manager',
  community_manager: 'Community Manager',
  productor: 'Productor',
  asistente_produccion: 'Asistente de Producción',
  editor: 'Editor',
  disenador: 'Diseñador',
  copywriter: 'Copywriter',
  analista: 'Analista',
  desarrollador: 'Desarrollador',
  trafficker: 'Trafficker',
}

function fechaCorta(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric', month: 'short' })
}

const emit = defineEmits<{
  (e: 'edit-user', user: WorkspaceUser): void
  (e: 'resend-invite', user: WorkspaceUser): void
  (e: 'delete-user', user: WorkspaceUser): void
  (e: 'invitar-bot', user: WorkspaceUser): void
}>()
</script>

<template>
  <div class="superadmin-dashboard__user-table-container">
    <table class="superadmin-dashboard__user-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th v-if="muestraRolInterno">Rol interno</th>
          <th>Cuenta</th>
          <th>Bot</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user._id">
          <td>
            <div class="superadmin-dashboard__user-identity">
              <div class="superadmin-dashboard__user-name-wrapper">
                <strong>{{ user.name || 'Sin nombre' }}</strong>
                <span v-if="user.isInternal" class="superadmin-dashboard__internal-badge">
                  <i class="fa-solid fa-shield-halved" />
                  Bakano Team
                </span>
              </div>
              <span>{{ user.email }}</span>
            </div>
          </td>
          <td v-if="muestraRolInterno">
            <span
              v-if="user.isInternal && user.internalRole"
              class="superadmin-dashboard__internal-role-chip"
            >
              {{ ROLES_INTERNOS[user.internalRole] || user.internalRole }}
            </span>
            <span v-else class="superadmin-dashboard__no-role">—</span>
          </td>
          <td>
            <div class="superadmin-dashboard__user-workspaces">
              <template v-if="user.workspaces?.length">
                <div
                  v-for="ws in user.workspaces.slice(0, 3)"
                  :key="ws.workspaceId?._id"
                  class="superadmin-dashboard__ws-tag"
                >
                  {{ ws.workspaceId?.name || '---' }}
                  <small>{{ ws.role === 'admin' ? 'Adm' : 'Col' }}</small>
                </div>
                <button
                  v-if="user.workspaces.length > 3"
                  class="superadmin-dashboard__ws-more"
                  :title="user.workspaces.slice(3).map((w: any) => w.workspaceId?.name || '---').join(', ')"
                >
                  +{{ user.workspaces.length - 3 }}
                </button>
              </template>
              <span v-else class="superadmin-dashboard__ws-tag superadmin-dashboard__ws-tag--none">
                Sin entornos
              </span>
            </div>
          </td>
          <td>
            <!-- Desde que el flujo pasa por Telegram, esto se mira tanto como
                 el estado de la cuenta: si no conectó el bot, no se entera de nada. -->
            <span
              v-if="(user as any).isInternal"
              class="bot-chip bot-chip--na"
              title="El bot es para clientes"
            >—</span>
            <span
              v-else-if="(user as any).botConectado"
              class="bot-chip bot-chip--ok"
              title="Ya conectó su Telegram con Metrics"
            ><i class="fa-brands fa-telegram" /> Conectado</span>
            <span
              v-else-if="(user as any).presentacionBotEnviadaEn"
              class="bot-chip bot-chip--pend"
              :title="`Invitación enviada el ${fechaCorta((user as any).presentacionBotEnviadaEn)}, todavía sin conectar`"
            >Invitado</span>
            <span v-else class="bot-chip bot-chip--sin" title="Todavía no se le envió la invitación">Sin invitar</span>
          </td>
          <td>
            <span class="superadmin-dashboard__status-chip" :class="{ 'superadmin-dashboard__status-chip--active': user.isActive }">
              {{ user.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td>
            <div class="superadmin-dashboard__actions">
              <button class="superadmin-dashboard__action-btn" @click="emit('edit-user', user)" title="Editar">
                <i class="fa-solid fa-pen" />
              </button>
              <button class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--invite" @click="emit('resend-invite', user)" title="Reenviar invitación">
                <i class="fa-solid fa-paper-plane" />
              </button>
              <button
                v-if="!(user as any).isInternal"
                class="superadmin-dashboard__action-btn bot-btn"
                :title="(user as any).presentacionBotEnviadaEn ? 'Volver a enviar la invitación al bot' : 'Enviar la invitación al bot'"
                @click="emit('invitar-bot', user)"
              >
                <i class="fa-brands fa-telegram" />
              </button>
              <button class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--danger" @click="emit('delete-user', user)" title="Eliminar">
                <i class="fa-solid fa-trash-can" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.bot-btn { color: #2aabee; }

/* Estado del bot por persona. Colores por significado, no por decoración:
   verde ya está adentro, ámbar le llegó y no entró, gris ni se enteró. */
.bot-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;

  &--ok {
    background: rgba(47, 125, 93, 0.12);
    color: #2f7d5d;
    border-color: rgba(47, 125, 93, 0.3);
  }

  &--pend {
    background: rgba(180, 103, 26, 0.12);
    color: #b4671a;
    border-color: rgba(180, 103, 26, 0.3);
  }

  &--sin {
    background: rgba(100, 100, 110, 0.1);
    color: #6b6b78;
    border-color: rgba(100, 100, 110, 0.25);
  }

  &--na {
    background: transparent;
    color: #a0a0aa;
  }
}

.superadmin-dashboard__user-table-container {
  // min-width: 0 es lo que permite encoger dentro de un contenedor flex; sin
  // el, overflow-x no llegaba a activarse y la columna Estado quedaba cortada
  // contra el borde de la tarjeta en vez de poder desplazarse.
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  margin-top: 1.5rem;
}

.superadmin-dashboard__user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th {
    text-align: left;
    padding: 1rem;
    background: rgba($primary-dark, 0.02);
    color: $text-secondary;
    font-weight: 600;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid rgba($primary-dark, 0.03);
  }
}

.superadmin-dashboard__user-identity {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  span {
    color: $text-secondary;
    font-size: 0.85rem;
  }
}

.superadmin-dashboard__user-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  strong {
    color: $primary-dark;
    font-size: 0.95rem;
  }
}

.superadmin-dashboard__internal-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);
  color: $primary;
  border: 1px solid rgba($primary, 0.2);
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  i {
    font-size: 0.75rem;
  }
}

.superadmin-dashboard__internal-role-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  background: linear-gradient(135deg, rgba($secondary, 0.1) 0%, rgba($secondary, 0.06) 100%);
  color: darken($secondary, 10%);
  border: 1px solid rgba($secondary, 0.25);
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.superadmin-dashboard__no-role {
  color: rgba($primary-dark, 0.25);
  font-size: 0.9rem;
}

.superadmin-dashboard__user-workspaces {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.superadmin-dashboard__ws-tag {
  padding: 0.25rem 0.6rem;
  background: rgba($primary, 0.08);
  color: $primary;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  small {
    opacity: 0.7;
    font-weight: 400;
    margin-left: 0.2rem;
  }

  &--none {
    background: rgba($text-secondary, 0.1);
    color: $text-secondary;
  }
}

.superadmin-dashboard__status-chip {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba($primary-dark, 0.06);
  color: $text-secondary;

  &--active {
    background: rgba($BAKANO-GREEN, 0.1);
    color: $BAKANO-GREEN;
  }
}

.superadmin-dashboard__actions {
  display: flex;
  gap: 0.5rem;
}

.superadmin-dashboard__action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba($primary-dark, 0.05);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &--invite:hover {
    background: rgba(#6d28d9, 0.1);
    color: #6d28d9;
  }
}

.superadmin-dashboard__ws-more {
  padding: 0.2rem 0.5rem;
  background: rgba($primary, 0.12);
  color: $primary;
  border: 1px solid rgba($primary, 0.2);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: default;
  white-space: nowrap;
  position: relative;

  &:hover::after {
    content: attr(title);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: $primary-dark;
    color: white;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 11px;
    white-space: normal;
    max-width: 260px;
    text-align: center;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: none;
  }
}
</style>
