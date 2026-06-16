export const INTERNAL_ROLE_LABELS: Record<string, string> = {
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

export const getRoleLabel = (role: string | null | undefined) => {
  if (!role) return 'Miembro del Equipo'
  return INTERNAL_ROLE_LABELS[role] || role
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  director: 'Lidera la visión estratégica y coordina los esfuerzos globales.',
  estratega: 'Diseña el plan de acción para alcanzar los objetivos de la marca.',
  project_manager: 'Garantiza que el proyecto avance en tiempo, forma y presupuesto.',
  content_manager: 'Dirige la estrategia de contenido y asegura la calidad del mensaje.',
  account_manager: 'Es tu puente de comunicación principal con el equipo.',
  community_manager: 'Gestiona tu comunidad online e interactúa con tu audiencia.',
  productor: 'Coordina y supervisa la creación de recursos audiovisuales.',
  asistente_produccion: 'Apoya en la logística y ejecución de las producciones.',
  editor: 'Da vida al material audiovisual con edición profesional.',
  disenador: 'Crea piezas visuales impactantes y fieles a la marca.',
  copywriter: 'Escribe textos persuasivos que conectan y convierten.',
  analista: 'Interpreta los datos para optimizar continuamente la estrategia.',
  desarrollador: 'Construye y mantiene soluciones técnicas de alto nivel.',
  trafficker: 'Gestiona y optimiza las campañas de publicidad digital.',
}

export const getRoleDescription = (role: string | null | undefined) => {
  if (!role) return 'Colaborador esencial en el éxito del proyecto.'
  return ROLE_DESCRIPTIONS[role] || 'Colaborador esencial en el éxito del proyecto.'
}
