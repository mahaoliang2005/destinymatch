import OpenAI from 'openai';
import { PartnerVibe } from '../types/index.js';
import { fetchImageAsBase64 } from './imageProxy.js';

const ARK_API_KEY = process.env.DREAMINA_API_KEY;

// Check if using mock mode (no valid API Key configured)
const USE_MOCK = !ARK_API_KEY || ARK_API_KEY.includes('your_') || ARK_API_KEY.includes('test');

// Initialize Ark client (only in non-mock mode)
const client = USE_MOCK ? null : new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: ARK_API_KEY,
});

/**
 * Mock partner photo URLs (based on vibe)
 */
const mockPartnerImages: Record<PartnerVibe, string> = {
  gentle: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  sunny: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  intellectual: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  mysterious: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80'
};

/**
 * Vibe prompt mapping
 */
const vibePrompts: Record<PartnerVibe, string> = {
  gentle: '温柔气质，自然微笑，柔和眼神，亲和力强，自然光生活照，真实自然',
  sunny: '阳光活力，开朗笑容，健康自然，邻家感，户外自然光，生活照风格',
  intellectual: '知性沉稳，自然神态，文艺气质，书卷感，日常场景，真实生活照',
  mysterious: '独特气质，神秘眼神，艺术气息，个性风格，自然光影，真实生活照'
};

/**
 * Generate partner image using Dreamina (即梦 AI)
 * Server-side: fetches the generated image and converts to base64
 * @param userImageBase64 User uploaded photo (Base64)
 * @param vibe Partner vibe
 * @returns Generated partner photo as base64
 */
export const generatePartnerImage = async (
  userImageBase64: string,
  vibe: PartnerVibe
): Promise<string> => {
  // Mock mode: return preset image converted to base64
  if (USE_MOCK) {
    console.log('[MOCK] Generating mock partner image:', vibe);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch the mock image and convert to base64 for consistency
    try {
      return await fetchImageAsBase64(mockPartnerImages[vibe]);
    } catch (error) {
      console.error('Failed to fetch mock image:', error);
      // Return a placeholder if fetch fails
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyRDFBMjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+6LSo6YeP55So5oi3PC90ZXh0Pjwvc3ZnPg==';
    }
  }

  const prompt = `基于参考图中的人物特征，想象并生成一位与 TA 般配的理想伴侣照片。这是一张单人肖像照。画面中只能出现这位新生成的伴侣（人物 B），绝对不要在画面中包含参考图中的原始人物（人物 A），且 A 与 B 互为异性。${vibePrompts[vibe]}，自然真实的生活照，邻家感，不是精修写真，看起来像真实会见到的人，与上传照片中的人看起来很般配`;

  try {
    const imagesResponse = await (client!.images.generate as any)({
      model: 'ep-20260106225752-q46qg',
      prompt: prompt,
      size: '2K',
      response_format: 'url',
      extra_body: {
        image: userImageBase64,
        watermark: true,
        sequential_image_generation: 'disabled'
      }
    });

    const imageUrl = imagesResponse.data[0]?.url;

    if (!imageUrl) {
      throw new Error('Image generation failed: no valid image URL returned');
    }

    console.log('[Dreamina] Generated image URL:', imageUrl.substring(0, 50) + '...');

    // Fetch the image and convert to base64 to avoid CORS issues on frontend
    const base64Image = await fetchImageAsBase64(imageUrl);
    console.log('[Dreamina] Converted to base64, length:', base64Image.length);

    return base64Image;
  } catch (error) {
    console.error('Dreamina API call failed:', error);
    // Fall back to mock mode on API error
    console.log('[MOCK] API failed, using mock image');
    return fetchImageAsBase64(mockPartnerImages[vibe]);
  }
};
