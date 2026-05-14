import OpenAI from "openai";
import type { GeneratedResult, FormState } from "../src/lib/copyGenerator";
import { generateMockResult } from "../src/lib/copyGenerator";

export type GeneratePayload = {
  form: FormState;
  seed?: number;
};

export type GenerateResponse = {
  result: GeneratedResult;
  source: "openai" | "mock";
  model?: string;
  notice?: string;
};

const resultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["titles", "hooks", "completeCopies", "douyinScript", "xiaohongshuPost", "commentGuides", "dmScripts"],
  properties: {
    titles: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: { type: "string" },
    },
    hooks: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: { type: "string" },
    },
    completeCopies: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "angle", "copy"],
        properties: {
          label: { type: "string" },
          angle: { type: "string" },
          copy: { type: "string" },
        },
      },
    },
    douyinScript: { type: "string" },
    xiaohongshuPost: { type: "string" },
    commentGuides: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: { type: "string" },
    },
    dmScripts: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: { type: "string" },
    },
  },
} as const;

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

export const generateCopy = async (payload: GeneratePayload): Promise<GenerateResponse> => {
  const seed = payload.seed ?? 0;
  const fallback = generateMockResult(payload.form, seed);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  if (!apiKey) {
    return {
      result: fallback,
      source: "mock",
      notice: "未检测到 OPENAI_API_KEY，已使用本地模拟内容。",
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model,
      instructions:
        "你是资深中文短视频内容策划。请生成适合商业账号使用的中文爆款文案，表达自然、具体、可直接发布，避免空泛套话。",
      input: `请根据以下信息生成短视频文案资产：
视频主题：${payload.form.topic}
目标平台：${payload.form.platform}
账号类型：${payload.form.accountType}
文案风格：${payload.form.style}

要求：
1. 爆款标题 10 个，每个不超过 28 个中文字符。
2. 开头钩子 10 个，每个适合视频前 3 秒口播。
3. 完整文案对比 2 篇，版本A和版本B必须角度明显不同。每篇都要包含标题、开头、正文、结尾行动，适合直接发布，约 450-700 字。
4. 抖音口播文案 1 篇，约 450-650 字。
5. 小红书图文文案 1 篇，有标题、正文、结尾互动。
6. 评论区引导话术 5 条。
7. 私信转化话术 5 条，语气真诚，不要强推。`,
      text: {
        format: {
          type: "json_schema",
          name: "viral_copy_result",
          strict: true,
          schema: resultSchema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as Partial<GeneratedResult>;
    return {
      result: normalizeResult(parsed, fallback),
      source: "openai",
      model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI API 请求失败";
    return {
      result: fallback,
      source: "mock",
      model,
      notice: `OpenAI API 暂不可用，已回退本地模拟内容。${message}`,
    };
  }
};
