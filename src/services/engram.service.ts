import APIBase from './httpBase'

export interface EngramEvidence {
  videoItemId: string
  tema?: string
  metrica: string
  valor: number
}

export interface EngramPattern {
  patron: string
  dimension?: string
  liftPct?: number
  evidencia?: EngramEvidence[]
}

export interface EngramToneRule {
  regla: string
  ejemploBueno?: string
  ejemploMalo?: string
}

export interface Engram {
  _id: string
  workspaceId: string
  version: number
  status: 'draft' | 'active' | 'archived'
  winningPatterns: EngramPattern[]
  losingPatterns: EngramPattern[]
  toneRules: EngramToneRule[]
  vocabularioMarca: string[]
  vocabularioProhibido: string[]
  basadoEn?: {
    metric: string
    month?: string
    videosAnalizados: number
    ganadores: number
  }
  approvedAt?: string
  createdAt: string
}

class EngramService extends APIBase {
  async getEngram(workspaceId: string): Promise<{ active: Engram | null; versions: Engram[] }> {
    const res = await this.get<{ active: Engram | null; versions: Engram[] }>(
      `engram/${workspaceId}`
    )
    return res.data
  }

  async rebuild(
    workspaceId: string,
    options: { metric?: 'views' | 'leads'; month?: string } = {}
  ): Promise<{ engram: Engram; message: string }> {
    const res = await this.post<{ engram: Engram; message: string }>(
      `engram/${workspaceId}/rebuild`,
      options,
      undefined,
      // Synthesis over a full month of scripts takes well past the 15s default.
      { timeout: 90000 }
    )
    return res.data
  }

  async activate(workspaceId: string, version: number): Promise<{ engram: Engram }> {
    const res = await this.patch<{ engram: Engram }>(
      `engram/${workspaceId}/${version}/activate`,
      {}
    )
    return res.data
  }
}

export const engramService = new EngramService()
