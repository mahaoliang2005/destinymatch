import { Router, Request, Response, NextFunction } from 'express';
import { analyze, health } from '../controllers/analysis.js';
import { saveImage } from '../services/imageStorage.js';
import { checkAndIncrementUsage } from '../services/usageTracker.js';

const router = Router();

// Health check endpoint
router.get('/health', health);

// Upload image endpoint - saves base64 image to disk and returns URL
router.post('/upload-image', (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing or invalid imageBase64 field'
        }
      });
      return;
    }

    // Save image to disk and get URL path
    const imageUrl = saveImage(imageBase64);

    res.json({
      success: true,
      data: {
        imageUrl
      }
    });
  } catch (error) {
    console.error('[Upload] Failed to save image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save image'
      }
    });
  }
});

// Main analysis endpoint with rate limiting
router.post('/analyze', (req: Request, res: Response, next: NextFunction) => {
  // 从 header 或 body 获取 userId
  const userId = (req.headers['x-user-id'] as string) || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_USER_ID',
        message: 'Missing user identification'
      }
    });
  }

  const { allowed, remaining } = checkAndIncrementUsage(userId);

  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '今日次数已用完，请明天再试'
      }
    });
  }

  // 设置响应头告知剩余次数
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Limit', '5');

  next();
}, analyze);

export default router;
