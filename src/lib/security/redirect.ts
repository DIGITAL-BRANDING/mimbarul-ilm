/** Accept only same-site relative paths for post-login redirects (prevents open redirects). */
export function safeInternalPath(next: string | null | undefined, fallback = "/admin"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
