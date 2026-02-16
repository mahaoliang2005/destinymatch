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

export interface AnalyzeRequest {
  userImageUrl: string;
  vibe: PartnerVibe;
  userId?: string; // 可选：用户ID用于追踪
}

// 限流相关响应类型
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetDate: string; // YYYY-MM-DD
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
