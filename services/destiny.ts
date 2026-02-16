
import { AnalysisResult, PartnerVibe } from '../types';
import { generatePartnerImage } from './dreamina';
import { generateDestinyAnalysis } from './siliconflow';

/**
 * 生成般配度分数
 * 控制在 60-98 之间，避免过低打击用户
 * 使用加权随机，让高分概率更大
 */
const generateCompatibilityScore = (): number => {
  const weights = [
    { range: [60, 70], weight: 0.15 },  // 有缘相识 15%
    { range: [71, 80], weight: 0.25 },  // 情投意合 25%
    { range: [81, 90], weight: 0.35 },  // 天作之合 35%
    { range: [91, 98], weight: 0.25 }   // 命中注定 25%
  ];

  const random = Math.random();
  let cumulativeWeight = 0;

  for (const item of weights) {
    cumulativeWeight += item.weight;
    if (random <= cumulativeWeight) {
      return Math.floor(Math.random() * (item.range[1] - item.range[0] + 1)) + item.range[0];
    }
  }

  return 85; // 默认分数
};

/**
 * 完整的命运匹配分析流程
 * 1. 生成般配度分数
 * 2. 调用即梦生成伴侣照片
 * 3. 调用 DeepSeek 生成缘分解读
 */
export const runDestinyMatch = async (
  userImageBase64: string,
  vibe: PartnerVibe
): Promise<AnalysisResult> => {
  // 1. 客户端生成般配度分数
  const score = generateCompatibilityScore();

  // 2. 并行调用两个服务
  const [partnerImageUrl, analysis] = await Promise.all([
    // 即梦：生成伴侣照片
    generatePartnerImage(userImageBase64, vibe),
    // DeepSeek：生成缘分解读
    generateDestinyAnalysis(vibe, score)
  ]);

  return {
    ...analysis,
    score,
    partnerImageBase64: partnerImageUrl
  };
};

/**
 * 导出单独的服务函数（便于测试和单独使用）
 */
export { generatePartnerImage } from './dreamina';
export { generateDestinyAnalysis } from './siliconflow';
