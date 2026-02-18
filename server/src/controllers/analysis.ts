import { Request, Response } from 'express';
import { AnalyzeRequest, ApiResponse, AnalysisResult, PartnerVibe } from '../types/index.js';
import { generatePartnerImage } from '../services/dreamina.js';
import { generateDestinyAnalysis } from '../services/siliconflow.js';
import { saveImageFromBuffer } from '../services/imageStorage.js';

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

        // Prepare the user image URL for Dreamina API
        // For local images (/images/...), construct full public URL
        // For remote URLs, use as-is
        let finalImageUrl: string;
        if (userImageUrl.startsWith('/images/')) {
            // Local image - need to construct full public URL
            const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://destiny.mahaoliang.tech';
            finalImageUrl = `${publicBaseUrl}${userImageUrl}`;
        } else {
            // Remote URL - use directly
            finalImageUrl = userImageUrl;
        }
        console.log('[Analysis] Final image URL for Dreamina:', finalImageUrl.substring(0, 50) + '...');

        // 2. Parallel calls to image generation and text analysis
        const [partnerImageData, analysis] = await Promise.all([
            // Dreamina: Generate partner photo (returns buffer)
            generatePartnerImage(finalImageUrl, vibe as PartnerVibe),
            // DeepSeek: Generate destiny analysis
            generateDestinyAnalysis(vibe as PartnerVibe, score)
        ]);

        // 3. Save partner image to disk and get URL
        const partnerImageUrl = await saveImageFromBuffer(partnerImageData.buffer, partnerImageData.contentType);
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
