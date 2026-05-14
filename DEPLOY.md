# 部署指南

## 推荐方式：Render

1. 把项目上传到 GitHub。
2. 打开 Render，选择 New Web Service。
3. 连接这个 GitHub 仓库。
4. Render 会读取 `render.yaml`，自动填好构建和启动命令。
5. 在 Environment Variables 中填写：

```bash
OPENAI_API_KEY=你的 API Key
OPENAI_MODEL=gpt-5.2
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=600000
```

6. 点击 Deploy。
7. 部署完成后，把 Render 给你的公网链接发给别人即可。

## 手动填写部署参数

如果平台没有自动读取 `render.yaml`，手动填写：

```bash
Build Command: npm install && npm run build
Start Command: npm start
Health Check Path: /health
```

## Docker 部署

构建镜像：

```bash
docker build -t viral-copy-generator .
```

启动容器：

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=你的 API Key \
  -e OPENAI_MODEL=gpt-5.2 \
  -e RATE_LIMIT_MAX=20 \
  -e RATE_LIMIT_WINDOW_MS=600000 \
  viral-copy-generator
```

打开：

```bash
http://localhost:3000
```

## 上线前检查

- 不要把 `.env` 提交到 GitHub。
- `OPENAI_API_KEY` 只放在部署平台环境变量里。
- 公开给别人用之前，建议给 OpenAI 账户设置预算或额度提醒。
- 如果访问量变大，把 `RATE_LIMIT_MAX` 调小，或者增加登录、付费、验证码等保护。
