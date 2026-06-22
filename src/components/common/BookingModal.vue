<script setup lang="ts">
import { ref } from 'vue'
import carlosPhoto from '@/assets/team/carlos.jpg'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

type Expert = 'soporte' | 'meta' | 'ventas' | null
const selected = ref<Expert>(null)

const fallbackImg = ref<Record<string, boolean>>({})

const experts = [
  {
    key: 'soporte' as Expert,
    name: 'Diego Reyes',
    role: 'Director de Tecnología',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1/sorbito-de-verdad/collaborators/bakano-team-diego',
    initials: 'DR',
    color: '#3B5BDB',
    accentBg: 'rgba(59, 91, 219, 0.08)',
    accentBorder: 'rgba(59, 91, 219, 0.25)',
    shadowColor: 'rgba(59, 91, 219, 0.2)',
    topics: [
      { icon: 'fa-solid fa-laptop-code', label: 'Soporte técnico de la plataforma' },
      { icon: 'fa-solid fa-database', label: 'CRM, reportes y metrics.bakano.ec' },
      { icon: 'fa-solid fa-link', label: 'Integraciones y herramientas' },
      { icon: 'fa-solid fa-life-ring', label: 'Resolución de incidencias' },
    ],
    notFor: 'Esta reunión NO es para temas de Meta Ads, estrategia publicitaria ni ventas.',
    url: 'https://api.leadconnectorhq.com/widget/booking/aaHn06pmWuNFuF7tjDST',
    warningTitle: 'Soporte Técnico',
    warningBody: 'Si tu consulta es sobre la plataforma, CRM, reportes o cualquier tema técnico, estás en el lugar correcto.',
    btnLabel: 'Agendar Soporte Técnico',
  },
  {
    key: 'meta' as Expert,
    name: 'Denisse Quimi',
    role: 'Experta en Meta Ads',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1775356095/sorbito-de-verdad/collaborators/bakano-team-denisse.webp',
    initials: 'DQ',
    color: '#E91E8C',
    accentBg: 'rgba(233, 30, 140, 0.08)',
    accentBorder: 'rgba(233, 30, 140, 0.25)',
    shadowColor: 'rgba(233, 30, 140, 0.2)',
    topics: [
      { icon: 'fa-brands fa-meta', label: 'Anuncios en Facebook e Instagram' },
      { icon: 'fa-solid fa-bullseye', label: 'Estrategia y optimización de campañas' },
      { icon: 'fa-solid fa-images', label: 'Creativos, copy y segmentación' },
      { icon: 'fa-solid fa-chart-line', label: 'Resultados y métricas' },
    ],
    notFor: 'Esta reunión NO es para temas técnicos, de plataforma ni de ventas.',
    url: 'https://api.leadconnectorhq.com/widget/booking/GNizdekhY5SQaYTPdKPP',
    warningTitle: 'Sesión de Meta Ads',
    warningBody: 'Si tu duda es sobre anuncios en Facebook o Instagram, estás en el lugar correcto.',
    btnLabel: 'Agendar con Denisse',
  },
  {
    key: 'ventas' as Expert,
    name: 'Luis Reyes',
    role: 'Director Comercial',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1/sorbito-de-verdad/collaborators/bakano-team-luis',
    initials: 'LR',
    color: '#0EA5E9',
    accentBg: 'rgba(14, 165, 233, 0.08)',
    accentBorder: 'rgba(14, 165, 233, 0.25)',
    shadowColor: 'rgba(14, 165, 233, 0.2)',
    topics: [
      { icon: 'fa-solid fa-handshake', label: 'Nuevos servicios y contrataciones' },
      { icon: 'fa-solid fa-file-invoice-dollar', label: 'Facturación y planes comerciales' },
      { icon: 'fa-solid fa-arrow-trend-up', label: 'Escalabilidad y crecimiento' },
      { icon: 'fa-solid fa-star', label: 'Propuestas y negociación' },
    ],
    notFor: 'EXCLUSIVO para ventas. Cualquier otro tema será cancelado.',
    url: 'https://api.leadconnectorhq.com/widget/booking/nF8Yw6KCBE0R4a3B8XGy',
    warningTitle: 'Sesión de Ventas',
    warningBody: 'Exclusivo para temas comerciales. Cualquier otro tema será cancelado.',
    btnLabel: 'Agendar Sesión de Ventas',
  },
]

function close() {
  selected.value = null
  emit('update:modelValue', false)
}

function selectExpert(key: Expert) {
  selected.value = key
}

function backToSelection() {
  selected.value = null
}

const selectedExpert = () => experts.find(e => e.key === selected.value) ?? null

function imgError(key: string) {
  fallbackImg.value[key] = true
}
</script>

<template>
  <Transition name="modal">
    <div v-if="modelValue" class="bm-overlay" @click.self="close">
      <div class="bm-modal" :class="{ 'bm-modal--calendar': selected }">

        <!-- ── HEADER ── -->
        <div class="bm-header">
          <button v-if="selected" class="bm-back" @click="backToSelection">
            <i class="fa-solid fa-arrow-left" />
          </button>
          <div class="bm-header-text">
            <h2 class="bm-title">
              {{ selected ? `Agendar con ${selectedExpert()?.name}` : 'Agenda una reunión con nuestro equipo' }}
            </h2>
            <p class="bm-subtitle">
              {{ selected
                ? `Completa los datos para agendar tu ${selectedExpert()?.warningTitle?.toLowerCase()}`
                : 'Elige la opción correcta según tu necesidad — esto nos ayuda a preparar mejor cada reunión' }}
            </p>
          </div>
          <button class="bm-close" @click="close">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- ── SELECTION SCREEN ── -->
        <div v-if="!selected" class="bm-selection">

          <div class="bm-alert">
            <i class="fa-solid fa-triangle-exclamation" />
            <span><strong>Importante:</strong> Selecciona el tipo de reunión según tu necesidad. Las reuniones fuera de tema serán canceladas para optimizar el tiempo de todos.</span>
          </div>

          <div class="bm-cards">
            <button
              v-for="expert in experts"
              :key="expert.key!"
              class="bm-card"
              :class="{ 'bm-card--ventas': expert.key === 'ventas' }"
              :style="{ '--accent': expert.color, '--accent-bg': expert.accentBg, '--accent-border': expert.accentBorder, '--shadow': expert.shadowColor }"
              @click="selectExpert(expert.key)"
            >
              <!-- Photo / Initials -->
              <div class="bm-card__photo-wrap">
                <img
                  v-if="!fallbackImg[expert.key]"
                  :src="expert.photo"
                  :alt="expert.name"
                  class="bm-card__photo"
                  @error="imgError(expert.key)"
                >
                <div v-else class="bm-card__initials" :style="{ background: expert.color }">
                  {{ expert.initials }}
                </div>
                <div class="bm-card__photo-ring" />
              </div>

              <!-- Identity -->
              <div class="bm-card__identity">
                <div class="bm-card__name">{{ expert.name }}</div>
                <div class="bm-card__role">{{ expert.role }}</div>
              </div>

              <!-- Topics -->
              <div class="bm-card__section-label">Temas de esta reunión</div>
              <ul class="bm-card__topics">
                <li v-for="topic in expert.topics" :key="topic.label">
                  <i :class="topic.icon" />
                  {{ topic.label }}
                </li>
              </ul>

              <!-- Not-for notice -->
              <div class="bm-card__notfor" :class="{ 'bm-card__notfor--ventas': expert.key === 'ventas' }">
                <i class="fa-solid fa-ban" />
                {{ expert.notFor }}
              </div>

              <!-- CTA -->
              <div class="bm-card__cta">
                {{ expert.btnLabel }} <i class="fa-solid fa-arrow-right" />
              </div>
            </button>
          </div>

          <!-- ── VENTAS WARNING ── -->
          <div class="bm-ventas-warning">
            <i class="fa-solid fa-shield-halved"></i>
            <div>
              <strong>Política de reuniones de ventas:</strong> Esta reunión es <u>exclusivamente para tratar temas comerciales</u>.
              Si se agenda y se utiliza para consultar sobre Meta Ads, soporte técnico u otros temas no comerciales,
              se registrará como una <strong>mala utilización</strong> del espacio y <strong>no podrás agendar nuevamente</strong> una sesión de ventas.
              Agradecemos tu comprensión para mantener la eficiencia del equipo comercial.
            </div>
          </div>
        </div>

        <!-- ── CALENDAR EMBED ── -->
        <div v-else class="bm-calendar">
          <div class="bm-expert-strip" :style="{ borderLeftColor: selectedExpert()?.color }">
            <div class="bm-expert-strip__photo-wrap">
              <img
                v-if="!fallbackImg[selected]"
                :src="selectedExpert()?.photo"
                :alt="selectedExpert()?.name"
                class="bm-expert-strip__photo"
                @error="imgError(selected)"
              >
              <div v-else class="bm-expert-strip__initials" :style="{ background: selectedExpert()?.color }">
                {{ selectedExpert()?.initials }}
              </div>
            </div>
            <div class="bm-expert-strip__info">
              <div class="bm-expert-strip__name" :style="{ color: selectedExpert()?.color }">
                {{ selectedExpert()?.name }} — {{ selectedExpert()?.role }}
              </div>
              <div class="bm-expert-strip__body">{{ selectedExpert()?.warningBody }}</div>
            </div>
            <div class="bm-expert-strip__badge" :style="{ background: selectedExpert()?.accentBg, borderColor: selectedExpert()?.accentBorder, color: selectedExpert()?.color }">
              <i class="fa-solid fa-shield-check" /> {{ selectedExpert()?.warningTitle }}
            </div>
          </div>

          <iframe
            :src="selectedExpert()?.url"
            class="bm-iframe"
            frameborder="0"
            allowfullscreen
          />
        </div>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
$danger: $alert-error;

.bm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.bm-modal {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.28);
  width: 100%;
  max-width: 820px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: max-width 0.35s ease;

  &--calendar {
    max-width: 880px;
  }
}

// ── Header ──────────────────────────────────────────────
.bm-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fafafa;
}

.bm-back {
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  flex-shrink: 0;
  margin-top: 2px;
  transition: background 0.2s;

  &:hover { background: #e4e4e4; }
}

.bm-header-text { flex: 1; }

.bm-title {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0d0d0d;
}

.bm-subtitle {
  margin: 0;
  font-size: 0.83rem;
  color: #666;
  line-height: 1.4;
}

.bm-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #999;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: color 0.2s;

  &:hover { color: #333; }
}

// ── Alert ────────────────────────────────────────────────
.bm-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  font-size: 0.82rem;
  color: #7a5800;
  line-height: 1.5;
  margin-bottom: 1.25rem;

  i {
    margin-top: 2px;
    flex-shrink: 0;
    color: #f59e0b;
  }
  strong { font-weight: 700; }
}

// ── Selection ────────────────────────────────────────────
.bm-selection {
  padding: 1.25rem 1.5rem 1.5rem;
  overflow-y: auto;
}

.bm-cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.bm-card {
  --accent: #999;
  --accent-bg: rgba(153, 153, 153, 0.08);
  --accent-border: rgba(153, 153, 153, 0.2);
  --shadow: rgba(0, 0, 0, 0.1);

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.7rem;
  padding: 1.5rem 1rem 1.25rem;
  border: 2px solid #ebebeb;
  border-radius: 18px;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.18s, box-shadow 0.2s, background 0.2s;
  font-family: inherit;
  font-size: inherit;

  &:hover {
    border-color: var(--accent);
    transform: translateY(-3px);
    box-shadow: 0 12px 32px var(--shadow);
    background: var(--accent-bg);
  }

  &--ventas {
    position: relative;

    &::after {
      content: 'EXCLUSIVO';
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.55rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: $danger;
      background: rgba($danger, 0.1);
      border: 1px solid rgba($danger, 0.2);
      padding: 0.15rem 0.45rem;
      border-radius: 100px;
    }
  }

  // Photo / Initials
  &__photo-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }

  &__photo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top center;
    border: 3px solid #fff;
    box-shadow: 0 4px 16px var(--shadow);
    display: block;
  }

  &__initials {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 1.5rem;
    border: 3px solid #fff;
    box-shadow: 0 4px 16px var(--shadow);
  }

  &__photo-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover &__photo-ring { opacity: 1; }

  // Identity
  &__identity { width: 100%; }

  &__name {
    font-size: 1rem;
    font-weight: 800;
    color: #0d0d0d;
    margin-bottom: 0.2rem;
  }

  &__role {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  // Section label
  &__section-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    align-self: flex-start;
    margin-top: 0.25rem;
  }

  // Topics list
  &__topics {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;

    li {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      color: #333;
      padding: 0.3rem 0.45rem;
      border-radius: 7px;
      background: rgba(0, 0, 0, 0.025);

      i {
        color: var(--accent);
        width: 15px;
        text-align: center;
        flex-shrink: 0;
        font-size: 0.75rem;
      }
    }
  }

  // Not-for notice
  &__notfor {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    font-size: 0.7rem;
    color: #c0392b;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 0.45rem 0.55rem;
    text-align: left;
    line-height: 1.4;

    i {
      flex-shrink: 0;
      margin-top: 1px;
      font-size: 0.68rem;
    }

    &--ventas {
      background: #fff0f0;
      border-color: rgba($danger, 0.25);
      font-weight: 600;
    }
  }

  // CTA
  &__cta {
    width: 100%;
    padding: 0.65rem 1rem;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    box-shadow: 0 4px 14px var(--shadow);
  }
}

// ── Ventas warning block ─────────────────────────────────
.bm-ventas-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-top: 1.25rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba($danger, 0.06) 0%, rgba($danger, 0.02) 100%);
  border: 1px solid rgba($danger, 0.18);
  border-radius: 12px;
  font-size: 0.78rem;
  color: #7a1a1a;
  line-height: 1.6;

  i {
    font-size: 1.2rem;
    color: $danger;
    flex-shrink: 0;
    margin-top: 2px;
  }

  strong {
    font-weight: 700;
  }

  u {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

// ── Calendar embed ────────────────────────────────────────
.bm-calendar {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 1rem 1.5rem 1.5rem;
  gap: 0.85rem;
}

.bm-expert-strip {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid #eee;
  background: #fafafa;
  border-left: 4px solid #ccc;
  flex-shrink: 0;

  &__photo-wrap {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  }

  &__photo {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    object-position: top center;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    display: block;
  }

  &__initials {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 1rem;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 800;
    margin-bottom: 0.15rem;
  }

  &__body {
    font-size: 0.78rem;
    color: #555;
    line-height: 1.4;
  }

  &__badge {
    flex-shrink: 0;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.3rem 0.65rem;
    border-radius: 100px;
    border: 1px solid;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;

    @media (max-width: 560px) { display: none; }
  }
}

.bm-iframe {
  flex: 1;
  width: 100%;
  min-height: 500px;
  border-radius: 12px;
  border: 1px solid #eee;
}

// ── Transitions ──────────────────────────────────────────
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;

  .bm-modal {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .bm-modal {
    transform: scale(0.93) translateY(16px);
  }
}
</style>
