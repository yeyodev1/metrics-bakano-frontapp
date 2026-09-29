import APIBase from './httpBase'

/** Lo que el equipo necesita saber de un cliente antes de planificarle. */
export interface ContextoCliente {
  pago: {
    vinculado: boolean
    /** Sin facturas vencidas: ve y aprueba sus guiones. */
    alDia: boolean
    deudaTexto: string | null
    facturasVencidas: number
  }
  destacar: { texto: string; en: string; porNombre?: string; fuente: 'cliente' | 'equipo' } | null
}

class ContextoClienteService extends APIBase {
  async ver(workspaceId: string): Promise<ContextoCliente> {
    const res = await this.get<ContextoCliente>(`contexto-cliente/${workspaceId}`)
    return res.data
  }
}

export const contextoClienteService = new ContextoClienteService()
