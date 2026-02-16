
export type PartnerVibe = 'gentle' | 'sunny' | 'intellectual' | 'mysterious';

export interface AnalysisResult {
  score: number;
  interpretation: string;
  emotionalResonance: string;
  communicationStyle: string;
  coreValues: string;
  partnerType: string;
  partnerImageUrl?: string;
}

export interface HistoryRecord extends AnalysisResult {
  id: string;
  timestamp: number;
  userName: string;
  userImageUrl: string;
  vibe: PartnerVibe;
}

export enum AppStep {
  HOME,
  PRIVACY,
  UPLOAD,
  SELECT_VIBE,
  LOADING,
  RESULT,
  RECORDS,
  ERROR,
  RATE_LIMIT
}
