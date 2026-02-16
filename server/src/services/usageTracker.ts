import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 存储目录：server/data/usage/
const DATA_DIR = path.join(__dirname, '../../data/usage');
const DAILY_LIMIT = 3;

// 确保目录存在
const ensureDir = (): void => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
};

// 获取用户文件路径
const getUserFilePath = (userId: string): string => {
    // 清理 userId 防止目录遍历
    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    return path.join(DATA_DIR, `${safeUserId}.json`);
};

// 获取今日日期字符串
const getToday = (): string => new Date().toISOString().split('T')[0];

// 读取用户使用记录
const readUsage = (userId: string): { count: number; date: string } | null => {
    const filePath = getUserFilePath(userId);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
};

// 写入用户使用记录
const writeUsage = (userId: string, usage: { count: number; date: string }): void => {
    ensureDir();
    const filePath = getUserFilePath(userId);
    fs.writeFileSync(filePath, JSON.stringify(usage, null, 2));
};

// 检查并增加使用次数，返回是否允许
export const checkAndIncrementUsage = (userId: string): { allowed: boolean; remaining: number } => {
    const today = getToday();
    const usage = readUsage(userId);

    if (!usage || usage.date !== today) {
        // 新用户或新的一天
        writeUsage(userId, { count: 1, date: today });
        return { allowed: true, remaining: DAILY_LIMIT - 1 };
    }

    if (usage.count >= DAILY_LIMIT) {
        return { allowed: false, remaining: 0 };
    }

    usage.count++;
    writeUsage(userId, usage);
    return { allowed: true, remaining: DAILY_LIMIT - usage.count };
};

// 仅查询剩余次数（不增加）
export const getRemainingUsage = (userId: string): number => {
    const today = getToday();
    const usage = readUsage(userId);

    if (!usage || usage.date !== today) {
        return DAILY_LIMIT;
    }

    return Math.max(0, DAILY_LIMIT - usage.count);
};

// 清理过期数据（可选：每月运行一次删除旧文件）
export const cleanupOldUsage = (): void => {
    if (!fs.existsSync(DATA_DIR)) return;

    const today = getToday();
    const files = fs.readdirSync(DATA_DIR);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(DATA_DIR, file);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            // 删除非今天的记录文件
            if (data.date !== today) {
                fs.unlinkSync(filePath);
            }
        } catch {
            // 解析失败的文件跳过
        }
    }
};
