<template>
  <div v-if="chartData && hasAnyData" class="chart-card">
    <div class="chart-card-header">
      <div class="chart-title">
        <i class="fa-solid fa-chart-area" />
        <h3>Facturación vs Inversión · {{ monthLabel }}</h3>
      </div>
    </div>
    <div class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { IMonthData } from '@/services/billing.service'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  monthData: IMonthData | null
  monthLabel: string
  hasAnyData: boolean
}>()

function dateStr(date: string): string { return date.substring(0, 10) }
function dayNumber(date: string) { return new Date(dateStr(date) + 'T12:00:00').getDate().toString() }
function dayName(date: string) { return new Date(dateStr(date) + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short' }) }

const chartData = computed(() => {
  if (!props.monthData?.days?.length) return null
  const sorted = [...props.monthData.days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  return {
    labels: sorted.map(d => `${dayName(d.date)} ${dayNumber(d.date)}`),
    datasets: [
      {
        label: 'Facturación',
        data: sorted.map(d => d.totalAmount),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Inversión Meta',
        data: sorted.map(d => d.totalMetaSpend),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 3,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
      ...(sorted.some(d => (d.totalOnlineRevenue ?? 0) > 0) ? [{
        label: 'Ventas Online',
        data: sorted.map(d => d.totalOnlineRevenue ?? 0),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        borderWidth: 2,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: false,
        borderDash: [5, 5],
      }] : []),
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { family: 'Inter, sans-serif', weight: '600' as const, size: 12 }, color: '#475569' },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#cbd5e1',
      bodyColor: '#fff',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter, sans-serif', size: 11, weight: '600' as const }, color: '#94a3b8' },
    },
    y: {
      grid: { color: '#f1f5f9', drawBorder: false },
      ticks: {
        callback: (val: any) => `$${Number(val).toLocaleString('es-EC')}`,
        font: { family: 'Inter, sans-serif', size: 11 },
        color: '#94a3b8',
      },
      border: { display: false },
    },
  },
}
</script>

<style scoped lang="scss">
.chart-card {
  background: $white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.chart-card-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;

  .chart-title {
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      color: $primary;
      font-size: 18px;
    }

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: $primary-dark;
      letter-spacing: -0.2px;
    }
  }
}

.chart-wrap {
  position: relative;
  height: 320px;
  width: 100%;
}
</style>
