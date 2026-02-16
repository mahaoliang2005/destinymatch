import { Request, Response } from 'express';
import { AnalyzeRequest, ApiResponse, AnalysisResult, PartnerVibe } from '../types/index.js';
import { generatePartnerImage } from '../services/dreamina.js';
import { generateDestinyAnalysis } from '../services/siliconflow.js';
import { saveImage } from '../services/imageStorage.js';
import { fetchImageAsBase64 } from '../services/imageProxy.js';

/**
 * Generate compatibility score
 * Controlled between 60-98 to avoid discouraging users
 * Uses weighted random for higher score probability
 */
const generateCompatibilityScore = (): number => {
  const weights = [
    { range: [60, 70], weight: 0.15 },  // Acquainted by fate 15%
    { range: [71, 80], weight: 0.25 },  // Soul resonance 25%
    { range: [81, 90], weight: 0.35 },  // Perfect match 35%
    { range: [91, 98], weight: 0.25 }   // Destined 25%
  ];

  const random = Math.random();
  let cumulativeWeight = 0;

  for (const item of weights) {
    cumulativeWeight += item.weight;
    if (random <= cumulativeWeight) {
      return Math.floor(Math.random() * (item.range[1] - item.range[0] + 1)) + item.range[0];
    }
  }

  return 85; // Default score
};

/**
 * POST /api/analyze
 * Main analysis endpoint that:
 * 1. Generates compatibility score
 * 2. Calls Dreamina to generate partner image, saves to disk, returns URL
 * 3. Calls DeepSeek to generate destiny analysis
 */
export const analyze = async (
  req: Request,
  res: Response<ApiResponse<AnalysisResult>>
): Promise<void> => {
  try {
    const { userImageUrl, vibe } = req.body as AnalyzeRequest;

    // Validate request
    if (!userImageUrl || typeof userImageUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing or invalid userImageUrl field'
        }
      });
      return;
    }

    if (!vibe || !['gentle', 'sunny', 'intellectual', 'mysterious'].includes(vibe)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing or invalid vibe field (must be gentle, sunny, intellectual, or mysterious)'
        }
      });
      return;
    }

    console.log('[Analysis] Starting analysis for vibe:', vibe);
    console.log('[Analysis] User image URL:', userImageUrl.substring(0, 50) + '...');

    // 1. Generate compatibility score on server side
    const score = generateCompatibilityScore();
    console.log('[Analysis] Generated score:', score);

    // Fetch the user image as base64 for the Dreamina API
    // User image URL could be either a local path (/images/...) or a remote URL
    let userImageBase64: string;
    if (userImageUrl.startsWith('/images/')) {
      // Local image - read from disk
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const imagePath = path.join(__dirname, '../../public', userImageUrl);
      const buffer = fs.readFileSync(imagePath);
      userImageBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } else {
      // Remote URL - fetch it
      userImageBase64 = await fetchImageAsBase64(userImageUrl);
    }

    // 2. Parallel calls to image generation and text analysis
    const [partnerImageBase64, analysis] = await Promise.all([
      // Dreamina: Generate partner photo (returns base64)
      generatePartnerImage(userImageBase64, vibe as PartnerVibe),
      // DeepSeek: Generate destiny analysis
      generateDestinyAnalysis(vibe as PartnerVibe, score)
    ]);

    // 3. Save partner image to disk and get URL
    const partnerImageUrl = saveImage(partnerImageBase64);
    console.log('[Analysis] Saved partner image:', partnerImageUrl);

    console.log('[Analysis] Analysis complete');

    // 4. Return combined result with URL
    const result: AnalysisResult = {
      ...analysis,
      score,
      partnerImageUrl
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Analysis] Analysis failed:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : 'Analysis failed'
      }
    });
  }
};

/**
 * GET /api/health
 * Health check endpoint
 */
export const health = (req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      mockMode: !process.env.DREAMINA_API_KEY || !process.env.SILICONFLOW_API_KEY
    }
  });
};
