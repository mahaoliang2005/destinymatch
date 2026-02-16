# 命运匹配 (Destiny Match) - 技术实现文档

> 版本：v1.0
> 更新日期：2026-02-16
> 状态：基于现有架构的完整技术规范

---

## 1. 技术架构概览

### 1.1 技术栈选型

| 层级 | 技术 | 版本 | 说明 |
|-----|------|-----|------|
| 前端框架 | React | 19.2.4 | 函数式组件 + Hooks |
| 构建工具 | Vite | 6.2.0 | 快速开发服务器 + HMR |
| 开发语言 | TypeScript | 5.8.2 | 类型安全 |
| UI 样式 | Tailwind CSS | v3 (CDN) | 原子化 CSS |
| AI 服务 SDK | OpenAI | ^4.77.0 | 即梦 + 硅基流动 API 调用 |
| 包管理 | npm | - | ES Modules |

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         命运匹配应用                              │
├─────────────────────────┬───────────────────────────────────────┤
│      表现层 (Pages)      │           业务逻辑层                   │
├─────────────────────────┼───────────────────────────────────────┤
│  Home.tsx               │  App.tsx (状态管理中枢)                 │
│  Privacy.tsx            │    ├─ AppStep 状态机                   │
│  Upload.tsx             │    ├─ 用户数据状态                     │
│  SelectVibe.tsx         │    └─ 历史记录管理                     │
│  Loading.tsx            │                                       │
│  Result.tsx             │  services/dreamina.ts                 │
│  Records.tsx            │  services/siliconflow.ts              │
│  ErrorPage.tsx          │    └─ AI 图像/文本服务                 │
├─────────────────────────┴───────────────────────────────────────┤
│                         数据层                                   │
│  localStorage - 历史记录持久化                                    │
│  即梦 API - 图像生成服务                                          │
│  硅基流动 API - 文本生成服务                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 类型系统规范

### 2.1 核心类型定义

```typescript
// types.ts - 现有实现

export type PartnerVibe = 'gentle' | 'sunny' | 'intellectual' | 'mysterious';

export interface AnalysisResult {
  score: number;                    // 匹配度评分 (0-100)
  interpretation: string;           // 缘分解读文本
  emotionalResonance: string;       // 情感共鸣分析
  communicationStyle: string;       // 沟通风格分析
  coreValues: string;               // 核心价值观分析
  partnerType: string;              // 伴侣类型标签
  partnerImageBase64?: string;      // 生成伴侣照片 (可选)
}

export interface HistoryRecord extends AnalysisResult {
  id: string;                       // 唯一标识
  timestamp: number;                // 生成时间戳
  userName: string;                 // 用户名
  userImageBase64: string;          // 用户上传的照片
  vibe: PartnerVibe;                // 选择的风格
}

export enum AppStep {
  HOME,        // 首页
  PRIVACY,     // 隐私协议
  UPLOAD,      // 照片上传
  SELECT_VIBE, // 风格选择
  LOADING,     // 生成中
  RESULT,      // 结果展示
  RECORDS,     // 历史记录
  ERROR        // 错误页面
}
```

### 2.2 风格映射配置

```typescript
// 风格配置常量
export const VIBE_CONFIG: Record<PartnerVibe, {
  label: string;
  icon: string;
  description: string;
  prompt: string;
}> = {
  gentle: {
    label: '温柔型',
    icon: '💕',
    description: '如春风般温暖的 TA，善解人意，会给你最贴心的陪伴',
    prompt: 'soft, gentle eyes, warm smile, elegant, caring personality'
  },
  sunny: {
    label: '阳光型',
    icon: '☀️',
    description: '充满活力的 TA，笑容灿烂，会带你探索世界的美好',
    prompt: 'bright smile, energetic, sporty, outdoorsy, positive attitude'
  },
  intellectual: {
    label: '知性型',
    icon: '📚',
    description: '聪慧内敛的 TA，思想深邃，能与你进行灵魂对话',
    prompt: 'glasses, intellectual, sophisticated, calm, thoughtful'
  },
  mysterious: {
    label: '神秘型',
    icon: '🌙',
    description: '独特迷人的 TA，有着神秘的魅力，让生活充满惊喜',
    prompt: 'mysterious eyes, artistic, unique style, enigmatic aura'
  }
};
```

---

## 3. 状态管理设计

### 3.1 应用状态机

```typescript
// App.tsx 状态定义
const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.HOME);
const [userImage, setUserImage] = useState<string | null>(null);
const [selectedVibe, setSelectedVibe] = useState<PartnerVibe>('gentle');
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
const [history, setHistory] = useState<HistoryRecord[]>([]);
```

### 3.2 状态流转图

```
                    ┌─────────────┐
                    │    HOME     │
                    │    首页     │
                    └──────┬──────┘
                           │ handleStart()
                           ▼
                    ┌─────────────┐
              ┌─────│   PRIVACY   │─────┐
              │     │  隐私协议    │     │
              │     └──────┬──────┘     │
              │            │             │
   onDisagree │            │ onAgree()   │
              │            ▼             │
              │     ┌─────────────┐      │
              └────►│   UPLOAD    │      │
                    │  照片上传    │      │
                    └──────┬──────┘      │
                           │ onUpload()   │
                           ▼              │
                    ┌─────────────┐       │
                    │ SELECT_VIBE │       │
                    │  风格选择    │       │
                    └──────┬──────┘       │
                           │ onSelect()   │
                           ▼              │
                    ┌─────────────┐       │
      ┌────────────►│   LOADING   │       │
      │             │  生成中      │       │
      │             └──────┬──────┘       │
      │                    │              │
      │         失败       │ 成功         │
      │    ┌───────────────┴───────┐      │
      │    ▼                       ▼      │
      │ ┌─────────┐           ┌─────────┐ │
      └─│  ERROR  │           │ RESULT  │─┘
        │ 错误页   │           │ 结果页   │
        └────┬────┘           └────┬────┘
             │                     │
             │   onRestart()       │ onRestart()
             └─────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │       RECORDS       │
              │      历史记录       │
              └─────────────────────┘
```

### 3.3 历史记录持久化

```typescript
// 加载历史记录
useEffect(() => {
  const saved = localStorage.getItem('destiny_history');
  if (saved) {
    try {
      setHistory(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }
}, []);

// 保存历史记录
useEffect(() => {
  localStorage.setItem('destiny_history', JSON.stringify(history));
}, [history]);
```

---

## 4. AI 服务层设计

### 4.1 架构设计

采用**双服务架构**，完全移除 Gemini，使用国产 AI 服务：

| 服务 | 用途 | 接入方式 |
|-----|------|---------|
| **即梦 (Dreamina)** | AI 图像生成 | 字节跳动即梦专业版 API |
| **硅基流动 (SiliconFlow)** | DeepSeek 文本生成 | DeepSeek API 代理 |

### 4.2 服务一：即梦图像生成 (OpenAI SDK)

```typescript
// services/dreamina.ts

import OpenAI from 'openai';
import { PartnerVibe } from '../types';

const ARK_API_KEY = process.env.DREAMINA_API_KEY || '';

// 初始化 Ark 客户端
const client = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: ARK_API_KEY,
});

/**
 * 风格提示词映射
 */
const vibePrompts: Record<PartnerVibe, string> = {
  gentle: '温柔优雅的女性，柔和的眼神，温暖的微笑，长发，精致五官，柔和光线，写真风格',
  sunny: '阳光开朗的女性，灿烂笑容，活泼气质，运动风格，自然光线，青春活力，写真风格',
  intellectual: '知性优雅的女性，戴眼镜，沉稳气质，文艺风格，书卷气息，精致妆容，写真风格',
  mysterious: '神秘迷人的女性，独特气质，艺术感，深邃眼神，时尚风格，氛围感，写真风格'
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
  const prompt = `基于参考图中的人物，生成这位用户未来伴侣的照片。${vibePrompts[vibe]}，高清人像，专业摄影质感`;

  const imagesResponse = await (client.images.generate as any)({
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
};
```

### 4.3 服务二：硅基流动 DeepSeek 文本生成 (OpenAI SDK)

```typescript
// services/siliconflow.ts

import OpenAI from 'openai';
import { AnalysisResult, PartnerVibe } from '../types';

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || '';

// 初始化 SiliconFlow 客户端
const client = new OpenAI({
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: SILICONFLOW_API_KEY,
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
- interpretation: 缘分解读（200字左右，诗意化描述你们的缘分，包含相遇场景、相处模式等）
- emotionalResonance: 情感共鸣分析（描述你们在情感上的契合点，50-80字）
- communicationStyle: 沟通风格分析（描述你们的相处和沟通模式，50-80字）
- coreValues: 核心价值观分析（描述你们在价值观上的契合，50-80字）
- partnerType: 伴侣类型标签（简短有力的标签，如"命中注定的知己"、"灵魂伴侣"等，8个字以内）`;

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

  const levelText = score >= 91 ? '命中注定 - 跨越时空的缘分' :
    score >= 81 ? '天作之合 - 命运精心安排' :
    score >= 71 ? '情投意合 - 灵魂奇妙共鸣' :
    '有缘相识 - 缘分暗中牵引';

  const userPrompt = `用户选择了"${vibeNames[vibe]}"风格的伴侣。

两人的般配度为 ${score}%。

般配度等级：${levelText}

请生成一份个性化的缘分解读，以 JSON 格式返回。`;

  const response = await client.chat.completions.create({
    model: 'deepseek-ai/DeepSeek-V3.2',
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

  const result = JSON.parse(content);

  return {
    interpretation: result.interpretation || '',
    emotionalResonance: result.emotionalResonance || '',
    communicationStyle: result.communicationStyle || '',
    coreValues: result.coreValues || '',
    partnerType: result.partnerType || '命中注定的TA'
  };
};
```

### 4.4 组合服务：完整分析流程

```typescript
// services/destiny.ts

import { generatePartnerImage } from './dreamina';
import { generateDestinyAnalysis } from './siliconflow';
import { AnalysisResult, PartnerVibe } from '../types';

/**
 * 完整的命运匹配分析流程
 */
export const runDestinyMatch = async (
  userImageBase64: string,
  vibe: PartnerVibe
): Promise<AnalysisResult> => {
  // 1. 客户端生成般配度分数 (60-98 之间)
  const score = generateCompatibilityScore();

  // 2. 并行调用两个服务
  const [partnerImage, analysis] = await Promise.all([
    // 即梦：生成伴侣照片
    generatePartnerImage(userImageBase64, vibe),
    // DeepSeek：生成缘分解读
    generateDestinyAnalysis(vibe, score)
  ]);

  return {
    ...analysis,
    score,
    partnerImageBase64: partnerImage
  };
};

/**
 * 生成般配度分数
 * 控制在 60-98 之间，避免过低打击用户
 */
const generateCompatibilityScore = (): number => {
  // 使用加权随机，让高分概率更大
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
```

---

## 5. 页面组件详细规范

### 5.1 组件清单

| 页面 | 文件路径 | 输入 Props | 输出 Callbacks |
|-----|---------|-----------|---------------|
| 首页 | `pages/Home.tsx` | - | `onStart()`, `onGoToRecords()` |
| 隐私协议 | `pages/Privacy.tsx` | - | `onAgree()`, `onDisagree()` |
| 上传页 | `pages/Upload.tsx` | - | `onUpload(base64)`, `onBack()` |
| 风格选择 | `pages/SelectVibe.tsx` | - | `onSelect(vibe)`, `onBack()` |
| 生成中 | `pages/Loading.tsx` | - | - |
| 结果页 | `pages/Result.tsx` | `result`, `userImage`, `vibe` | `onRestart()` |
| 历史记录 | `pages/Records.tsx` | `history` | `onBack()` |
| 错误页 | `pages/ErrorPage.tsx` | - | `onRetry()`, `onBack()` |

### 5.2 页面 Props 接口

```typescript
// Home.tsx
interface HomeProps {
  onStart: () => void;
  onGoToRecords: () => void;
}

// Privacy.tsx
interface PrivacyProps {
  onAgree: () => void;
  onDisagree: () => void;
}

// Upload.tsx
interface UploadProps {
  onUpload: (base64: string) => void;
  onBack: () => void;
}

// SelectVibe.tsx
interface SelectVibeProps {
  onSelect: (vibe: PartnerVibe) => void;
  onBack: () => void;
}

// Result.tsx
interface ResultProps {
  result: AnalysisResult;
  userImage: string;
  vibe: PartnerVibe;
  onRestart: () => void;
}

// Records.tsx
interface RecordsProps {
  history: HistoryRecord[];
  onBack: () => void;
}

// ErrorPage.tsx
interface ErrorPageProps {
  onRetry: () => void;
  onBack: () => void;
}
```

---

## 6. 样式系统规范

### 6.1 颜色系统

```css
/* Tailwind 自定义配置 */
--primary: #e6195d;        /* 主色调 - 玫红 */
--primary-gold: #f4c025;   /* 强调色 - 金色 */
--primary-purple: #8311d4; /* 辅助色 - 紫色 */
--background-dark: #211116; /* 深色背景 */
--surface-dark: #2d161e;   /* 卡片背景 */
--gold: #FFD700;           /* 高亮文字 */
```

### 6.2 自定义 CSS 类

```css
/* 毛玻璃效果 */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 星空背景 */
.stars-bg {
  background:
    radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

/* 网格背景 */
.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(230, 25, 93, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(230, 25, 93, 0.1) 1px, transparent 1px);
}
```

### 6.3 动画效果

```css
/* 浮动动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
.animate-float { animation: float 6s ease-in-out infinite; }

/* 慢速脉冲 */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }

/* 闪光效果 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.animate-shimmer { animation: shimmer 2s linear infinite; }
```

---

## 7. 功能模块实现对照

### 7.1 已实现功能 ✅

| 需求ID | 功能 | 实现状态 | 实现文件 |
|-------|------|---------|---------|
| UM-001 | 首页入口 | ✅ | `pages/Home.tsx` |
| UM-003 | 历史记录 | ✅ | `App.tsx` + `pages/Records.tsx` |
| PM-001 | 照片上传 | ✅ | `pages/Upload.tsx` |
| PM-002 | 照片预览 | ✅ | `pages/Upload.tsx` |
| PM-003 | 风格选择 | ✅ | `pages/SelectVibe.tsx` |
| PM-004 | 隐私声明 | ✅ | `pages/Privacy.tsx` |
| AI-001 | AI 图像生成 | ✅ | `services/dreamina.ts` |
| AI-001 | AI 文本分析 | ✅ | `services/siliconflow.ts` |
| RM-001 | 结果展示 | ✅ | `pages/Result.tsx` |
| RM-003 | 重新生成 | ✅ | `pages/Result.tsx` |
| SM-001 | 错误处理 | ✅ | `pages/ErrorPage.tsx` |

### 7.2 待实现功能 📋

| 需求ID | 功能 | 优先级 | 建议实现方案 |
|-------|------|-------|-------------|
| UM-002 | 用户引导流程 | P1 | 新增 `pages/Onboarding.tsx` |
| AI-003 | 般配度算法 | P1 | ✅ 已实现于 `services/destiny.ts` |
| AI-004 | 即梦图像生成 | P0 | ✅ 已实现于 `services/dreamina.ts` |
| AI-004 | 即梦图像生成 | P1 | 新增 `services/dreamina.ts` |
| RM-002 | 分享功能 | P1 | 新增 `components/ShareModal.tsx` |
| RM-004 | 结果下载 | P2 | 使用 `html2canvas` |
| SM-002 | 性能优化 | P1 | 图片压缩、懒加载 |
| SM-003 | 数据统计 | P2 | 接入分析服务 |

---

## 8. 分享功能实现方案

### 8.1 分享卡片设计

```typescript
// components/ShareCard.tsx
interface ShareCardProps {
  userImage: string;
  partnerImage?: string;
  score: number;
  partnerType: string;
  interpretation: string;
}

// 使用 html2canvas 生成分享图
import html2canvas from 'html2canvas';

export const generateShareImage = async (elementId: string): Promise<string> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element, {
    backgroundColor: '#211116',
    scale: 2, // 高清输出
  });

  return canvas.toDataURL('image/png');
};
```

### 8.2 分享渠道

```typescript
// utils/share.ts

export const shareToWeChat = (imageBase64: string) => {
  // 复制图片到剪贴板或显示二维码
};

export const shareToWeibo = (text: string, imageBase64: string) => {
  // 打开微博分享链接
};

export const saveToLocal = (imageBase64: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageBase64;
  link.click();
};
```

---

## 9. 性能优化方案

### 9.1 图片处理

```typescript
// utils/image.ts

export const compressImage = (
  base64: string,
  maxWidth: number = 1024,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 计算缩放比例
      const scale = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = base64;
  });
};
```

### 9.2 懒加载

```typescript
// 历史记录图片懒加载
<img
  src={record.userImageBase64}
  loading="lazy"
  alt="历史记录"
/>
```

---

## 10. 错误处理规范

### 10.1 错误类型定义

```typescript
// types/error.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  AI_GENERATION_ERROR = 'AI_GENERATION_ERROR',
  IMAGE_PROCESSING_ERROR = 'IMAGE_PROCESSING_ERROR',
  FACE_DETECTION_ERROR = 'FACE_DETECTION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}
```

### 10.2 错误处理流程

```typescript
// App.tsx 错误处理
const runAnalysis = async (vibe: PartnerVibe) => {
  if (!userImage) return;
  setCurrentStep(AppStep.LOADING);

  try {
    const result = await analyzeDestiny(userImage, vibe);
    // 成功处理
  } catch (error) {
    console.error(error);
    // 区分错误类型
    if (error.message.includes('face')) {
      setErrorType(ErrorType.FACE_DETECTION_ERROR);
    } else if (error.message.includes('network')) {
      setErrorType(ErrorType.NETWORK_ERROR);
    } else {
      setErrorType(ErrorType.AI_GENERATION_ERROR);
    }
    setCurrentStep(AppStep.ERROR);
  }
};
```

---

## 11. API 接口规范

### 11.1 即梦 (Dreamina) API

| 属性 | 配置 |
|-----|------|
| 端点 | `https://ark.cn-beijing.volces.com/api/v3/images/generations` |
| 模型 | `ep-20260106225752-q46qg` |
| 图生图模式 | `image` 字段传入参考图 |
| 分辨率 | `2K` |
| 水印 | 开启 |
| 认证 | Bearer Token |

```typescript
// services/dreamina.ts
const DREAMINA_API_CONFIG = {
  endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
  model: 'ep-20260106225752-q46qg',
  params: {
    response_format: 'url',
    size: '2K',
    sequential_image_generation: 'disabled',
    watermark: true,
    stream: false
  }
};
```

### 11.2 硅基流动 DeepSeek API

| 属性 | 配置 |
|-----|------|
| 端点 | `https://api.siliconflow.cn/v1/chat/completions` |
| 模型 | `deepseek-ai/DeepSeek-V3.2` |
| 温度 | 0.8 |
| 最大 tokens | 800 |
| 响应格式 | JSON |
| 流式输出 | 关闭 |
| 认证 | Bearer Token |

```typescript
// services/siliconflow.ts
const SILICONFLOW_CONFIG = {
  endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
  model: 'deepseek-ai/DeepSeek-V3.2',
  temperature: 0.8,
  max_tokens: 800,
  response_format: { type: 'json_object' },
  stream: false,
  system_prompt: '你是一位精通东方玄学的"缘分大师"...',
};
```

---

## 12. 项目文件结构

```
destiny-match/
├── App.tsx                      # 应用主组件
├── index.tsx                    # 应用入口
├── index.html                   # HTML 模板 + Tailwind 配置
├── types.ts                     # TypeScript 类型定义
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 项目依赖
├── docs/                        # 文档目录
│   ├── functional-requirements.md  # 功能需求文档
│   ├── user-flow.md                # 用户流程文档
│   ├── technical-spec.md           # 技术实现文档 (本文档)
│   └── ideal.md                    # 项目想法文档
├── pages/                       # 页面组件
│   ├── Home.tsx
│   ├── Privacy.tsx
│   ├── Upload.tsx
│   ├── SelectVibe.tsx
│   ├── Loading.tsx
│   ├── Result.tsx
│   ├── Records.tsx
│   └── ErrorPage.tsx
├── services/                    # 服务层
│   ├── dreamina.ts             # 即梦图像生成服务
│   ├── siliconflow.ts          # 硅基流动 DeepSeek 文本生成服务
│   └── destiny.ts              # 组合服务：完整分析流程
├── components/                  # 可复用组件 (待扩展)
│   ├── ShareCard.tsx           # 分享卡片
│   ├── LoadingSpinner.tsx      # 加载动画
│   └── ProgressBar.tsx         # 进度条
├── utils/                       # 工具函数 (待扩展)
│   ├── image.ts                # 图片处理
│   ├── share.ts                # 分享功能
│   └── storage.ts              # 本地存储
└── hooks/                       # 自定义 Hooks (待扩展)
    ├── useLocalStorage.ts
    └── useImageUpload.ts
```

---

## 13. 开发规范

### 13.1 代码风格

- 使用函数式组件 + React Hooks
- Props 接口必须显式定义
- 异步操作使用 `try/catch` 处理
- 图片资源使用 Base64 或 CDN

### 13.2 命名规范

| 类型 | 命名规范 | 示例 |
|-----|---------|------|
| 组件 | PascalCase | `Home.tsx`, `SelectVibe.tsx` |
| 函数 | camelCase | `handleStart`, `runAnalysis` |
| 常量 | UPPER_SNAKE_CASE | `VIBE_CONFIG`, `API_ENDPOINT` |
| 类型 | PascalCase | `PartnerVibe`, `AnalysisResult` |
| 文件 | camelCase/PascalCase | `gemini.ts`, `Home.tsx` |

### 13.3 Git 提交规范

```
feat: 新增功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

---

## 14. 部署指南

### 14.1 环境变量

```bash
# .env
# 即梦 API Key (字节跳动)
DREAMINA_API_KEY=your_dreamina_api_key_here

# 硅基流动 API Key (DeepSeek 代理)
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
```

### 14.2 构建命令

```bash
# 开发
npm run dev

# 生产构建
npm run build

# 预览
npm run preview
```

### 14.3 部署配置

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  define: {
    'process.env.DREAMINA_API_KEY': JSON.stringify(process.env.DREAMINA_API_KEY),
    'process.env.SILICONFLOW_API_KEY': JSON.stringify(process.env.SILICONFLOW_API_KEY),
  },
});
```

---

## 15. 迭代路线图

### V1.0 (当前版本)
- ✅ 核心流程实现
- ✅ 即梦 AI 图像生成
- ✅ 硅基流动 DeepSeek 文本分析
- ✅ 历史记录

### V1.1 (规划中)
- 📋 用户引导流程
- 📋 分享功能
- 📋 结果下载

### V1.2 (规划中)
- 📋 即梦图像生成
- 📋 DeepSeek 文案生成
- 📋 性能优化

### V2.0 (未来)
- 📋 多语言支持
- 📋 社交登录
- 📋 云端存储

---

*文档版本历史*
- v1.0 (2026-02-16): 基于现有架构创建完整技术规范
