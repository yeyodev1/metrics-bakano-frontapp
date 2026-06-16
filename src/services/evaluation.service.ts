import APIBase from './httpBase';

export interface EvaluationInput {
  evaluatedUserId: string;
  workspaceId: string;
  rating: number;
  feedback: string;
}

export interface PositiveFeedback {
  rating: number;
  feedback: string;
  createdAt: string;
}

export interface TeamRanking {
  _id: string;
  name?: string;
  email: string;
  photoUrl?: string;
  internalRole?: string;
  averageRating: number;
  totalEvaluations: number;
  positiveFeedback: PositiveFeedback[];
}

class EvaluationService extends APIBase {
  async submitEvaluation(data: EvaluationInput): Promise<any> {
    const res = await this.post<any>('evaluations', data);
    return res.data;
  }

  async getTeamRanking(workspaceId: string): Promise<TeamRanking[]> {
    const res = await this.get<{ message: string; ranking: TeamRanking[] }>(`evaluations/workspace/${workspaceId}/ranking`);
    return res.data.ranking;
  }
}

export const evaluationService = new EvaluationService();
