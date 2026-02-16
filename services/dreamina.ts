
import OpenAI from 'openai';
import { PartnerVibe } from '../types';

const ARK_API_KEY = process.env.DREAMINA_API_KEY;

// 检查是否使用模拟模式（没有配置有效 API Key 时）
const USE_MOCK = !ARK_API_KEY || ARK_API_KEY.includes('your_') || ARK_API_KEY.includes('test');

// 初始化 Ark 客户端（仅在非模拟模式下）
const client = USE_MOCK ? null : new OpenAI({
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: ARK_API_KEY,
    dangerouslyAllowBrowser: true,
});

/**
 * 模拟伴侣照片 URL（基于风格）
 */
const mockPartnerImages: Record<PartnerVibe, string> = {
    gentle: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    sunny: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    intellectual: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    mysterious: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80'
};

/**
 * 风格提示词映射
 */
const vibePrompts: Record<PartnerVibe, string> = {
    gentle: '温柔气质，自然微笑，柔和眼神，亲和力强，自然光生活照，真实自然',
    sunny: '阳光活力，开朗笑容，健康自然，邻家感，户外自然光，生活照风格',
    intellectual: '知性沉稳，自然神态，文艺气质，书卷感，日常场景，真实生活照',
    mysterious: '独特气质，神秘眼神，艺术气息，个性风格，自然光影，真实生活照'
};

/**
 * 使用即梦 AI 生成伴侣照片
 * @param userImageBase64 用户上传的照片 (Base64)
 * @param vibe 伴侣风格
 * @returns 生成的伴侣照片 URL
 */
export const generatePartnerImage = async (
    userImageBase64: string,
    vibe: PartnerVibe
): Promise<string> => {
    // 模拟模式：返回预设图片
    if (USE_MOCK) {
        console.log('[MOCK] 模拟生成伴侣照片：', vibe);
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        return mockPartnerImages[vibe];
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
            throw new Error('图像生成失败：未返回有效图片 URL');
        }

        return imageUrl;
    } catch (error) {
        console.error('即梦 API 调用失败：', error);
        // 出错时降级到模拟模式
        console.log('[MOCK] API 失败，使用模拟图片');
        return mockPartnerImages[vibe];
    }
};
