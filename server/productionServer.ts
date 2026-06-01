import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { readJsonBody, sendJson } from "./httpHelpers";
import { generateCopy, normalizePayload } from "./deepseekGenerator";
import { checkRateLimit } from "./rateLimit";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const port = Number(process.env.PORT || 3000);

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const resolveStaticPath = (urlPath: string) => {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(distDir, normalizedPath === "/" ? "index.html" : normalizedPath);

  if (!requestedPath.startsWith(distDir)) {
    return path.join(distDir, "index.html");
  }

  return requestedPath;
};

const serveFile = async (requestUrl: string, response: ServerResponse) => {
  let filePath = resolveStaticPath(requestUrl);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch {
    filePath = path.join(distDir, "index.html");
  }

  const extension = path.extname(filePath);
  response.setHeader("Content-Type", mimeTypes[extension] || "application/octet-stream");
  createReadStream(filePath).pipe(response);
};

const server = createServer(async (request, response) => {
  if (request.url === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "viral-copy-generator",
      hasDeepSeekKey: Boolean(process.env.DEEPSEEK_API_KEY),
    });
    return;
  }

  if (request.url === "/api/generate") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      sendJson(response, 429, {
        error: "请求太频繁，请稍后再试。",
        resetAt: rateLimit.resetAt,
      });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const payload = normalizePayload(body as object);
      const generated = await generateCopy(payload);
      sendJson(response, 200, generated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败";
      sendJson(response, 400, { error: message });
    }

    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  await serveFile(request.url || "/", response);
});

server.listen(port, () => {
  console.log(`Viral copy generator is running on http://localhost:${port}`);
});
