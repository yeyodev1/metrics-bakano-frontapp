<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  contractData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

function closePreviewModal() {
  emit('close')
}

function onSubmitContract() {
  emit('confirm')
}
</script>

<template>
  <div v-if="show" class="preview-modal-overlay" @click.self="closePreviewModal">
    <div class="preview-modal-content">
      <div class="modal-header">
        <h2>Previsualización del Contrato</h2>
        <button type="button" class="btn-close" @click="closePreviewModal"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <div class="modal-body">
        <div class="contract-document">
          <h3 class="doc-title">CONTRATO DE PRESTACIÓN DE SERVICIOS DE MARKETING DIGITAL, CONSULTORÍA COMERCIAL Y PARTNER DE ESCALADO 360</h3>
          
          <p><strong>PRIMERA.- COMPARECIENTES:</strong><br/>
          Comparecen a la celebración del presente contrato, por una parte, NEGOCIOS DEL PACIFICO NEGODELPAC S.A., representada por LUIS ALBERTO REYES LEMA, en calidad de representante legal, con Ruc No. 0993213210001, en adelante y para efectos del presente contrato se lo denominará como BAKANO, y por otra parte, <strong>{{ contractData.nombreCliente }}</strong>, con RUC/C.I. No. <strong>{{ contractData.rucCliente }}</strong>, representada por <strong>{{ contractData.representanteCliente }}</strong>, en adelante y para el efecto de este contrato se lo denominará como EL CLIENTE, quienes libre y voluntariamente acuerdan celebrar el presente Contrato de Prestación de Servicios, al tenor de las siguientes cláusulas:</p>
          
          <p><strong>SEGUNDA.- ANTECEDENTES:</strong><br/>
          1.1. BAKANO es una empresa especializada en marketing digital, adquisición de clientes, consultoría comercial y estrategias de escalado de negocios mediante sistemas de conversión digital, generación de contenido estratégico, tráfico pago y optimización comercial.<br/>
          1.2. EL CLIENTE ha manifestado su interés en contratar los servicios profesionales de BAKANO para implementar estrategias digitales y comerciales orientadas al posicionamiento, generación de prospectos y fortalecimiento de su presencia digital.<br/>
          1.3. Las partes reconoce que la metodología, procesos, sistemas, funnels, estructuras comerciales, guiones, estrategias y know-how utilizados por BAKANO son propios, confidenciales y forman parte de sus activos intelectuales y comerciales.</p>

          <p><strong>TERCERA.- OBJETO DEL CONTRATO:</strong><br/>
          BAKANO se obliga a prestar a favor de EL CLIENTE servicios de marketing digital, consultoría comercial y acompañamiento estratégico bajo la modalidad de “Partner de Escalado 360”, incluyendo generación de contenido estratégico, implementación de campañas publicitarias digitales, diseño de sistemas de adquisición de clientes y acompañamiento consultivo, conforme al alcance establecido en este contrato.</p>

          <p><strong>CUARTA.- ALCANCE DE LOS SERVICIOS:</strong><br/>
          <template v-if="contractData.cantidadGuiones">
            A. Motor de Contenido de Conversión:<br/>
            - Ingeniería y desarrollo de guiones persuasivos. Cantidad de piezas: <strong>{{ contractData.cantidadGuiones }}</strong>.<br/>
            - Producción y edición de <strong>{{ contractData.videosEntretenimiento || 0 }}</strong> videos de entretenimiento y <strong>{{ contractData.videosVenta || 0 }}</strong> videos de venta mensuales.<br/>
            - Planificación estratégica de contenido.<br/>
            - Programación y publicación del contenido acordado.<br/><br/>
            B. Sistema de Adquisición de Clientes:<br/>
            - Diseño de funnels y rutas de conversión. Cantidad de funnels: <strong>{{ contractData.numeroFunnels }}</strong>.<br/>
            - Configuración de campañas digitales.<br/>
            - Segmentación estratégica de audiencias.<br/>
            - Optimización técnica de campañas y presupuesto publicitario.<br/>
            - Implementación de herramientas de métricas y seguimiento.<br/><br/>
            C. Consultoría Estratégica:<br/>
            - Sesiones de análisis estratégico. Modalidad y frecuencia: <strong>{{ contractData.frecuenciaSesiones }}</strong>.<br/>
            - Revisión de métricas comerciales.<br/>
            - Recomendaciones sobre procesos comerciales y de ventas.<br/>
            - Acompañamiento estratégico de escalado. Modalidad y frecuencia: <strong>{{ contractData.frecuenciaSesiones }}</strong>.<br/><br/>
            BAKANO ejecutará únicamente las actividades expresamente acordadas. Cualquier servicio adicional deberá ser cotizado y aprobado por separado.
          </template>
          <template v-else>
            Los servicios a prestar se ejecutarán estrictamente <strong>según lo conversado y estipulado</strong> previamente entre las partes.<br/><br/>
            BAKANO ejecutará únicamente las actividades expresamente acordadas. Cualquier servicio adicional deberá ser cotizado y aprobado por separado.
          </template>
          </p>

          <p><strong>QUINTA.- DELIMITACIÓN DEL SERVICIO:</strong><br/>
          Las partes acuerdan expresamente que el presente contrato NO incluye:<br/>
          - Diseño gráfico integral o branding corporativo.<br/>
          - Desarrollo de identidad visual.<br/>
          - Atención al cliente o gestión de cierres comerciales.<br/>
          - Manejo de chats, WhatsApp o seguimiento comercial.<br/>
          - Fotografía profesional de catálogo o eventos.<br/>
          - Desarrollo web o mantenimiento tecnológico, salvo contratación independiente.</p>

          <p><strong>SEXTA.- OBLIGACIONES DE BAKANO:</strong><br/>
          BAKANO se obliga a:<br/>
          - Ejecutar los servicios contratados con diligencia y criterio técnico.<br/>
          - Implementar estrategias digitales acordes al modelo de negocio de EL CLIENTE.<br/>
          - Entregar los contenidos y campañas dentro de tiempos razonables.<br/>
          - Mantener confidencialidad respecto de la información de EL CLIENTE.<br/>
          - Informar periódicamente sobre métricas y resultados publicitarios.</p>

          <p><strong>SÉPTIMA.- OBLIGACIONES DE EL CLIENTE:</strong><br/>
          EL CLIENTE se obliga a:<br/>
          - Entregar información veraz y oportuna.<br/>
          - Facilitar accesos, materiales y aprobaciones necesarias.<br/>
          - Contar con personal interno capacitado para atención, seguimiento y cierre de ventas.<br/>
          - Dar seguimiento efectivo y oportuno a los prospectos generados.<br/>
          - Ejecutar adecuadamente los procesos comerciales y operativos internos.<br/>
          - Pagar puntualmente los valores acordados.<br/><br/>
          EL CLIENTE reconoce expresamente que el resultado comercial final depende de múltiples factores ajenos al control de BAKANO, incluyendo capacidad operativa, seguimiento comercial, precios, servicio al cliente, competencia y capacidad de cierre de ventas.</p>

          <p><strong>OCTAVA.- EXCLUSIÓN DE GARANTÍA DE RESULTADOS:</strong><br/>
          BAKANO presta servicios de estrategia, marketing digital, posicionamiento y generación de prospectos, mas no garantiza resultados económicos específicos, volúmenes determinados de ventas, retornos financieros, cierres comerciales ni niveles concretos de facturación.<br/>
          EL CLIENTE reconoce y acepta que:<br/>
          - La generación efectiva de ventas depende de la correcta ejecución comercial interna.<br/>
          - El cierre de ventas corresponde exclusivamente al personal y procesos del EL CLIENTE.<br/>
          - Los resultados pueden verse afectados por variables de mercado, competencia, presupuesto publicitario, calidad del producto o servicio, tiempos de respuesta y gestión comercial.<br/>
          En consecuencia, BAKANO no será responsable por metas comerciales no alcanzadas ni por expectativas de ventas de EL CLIENTE.</p>

          <p><strong>NOVENA.- PROPIEDAD INTELECTUAL Y PROTECCIÓN DE METODOLOGÍA:</strong><br/>
          Toda metodología, estructura estratégica, funnels, sistemas de adquisición, procesos, scripts, guiones, dashboards, automatizaciones, estrategias publicitarias, know-how, documentation técnica y modelos comerciales utilizados o desarrollados por BAKANO constituyen propiedad intelectual y comercial exclusiva de BAKANO.<br/>
          EL CLIENTE se obliga expresamente a:<br/>
          - No divulgar, reproducir, compartir, comercializar o transferir la metodología de BAKANO.<br/>
          - No entregar información estratégica a terceros competidores o agencias externas.<br/>
          - No replicar parcial o totalmente los sistemas implementados para fines comerciales externos.<br/>
          - No capacitar terceros utilizando material o metodología de BAKANO.<br/>
          El incumplimiento a esta cláusula facultará a BAKANO a terminar inmediatamente el contrato, exigir indemnización y/o iniciar acciones penales o civiles.</p>

          <p><strong>DÉCIMA.- CONFIDENCIALIDAD:</strong><br/>
          Toda información comercial, financiera, estratégica, técnica o publicitaria compartida entre las partes tendrá carácter confidencial. Ninguna de las partes podrá divulgar información sin autorización previa y escrita de la otra.</p>

          <p><strong>DÉCIMA PRIMERA.- ANEXOS OPERATIVOS:</strong><br/>
          Forman parte integrante del presente contrato los anexos sobre propuesta comercial, cronogramas, lineamientos, accesos, KPIs y presupuestos publicitarios, actualizables de común acuerdo.</p>

          <p><strong>DÉCIMA SEGUNDA.- HONORARIOS Y FORMA DE PAGO:</strong><br/>
          <template v-if="contractData.diasPago">
            EL CLIENTE pagará a BAKANO la suma mensual acordada más IVA.<br/>
            Los pagos deberán realizarse de manera anticipada dentro de los primeros <strong>{{ contractData.diasPago }}</strong> días de cada período mensual.<br/>
            La falta de pago facultará a BAKANO a suspender inmediatamente los servicios sin responsabilidad alguna.<br/>
            El presupuesto publicitario en Meta Ads, Google Ads u otras plataformas NO se encuentra incluido salvo pacto expreso.
          </template>
          <template v-else>
            EL CLIENTE pagará a BAKANO la suma mensual acordada más IVA. Los pagos y fechas se realizarán <strong>según lo conversado y estipulado</strong> entre las partes. La falta de pago facultará a BAKANO a suspender los servicios.
          </template>
          </p>

          <p><strong>DÉCIMA TERCERA.- PLAZO Y TERMINACIÓN:</strong><br/>
          El contrato tiene una permanencia mínima obligatoria de <strong>1 mes</strong> contado desde el inicio efectivo de la prestación del servicio. Posteriormente, el contrato se renovará de manera automática y sucesiva mes a mes, mientras EL CLIENTE mantenga activa y al día su suscripción mensual. EL CLIENTE podrá desistir del servicio y dar por terminado el contrato en el momento que lo desee, sin penalidad alguna, comunicando su decisión mediante notificación formal escrita o electrónica.<br/><br/>
          BAKANO podrá terminar inmediatamente el contrato en caso de incumplimiento de pagos, uso indebido de metodología, conductas que afecten reputacionalmente a BAKANO, o incumplimiento grave de EL CLIENTE.
          </p>

          <p><strong>DÉCIMA CUARTA.- LIMITACIÓN DE RESPONSABILIDAD:</strong><br/>
          La responsabilidad total de BAKANO se limitará exclusivamente al valor efectivamente pagado por EL CLIENTE durante el último mes de servicio. BAKANO no será responsable por pérdidas de ventas, lucro cesante, daños indirectos, pérdida de clientes, decisiones comerciales tomadas por EL CLIENTE o suspensiones de plataformas digitales ajenas a su control.</p>

          <p><strong>DÉCIMA QUINTA.- NATURALEZA DE LA RELACIÓN:</strong><br/>
          El presente contrato es de naturaleza civil y mercantil. No genera relación laboral, representación, sociedad, joint venture ni exclusividad entre las partes.</p>

          <p><strong>DÉCIMA SEXTA.- JURISDICCIÓN:</strong><br/>
          Para cualquier controversia derivada del presente contrato, las partes se someten a los jueces competentes de la ciudad de Guayaquil y a la legislación ecuatoriana.</p>

          <p><strong>DÉCIMA OCTAVA.- GARANTÍA DE DESEMPEÑO Y EXTENSIÓN DE SERVICIO:</strong><br/>
          En caso de que, tras la correcta implementación de las campañas y estrategias comerciales, BAKANO no logre generar ningún prospecto (lead) para EL CLIENTE, se activará de forma excepcional una garantía de desempeño. Esta garantía consistirá en la extensión de los servicios por un periodo máximo de hasta dos (2) meses adicionales, durante los cuales BAKANO no percibirá el pago de sus honorarios mensuales estipulados. El objetivo exclusivo de esta extensión será ajustar, optimizar y completar el proceso estratégico de marketing digital hasta estabilizar la captación de prospectos.</p>

          <p><strong>DÉCIMA NOVENA.- EXCLUSIÓN DE PRESUPUESTO PUBLICITARIO DE LA GARANTÍA:</strong><br/>
          EL CLIENTE reconoce y acepta expresamente que la gratuidad temporal de honorarios descrita en la cláusula anterior aplica única y exclusivamente a los servicios profesionales de BAKANO. En consecuencia, durante los meses que se active la extensión por garantía, EL CLIENTE mantendrá de forma obligatoria, directa e ininterrumpida el pago del presupuesto publicitario (pauta) en Meta Ads, Google Ads o las plataformas correspondientes. La falta de asignación presupuestaria para pauta por parte de EL CLIENTE provocará la cancelación inmediata de la garantía.</p>

          <p><strong>VIGÉSIMA.- CORRESPONSABILIDAD COMERCIAL Y CONDICIÓN DE GESTIÓN:</strong><br/>
          Para la validez y continuidad de la garantía de desempeño, EL CLIENTE se obliga irrevocablemente a cumplir con su contraparte operativa y comercial estipulada en la Cláusula Séptima de este contrato. Esto incluye la obligación estricta de contar con personal interno capacitado para la atención inmediata, seguimiento oportuno y el despliegue del máximo esfuerzo comercial para el cierre de ventas de los prospectos generados. EL CLIENTE deberá compartir con BAKANO la retroalimentación de dicha gestión comercial para fines de optimización.</p>

          <p><strong>VIGÉSIMA PRIMERA.- AUDITORÍA Y ANULACIÓN DE LA GARANTÍA:</strong><br/>
          BAKANO se reserva el derecho de verificar la gestión comercial de EL CLIENTE a través de las plataformas y herramientas tecnológicas pactadas. Si se demuestra que BAKANO cumplió con la generación de prospectos, pero estos no se convirtieron en cierres comerciales debido a demoras en el contacto, deficiente atención, inacción operativa o incumplimiento de procesos internos por parte de EL CLIENTE, la presente garantía quedará automáticamente anulada, debiendo EL CLIENTE abonar la mensualidad regular correspondiente.</p>

          <p class="mt-4 text-center"><em>Al confirmar, este documento será generado en PDF y sellado con tu firma electrónica y la de BAKANO, y se enviará una copia a <strong>{{ contractData.email }}</strong>.</em></p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="closePreviewModal" :disabled="isSubmitting">Cancelar</button>
        <button type="button" class="btn-primary" @click="onSubmitContract" :disabled="isSubmitting">
          {{ isSubmitting ? 'Enviando y Firmando...' : 'Confirmar y Firmar Definitivamente' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}

.preview-modal-content {
  background: white;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: $primary-dark;
  }

  .btn-close {
    background: transparent;
    border: none;
    font-size: 1.25rem;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #ef4444;
    }
  }
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.contract-document {
  background: white;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Times New Roman', Times, serif;
  color: #111827;
  line-height: 1.6;

  .doc-title {
    text-align: center;
    font-weight: bold;
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  p {
    margin-bottom: 1rem;
    font-size: 1rem;
  }
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f9fafb;

  .btn-cancel {
    background: transparent;
    border: 1px solid #d1d5db;
    padding: 0.8rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: #f3f4f6;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.mt-4 { margin-top: 1.5rem; }
.text-center { text-align: center; }

.btn-primary {
  background: linear-gradient(135deg, $primary 0%, #c91e4c 100%);
  color: $white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba($primary, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px rgba($primary, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
