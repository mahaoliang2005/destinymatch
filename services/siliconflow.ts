
import OpenAI from 'openai';
import { AnalysisResult, PartnerVibe } from '../types';

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;

// 检查是否使用模拟模式（没有配置有效 API Key 时）
const USE_MOCK = !SILICONFLOW_API_KEY || SILICONFLOW_API_KEY.includes('your_') || SILICONFLOW_API_KEY.includes('test');

// 初始化 SiliconFlow 客户端（仅在非模拟模式下）
const client = USE_MOCK ? null : new OpenAI({
    baseURL: 'https://api.siliconflow.cn/v1',
    apiKey: SILICONFLOW_API_KEY,
    dangerouslyAllowBrowser: true,
});

/**
 * 风格名称映射
 */
const vibeNames: Record<PartnerVibe, string> = {
    gentle: '温柔型',
    sunny: '阳光型',
    intellectual: '知性型',
    mysterious: '神秘型'
};

/**
 * 系统提示词
 */
const SYSTEM_PROMPT = `你是一位精通东方玄学的"缘分大师"，擅长根据用户的伴侣风格偏好，生成富有诗意和神秘感的缘分解读。

要求：
1. 语气神秘但不迷信，有趣但不轻浮
2. 融合东方玄学元素（月老、红线、前世今生等）与现代心理学
3. 内容要积极正面，给用户美好的期待
4. 避免过于具体的个人信息（因为你不知道用户的具体情况）
5. 使用中文回答，语言要优美流畅

输出必须是严格的 JSON 格式，包含以下字段：
- interpretation: 缘分解读（200 字左右，诗意化描述你们的缘分，包含相遇场景、相处模式等）
- emotionalResonance: 情感共鸣分析（描述你们在情感上的契合点，50-80 字）
- communicationStyle: 沟通风格分析（描述你们的相处和沟通模式，50-80 字）
- coreValues: 核心价值观分析（描述你们在价值观上的契合，50-80 字）
- partnerType: 伴侣类型标签（简短有力的标签，如"命中注定的知己"、"灵魂伴侣"等，8 个字以内）`;

/**
 * 模拟缘分解读数据（基于风格和分数）
 */
const generateMockAnalysis = (
    vibe: PartnerVibe,
    score: number
): Omit<AnalysisResult, 'score' | 'partnerImageBase64'> => {
    const levelText = score >= 91 ? '命中注定' :
        score >= 81 ? '天作之合' :
            score >= 71 ? '情投意合' : '有缘相识';

    const mockData: Record<PartnerVibe, any> = {
        gentle: {
            interpretation: `你们的缘分如同春风拂面，温润而细腻。在茫茫人海中，命运将你们牵引到一起。${score > 80 ? '你们的灵魂有着奇妙的共鸣，' : '虽然起步平淡，但'}温柔的她会如月光般照亮你的生活。你们可能在一次安静的午后相遇，那份宁静中的心动将成为永恒的记忆。相处时，她会用细腻的关怀包裹着你，让每一天都充满温暖。`,
            emotionalResonance: '你们的情感深度契合，她的温柔能抚平你所有的疲惫，你给予的安全感让她绽放光彩。',
            communicationStyle: '你们善于倾听彼此，即使在沉默中也能感受到对方的心意，沟通总是充满耐心与理解。',
            coreValues: '你们都珍视真挚的情感与家庭的温暖，追求平淡中的幸福，这份共识让你们的纽带更加牢固。',
            partnerType: score >= 81 ? '灵魂伴侣' : '温柔知己'
        },
        sunny: {
            interpretation: `你们的相遇像阳光穿透云层，瞬间点亮了彼此的世界。${score > 80 ? '这是命运最美好的安排，' : '虽然偶然，但'}充满活力的她会带你探索生活的无限可能。你们可能在一次户外运动或旅行中相识，她灿烂的笑容让你无法移开视线。在一起的日子总是充满惊喜与欢笑，她教会你用全新的视角看待世界。`,
            emotionalResonance: '她的正能量感染着你，你的沉稳给予她依靠，你们在感情中形成完美的互补。',
            communicationStyle: '你们之间充满轻松愉快的对话，即使是平凡的日子也能聊出趣味，笑声是你们沟通的桥梁。',
            coreValues: '你们都热爱自由与冒险，追求真实而鲜活的生活体验，这份共同的理念让关系充满活力。',
            partnerType: score >= 81 ? '阳光伴侣' : '活力拍档'
        },
        intellectual: {
            interpretation: `你们的缘分建立在思想的共鸣之上，如两本契合的书籍被命运摆放在了一起。${score > 80 ? '这是灵魂深处的相遇，' : '虽然开始缓慢，但'}聪慧内敛的她能与你进行超越表面的深度交流。你们可能在一场讲座或文化活动中相遇，一次深入的对话让你们彼此倾心。相处中，你们互相启发，共同成长。`,
            emotionalResonance: '你们在精神层面高度契合，思想的碰撞带来心灵的愉悦，这种默契弥足珍贵。',
            communicationStyle: '你们享受有深度的对话，从哲学到艺术无所不谈，彼此的思想在交流中不断升华。',
            coreValues: '你们都追求智慧与成长，珍视内在的充实胜过外在的繁华，这份共识让关系历久弥新。',
            partnerType: score >= 81 ? '灵魂知己' : '智慧伴侣'
        },
        mysterious: {
            interpretation: `你们的缘分带着神秘的色彩，如同命运编织的一场美丽谜题。${score > 80 ? '这是跨越时空的注定相遇，' : '虽然充满未知，但'}独特迷人的她有着让人想要探索的魅力。你们的相遇可能充满戏剧性，或许是一次意料之外的邂逅。她带你走进一个充满惊喜的世界，生活因她而充满神秘与期待。`,
            emotionalResonance: '你们之间有着说不清道不明的吸引力，像是前世的记忆在今生延续，情感深邃而迷人。',
            communicationStyle: '你们的交流充满默契与暗示，有时一个眼神胜过千言万语，这种神秘的联系独一无二。',
            coreValues: '你们都珍视独特性与真实自我，追求不落俗套的人生体验，这份共鸣让关系与众不同。',
            partnerType: score >= 81 ? '命中注定的谜' : '神秘伴侣'
        }
    };

    return {
        ...mockData[vibe],
        partnerType: `${levelText} · ${mockData[vibe].partnerType}`
    };
};

/**
 * 使用 DeepSeek 生成缘分解读
 * @param vibe 伴侣风格
 * @param score 般配度分数
 * @returns 分析结果
 */
export const generateDestinyAnalysis = async (
    vibe: PartnerVibe,
    score: number
): Promise<Omit<AnalysisResult, 'score' | 'partnerImageBase64'>> => {
    // 模拟模式：返回预设数据
    if (USE_MOCK) {
        console.log('[MOCK] 模拟生成缘分解读：', vibe, score);
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        return generateMockAnalysis(vibe, score);
    }

    const levelText = score >= 91 ? '命中注定 - 跨越时空的缘分' :
        score >= 81 ? '天作之合 - 命运精心安排' :
            score >= 71 ? '情投意合 - 灵魂奇妙共鸣' :
                '有缘相识 - 缘分暗中牵引';

    const userPrompt = `用户选择了"${vibeNames[vibe]}"风格的伴侣。

两人的般配度为 ${score}%。

般配度等级：${levelText}

请生成一份个性化的缘分解读，以 JSON 格式返回。`;

    try {
        const response = await client!.chat.completions.create({
            model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 800,
            response_format: { type: 'json_object' },
            stream: false
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            throw new Error('DeepSeek 返回空内容');
        }

        try {
            const result = JSON.parse(content);

            return {
                interpretation: result.interpretation || '',
                emotionalResonance: result.emotionalResonance || '',
                communicationStyle: result.communicationStyle || '',
                coreValues: result.coreValues || '',
                partnerType: result.partnerType || '命中注定的 TA'
            };
        } catch (error) {
            console.error('解析 DeepSeek 响应失败：', error);
            console.error('原始内容：', content);
            // 解析失败时降级到模拟模式
            return generateMockAnalysis(vibe, score);
        }
    } catch (error) {
        console.error('DeepSeek API 调用失败：', error);
        // 出错时降级到模拟模式
        console.log('[MOCK] API 失败，使用模拟数据');
        return generateMockAnalysis(vibe, score);
    }
};
