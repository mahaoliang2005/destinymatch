# 命运匹配 (Destiny Match) - 技术实现文档

> 版本：v2.0
> 更新日期：2026-02-17
> 状态：基于前后端分离架构的完整技术规范

---

## 1. 架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端 (Client)                                  │
│                              Port: 3000                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Home.tsx  │  │ Privacy.tsx │  │ Upload.tsx  │  │   SelectVibe.tsx    │  │
│  │   首页       │  │  隐私协议    │  │ 照片上传     │  │     风格选择         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └─────────────────┴─────────────────┴──────────────────┘              │
│                                       │                                       │
│                              App.tsx (状态管理)                                │
│                                       │                                       │
│                    services/destiny.ts (API 调用)                             │
│                                       │                                       │
│                              HTTP /api/*                                      │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              服务端 (Server)                                  │
│                              Port: 3001                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Express 路由层                                  │   │
│  │  POST /api/upload-image    →  保存用户照片 → 返回 URL                   │   │
│  │  POST /api/analyze         →  AI分析 → 返回结果                        │   │
│  │  GET  /api/health          →  健康检查                                  │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                           │
│  ┌───────────────────────────────┼──────────────────────────────────────┐   │
│  │                               ▼                                      │   │
│  │  ┌─────────────────────┐   ┌─────────────────────┐                  │   │
│  │  │   services/         │   │   services/         │                  │   │
│  │  │   dreamina.ts       │   │   siliconflow.ts    │                  │   │
│  │  │   (图像生成)         │   │   (文本分析)         │                  │   │
│  │  │                     │   │                     │                  │   │
│  │  │  即梦 API            │   │  DeepSeek API       │                  │   │
│  │  │  ark.volces.com      │   │  siliconflow.cn     │                  │   │
│  │  └─────────────────────┘   └─────────────────────┘                  │   │
│  │                                                                         │   │
│  │  ┌─────────────────────┐   ┌─────────────────────┐                  │   │
│  │  │   services/         │   │   services/         │                  │   │
│  │  │   imageStorage.ts   │   │   usageTracker.ts   │                  │   │
│  │  │   (图片存储)         │   │   (使用限制)         │                  │   │
│  │  │                     │   │                     │                  │   │
│  │  │  public/images/      │   │  data/usage/         │                  │   │
│  │  │  (文件系统)          │   │  (JSON文件)          │                  │   │
│  │  └─────────────────────┘   └─────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 版本 | 说明 |
|-----|------|-----|------|
| **前端** ||||
| 前端框架 | React | 19.2.4 | 函数式组件 + Hooks |
| 构建工具 | Vite | 6.2.0 | 快速开发服务器 + HMR |
| 开发语言 | TypeScript | 5.8.2 | 类型安全 |
| UI 样式 | Tailwind CSS | v3 (CDN) | 原子化 CSS |
| 分享卡片 | html-to-image | ^1.11.11 | DOM 转图片 |
| **后端** ||||
| 服务端框架 | Express | 4.18.2 | RESTful API |
| 开发语言 | TypeScript | 5.8.2 | 类型安全 |
| AI SDK | OpenAI | ^4.77.0 | 即梦 + 硅基流动 API 兼容层 |
| 文件存储 | Node.js fs | - | 图片 + JSON 数据 |
| 身份标识 | UUID | ^11.0.0 | 用户唯一标识 |
| **基础设施** ||||
| 反向代理 | Nginx | - | 生产环境部署 |
| 进程管理 | PM2 | - | Node.js 进程守护 |

### 1.3 项目结构

```
destiny-match/
├── client/                      # 前端项目
│   ├── src/
│   │   ├── App.tsx             # 应用主组件 + 状态管理
│   │   ├── index.tsx           # 应用入口
│   │   ├── types.ts            # TypeScript 类型定义
│   │   ├── pages/              # 页面组件
│   │   │   ├── Home.tsx        # 首页
│   │   │   ├── Privacy.tsx     # 隐私协议
│   │   │   ├── Upload.tsx      # 照片上传
│   │   │   ├── SelectVibe.tsx  # 风格选择
│   │   │   ├── Loading.tsx     # 生成中
│   │   │   ├── Result.tsx      # 结果展示
│   │   │   ├── Records.tsx     # 历史记录
│   │   │   ├── ErrorPage.tsx   # 错误页面
│   │   │   └── RateLimitPage.tsx # 限流页面
│   │   ├── services/           # API 服务层
│   │   │   ├── destiny.ts      # 主分析流程
│   │   │   └── share.ts        # 分享功能
│   │   └── utils/
│   │       └── userId.ts       # 用户ID生成
│   ├── index.html              # HTML 模板
│   ├── vite.config.ts          # Vite 配置
│   └── package.json
│
├── server/                      # 后端项目
│   ├── src/
│   │   ├── index.ts            # Express 入口
│   │   ├── routes/
│   │   │   └── api.ts          # API 路由定义
│   │   ├── controllers/
│   │   │   └── analysis.ts     # 分析控制器
│   │   ├── services/           # 业务服务层
│   │   │   ├── dreamina.ts     # 即梦图像生成
│   │   │   ├── siliconflow.ts  # DeepSeek 文本分析
│   │   │   ├── imageStorage.ts # 图片存储管理
│   │   │   ├── imageProxy.ts   # 外部图片获取
│   │   │   └── usageTracker.ts # 使用次数限制
│   │   └── types/
│   │       └── index.ts        # 服务端类型定义
│   ├── public/images/          # 图片存储目录
│   ├── data/usage/             # 使用记录存储
│   ├── .env                    # 环境变量
│   └── package.json
│
├── docs/                        # 文档目录
│   ├── functional-requirements.md  # 功能需求
│   ├── user-flow.md                # 用户流程
│   ├── technical-spec-v2.md        # 本文档
│   └── ideal.md                    # 项目愿景
│
├── nginx.conf                   # Nginx 生产配置
└── package.json                 # 根项目配置
```

---

## 2. 数据模型

### 2.1 类型定义

```typescript
// ==================== 共享类型 ====================
// client/src/types.ts & server/src/types/index.ts

/** 伴侣风格类型 */
export type PartnerVibe = 'gentle' | 'sunny' | 'intellectual' | 'mysterious';

/** 分析结果 */
export interface AnalysisResult {
  score: number;                    // 般配度评分 (60-98)
  interpretation: string;           // 缘分解读文本 (~200 字)
  emotionalResonance: string;       // 情感共鸣分析 (50-80 字)
  communicationStyle: string;       // 沟通风格分析 (50-80 字)
  coreValues: string;               // 核心价值观分析 (50-80 字)
  partnerType: string;              // 伴侣类型标签 (8 字以内)
  partnerImageUrl: string;          // 生成的伴侣照片 URL
}

/** 历史记录 */
export interface HistoryRecord extends AnalysisResult {
  id: string;                       // 唯一标识 (UUID)
  timestamp: number;                // 生成时间戳
  userName: string;                 // 用户名 (默认"有缘人")
  userImageUrl: string;             // 用户上传的照片 URL
  vibe: PartnerVibe;                // 选择的风格
}

/** 应用步骤状态 */
export enum AppStep {
  HOME,        // 首页
  PRIVACY,     // 隐私协议
  UPLOAD,      // 照片上传
  SELECT_VIBE, // 风格选择
  LOADING,     // 生成中
  RESULT,      // 结果展示
  RECORDS,     // 历史记录
  ERROR,       // 错误页面
  RATE_LIMIT   // 限流页面
}

// ==================== 服务端特有类型 ====================
// server/src/types/index.ts

/** 分析请求 */
export interface AnalyzeRequest {
  userImageUrl: string;             // 用户照片 URL (/images/...)
  vibe: PartnerVibe;
  userId?: string;
}

/** API 统一响应 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/** 限流信息 */
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetDate: string;                // YYYY-MM-DD
}
```

### 2.2 文件存储结构

```
server/
├── public/images/                 # 图片存储目录
│   └── 2026-02-17/               # 按日期分子目录
│       ├── user_abc123.jpg       # 用户上传照片
│       ├── partner_def456.jpg    # AI生成的伴侣照片
│       └── ...
│
└── data/usage/                    # 使用记录存储
    ├── user-abc-123.json         # 用户A的使用记录
    └── user-def-456.json         # 用户B的使用记录
```

**使用记录文件格式 (JSON):**
```json
{
  "count": 2,
  "date": "2026-02-17"
}
```

### 2.3 本地存储结构 (localStorage)

```typescript
// Key: destiny_history
interface HistoryStorage {
  records: HistoryRecord[];         // 最多保存 5 条
}
```

---

## 3. 接口设计

### 3.1 API 端点概览

| 方法 | 端点 | 描述 | 认证 |
|-----|------|------|------|
| POST | `/api/upload-image` | 上传图片，返回 URL | 无 |
| POST | `/api/analyze` | 执行 AI 分析 | X-User-Id Header |
| GET | `/api/health` | 健康检查 | 无 |

### 3.2 POST /api/upload-image

**功能描述：** 接收 Base64 图片，保存到磁盘，返回可访问的 URL。

**请求格式：**
```http
POST /api/upload-image
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

**响应格式 (成功):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "imageUrl": "/images/2026-02-17/abc123.jpg"
  }
}
```

**响应格式 (失败):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing or invalid imageBase64 field"
  }
}
```

### 3.3 POST /api/analyze

**功能描述：** 核心分析接口，执行限流检查、调用 AI 服务生成结果。

**请求头：**
```http
X-User-Id: abc-123-uuid  // 用户唯一标识
```

**请求格式：**
```http
POST /api/analyze
Content-Type: application/json
X-User-Id: abc-123

{
  "userImageUrl": "/images/2026-02-17/user_abc.jpg",
  "vibe": "gentle"
}
```

**响应格式 (成功):**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Remaining: 2
X-RateLimit-Limit: 3

{
  "success": true,
  "data": {
    "score": 87,
    "interpretation": "你们的灵魂有着奇妙的共鸣...",
    "emotionalResonance": "你们的情感深度契合...",
    "communicationStyle": "你们善于倾听彼此...",
    "coreValues": "你们都珍视真挚的情感...",
    "partnerType": "天作之合 · 灵魂伴侣",
    "partnerImageUrl": "/images/2026-02-17/partner_xyz.jpg"
  }
}
```

**响应格式 (限流):**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "今日次数已用完，请明天再试"
  }
}
```

**响应格式 (其他错误):**
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "ANALYSIS_ERROR",
    "message": "图像生成失败: API 超时"
  }
}
```

### 3.4 GET /api/health

**功能描述：** 健康检查，返回服务状态和 mock 模式信息。

**响应格式：**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "timestamp": "2026-02-17T10:30:00.000Z",
  "env": {
    "mockMode": false
  }
}
```

### 3.5 错误码定义

| 错误码 | 描述 | HTTP 状态 |
|-------|------|----------|
| `INVALID_REQUEST` | 请求参数无效 | 400 |
| `MISSING_USER_ID` | 缺少用户标识 | 400 |
| `UPLOAD_ERROR` | 图片保存失败 | 500 |
| `ANALYSIS_ERROR` | AI 分析失败 | 500 |
| `RATE_LIMIT_EXCEEDED` | 超过每日限制 | 429 |

---

## 4. 功能实现方案

### 4.1 P0 功能实现对照

| 需求 ID | 功能 | 实现位置 | 关键实现 |
|-------|------|---------|---------|
| **UM-001** | 首页入口 | `client/src/pages/Home.tsx` | 星空背景动画，开始按钮路由跳转 |
| **PM-001** | 照片上传 | `client/src/pages/Upload.tsx` | FileReader 转 Base64，拖拽支持 |
| **PM-002** | 照片预览 | `client/src/pages/Upload.tsx` | 图片压缩，旋转，重新上传 |
| **PM-004** | 隐私声明 | `client/src/pages/Privacy.tsx` | 协议内容展示，同意/拒绝处理 |
| **PM-003** | 风格选择 | `client/src/pages/SelectVibe.tsx` | 4 种风格卡片，选中状态管理 |
| **AI-001** | 图像生成 | `server/src/services/dreamina.ts` | 即梦 API 调用，图片转 Base64 |
| **AI-001** | 文本分析 | `server/src/services/siliconflow.ts` | DeepSeek API 调用，JSON 解析 |
| **RM-001** | 结果展示 | `client/src/pages/Result.tsx` | 分数动画，解读展示，图片显示 |
| **SM-001** | 错误处理 | `client/src/pages/ErrorPage.tsx` | 错误分类，重试机制 |
| **SM-003** | 使用限制 | `server/src/services/usageTracker.ts` | 文件存储，每日 3 次限制 |

### 4.2 P1 功能实现对照

| 需求 ID | 功能 | 实现位置 | 关键实现 |
|-------|------|---------|---------|
| **UM-003** | 历史记录 | `client/src/App.tsx` + `pages/Records.tsx` | localStorage 存储，最多 5 条 |
| **AI-003** | 般配度算法 | `server/src/controllers/analysis.ts:13-32` | 加权随机，60-98 分数分布 |
| **RM-002** | 分享功能 | `client/src/pages/Result.tsx` + `services/share.ts` | html-to-image 生成卡片 |
| **RM-003** | 重新生成 | `client/src/pages/Result.tsx` | 保留照片，跳转风格选择 |
| **SM-002** | 性能优化 | `client/vite.config.ts` | 代理配置，代码分割 |

### 4.3 核心流程实现

#### 4.3.1 图片上传流程

```typescript
// client/src/pages/Upload.tsx
const handleUpload = async (file: File) => {
  // 1. 客户端压缩图片
  const compressed = await compressImage(file, 1024, 0.8);

  // 2. 转换为 Base64
  const base64 = await fileToBase64(compressed);

  // 3. 上传到服务端
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 })
  });

  // 4. 获取 URL，保存到状态
  const { data } = await response.json();
  setUserImageUrl(data.imageUrl);
};
```

```typescript
// server/src/routes/api.ts
router.post('/api/upload-image', (req, res) => {
  const { imageBase64 } = req.body;

  // 保存到磁盘，返回 URL
  const imageUrl = saveImage(imageBase64);
  // 结果：/images/2026-02-17/uuid.jpg

  res.json({ success: true, data: { imageUrl } });
});
```

#### 4.3.2 AI 分析流程

```typescript
// server/src/controllers/analysis.ts
export const analyze = async (req, res) => {
  const { userImageUrl, vibe } = req.body;

  // 1. 生成般配度分数 (服务端)
  const score = generateCompatibilityScore();

  // 2. 读取用户图片为 Base64
  const userImageBase64 = await readImageAsBase64(userImageUrl);

  // 3. 并行调用 AI 服务
  const [partnerImageBase64, analysis] = await Promise.all([
    generatePartnerImage(userImageBase64, vibe),    // 即梦
    generateDestinyAnalysis(vibe, score)             // DeepSeek
  ]);

  // 4. 保存生成的伴侣图片
  const partnerImageUrl = saveImage(partnerImageBase64);

  // 5. 返回结果
  res.json({
    success: true,
    data: { ...analysis, score, partnerImageUrl }
  });
};
```

#### 4.3.3 限流检查流程

```typescript
// server/src/routes/api.ts
router.post('/api/analyze', (req, res, next) => {
  const userId = req.headers['x-user-id'];

  // 检查并增加使用次数
  const { allowed, remaining } = checkAndIncrementUsage(userId);

  if (!allowed) {
    return res.status(429).json({
      error: { code: 'RATE_LIMIT_EXCEEDED', message: '今日次数已用完' }
    });
  }

  res.setHeader('X-RateLimit-Remaining', remaining);
  next();
}, analyze);
```

```typescript
// server/src/services/usageTracker.ts
export const checkAndIncrementUsage = (userId: string) => {
  const today = getToday();  // "2026-02-17"
  const usage = readUsage(userId);  // { count: 2, date: "2026-02-17" }

  if (!usage || usage.date !== today) {
    writeUsage(userId, { count: 1, date: today });
    return { allowed: true, remaining: 2 };
  }

  if (usage.count >= 3) {
    return { allowed: false, remaining: 0 };
  }

  usage.count++;
  writeUsage(userId, usage);
  return { allowed: true, remaining: 3 - usage.count };
};
```

### 4.4 状态流转实现

```typescript
// client/src/App.tsx
const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.HOME);
const [userImage, setUserImage] = useState<string | null>(null);
const [selectedVibe, setSelectedVibe] = useState<PartnerVibe>('gentle');
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

// 状态流转
const handleStart = () => setCurrentStep(AppStep.PRIVACY);
const handleAgree = () => setCurrentStep(AppStep.UPLOAD);
const handleUpload = (url: string) => {
  setUserImage(url);
  setCurrentStep(AppStep.SELECT_VIBE);
};
const handleSelectVibe = async (vibe: PartnerVibe) => {
  setSelectedVibe(vibe);
  setCurrentStep(AppStep.LOADING);

  try {
    const result = await runDestinyMatch(userImage!, vibe);
    setAnalysisResult(result);
    setCurrentStep(AppStep.RESULT);
  } catch (error) {
    if (error.message.includes('次数已用完')) {
      setCurrentStep(AppStep.RATE_LIMIT);
    } else {
      setCurrentStep(AppStep.ERROR);
    }
  }
};
```

---

## 5. 外部服务集成

### 5.1 即梦 AI (图像生成)

**服务信息：**
| 属性 | 值 |
|-----|---|
| 提供商 | 字节跳动 |
| 端点 | `https://ark.cn-beijing.volces.com/api/v3` |
| 模型 | `ep-20260106225752-q46qg` |
| 认证 | Bearer Token |

**配置代码：**
```typescript
// server/src/services/dreamina.ts
const client = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.DREAMINA_API_KEY,
});

const vibePrompts: Record<PartnerVibe, string> = {
  gentle: '温柔气质，自然微笑，柔和眼神...',
  sunny: '阳光活力，开朗笑容，健康自然...',
  intellectual: '知性沉稳，自然神态，文艺气质...',
  mysterious: '独特气质，神秘眼神，艺术气息...'
};
```

**调用方式：**
```typescript
const response = await client.images.generate({
  model: 'ep-20260106225752-q46qg',
  prompt: `基于参考图生成伴侣照片...${vibePrompts[vibe]}`,
  size: '2K',
  response_format: 'url',
  extra_body: {
    image: userImageBase64,  // 参考图
    watermark: true,
    sequential_image_generation: 'disabled'
  }
});
```

**错误处理：**
```typescript
try {
  return await generatePartnerImage(userImageBase64, vibe);
} catch (error) {
  console.error('Dreamina API failed:', error);
  // Fallback: 返回预设的 Mock 图片
  return fetchImageAsBase64(mockPartnerImages[vibe]);
}
```

### 5.2 硅基流动 DeepSeek (文本生成)

**服务信息：**
| 属性 | 值 |
|-----|---|
| 提供商 | 硅基流动 (SiliconFlow) |
| 端点 | `https://api.siliconflow.cn/v1` |
| 模型 | `deepseek-ai/DeepSeek-R1-0528-Qwen3-8B` |
| 认证 | Bearer Token |

**配置代码：**
```typescript
// server/src/services/siliconflow.ts
const client = new OpenAI({
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: process.env.SILICONFLOW_API_KEY,
});

const SYSTEM_PROMPT = `你是一位精通东方玄学的"缘分大师"...`;
```

**调用方式：**
```typescript
const response = await client.chat.completions.create({
  model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.8,
  max_tokens: 800,
  response_format: { type: 'json_object' }
});

const result = JSON.parse(response.choices[0].message.content);
```

### 5.3 Mock 模式

当环境变量未配置或包含 `your_` / `test` 时，自动启用 Mock 模式：

```typescript
// 即梦 Mock
const USE_MOCK = !ARK_API_KEY || ARK_API_KEY.includes('your_');

const mockPartnerImages: Record<PartnerVibe, string> = {
  gentle: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
  sunny: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
  intellectual: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
  mysterious: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800'
};
```

### 5.4 错误处理策略

| 错误类型 | 处理策略 |
|---------|---------|
| API 超时 | 超时时间 60s，返回友好错误提示 |
| API 限流 | 指数退避重试，最多 3 次 |
| API 密钥无效 | 自动降级到 Mock 模式 |
| 图片生成失败 | 返回预设 Unsplash 图片 |
| 文本解析失败 | 返回本地预设文案 |

---

## 6. 部署配置

### 6.1 环境变量

```bash
# server/.env

# 服务端配置
PORT=3001
CLIENT_URL=http://localhost:3000

# 即梦 API (图像生成)
DREAMINA_API_KEY=your_dreamina_api_key_here

# 硅基流动 API (文本生成)
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
```

### 6.2 开发环境配置

**Vite 代理配置 (client/vite.config.ts):**
```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/images': 'http://localhost:3001'
    }
  }
});
```

**开发启动：**
```bash
# 根目录
npm run dev        # 同时启动 client (3000) 和 server (3001)
npm run dev:client # 仅启动前端
npm run dev:server # 仅启动后端
```

### 6.3 生产环境 Nginx 配置

```nginx
# nginx.conf
server {
    listen 80;
    server_name destiny.app;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;

    # 前端静态文件
    location / {
        root /var/www/destiny-match/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # AI 生成可能较慢
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;

        # 大图片上传
        client_max_body_size 10M;
    }

    # 图片文件代理
    location /images/ {
        proxy_pass http://localhost:3001/images/;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 6.4 生产部署步骤

```bash
# 1. 构建前端
cd client && npm run build

# 2. 构建后端
cd server && npm run build

# 3. 配置环境变量
cp server/.env.example server/.env
# 编辑 .env，填入 API 密钥

# 4. 安装依赖
cd server && npm ci --production

# 5. 使用 PM2 启动服务
pm2 start server/dist/index.js --name destiny-match-api

# 6. 配置 Nginx
sudo cp nginx.conf /etc/nginx/sites-available/destiny-match
sudo ln -s /etc/nginx/sites-available/destiny-match /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 6.5 目录权限设置

```bash
# 创建存储目录
mkdir -p /var/www/destiny-match/server/public/images
mkdir -p /var/www/destiny-match/server/data/usage

# 设置权限
chmod 755 /var/www/destiny-match/server/public/images
chmod 755 /var/www/destiny-match/server/data/usage

# 如果需要，设置目录所有者为运行用户
chown -R www-data:www-data /var/www/destiny-match/server/public/images
chown -R www-data:www-data /var/www/destiny-match/server/data/usage
```

---

## 7. 附录

### 7.1 技术决策记录

| 决策 | 选项 | 选择 | 原因 |
|-----|------|------|------|
| 用户身份 | Cookie / JWT / UUID | UUID | 无账号系统，简单轻量 |
| 图片存储 | 云存储 / 本地文件 | 本地文件 | 降低复杂度，隐私友好 |
| 使用限制 | Redis / 文件 | 文件 | 单机部署，无需外部依赖 |
| AI 图像 | Gemini / 即梦 | 即梦 | 国内服务，参考图模式 |
| AI 文本 | GPT / DeepSeek | DeepSeek | 中文优化好，成本低 |

### 7.2 性能指标

| 指标 | 目标 | 当前 |
|-----|------|------|
| 首屏加载 | < 3s | ~1.5s |
| 图片上传 | < 5s | ~2s (2MB) |
| AI 生成 | < 30s | 15-25s |
| 并发用户 | > 100 | 待测试 |

### 7.3 安全考虑

1. **API 密钥保护**：仅存储在服务端环境变量
2. **文件上传限制**：仅允许图片格式，最大 10MB
3. **路径遍历防护**：文件名清理，防止 `../` 攻击
4. **CORS 配置**：生产环境限制来源域名
5. **速率限制**：每用户每日 3 次，防止 API 滥用

---

*文档版本历史*
- v1.0 (2026-02-16): 纯前端原型文档
- v2.0 (2026-02-17): 重写为前后端分离架构，增加服务端实现细节
