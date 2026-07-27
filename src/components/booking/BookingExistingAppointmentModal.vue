<script setup lang="ts">
defineProps<{ appointmentDate?: string }>()
defineEmits<{ registerAnother: [] }>()

function formatAppointmentDate(date?: string) {
  if (!date) return 'Revisa la fecha y hora en tu correo.'
  return new Date(date).toLocaleString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guayaquil' })
}
</script>

<template>
  <Transition name="appointment-modal" appear>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title">
      <section class="modal__card">
        <div class="modal__icon"><i class="fa-solid fa-calendar-check"></i></div>
        <span>Reunión ya agendada</span>
        <h1 id="appointment-title">Ya tienes una asesoría con Luis.</h1>
        <p>Tu reunión quedó registrada para:</p>
        <strong><i :class="appointmentDate ? 'fa-solid fa-clock' : 'fa-solid fa-envelope'"></i>{{ formatAppointmentDate(appointmentDate) }}</strong>
        <p class="modal__hint">Si necesitas solicitar otra fecha, registra nuevamente tu información comercial.</p>
        <button @click="$emit('registerAnother')"><i class="fa-solid fa-calendar-plus"></i> Quiero dejar otro registro</button>
      </section>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal { position: fixed; z-index: 1000; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1.25rem; background: rgba($primary-dark,.72); }
.modal__card { display: flex; align-items: center; width: min(100%, 560px); flex-direction: column; padding: clamp(1.75rem,5vw,3rem); border: 1px solid rgba($BAKANO-GREEN,.35); border-radius: 24px; text-align: center; background: $white; box-shadow: 0 28px 70px rgba($primary-dark,.42); }
.modal__icon { display: flex; align-items: center; justify-content: center; width: 4rem; height: 4rem; margin-bottom: 1rem; border-radius: 50%; color: $white; background: $BAKANO-GREEN; box-shadow: 0 10px 24px rgba($BAKANO-GREEN,.25); font-size: 1.65rem; }
.modal__card > span { color: #16714b; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.modal h1 { margin: .7rem 0; color: $primary-dark; font-size: clamp(1.6rem,4vw,2.3rem); letter-spacing: -.03em; }
.modal p { max-width: 430px; margin: 0; color: $text-secondary; line-height: 1.6; }
.modal strong { display: inline-flex; align-items: center; gap: .55rem; margin-top: 1rem; padding: .75rem 1rem; border-radius: 12px; color: #16714b; background: rgba($BAKANO-GREEN,.1); font-size: .85rem; }
.modal__hint { margin-top: 1.25rem !important; font-size: .82rem; }
.modal button { display: inline-flex; align-items: center; gap: .5rem; margin-top: 1.25rem; padding: .9rem 1rem; border: 0; border-radius: 11px; color: $white; background: $primary; box-shadow: 0 10px 20px rgba($primary,.22); cursor: pointer; font: inherit; font-size: .84rem; font-weight: 800; transition: transform .2s, box-shadow .2s; }
.modal button:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba($primary,.3); }
.appointment-modal-enter-active, .appointment-modal-leave-active { transition: opacity .24s ease; }
.appointment-modal-enter-active .modal__card, .appointment-modal-leave-active .modal__card { transition: transform .24s ease, opacity .24s ease; }
.appointment-modal-enter-from, .appointment-modal-leave-to { opacity: 0; }
.appointment-modal-enter-from .modal__card, .appointment-modal-leave-to .modal__card { opacity: 0; transform: translateY(16px) scale(.98); }
</style>
