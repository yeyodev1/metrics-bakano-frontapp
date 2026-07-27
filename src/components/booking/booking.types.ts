export type ExpertKey = 'soporte' | 'meta' | 'ventas'

export interface BookingExpert {
  key: ExpertKey
  name: string
  role: string
  photo: string
  initials: string
  color: string
  gradient: string
  accentBg: string
  accentBorder: string
  shadowColor: string
  topics: string[]
  url: string
  warning: string
  warningDesc: string
  icon: string
}

export interface SalesEvidenceUpload {
  file: File
  description: string
}

export interface SalesBookingPayload {
  salesApproach: string
  commonObjection: string
  otherObjection: string
  evidence: SalesEvidenceUpload[]
}
