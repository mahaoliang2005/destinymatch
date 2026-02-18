# 命运匹配 (Destiny Match) 生产环境部署指南

本文档介绍如何将命运匹配应用部署到生产环境，使用 Nginx 作为反向代理，采用手动命令方式管理服务。

---

## 快速开始

```bash
# 1. 服务器准备（Ubuntu/Debian）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 2. 创建部署目录
sudo mkdir -p /home/ubuntu/works/destinymatch
sudo chown -R $USER:$USER /home/ubuntu/works/destinymatch
cd /home/ubuntu/works/destinymatch

# 3. 拉取代码并构建
git clone <your-repo-url> .
npm install
npm run build:client
npm run build:server

# 4. 配置环境变量
cp server/.env server/.env.production
nano server/.env.production  # 编辑配置

# 5. 上传 SSL 证书到 /etc/nginx/ssl/

# 6. 配置 Nginx
sudo nano /etc/nginx/sites-available/destiny-match
# 粘贴配置文件（见下文），修改域名和证书路径
sudo ln -s /etc/nginx/sites-available/destiny-match /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. 启动后端服务
cd server && export $(cat .env.production | grep -v '^#' | xargs) && nohup node dist/index.js > ../logs/app.log 2>&1 &
```

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

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 18.0.0 | 20.x LTS | 必需 |
| npm | 9.0.0 | 10.x | 必需 |
| Nginx | 1.18.0 | 最新稳定版 | 必需 |

### 1.3 域名和 SSL 证书

- 已注册的域名，DNS 解析到服务器 IP
- 手工申请的 SSL 证书（如腾讯云、阿里云证书）
- 证书文件：`.crt`（或 `.pem`）和 `.key` 格式

---

## 2. 环境准备

### 2.1 安装 Node.js

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
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

### 2.3 理解 Nginx 用户配置（重要）

Nginx 有两个层面的用户概念：

1. **Nginx master 进程**：以 `root` 运行（启动时绑定 80/443 端口需要 root 权限）
2. **Nginx worker 进程**：实际处理请求的子进程，以配置文件中 `user` 指令指定的用户运行

**查看你的 Nginx 配置**：
```bash
cat /etc/nginx/nginx.conf | grep user
```

你的配置显示 `user ubuntu;`，这意味着：
- Nginx worker 进程以 `ubuntu` 用户身份运行
- Nginx 需要读取的文件（如前端静态文件）必须对 `ubuntu` 用户可读
- 在你的环境中，由于你用 `ubuntu` 用户部署，且后端也以 `ubuntu` 运行，**所有文件归 ubuntu 所有即可**

**对比：默认安装的 Nginx**
- 默认配置通常是 `user www-data;`（Ubuntu/Debian）或 `user nginx;`（CentOS）
- 这时需要确保文件对 `www-data` 用户可读
- 你的环境使用 `user ubuntu;`，权限管理更简单

---

## 3. 项目构建

### 3.1 创建部署目录

```bash
# 创建部署目录
sudo mkdir -p /home/ubuntu/works/destinymatch

# 设置目录权限（使用当前用户部署）
sudo chown -R $USER:$USER /home/ubuntu/works/destinymatch
cd /home/ubuntu/works/destinymatch
```

### 3.2 拉取代码

```bash
# 克隆代码仓库
git clone https://github.com/your-username/destiny-match.git .

# 或使用 SCP/FTP 上传代码压缩包后解压
# tar -xzf destiny-match.tar.gz
```

### 3.3 安装依赖

```bash
# 安装根目录、客户端和服务端依赖
npm install
```

### 3.4 构建前端

```bash
npm run build:client
```

构建输出位于 `client/dist/` 目录。

### 3.5 构建后端

```bash
npm run build:server
```

构建输出位于 `server/dist/` 目录。

### 3.6 配置环境变量

```bash
# 进入服务端目录
cd server

# 创建生产环境配置文件
cp .env .env.production

# 编辑配置文件
nano .env.production
```

**生产环境配置示例：**

```bash
# 服务端配置
PORT=3001
CLIENT_URL=https://your-domain.com

# AI 服务 API 密钥（必填）
# 即梦 AI - 用于生成伴侣图片
DREAMINA_API_KEY=your_dreamina_api_key_here

# 硅基流动 - 用于 DeepSeek 文本分析
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
```

**设置环境变量文件权限：**

```bash
chmod 600 /home/ubuntu/works/destinymatch/server/.env.production
```

---

## 4. 生产部署

### 4.1 创建必要的目录

```bash
# 创建图片存储目录
mkdir -p /home/ubuntu/works/destinymatch/server/public/images

# 创建数据目录
mkdir -p /home/ubuntu/works/destinymatch/server/data/usage

# 创建日志目录
mkdir -p /home/ubuntu/works/destinymatch/logs
```

### 4.2 设置目录权限

> **关于权限的基础知识**：Nginx 需要读取前端静态文件，后端 Node.js 需要写入图片和数据。理解「哪个用户运行哪个服务」是关键。

**你的环境特点**：
- 你用 `ubuntu` 用户登录并部署项目
- Nginx 配置为 `user ubuntu;`（运行 Nginx worker 进程的用户）
- Node.js 后端由你手动启动，也以 `ubuntu` 用户运行

**因此权限设置很简单**——所有文件归 `ubuntu` 用户所有即可：

```bash
# 确保项目目录归 ubuntu 用户所有（前面已设置，这里再确认）
sudo chown -R ubuntu:ubuntu /home/ubuntu/works/destinymatch

# 设置可写目录的权限（755 = 所有者读写执行，组和其他人读执行）
chmod 755 /home/ubuntu/works/destinymatch/server/public/images
chmod 755 /home/ubuntu/works/destinymatch/server/data
chmod 755 /home/ubuntu/works/destinymatch/logs
```

**为什么需要这些权限？**

| 目录 | 需要权限的用户 | 操作 | 说明 |
|------|---------------|------|------|
| `client/dist/` | Nginx (ubuntu) | 读取 | 前端页面和静态资源 |
| `server/public/images/` | Node.js (ubuntu) | 写入 | 保存生成的图片 |
| `server/data/usage/` | Node.js (ubuntu) | 写入 | 保存使用统计数据 |
| `logs/` | Node.js (ubuntu) | 写入 | 保存应用日志 |

**权限数字解释**：
- `755` = `rwxr-xr-x`（所有者可读可写可执行，其他人只读可执行）
- `600` = `rw-------`（只有所有者可读写，用于保护密钥文件）

**检查权限是否正确的命令**：
```bash
# 查看文件所有者
ls -la /home/ubuntu/works/destinymatch/server/public/images
# 应该显示：drwxr-xr-x ubuntu ubuntu ...
```

### 4.3 上传 SSL 证书

```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 上传证书文件（本地终端执行）
scp your-domain.crt root@server-ip:/etc/nginx/ssl/
scp your-domain.key root@server-ip:/etc/nginx/ssl/

# 设置权限（服务器执行）
sudo chmod 600 /etc/nginx/ssl/*.key
sudo chmod 644 /etc/nginx/ssl/*.crt
```

### 4.4 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/destiny-match
```

添加以下内容：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name destiny.mahaoliang.tech;
    return 301 https://$server_name$request_uri;
}

# HTTPS 服务
server {
    listen 443 ssl;
    server_name destiny.mahaoliang.tech;

    # SSL 证书（实际生产环境证书路径）
    ssl_certificate /etc/nginx/ssl/destiny.mahaoliang.tech.crt;
    ssl_certificate_key /etc/nginx/ssl/destiny.mahaoliang.tech.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 前端静态文件
    location / {
        root /home/ubuntu/works/destinymatch/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

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

**启用站点配置：**

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

---

## 5. 启动与验证

### 5.1 启动后端服务

```bash
cd /home/ubuntu/works/destinymatch/server

# 加载环境变量并启动服务
export $(cat .env.production | grep -v '^#' | xargs) && nohup node dist/index.js > ../logs/app.log 2>&1 &

# 查看启动是否成功
sleep 2 && ps aux | grep "node dist/index.js"
```

### 5.2 验证服务状态

**检查后端服务：**

```bash
# 直接访问后端
curl http://localhost:3001/api/health

# 查看进程
ps aux | grep "node dist/index.js"

# 查看日志
tail -f /home/ubuntu/works/destinymatch/logs/app.log
```

**通过 Nginx 访问：**

```bash
# 测试前端页面
curl -I http://localhost

# 测试 API
curl http://localhost/api/health
```

**浏览器验证：**

1. 访问 `https://your-domain.com`，应看到前端页面
2. HTTP 应自动跳转到 HTTPS
3. 测试上传图片并生成，验证完整流程

---

## 6. 维护更新

### 6.1 停止服务

```bash
# 停止后端服务
pkill -f "node dist/index.js"

# 确认已停止
ps aux | grep "node dist/index.js"
```

### 6.2 更新流程

```bash
# 1. 停止服务
pkill -f "node dist/index.js"

# 2. 拉取最新代码
cd /home/ubuntu/works/destinymatch
git pull

# 3. 重新安装依赖（如有需要）
npm install

# 4. 重新构建
npm run build:client
npm run build:server

# 5. 启动服务
cd server
export $(cat .env.production | grep -v '^#' | xargs) && nohup node dist/index.js > ../logs/app.log 2>&1 &

# 6. 验证
tail -f ../logs/app.log
```

### 6.3 查看日志

**应用日志：**

```bash
# 实时查看日志
tail -f /home/ubuntu/works/destinymatch/logs/app.log

# 查看最后 100 行
tail -n 100 /home/ubuntu/works/destinymatch/logs/app.log
```

**Nginx 日志：**

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

**系统日志：**

```bash
# 查看 Nginx 服务日志
sudo journalctl -u nginx -f
```

---

## 7. 安全配置

### 7.1 防火墙设置

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

### 7.2 环境变量安全

```bash
# 确保环境变量文件只有 ubuntu 用户可读（防止其他用户看到 API 密钥）
chmod 600 /home/ubuntu/works/destinymatch/server/.env.production

# 验证权限
ls -la /home/ubuntu/works/destinymatch/server/.env.production
# 应该显示：-rw------- ubuntu ubuntu .env.production
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
cat /home/ubuntu/works/destinymatch/server/.env.production

# 直接运行查看错误
cd /home/ubuntu/works/destinymatch/server
export $(cat .env.production | grep -v '^#' | xargs) && node dist/index.js
```

**问题 2: Nginx 返回 502 Bad Gateway**

```bash
# 检查后端是否运行
ps aux | grep "node dist/index.js"
curl http://localhost:3001/api/health

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查 SELinux（CentOS）
sudo setsebool -P httpd_can_network_connect 1
```

**问题 3: 前端页面空白或 404**

```bash
# 检查前端文件是否存在
ls -la /home/ubuntu/works/destinymatch/client/dist/

# 检查 Nginx 配置路径
sudo nginx -t

# 检查目录权限
ls -la /home/ubuntu/works/destinymatch/client/
```

**问题 4: 图片上传失败**

```bash
# 检查目录权限
ls -la /home/ubuntu/works/destinymatch/server/public/images

# 确保目录归 ubuntu 所有且有写入权限
chmod 755 /home/ubuntu/works/destinymatch/server/public/images
chown -R ubuntu:ubuntu /home/ubuntu/works/destinymatch/server/public/images

# 检查 Nginx 上传限制
# 确保 client_max_body_size 设置足够大（10M）
```

**问题 5: API 请求超时**

```bash
# 检查 Nginx 超时设置
# 确保 proxy_read_timeout 足够长（60s）

# 检查后端日志了解详情
tail -f /home/ubuntu/works/destinymatch/logs/app.log
```

### 8.2 性能优化

**启用 Nginx 缓存：**

```nginx
# 在 http 块中添加（/etc/nginx/nginx.conf）
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=destiny_cache:10m max_size=1g;

# 在 location /images/ 块中使用
location /images/ {
    proxy_cache destiny_cache;
    proxy_cache_valid 200 1d;
    # ...
}
```

**日志轮转：**

```bash
# 安装 logrotate
sudo apt install -y logrotate

# 创建配置
sudo nano /etc/logrotate.d/destiny-match
```

```
/home/ubuntu/works/destinymatch/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
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
Node.js 后端服务（手动启动）
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
| DREAMINA_API_KEY | 即梦 AI API 密钥 | 是 | xxx |
| SILICONFLOW_API_KEY | 硅基流动 API 密钥 | 是 | xxx |

### B. 目录结构

```
/home/ubuntu/works/destinymatch/
├── client/
│   ├── dist/              # 前端构建输出
│   └── ...
├── server/
│   ├── dist/              # 后端构建输出
│   ├── public/images/     # 生成的图片存储
│   ├── data/usage/        # 使用数据存储
│   └── .env.production    # 生产环境配置
├── logs/
│   └── app.log            # 应用日志
└── nginx.conf             # Nginx 配置参考
```

### C. 命令速查

**服务管理：**

```bash
# 启动后端服务
cd server && export $(cat .env.production | grep -v '^#' | xargs) && nohup node dist/index.js > ../logs/app.log 2>&1 &

# 停止后端服务
pkill -f "node dist/index.js"

# 查看日志
tail -f logs/app.log
```

**构建：**

```bash
# 安装依赖
npm install

# 构建前端
npm run build:client

# 构建后端
npm run build:server
```

**Nginx:**

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx
```

---

## 总结

按照本文档完成部署后，你将拥有：

1. 使用 Nginx 作为反向代理的生产环境
2. 手动管理的 Node.js 后端服务
3. HTTPS 安全访问
4. 手工 SSL 证书配置

**注意事项：**

- 服务器重启后需手动重新启动后端服务
- 建议配置日志轮转防止日志文件过大
- 定期检查 SSL 证书有效期并及时更新
