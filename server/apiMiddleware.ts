import type { Connect, Plugin } from "vite";
import { readJsonBody, sendJson } from "./httpHelpers";
import { generateCopy, normalizePayload } from "./openaiGenerator";
import { checkRateLimit } from "./rateLimit";

const handleGenerate: Connect.NextHandleFunction = async (request, response, next) => {
  if (request.url !== "/api/generate") {
    next();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      sendJson(response, 429, {
        error: "请求太频繁，请稍后再试。",
        resetAt: rateLimit.resetAt,
      });
      return;
    }

    const body = await readJsonBody(request);
    const payload = normalizePayload(body as object);
    const generated = await generateCopy(payload);
    sendJson(response, 200, generated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败";
    sendJson(response, 400, { error: message });
  }
};

export const apiMiddlewarePlugin = (): Plugin => ({
  name: "viral-copy-api",
  configureServer(server) {
    server.middlewares.use(handleGenerate);
  },
  configurePreviewServer(server) {
    server.middlewares.use(handleGenerate);
  },
});
