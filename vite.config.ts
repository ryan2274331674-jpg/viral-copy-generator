import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { apiMiddlewarePlugin } from "./server/apiMiddleware";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("DEEPSEEK_") && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), apiMiddlewarePlugin()],
  };
});
