# 环境变量约定

这个目录只放 **示例**，真实 `.env` 不提交。

## 1. 文件对应关系

### Next.js 主站

| 环境 | 真实文件 | 示例 |
|---|---|---|
| 开发 | `.env.local` | `env/next.development.example` |
| 生产 | `.env.production.local` | `env/next.production.example` |

Next.js 自动加载：

```text
.env
.env.local
.env.[NODE_ENV]
.env.[NODE_ENV].local
```

生产机建议：

```bash
cp env/next.production.example .env.production.local
```

然后填写真实密钥。

### Python 服务

| 环境 | 真实文件 | 示例 |
|---|---|---|
| 开发 | `PythonProject17/.env.development` | `env/python.development.example` |
| 生产 | `PythonProject17/.env.production` | `env/python.production.example` |

Python 按 `APP_ENV` 加载：

```text
APP_ENV=development
→ PythonProject17/.env.development
→ PythonProject17/.env
→ 根目录 .env.development
→ 根目录 .env

APP_ENV=production
→ PythonProject17/.env.production
→ PythonProject17/.env
→ 根目录 .env.production
→ 根目录 .env
```

生产启动必须明确设置：

```bash
APP_ENV=production
```

---

## 2. 两边必须一致的变量

这两个值必须完全一致：

```env
PYTHON_API_SECRET
KUN_DATABASE_URL
```

因为：

```text
Next → 带 X-Internal-Token 请求 Python
Python → 用同一个 secret 校验
两边都连同一个 PostgreSQL
```

`PYTHON_API_SECRET` 必须：

```text
长随机字符串
只放服务端
不要放 NEXT_PUBLIC_*
不要提交仓库
定期轮换
```

---

## 3. 开发和生产差异

| 变量 | 开发 | 生产 |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `APP_ENV` | `development` | `production` |
| `NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV` | `http://localhost:3000` | 正式域名 |
| `NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD` | 正式域名 | 正式域名 |
| `FASTAPI_INTERNAL_URL` | `http://127.0.0.1:8000` | `http://127.0.0.1:8000` |
| `CRAWLER_PROXY` | `http://127.0.0.1:7890` | 空 |
| `CHAT_MAX_CONCURRENT` | `15` | `15` |
| `DLSITE_IMAGE_DEBUG` | 可选 | 不设置或 false |
| `NEXT_PUBLIC_FASTAPI_URL` | 已废弃 | 已废弃 |

生产东京 VPS 直连 DLsite：

```env
CRAWLER_PROXY=
```

本地 Windows 开发才需要：

```env
CRAWLER_PROXY=http://127.0.0.1:7890
```

---

## 4. 变量归属

### 只属于 Next

```env
NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV
NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD
NEXT_PUBLIC_KUN_RANKING_IMAGE_BED_URL
NEXT_PUBLIC_API_URL
JWT_SECRET
JWT_ISS
JWT_AUD
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM_EMAIL
SMTP_FROM_NAME
KUN_VISUAL_NOVEL_S3_*
KUN_CF_CACHE_*
KUN_BACKUP_S3_*
```

### 只属于 Python

```env
DEEPSEEK_API_KEYS
DEEPSEEK_KEY_COOLDOWN_SECONDS
CHAT_MAX_CONCURRENT
CHAT_MAX_OUTPUT_TOKENS
PYTHON_HOST
PYTHON_PORT
PYTHON_MAX_BODY_BYTES
CRAWLER_PROXY
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_REGION
R2_RANKING_PREFIX
R2_PUBLIC_BASE
PURCHASE_HISTORY_*
```

### 两边共享

```env
KUN_DATABASE_URL
PYTHON_API_SECRET
FASTAPI_INTERNAL_URL   # Next 使用
DLSITE_API_URL         # Next 使用
REDIS_HOST / PORT / PASSWORD
```

---

## 5. 安全规则

```text
不要提交任何真实 .env
不要把 PYTHON_API_SECRET 放到 NEXT_PUBLIC_*
不要把 DEEPSEEK_API_KEYS 放到前端
不要把 R2_SECRET_ACCESS_KEY 放到前端
R2 只返回公开图片 URL
```

公开变量只放：

```text
NEXT_PUBLIC_*
```

服务端密钥只放：

```text
.env.local / .env.production.local
PythonProject17/.env.*
```

---

## 6. PM2 / systemd 注意

Next standalone 可能不会自动加载 `.env.production.local`，生产 PM2 建议显式加载环境文件：

```js
// ecosystem.config.cjs
env_file: '.env.production.local'
```

或者用 systemd：

```ini
EnvironmentFile=/opt/kun-touchgal/.env.production.local
```

Python 用 systemd/PM2 时明确设置：

```bash
APP_ENV=production
```

---

## 7. 本地启动

```bash
cp env/next.development.example .env.local
cp env/python.development.example PythonProject17/.env.development
```

然后填写真实值：

```text
数据库密码
JWT_SECRET
PYTHON_API_SECRET
DEEPSEEK_API_KEYS
R2 密钥
```

Python 启动：

```bash
cd PythonProject17
$env:APP_ENV="development"   # PowerShell
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

生产：

```bash
APP_ENV=production
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

## 8. 当前项目中的旧文件

根目录：

```text
.env
.env.local
```

Python：

```text
PythonProject17/.env
```

这些是当前开发文件，暂时可以继续使用。

推荐后续迁移为：

```text
.env.local
PythonProject17/.env.development
```

生产使用：

```text
.env.production.local
PythonProject17/.env.production
```
