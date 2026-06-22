<script setup lang="ts">
import { ref } from 'vue'
import carlosPhoto from '@/assets/team/carlos.jpg'

type ExpertKey = 'soporte' | 'meta' | 'ventas' | null
const selected = ref<ExpertKey>(null)
const fallbackImg = ref<Record<string, boolean>>({})

const experts = [
  {
    key: 'soporte' as ExpertKey,
    name: 'Carlos Jurado',
    role: 'Especialista en Tecnología',
    photo: carlosPhoto,
    initials: 'CJ',
    color: '#3B5BDB',
    gradient: 'linear-gradient(135deg, #3B5BDB, #6C5CE7)',
    accentBg: 'rgba(59, 91, 219, 0.08)',
    accentBorder: 'rgba(59, 91, 219, 0.2)',
    shadowColor: 'rgba(59, 91, 219, 0.25)',
    topics: [
      'Soporte técnico de la plataforma',
      'CRM, reportes y metrics.bakano.ec',
      'Integraciones y herramientas',
      'Resolución de incidencias',
    ],
    url: 'https://api.leadconnectorhq.com/widget/booking/aaHn06pmWuNFuF7tjDST',
    warning: 'Solo temas técnicos',
    warningDesc:
      'Si tu consulta es sobre el funcionamiento de la plataforma, CRM, reportes o integraciones, estás en el lugar correcto. Cualquier otro tema será redirigido.',
    icon: 'fa-solid fa-laptop-code',
  },
  {
    key: 'meta' as ExpertKey,
    name: 'Denisse Quimi',
    role: 'Especialista en Meta Ads',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1775356095/sorbito-de-verdad/collaborators/bakano-team-denisse.webp',
    initials: 'DQ',
    color: '#E91E8C',
    gradient: 'linear-gradient(135deg, #E91E8C, #FD79A8)',
    accentBg: 'rgba(233, 30, 140, 0.08)',
    accentBorder: 'rgba(233, 30, 140, 0.2)',
    shadowColor: 'rgba(233, 30, 140, 0.25)',
    topics: [
      'Anuncios en Facebook e Instagram',
      'Estrategia y optimización de campañas',
      'Creativos, copy y segmentación',
      'Resultados y métricas de campañas',
    ],
    url: 'https://api.leadconnectorhq.com/widget/booking/GNizdekhY5SQaYTPdKPP',
    warning: 'Solo Meta Ads',
    warningDesc:
      'Si tu duda es sobre anuncios en Facebook o Instagram, estás en el lugar correcto. Otros temas serán redirigidos.',
    icon: 'fa-solid fa-chart-simple',
  },
  {
    key: 'ventas' as ExpertKey,
    name: 'Luis Reyes',
    role: 'Especialista en Ventas',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1/sorbito-de-verdad/collaborators/bakano-team-luis',
    initials: 'LR',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    accentBg: 'rgba(14, 165, 233, 0.08)',
    accentBorder: 'rgba(14, 165, 233, 0.2)',
    shadowColor: 'rgba(14, 165, 233, 0.25)',
    topics: [
      'Nuevos servicios y contrataciones',
      'Facturación y planes comerciales',
      'Escalabilidad y crecimiento',
      'Propuestas y negociación',
    ],
    url: 'https://api.leadconnectorhq.com/widget/booking/nF8Yw6KCBE0R4a3B8XGy',
    warning: 'Exclusivo ventas',
    warningDesc:
      'Exclusivo para temas comerciales. Cualquier otro tema será cancelado y no podrás agendar nuevamente.',
    icon: 'fa-solid fa-handshake',
  },
]

const currentExpert = () => experts.find((e) => e.key === selected.value) ?? null

function selectExpert(key: ExpertKey) {
  selected.value = key
}

function backToSelection() {
  selected.value = null
}

function imgError(key: string) {
  fallbackImg.value[key] = true
}
</script>

<template>
  <div class="bv">
    <!-- ════════ SELECTION SCREEN ════════ -->
    <template v-if="!selected">
      <div class="bv-hero">
        <div class="bv-hero__bg"></div>
        <div class="bv-hero__deco bv-hero__deco--1"></div>
        <div class="bv-hero__deco bv-hero__deco--2"></div>
        <div class="bv-hero__inner">
          <div class="bv-hero__badge">Agenda una reunión</div>
          <h1 class="bv-hero__title">¿Con quién necesitas hablar?</h1>
          <p class="bv-hero__desc">
            Selecciona a la persona adecuada según tu consulta. Cada reunión está diseñada para un propósito específico.
          </p>
        </div>
      </div>

      <div class="bv-cards-section">
        <div class="bv-cards">
          <button
            v-for="expert in experts"
            :key="expert.key!"
            class="bv-card"
            :class="{ 'bv-card--ventas': expert.key === 'ventas' }"
            :style="{
              '--accent': expert.color,
              '--accent-bg': expert.accentBg,
              '--accent-gradient': expert.gradient,
              '--shadow': expert.shadowColor,
            }"
            @click="selectExpert(expert.key)"
          >
            <div class="bv-card__photo-ring">
              <div class="bv-card__photo-wrap">
                <img
                  v-if="!fallbackImg[expert.key]"
                  :src="expert.photo"
                  :alt="expert.name"
                  class="bv-card__photo"
                  @error="imgError(expert.key)"
                />
                <div v-else class="bv-card__initials">{{ expert.initials }}</div>
              </div>
            </div>

            <span class="bv-card__name">{{ expert.name }}</span>
            <span class="bv-card__role">{{ expert.role }}</span>

            <i :class="expert.icon" class="bv-card__icon"></i>

            <ul class="bv-card__topics">
              <li v-for="t in expert.topics" :key="t">{{ t }}</li>
            </ul>

            <div class="bv-card__cta">
              <span>Agendar reunión</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </button>
        </div>

        <div class="bv-policy">
          <div class="bv-policy__icon">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="bv-policy__body">
            <strong>Política de uso:</strong> Las reuniones de ventas son exclusivas para temas comerciales. El uso indebido será registrado y perderás acceso a futuras agendas con el equipo comercial.
          </div>
        </div>
      </div>
    </template>

    <!-- ════════ CALENDAR SCREEN ════════ -->
    <template v-else>
      <div class="bv-calendar-page">
        <div class="bv-sidebar-cal">
          <button class="bv-back-link" @click="backToSelection">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Volver a selección</span>
          </button>

          <div class="bv-sidebar-cal__card">
            <div class="bv-sidebar-cal__photo-wrap">
              <img
                v-if="!fallbackImg[selected]"
                :src="currentExpert()?.photo"
                :alt="currentExpert()?.name"
                class="bv-sidebar-cal__photo"
                @error="imgError(selected)"
              />
              <div
                v-else
                class="bv-sidebar-cal__initials"
                :style="{ background: currentExpert()?.color }"
              >
                {{ currentExpert()?.initials }}
              </div>
            </div>

            <h3 class="bv-sidebar-cal__name">{{ currentExpert()?.name }}</h3>
            <span class="bv-sidebar-cal__role" :style="{ color: currentExpert()?.color }">{{
              currentExpert()?.role
            }}</span>

            <div
              class="bv-sidebar-cal__badge"
              :style="{
                '--badge-color': currentExpert()?.color,
                '--badge-bg': currentExpert()?.accentBg,
                '--badge-border': currentExpert()?.accentBorder,
              }"
            >
              <i class="fa-solid fa-circle-info"></i>
              {{ currentExpert()?.warning }}
            </div>

            <div class="bv-sidebar-cal__desc">{{ currentExpert()?.warningDesc }}</div>

            <div class="bv-sidebar-cal__topics-label">Temas que se tratarán:</div>
            <ul class="bv-sidebar-cal__topics">
              <li v-for="t in currentExpert()?.topics" :key="t!">
                <i
                  class="fa-solid fa-circle-check"
                  :style="{ color: currentExpert()?.color }"
                ></i>
                {{ t }}
              </li>
            </ul>
          </div>
        </div>

        <div class="bv-calendar-main">
          <iframe
            :src="currentExpert()?.url"
            class="bv-calendar-main__iframe"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.bv {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

// ═══════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════
.bv-hero {
  position: relative;
  overflow: hidden;
  padding: 3rem 2rem 2.5rem;
  text-align: center;

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba($primary, 0.04) 0%, transparent 100%);
    z-index: 0;
  }

  &__deco {
    position: absolute;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;

    &--1 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba($primary, 0.06) 0%, transparent 70%);
      top: -100px;
      right: -80px;
    }

    &--2 {
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba($primary, 0.04) 0%, transparent 70%);
      bottom: -60px;
      left: -60px;
    }
  }

  &__inner {
    position: relative;
    z-index: 1;
    max-width: 640px;
    margin: 0 auto;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: $primary;
    background: rgba($primary, 0.08);
    border: 1px solid rgba($primary, 0.15);
    padding: 0.3rem 0.85rem;
    border-radius: 100px;
    margin-bottom: 1.25rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 800;
    color: $primary-dark;
    line-height: 1.2;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  &__desc {
    font-size: 0.95rem;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0;
    max-width: 480px;
    margin: 0 auto;
  }
}

// ═══════════════════════════════════════════════════════════════
// CARDS SECTION
// ═══════════════════════════════════════════════════════════════
.bv-cards-section {
  padding: 0 2rem 2.5rem;
  flex: 1;
}

.bv-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  max-width: 1100px;
  margin: 0 auto 1.5rem;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
}

.bv-card {
  --accent: #999;
  --accent-bg: rgba(153, 153, 153, 0.06);
  --accent-gradient: linear-gradient(135deg, #999, #bbb);
  --shadow: rgba(0, 0, 0, 0.08);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
  padding: 2.25rem 1.5rem 1.5rem;
  border-radius: 20px;
  background: $white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-family: inherit;
  font-size: inherit;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 2px;
    background: var(--accent-gradient);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px var(--shadow);
    border-color: transparent;

    &::before {
      opacity: 1;
    }

    .bv-card__cta {
      background: var(--accent-gradient);
      box-shadow: 0 6px 20px var(--shadow);
    }

    .bv-card__photo-ring {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px var(--accent-bg), 0 8px 24px var(--shadow);
    }
  }

  &--ventas::after {
    content: 'Exclusivo';
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 0.5rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: $alert-error;
    background: rgba($alert-error, 0.08);
    border: 1px solid rgba($alert-error, 0.15);
    padding: 0.2rem 0.5rem;
    border-radius: 100px;
  }

  &__photo-ring {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  &__photo-wrap {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  &__initials {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 1.6rem;
    background: linear-gradient(135deg, #3b3b3b, #666);
  }

  &__name {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0d0d0d;
    margin-top: 0.25rem;
  }

  &__role {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  &__icon {
    font-size: 1.5rem;
    color: var(--accent);
  }

  &__topics {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    text-align: left;

    li {
      position: relative;
      font-size: 0.78rem;
      color: #555;
      padding-left: 1rem;
      line-height: 1.4;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.5em;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--accent);
      }
    }
  }

  &__cta {
    width: 100%;
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.04);
    color: #333;
    font-size: 0.82rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    margin-top: auto;

    i {
      font-size: 0.75rem;
      transition: transform 0.3s ease;
    }
  }

  &:hover .bv-card__cta i {
    transform: translateX(3px);
  }
}

// ═══════════════════════════════════════════════════════════════
// POLICY
// ═══════════════════════════════════════════════════════════════
.bv-policy {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.25rem;
  background: $white;
  border: 1px solid rgba($alert-error, 0.12);
  border-radius: 14px;

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba($alert-error, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 0.9rem;
      color: $alert-error;
    }
  }

  &__body {
    font-size: 0.78rem;
    color: #666;
    line-height: 1.6;

    strong {
      color: #444;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR SPLIT VIEW
// ═══════════════════════════════════════════════════════════════
.bv-calendar-page {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 60px);
  background: #f8f7f5;

  @media (max-width: 820px) {
    flex-direction: column;
  }
}

.bv-sidebar-cal {
  width: 320px;
  flex-shrink: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: $white;
  border-right: 1px solid rgba(0, 0, 0, 0.05);

  @media (max-width: 820px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.65rem;
    padding: 1.5rem 1rem;
    border-radius: 16px;
    background: #fafafa;
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  &__photo-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid $white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &__photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  &__initials {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 1.3rem;
  }

  &__name {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0d0d0d;
    margin: 0;
  }

  &__role {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  &__badge {
    --badge-color: #999;
    --badge-bg: rgba(153, 153, 153, 0.08);
    --badge-border: rgba(153, 153, 153, 0.2);

    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--badge-color);
    background: var(--badge-bg);
    border: 1px solid var(--badge-border);
    padding: 0.3rem 0.7rem;
    border-radius: 100px;
  }

  &__desc {
    font-size: 0.78rem;
    color: #777;
    line-height: 1.5;
    max-width: 260px;
  }

  &__topics-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0.25rem;
  }

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
      font-size: 0.78rem;
      color: #555;
      display: flex;
      align-items: center;
      gap: 0.45rem;

      i {
        font-size: 0.75rem;
        flex-shrink: 0;
      }
    }
  }
}

.bv-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: none;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  padding: 0.3rem 0;
  font-family: inherit;
  align-self: flex-start;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
}

.bv-calendar-main {
  flex: 1;
  display: flex;
  padding: 1.5rem;

  &__iframe {
    flex: 1;
    width: 100%;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    background: $white;
    min-height: 500px;
  }
}
</style>
