import OpenAI from 'openai';
import { PartnerVibe } from '../types/index.js';
import { fetchImageAsBuffer, FetchedImage } from './imageProxy.js';

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
 * Server-side: fetches the generated image and returns as buffer
 * @param userImageUrl User uploaded photo URL (publicly accessible)
 * @param vibe Partner vibe
 * @returns Generated partner photo as buffer with content type
 */
export const generatePartnerImage = async (
    userImageUrl: string,
    vibe: PartnerVibe
): Promise<FetchedImage> => {
    // Mock mode: return preset image as buffer
    if (USE_MOCK) {
        console.log('[MOCK] Generating mock partner image:', vibe);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch the mock image and return as buffer for consistency
        try {
            return await fetchImageAsBuffer(mockPartnerImages[vibe]);
        } catch (error) {
            console.error('Failed to fetch mock image:', error);
            // Return a placeholder SVG as buffer if fetch fails
            const svgPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMyRDFBMjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjRkZENzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+6LSo6YeP55So5oi3PC90ZXh0Pjwvc3ZnPg==';
            const base64Data = svgPlaceholder.replace(/^data:image\/svg\+xml;base64,/, '');
            return {
                buffer: Buffer.from(base64Data, 'base64'),
                contentType: 'image/svg+xml'
            };
        }
    }

    const basePrompt = `必须生成与参考图人物生理性别完全相反的人物，单人物画面，仅 1 人出镜，画面仅包含这 1 位全新生成的异性人物，无其他任何人物，
                    彻底重构全部画面内容，生成与参考图完全不同的背景、服装、动作、光影，五官气质与参考图人物高度适配般配，有自然夫妻相，
                    生活化日常场景，自然随性穿搭，原生皮肤质感，无过度精修，面部清晰，光影自然，写实人像，真实相机拍摄效果。`;
    const prompt = `${basePrompt}${vibePrompts[vibe]}。`;


    console.log('[Dreamina] Calling API with userImageUrl:', userImageUrl.substring(0, 200) + '...');

    try {
        const imagesResponse = await (client!.images.generate as any)({
            model: 'ep-20260106225752-q46qg',
            prompt: prompt,
            size: '1K',
            response_format: 'url',
            extra_body: {
                image: userImageUrl,
                watermark: false,
                sequential_image_generation: 'disabled'
            }
        });

        const imageUrl = imagesResponse.data[0]?.url;

        if (!imageUrl) {
            throw new Error('Image generation failed: no valid image URL returned');
        }

        console.log('[Dreamina] Generated image URL:', imageUrl.substring(0, 200) + '...');

        // Fetch the image and return as buffer to avoid CORS issues on frontend
        const imageData = await fetchImageAsBuffer(imageUrl);
        console.log('[Dreamina] Fetched image buffer, size:', imageData.buffer.length, 'bytes');

        return imageData;
    } catch (error) {
        console.error('Dreamina API call failed:', error);
        // Fall back to mock mode on API error
        console.log('[MOCK] API failed, using mock image');
        return fetchImageAsBuffer(mockPartnerImages[vibe]);
    }
};
