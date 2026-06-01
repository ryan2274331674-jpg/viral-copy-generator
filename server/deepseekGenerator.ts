import OpenAI from "openai";
import type { GeneratedResult, FormState } from "../src/lib/copyGenerator";
import { generateMockResult } from "../src/lib/copyGenerator";

export type GeneratePayload = {
  form: FormState;
  seed?: number;
};

export type GenerateResponse = {
  result: GeneratedResult;
  source: "deepseek" | "mock";
  model?: string;
  notice?: string;
};

const normalizeString = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

export const normalizePayload = (payload: Partial<GeneratePayload>): GeneratePayload => ({
  form: {
    topic: normalizeString(payload.form?.topic, "短视频内容"),
    platform: normalizeString(payload.form?.platform, "抖音"),
    accountType: normalizeString(payload.form?.accountType, "个人IP"),
    style: normalizeString(payload.form?.style, "反差悬念"),
  },
  seed: Number.isFinite(payload.seed) ? Number(payload.seed) : 0,
});

const ensureArray = (items: unknown, size: number) => (Array.isArray(items) ? items.filter((item) => typeof item === "string").slice(0, size) : []);

const ensureCompleteCopies = (items: unknown, fallback: GeneratedResult["completeCopies"]) => {
  if (!Array.isArray(items)) return fallback;

  const normalized = items
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const copyItem = item as Record<string, unknown>;
      const label = normalizeString(copyItem.label, "");
      const angle = normalizeString(copyItem.angle, "");
      const copy = normalizeString(copyItem.copy, "");

      return label && angle && copy ? [{ label, angle, copy }] : [];
    })
    .slice(0, 2);

  return normalized.length === 2 ? normalized : fallback;
};

const normalizeResult = (result: Partial<GeneratedResult>, fallback: GeneratedResult): GeneratedResult => ({
  titles: ensureArray(result.titles, 10).length === 10 ? ensureArray(result.titles, 10) : fallback.titles,
  hooks: ensureArray(result.hooks, 10).length === 10 ? ensureArray(result.hooks, 10) : fallback.hooks,
  completeCopies: ensureCompleteCopies(result.completeCopies, fallback.completeCopies),
  douyinScript: normalizeString(result.douyinScript, fallback.douyinScript),
  xiaohongshuPost: normalizeString(result.xiaohongshuPost, fallback.xiaohongshuPost),
  commentGuides: ensureArray(result.commentGuides, 5).length === 5 ? ensureArray(result.commentGuides, 5) : fallback.commentGuides,
  dmScripts: ensureArray(result.dmScripts, 5).length === 5 ? ensureArray(result.dmScripts, 5) : fallback.dmScripts,
});

const buildSystemPrompt = () => `你是资深中文短视频内容策划，擅长抖音、小红书、视频号、快手、B站内容增长。
请只输出合法 JSON，不要输出 Markdown、解释、代码块或额外文本。
JSON 必须包含以下字段：
{
  "titles": ["10个爆款标题"],
  "hooks": ["10个开头钩子"],
  "completeCopies": [
    {"label": "版本A：...", "angle": "差异化角度", "copy": "完整可发布文案"},
    {"label": "版本B：...", "angle": "差异化角度", "copy": "完整可发布文案"}
  ],
  "douyinScript": "抖音口播文案",
  "xiaohongshuPost": "小红书图文文案",
  "commentGuides": ["5条评论区引导话术"],
  "dmScripts": ["5条私信转化话术"]
}`;

const buildUserPrompt = (form: FormState) => `请根据以下信息生成中文短视频文案资产：
视频主题：${form.topic}
目标平台：${form.platform}
账号类型：${form.accountType}
文案风格：${form.style}

输出要求：
1. titles：爆款标题 10 个，每个不超过 28 个中文字符，避免标题党和夸大承诺。
2. hooks：开头钩子 10 个，每个适合视频前 3 秒口播。
3. completeCopies：完整文案对比 2 篇。版本A和版本B必须角度明显不同，每篇包含标题、开头、正文、结尾行动，适合直接发布，约 450-700 字。
4. douyinScript：抖音口播文案 1 篇，约 450-650 字，适合口播。
5. xiaohongshuPost：小红书图文文案 1 篇，有标题、正文、结尾互动，适合收藏。
6. commentGuides：评论区引导话术 5 条。
7. dmScripts：私信转化话术 5 条，语气真诚，不要强推。

请确保输出是合法 JSON。`;

export const generateCopy = async (payload: GeneratePayload): Promise<GenerateResponse> => {
  const seed = payload.seed ?? 0;
  const fallback = generateMockResult(payload.form, seed);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    return {
      result: fallback,
      source: "mock",
      notice: "未检测到 DEEPSEEK_API_KEY，已使用本地模拟内容。",
    };
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(payload.form) },
      ],
      response_format: { type: "json_object" },
      max_tokens: 6000,
      temperature: 0.8,
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek 返回内容为空");
    }

    const parsed = JSON.parse(content) as Partial<GeneratedResult>;
    return {
      result: normalizeResult(parsed, fallback),
      source: "deepseek",
      model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "DeepSeek API 请求失败";
    return {
      result: fallback,
      source: "mock",
      model,
      notice: `DeepSeek API 暂不可用，已回退本地模拟内容。${message}`,
    };
  }
};
