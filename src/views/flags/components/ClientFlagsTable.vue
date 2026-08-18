<script setup lang="ts">
import type { ClientFlags } from '@/services/flags.service'
import FlagBadge from './FlagBadge.vue'

defineProps<{ clientes: ClientFlags[]; loading: boolean }>()
</script>

<template>
  <section class="client-flags">
    <header class="client-flags__header">
      <h2 class="client-flags__title">
        <i class="fa-solid fa-flag" aria-hidden="true" />
        Banderas por cliente
      </h2>
      <p class="client-flags__hint">
        % de aprobación del periodo: 🟢 85–100 · 🟡 70–84 · 🔴 ≤69
      </p>
    </header>

    <div v-if="loading" class="client-flags__empty">Cargando clientes…</div>
    <div v-else-if="clientes.length === 0" class="client-flags__empty">
      Sin decisiones registradas en este periodo.
    </div>

    <div v-else class="client-flags__table-wrap">
      <table class="client-flags__table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contenido</th>
            <th>Edición</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cliente in clientes" :key="cliente.workspaceId">
            <td class="client-flags__name">
              {{ cliente.nombre }}
              <span v-if="!cliente.isActive" class="client-flags__inactive">inactivo</span>
            </td>
            <td><FlagBadge :stats="cliente.contenido" /></td>
            <td><FlagBadge :stats="cliente.edicion" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
.client-flags {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: $primary;
    }
  }

  &__hint {
    font-size: 0.8rem;
    color: $text-secondary;
  }

  &__empty {
    padding: 2rem 0;
    text-align: center;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  &__table-wrap {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;

    th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      color: $text-secondary;
      font-weight: 600;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid rgba($primary-dark, 0.08);
    }

    td {
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid rgba($primary-dark, 0.05);
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__name {
    font-weight: 600;
    color: $primary-dark;
  }

  &__inactive {
    margin-left: 0.4rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: $text-secondary;
    background: rgba($text-secondary, 0.1);
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
  }
}
</style>
