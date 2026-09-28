import APIBase from './httpBase'

export interface HerramientaMcp {
  nombre: string
  titulo: string
  escribe: boolean
}

export interface ConexionMcp {
  id: string
  app: string
  desde: string
  ultimoUso: string | null
}

export interface MiConexionMcp {
  url: string
  guia: string
  perfil: string
  perfilNombre: string
  herramientas: HerramientaMcp[]
  conexiones: ConexionMcp[]
}

/** La conexión con Claude (MCP del equipo) vista desde metrics. */
class McpService extends APIBase {
  async miConexion(): Promise<MiConexionMcp> {
    const res = await this.get<MiConexionMcp>('mcp/mi-conexion')
    return res.data
  }

  async desconectar(id: string): Promise<void> {
    await this.delete(`mcp/conexiones/${id}`)
  }
}

export const mcpService = new McpService()
