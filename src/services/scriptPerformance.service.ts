import APIBase from './httpBase'

export type PerformanceMetric = 'views' | 'leads'

export interface ScoredVideo {
  videoItemId: string
  planningId: string
  numero: number
  tema: string
  guionResumen: string
  igPermalink?: string
  fechaPublicacion?: string
  tipoGuion?: string
  objetivo?: string
  hookType?: string
  formato?: string
  elementos?: Record<string, boolean>
  value: number
  measuredAt: 'normalized' | 'latest'
  leadSource?: 'ads' | 'proxy'
  share: number
  cumulativeShare: number
}

export interface DimensionStat {
  dimension: string
  bucket: string
  n: number
  avg: number
  median: number
  total: number
  liftPct: number
  lowConfidence: boolean
}

export interface ParetoResult {
  metric: PerformanceMetric
  month?: string
  totalVideos: number
  totalValue: number
  thresholdIndex: number
  winnersCount: number
  /** Real share those winners represent — may be 0.83, not a forced 0.8. */
  actualShare: number
  winnersRatio: number
  videos: ScoredVideo[]
  byDimension: DimensionStat[]
  insights: string[]
  leadSourceMix?: { ads: number; proxy: number }
}

export interface MetricSnapshot {
  _id: string
  date: string
  ageDays?: number
  views: number
  reach: number
  likes: number
  comments: number
  saved: number
  shares: number
  profileVisits: number
  follows: number
  adSpend: number
  adLeads: number
  adROAS: number
  source: 'organic' | 'ads' | 'merged'
}

export interface CrossWorkspaceRow {
  workspaceId: string
  workspaceName: string
  vertical?: string
  totalVideos: number
  totalValue: number
  avgValue: number
  winnersCount: number
  actualShare: number
  topDimensions: DimensionStat[]
}

class ScriptPerformanceService extends APIBase {
  async getWorkspacePerformance(
    workspaceId: string,
    options: { metric?: PerformanceMetric; month?: string } = {}
  ): Promise<ParetoResult> {
    const params: Record<string, string> = {}
    if (options.metric) params['metric'] = options.metric
    if (options.month) params['month'] = options.month

    const res = await this.get<{ performance: ParetoResult }>(
      `script-performance/${workspaceId}`,
      undefined,
      { params }
    )
    return res.data.performance
  }

  async getItemTimeline(workspaceId: string, itemId: string): Promise<MetricSnapshot[]> {
    const res = await this.get<{ timeline: MetricSnapshot[] }>(
      `script-performance/${workspaceId}/items/${itemId}/timeline`
    )
    return res.data.timeline
  }

  async getCrossWorkspace(
    options: { vertical?: string; metric?: PerformanceMetric; month?: string } = {}
  ): Promise<{ workspaces: CrossWorkspaceRow[] }> {
    const params: Record<string, string> = {}
    if (options.vertical) params['vertical'] = options.vertical
    if (options.metric) params['metric'] = options.metric
    if (options.month) params['month'] = options.month

    const res = await this.get<{ comparison: { workspaces: CrossWorkspaceRow[] } }>(
      'script-performance/cross-workspace',
      undefined,
      { params }
    )
    return res.data.comparison
  }

  async classifyScript(
    planningId: string,
    itemId: string,
    force = false
  ): Promise<{ scriptMeta: unknown; skipped?: string; message: string }> {
    const res = await this.post<{ scriptMeta: unknown; skipped?: string; message: string }>(
      `video-planning/${planningId}/items/${itemId}/classify`,
      { force },
      undefined,
      // Gemini classification regularly exceeds the 15s default.
      { timeout: 60000 }
    )
    return res.data
  }
}

export const scriptPerformanceService = new ScriptPerformanceService()
