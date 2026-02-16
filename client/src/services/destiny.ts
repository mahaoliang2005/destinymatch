import { AnalysisResult, PartnerVibe } from '../types';
import { getUserId } from '../utils/userId';

/**
 * API response type
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Complete destiny match analysis flow
 * Calls the backend API which:
 * 1. Generates compatibility score (server-side)
 * 2. Calls Dreamina to generate partner image, saves to disk
 * 3. Calls DeepSeek to generate destiny analysis
 * 4. Returns combined result with image URLs
 *
 * This approach:
 * - Keeps API keys secure (server-side only)
 * - Solves CORS issues by fetching images server-side
 * - Returns image URLs instead of base64 to save localStorage space
 */
export const runDestinyMatch = async (
  userImageUrl: string,
  vibe: PartnerVibe
): Promise<AnalysisResult> => {
  const userId = getUserId();

  // Call backend API (proxy configuration in vite.config.ts for dev)
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId, // 添加用户ID
    },
    body: JSON.stringify({
      userImageUrl,
      vibe,
    }),
  });

  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || '今日次数已用完，请明天再试'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `API request failed: ${response.status}`
    );
  }

  const result: ApiResponse<AnalysisResult> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Analysis failed');
  }

  return result.data;
};
