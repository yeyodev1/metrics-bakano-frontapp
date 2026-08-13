import { defineStore } from 'pinia'

export interface IdentidadEfectiva {
  role: string | null
  internalRole: string | null
  isInternal: boolean
}

export interface PersonaVista {
  id: string
  name: string
  internalRole: string | null
  isInternal: boolean
  role: string | null
}

/**
 * "Ver como": cambia QUÉ SE MUESTRA en el menú, nunca lo que se puede hacer.
 *
 * El panel tenía una pestaña por rol y accesos sueltos repartidos por el menú.
 * En vez de eso, se elige una perspectiva y la navegación se adapta.
 *
 * Importante: esto NO es suplantación. La sesión sigue siendo la del
 * superadmin y los guards del router siguen usando su rol real. Si alguien
 * escribe a mano una URL que este modo oculta, entra igual — porque tiene
 * permiso. Aquí solo se decide qué enlaces se ven.
 */
export const useViewAsStore = defineStore('viewAs', {
  state: () => ({
    /** Rol interno que se está previsualizando. */
    rol: null as string | null,
    /** Persona concreta, cuando se afina más que el rol. */
    persona: null as PersonaVista | null,
  }),

  getters: {
    activo: (state) => state.rol !== null || state.persona !== null,

    etiqueta(state): string {
      if (state.persona) return state.persona.name
      if (state.rol) return ROLES_INTERNOS[state.rol] ?? state.rol
      return ''
    },
  },

  actions: {
    verComoRol(rol: string) {
      this.rol = rol
      this.persona = null
      this.persistir()
    },

    verComoPersona(persona: PersonaVista) {
      this.persona = persona
      this.rol = persona.internalRole
      this.persistir()
    },

    salir() {
      this.rol = null
      this.persona = null
      localStorage.removeItem('view_as')
    },

    persistir() {
      localStorage.setItem(
        'view_as',
        JSON.stringify({ rol: this.rol, persona: this.persona })
      )
    },

    hidratar() {
      try {
        const crudo = localStorage.getItem('view_as')
        if (!crudo) return
        const datos = JSON.parse(crudo)
        this.rol = datos.rol ?? null
        this.persona = datos.persona ?? null
      } catch {
        localStorage.removeItem('view_as')
      }
    },

    /**
     * Identidad que debe usar el menú. Con el modo apagado devuelve la real,
     * así que la navegación se comporta igual que siempre.
     */
    identidadEfectiva(real: IdentidadEfectiva): IdentidadEfectiva {
      if (this.persona) {
        return {
          role: this.persona.role,
          internalRole: this.persona.internalRole,
          isInternal: this.persona.isInternal,
        }
      }
      if (this.rol) {
        return { role: 'user', internalRole: this.rol, isInternal: true }
      }
      return real
    },
  },
})

export const ROLES_INTERNOS: Record<string, string> = {
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
  sales_executive: 'Ejecutivo de ventas',
}
