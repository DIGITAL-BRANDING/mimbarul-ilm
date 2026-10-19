import { defineConfig } from "vitest/config";
import path from "node:path";

// Integration tests talk to a real PostgREST + PostgreSQL stack (see tests/integration/stack). Run via `npm run test:stack`.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts") } },
  test: { include: ["tests/integration/**/*.test.ts"], environment: "node", testTimeout: 20_000, fileParallelism: false },
});
