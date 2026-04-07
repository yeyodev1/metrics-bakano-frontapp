import APIBase from './httpBase'

export interface ChangelogChange {
  type: 'new' | 'improved' | 'fix' | 'removed'
  text: string
}

export interface ChangelogVersion {
  version: string
  date: string
  title: string
  summary: string
  changes: ChangelogChange[]
}

export interface ChangelogData {
  versions: ChangelogVersion[]
}

class ChangelogService extends APIBase {
  async getChangelog(): Promise<ChangelogData> {
    const res = await this.get<ChangelogData>('changelog')
    return res.data
  }

  async sendChangelog(versionIndex = 0): Promise<{ sent: number; failed: number; total: number; version: string }> {
    const res = await this.post<{ sent: number; failed: number; total: number; version: string }>(
      'changelog/send',
      { versionIndex }
    )
    return res.data
  }
}

export const changelogService = new ChangelogService()
