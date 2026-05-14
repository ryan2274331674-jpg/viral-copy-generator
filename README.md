# 短视频爆款文案生成器

一个基于 React + Vite 的短视频文案生成器网页。已内置 `/api/generate` 本地后端接口，可接入 OpenAI API；没有配置 API Key 时会自动回退到本地假数据。

## 功能

- 输入视频主题、目标平台、账号类型、文案风格
- 生成爆款标题 10 个
- 生成开头钩子 10 个
- 生成完整文案 A/B 对比 2 篇，方便选择不同表达角度
- 生成抖音口播文案 1 篇
- 生成小红书图文文案 1 篇
- 生成评论区引导话术 5 条
- 生成私信转化话术 5 条
- 支持单项复制、整组复制、重新生成
- 支持 OpenAI API 结构化输出
- 未配置 API Key 时自动使用本地模拟结果

## 接入 OpenAI API

复制环境变量示例文件：

```bash
cp .env.example .env
```

在 `.env` 中填入：

```bash
OPENAI_API_KEY=你的 API Key
OPENAI_MODEL=gpt-5.2
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=600000
```

保存后重新启动开发服务：

```bash
npm run dev
```

前端会请求本地接口 `/api/generate`，API Key 只在本地 Node 后端读取，不会暴露到浏览器。

`RATE_LIMIT_MAX` 表示单个访问者在一个时间窗口内最多请求多少次，`RATE_LIMIT_WINDOW_MS` 表示时间窗口，默认是 10 分钟。

## 运行步骤

```bash
npm install
npm run dev
```

打开终端显示的本地地址即可访问。

## 构建

```bash
npm run build
```

## 让别人使用

这个项目现在可以作为 Node 应用部署。部署后别人访问你的公网域名即可使用。

生产环境启动流程：

```bash
npm install
npm run build
npm start
```

部署到任意支持 Node.js 的平台时，通常这样填写：

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `RATE_LIMIT_MAX`
  - `RATE_LIMIT_WINDOW_MS`

注意：不要把 `OPENAI_API_KEY` 写进前端代码，也不要提交到 GitHub。只放在云平台的环境变量里。

更完整的部署步骤见 [DEPLOY.md](./DEPLOY.md)。项目也已包含 `render.yaml` 和 `Dockerfile`。
