# 命运匹配 (Destiny Match) 生产环境部署指南

本文档详细介绍了如何将命运匹配应用部署到生产环境，使用 Nginx 作为反向代理，PM2 进行进程管理。

---

## 目录

1. [部署要求](#1-部署要求)
2. [环境准备](#2-环境准备)
3. [项目构建](#3-项目构建)
4. [生产部署](#4-生产部署)
5. [启动与验证](#5-启动与验证)
6. [维护更新](#6-维护更新)
7. [安全配置](#7-安全配置)
8. [故障排查](#8-故障排查)

---

## 1. 部署要求

### 1.1 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**: 至少 1GB RAM（推荐 2GB）
- **磁盘空间**: 至少 5GB 可用空间
- **网络**: 可访问外网（用于下载依赖和调用 AI API）

### 1.2 软件版本要求

| 软件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| Nginx | 1.18.0 | 最新稳定版 |
| PM2 | 5.0.0 | 最新版 |

### 1.3 域名和 SSL（可选但推荐）

- 已注册的域名
- 域名 DNS 解析到服务器 IP
- SSL 证书（可使用 Let's Encrypt 免费证书）

---

## 2. 环境准备

### 2.1 安装 Node.js

**使用 NodeSource 安装（推荐）:**

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
```

**或使用 NVM 安装:**

```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js
nvm install 20
nvm use 20
nvm alias default 20
```

### 2.2 安装 Nginx

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
```

**CentOS/RHEL:**

```bash
sudo yum install -y epel-release
sudo yum install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.3 安装 PM2

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v

# 设置 PM2 开机自启
pm2 startup systemd
# 按照提示执行生成的命令
```

---

## 3. 项目构建

### 3.1 创建部署目录

```bash
# 创建部署目录
sudo mkdir -p /var/www/destiny-match
cd /var/www/destiny-match

# 设置目录权限（使用当前用户部署）
sudo chown -R $USER:$USER /var/www/destiny-match
```

### 3.2 拉取代码

```bash
# 克隆代码仓库（根据你的实际情况修改）
git clone https://github.com/your-username/destiny-match.git .

# 或者使用 SCP/FTP 上传代码压缩包后解压
# tar -xzf destiny-match.tar.gz
```

### 3.3 安装依赖

```bash
# 安装根目录、客户端和服务端依赖
npm run install:all
```

### 3.4 配置环境变量

```bash
# 进入服务端目录
cd server

# 创建生产环境配置文件
cp .env .env.production

# 编辑配置文件
nano .env.production
```

**生产环境配置示例:**

```bash
# ============================================
# 命运匹配 (Destiny Match) 生产环境配置
# ============================================

# 服务端配置
PORT=3001
CLIENT_URL=https://your-domain.com

# AI 服务 API 密钥（必填，生产环境建议使用真实 API）
# 即梦 AI - 用于生成伴侣图片
DREAMINA_API_KEY=your_dreamina_api_key_here

# 硅基流动 - 用于 DeepSeek 文本分析
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
```

**重要提示:**
- 将 `your-domain.com` 替换为你的实际域名
- 填入有效的 API 密钥（生产环境不建议使用 Mock 模式）
- 确保 `.env.production` 文件权限安全：`chmod 600 .env.production`

### 3.5 构建前端

```bash
# 在根目录执行
cd /var/www/destiny-match
npm run build:client
```

构建输出位于 `client/dist/` 目录。

### 3.6 构建后端

```bash
# 在根目录执行
npm run build:server
```

构建输出位于 `server/dist/` 目录。

---

## 4. 生产部署

### 4.1 创建必要的目录

```bash
# 创建图片存储目录
mkdir -p /var/www/destiny-match/server/public/images

# 创建数据目录
mkdir -p /var/www/destiny-match/server/data/usage

# 创建日志目录
mkdir -p /var/www/destiny-match/logs
```

### 4.2 设置目录权限

```bash
# 设置项目目录权限
sudo chown -R www-data:www-data /var/www/destiny-match/server/public/images
sudo chown -R www-data:www-data /var/www/destiny-match/server/data

# 设置目录权限
sudo chmod 755 /var/www/destiny-match/server/public/images
sudo chmod 755 /var/www/destiny-match/server/data

# 确保当前用户有写入权限
sudo usermod -aG www-data $USER
```

### 4.3 配置 Nginx

**方法一：使用项目提供的配置文件（推荐）**

```bash
# 复制配置文件
sudo cp /var/www/destiny-match/nginx.conf /etc/nginx/sites-available/destiny-match

# 编辑配置文件，修改域名
sudo nano /etc/nginx/sites-available/destiny-match
```

**方法二：手动创建配置**

```bash
sudo nano /etc/nginx/sites-available/destiny-match
```

添加以下内容:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 前端静态文件
    location / {
        root /var/www/destiny-match/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;  # 支持 React Router

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 长超时设置（图片生成可能需要 30-60 秒）
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;

        # 允许大文件上传（base64 图片）
        client_max_body_size 10M;
    }

    # 图片服务代理
    location /images/ {
        proxy_pass http://localhost:3001/images/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 图片缓存 1 天
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**启用站点配置:**

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/destiny-match /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 4.4 配置 PM2

**创建 PM2 配置文件:**

```bash
nano /var/www/destiny-match/ecosystem.config.cjs
```

添加以下内容:

```javascript
module.exports = {
  apps: [
    {
      name: 'destiny-match-server',
      cwd: '/var/www/destiny-match/server',
      script: './dist/index.js',
      instances: 1,           // 实例数，可根据 CPU 核心数调整
      exec_mode: 'fork',      // fork 模式（单实例）或 cluster 模式
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // 日志配置
      log_file: '/var/www/destiny-match/logs/combined.log',
      out_file: '/var/www/destiny-match/logs/out.log',
      error_file: '/var/www/destiny-match/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 自动重启配置
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      // 内存限制
      max_memory_restart: '500M',

      // 监控
      watch: false,           // 生产环境不启用文件监视
      ignore_watch: ['node_modules', 'logs', 'public/images'],

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,

      // 合并日志
      merge_logs: true,

      // 错误处理
      instance_var: 'INSTANCE_ID',
    },
  ],
};
```

**PM2 常用命令:**

```bash
# 启动服务
pm2 start ecosystem.config.cjs --env production

# 查看状态
pm2 status
pm2 logs

# 重启服务
pm2 restart destiny-match-server

# 停止服务
pm2 stop destiny-match-server

# 删除服务
pm2 delete destiny-match-server

# 保存 PM2 配置
pm2 save

# 设置开机自启（执行后按提示操作）
pm2 startup
```

---

## 5. 启动与验证

### 5.1 启动后端服务

```bash
cd /var/www/destiny-match

# 使用 PM2 启动
pm2 start ecosystem.config.cjs --env production

# 保存配置
pm2 save

# 查看运行状态
pm2 status
```

### 5.2 验证 Nginx 配置

```bash
# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx

# 查看 Nginx 状态
sudo systemctl status nginx
```

### 5.3 健康检查

**检查后端服务:**

```bash
# 直接访问后端
 curl http://localhost:3001/api/health

# 查看 PM2 日志
pm2 logs
```

**通过 Nginx 访问:**

```bash
# 测试前端页面
curl -I http://localhost

# 测试 API
curl http://localhost/api/health
```

**浏览器验证:**

1. 访问 `http://your-domain.com`，应看到前端页面
2. 打开浏览器开发者工具，检查控制台无错误
3. 测试上传图片并生成，验证完整流程

---

## 6. 维护更新

### 6.1 更新脚本

创建自动化更新脚本:

```bash
nano /var/www/destiny-match/deploy.sh
```

添加以下内容:

```bash
#!/bin/bash

# 命运匹配部署脚本
set -e

PROJECT_DIR="/var/www/destiny-match"
BACKUP_DIR="/var/backups/destiny-match/$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "开始部署 命运匹配 (Destiny Match)"
echo "时间: $(date)"
echo "=========================================="

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份当前版本
echo "[1/8] 备份当前版本..."
cp -r "$PROJECT_DIR/server/data" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$PROJECT_DIR/server/public/images" "$BACKUP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/server/.env.production" "$BACKUP_DIR/" 2>/dev/null || true

# 拉取最新代码
echo "[2/8] 拉取最新代码..."
cd "$PROJECT_DIR"
git pull origin main

# 安装依赖
echo "[3/8] 安装依赖..."
npm run install:all

# 构建前端
echo "[4/8] 构建前端..."
npm run build:client

# 构建后端
echo "[5/8] 构建后端..."
npm run build:server

# 重启 PM2 服务
echo "[6/8] 重启服务..."
pm2 reload ecosystem.config.cjs --env production

# 重载 Nginx
echo "[7/8] 重载 Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 清理旧备份（保留最近 10 个）
echo "[8/8] 清理旧备份..."
ls -t /var/backups/destiny-match | tail -n +11 | xargs -I {} rm -rf /var/backups/destiny-match/{}

echo "=========================================="
echo "部署完成!"
echo "=========================================="

# 显示状态
pm2 status
```

设置执行权限:

```bash
chmod +x /var/www/destiny-match/deploy.sh
```

使用方式:

```bash
./deploy.sh
```

### 6.2 查看日志

**PM2 日志:**

```bash
# 实时查看日志
pm2 logs

# 查看最后 100 行
pm2 logs --lines 100

# 查看特定应用日志
pm2 logs destiny-match-server

# 清空日志
pm2 flush
```

**Nginx 日志:**

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

**系统日志:**

```bash
# 查看系统日志
sudo journalctl -u nginx -f

# 查看 PM2 系统日志
pm2 logs
```

### 6.3 备份策略

**数据备份脚本:**

```bash
nano /var/www/destiny-match/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/destiny-match/$(date +%Y%m%d_%H%M%S)"
PROJECT_DIR="/var/www/destiny-match"

mkdir -p "$BACKUP_DIR"

# 备份使用数据
cp -r "$PROJECT_DIR/server/data" "$BACKUP_DIR/"

# 备份生成的图片（可选，可能很大）
# cp -r "$PROJECT_DIR/server/public/images" "$BACKUP_DIR/"

# 备份配置文件
cp "$PROJECT_DIR/server/.env.production" "$BACKUP_DIR/"
cp "$PROJECT_DIR/ecosystem.config.cjs" "$BACKUP_DIR/"
cp -r "$PROJECT_DIR/nginx.conf" "$BACKUP_DIR/"

# 压缩备份
tar -czf "$BACKUP_DIR.tar.gz" -C "$BACKUP_DIR" .
rm -rf "$BACKUP_DIR"

# 删除 30 天前的备份
find /var/backups/destiny-match -name "*.tar.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR.tar.gz"
```

设置定时任务:

```bash
chmod +x /var/www/destiny-match/backup.sh

# 编辑定时任务
crontab -e

# 每天凌晨 3 点自动备份
0 3 * * * /var/www/destiny-match/backup.sh >> /var/log/destiny-match-backup.log 2>&1
```

---

## 7. 安全配置

### 7.1 配置 HTTPS（推荐）

**使用 Let's Encrypt 免费证书:**

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（根据提示操作）
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

**Certbot 会自动修改 Nginx 配置。手动配置如下:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;  # HTTP 重定向到 HTTPS
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # 其他配置与 HTTP 相同...
    # ...
}
```

### 7.2 防火墙设置

```bash
# 安装 UFW（如未安装）
sudo apt install -y ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status verbose
```

### 7.3 环境变量安全

```bash
# 确保环境变量文件权限正确
chmod 600 /var/www/destiny-match/server/.env.production

# 确保目录权限正确
sudo chown -R www-data:www-data /var/www/destiny-match/server/public
sudo chmod 750 /var/www/destiny-match/server/public

# 禁用目录浏览
echo "Options -Indexes" | sudo tee /var/www/destiny-match/server/public/.htaccess
```

---

## 8. 故障排查

### 8.1 常见问题

**问题 1: 后端服务无法启动**

```bash
# 检查端口占用
sudo lsof -i :3001

# 杀死占用端口的进程
sudo kill -9 <PID>

# 检查环境变量
cat /var/www/destiny-match/server/.env.production

# 直接运行查看错误
cd /var/www/destiny-match/server
node dist/index.js
```

**问题 2: Nginx 返回 502 Bad Gateway**

```bash
# 检查后端是否运行
pm2 status
curl http://localhost:3001/api/health

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查 SELinux（CentOS）
sudo setsebool -P httpd_can_network_connect 1
```

**问题 3: 前端页面空白或 404**

```bash
# 检查前端文件是否存在
ls -la /var/www/destiny-match/client/dist/

# 检查 Nginx 配置路径
sudo nginx -t

# 检查目录权限
ls -la /var/www/destiny-match/client/
```

**问题 4: 图片上传失败**

```bash
# 检查目录权限
ls -la /var/www/destiny-match/server/public/images

# 确保目录可写
sudo chmod 755 /var/www/destiny-match/server/public/images
sudo chown -R www-data:www-data /var/www/destiny-match/server/public/images

# 检查 Nginx 上传限制
# 确保 client_max_body_size 设置足够大（10M）
```

**问题 5: API 请求超时**

```bash
# 检查 Nginx 超时设置
# 确保 proxy_read_timeout 足够长（60s）

# 检查后端 AI 服务是否正常
# 查看 PM2 日志了解详情
pm2 logs
```

### 8.2 性能优化

**启用 Nginx 缓存:**

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=destiny_cache:10m max_size=1g;

# 在 location 块中使用
location /images/ {
    proxy_cache destiny_cache;
    proxy_cache_valid 200 1d;
    # ...
}
```

**Node.js 性能优化:**

```javascript
// ecosystem.config.cjs 中使用集群模式
module.exports = {
  apps: [
    {
      name: 'destiny-match-server',
      script: './dist/index.js',
      instances: 'max',  // 使用所有 CPU 核心
      exec_mode: 'cluster',
      // ...
    },
  ],
};
```

### 8.3 监控建议

**基础监控:**

```bash
# 安装 htop 查看系统资源
sudo apt install -y htop

# 使用 PM2 监控
pm2 monit

# PM2 Plus（可选）
pm2 plus
```

**日志轮转:**

```bash
# 安装 logrotate
sudo apt install -y logrotate

# 创建配置
sudo nano /etc/logrotate.d/destiny-match
```

```
/var/www/destiny-match/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 部署架构图

```
用户浏览器
    │
    ▼
Nginx (80/443端口)
    ├── /          → 前端静态文件 (client/dist)
    ├── /api/*     → 后端服务 (localhost:3001)
    └── /images/*  → 后端服务 (localhost:3001)
    │
    ▼
PM2 管理的 Node.js 后端服务
    ├── AI 图像生成 (即梦 API)
    └── AI 文本分析 (DeepSeek API)
```

---

## 附录

### A. 环境变量参考

| 变量名 | 说明 | 必填 | 示例 |
|--------|------|------|------|
| PORT | 后端服务端口 | 否 | 3001 |
| CLIENT_URL | 前端地址 | 是 | https://your-domain.com |
| DREAMINA_API_KEY | 即梦 AI API 密钥 | 否* | xxx |
| SILICONFLOW_API_KEY | 硅基流动 API 密钥 | 否* | xxx |

* 生产环境建议配置真实 API 密钥

### B. 目录结构

```
/var/www/destiny-match/
├── client/
│   ├── dist/              # 前端构建输出
│   └── ...
├── server/
│   ├── dist/              # 后端构建输出
│   ├── public/images/     # 生成的图片存储
│   ├── data/usage/        # 使用数据存储
│   └── .env.production    # 生产环境配置
├── logs/                  # PM2 日志
├── nginx.conf             # Nginx 配置模板
├── ecosystem.config.cjs   # PM2 配置
├── deploy.sh              # 部署脚本
└── backup.sh              # 备份脚本
```

### C. 相关命令速查

```bash
# 部署
npm run build
pm2 start ecosystem.config.cjs --env production

# 更新
git pull
npm run build
pm2 reload ecosystem.config.cjs

# 查看状态
pm2 status
pm2 logs
pm2 monit

# 停止
pm2 stop destiny-match-server

# 重启
pm2 restart destiny-match-server

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx
```

---

## 总结

按照本文档完成部署后，你将拥有:

1. ✅ 使用 Nginx 作为反向代理的生产环境
2. ✅ 使用 PM2 管理的 Node.js 后端服务
3. ✅ 自动重启和进程守护
4. ✅ 完整的日志管理和备份策略
5. ✅ HTTPS 安全访问（如配置 SSL）
6. ✅ 便捷的更新和维护脚本

如需帮助，请参考项目文档或联系开发团队。
