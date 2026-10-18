import { createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const composeFile = path.join(root, "tests/integration/stack/docker-compose.yml");
const secret = "test-stack-jwt-secret-at-least-32-bytes-long";
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const header = encode({ alg: "HS256", typ: "JWT" });
const payload = encode({ role: "anon", iss: "supabase", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 });
const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
const env = {
  ...process.env,
  TEST_DB_PORT: process.env.TEST_DB_PORT || "55432",
  TEST_REST_PORT: process.env.TEST_REST_PORT || "55433",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${process.env.TEST_REST_PORT || "55433"}`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `${header}.${payload}.${signature}`,
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit", shell: process.platform === "win32", ...options });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const compose = (args) => run("docker", ["compose", "-p", "mimbarul-ilm-test", "-f", composeFile, ...args]);
const restUrl = env.NEXT_PUBLIC_SUPABASE_URL;

let testStatus = 1;
try {
  if (compose(["up", "--detach", "--wait"]) === 0) {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const response = await fetch(restUrl);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("PostgREST did not become ready at " + restUrl);
    testStatus = run("npx", ["vitest", "run", "tests/integration/public-data.test.ts"]);
  }
} finally {
  compose(["down", "--volumes", "--remove-orphans"]);
}
process.exit(testStatus);
