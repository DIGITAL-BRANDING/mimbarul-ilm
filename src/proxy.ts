import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import { getPublicEnv } from "@/lib/env";

/** Picks a locale from the NEXT_LOCALE cookie, then Accept-Language, then the default (Hausa). */
function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (isLocale(cookie)) return cookie;
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase().split("-")[0];
    if (tag && (LOCALES as readonly string[]).includes(tag)) return tag as Locale;
  }
  return DEFAULT_LOCALE;
}

async function adminGate(request: NextRequest) {
  const env = getPublicEnv();
  const requestHeaders = new Headers(request.headers);
  // Admin is not locale-prefixed. Keep its fallback/error UI in the admin language
  // instead of letting the public Hausa default leak into the admin area.
  requestHeaders.set("x-locale", "en");
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = nextResponse();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextResponse();
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Validates the token and refreshes the session cookies when needed.
  const { data } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  if (!data.user && pathname !== "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminGate(request);

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-locale", first); // read by not-found, which receives no route params
    return NextResponse.next({ request: { headers } });
  }

  // Un-prefixed public path (e.g. "/" or "/lessons") -> locale-prefixed path.
  const url = request.nextUrl.clone();
  url.pathname = `/${detectLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Skip API routes, Next internals and any path containing a file extension.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
