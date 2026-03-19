export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'rating'
  | 'nps'
  | 'yes_no'
  | 'dropdown'
  | 'date'

export interface IQuestion {
  id: string
  type: QuestionType
  label: string
  required: boolean
  options?: string[]
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
}

export interface ISurvey {
  _id: string
  title: string
  description?: string
  questions: IQuestion[]
  createdBy: { _id: string; name: string; email: string } | string
  authorizedSenders?: ({ _id: string; name: string; email: string } | string)[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface ISurveyAssignment {
  _id: string
  surveyId: ISurvey | string
  workspaceId: string
  recipientId: { _id: string; name?: string; email: string } | string
  sentBy: { _id: string; name?: string; email: string } | string
  token: string
  status: 'pending' | 'completed'
  sentAt: string
  completedAt?: string
}

export interface ISurveyResponse {
  _id: string
  assignmentId: string
  surveyId: string
  respondentId: string
  answers: { questionId: string; value: any }[]
  submittedAt: string
}
