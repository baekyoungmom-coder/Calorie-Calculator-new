import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getSupabaseConfig } from "@/lib/supabase/config";

function isAllowedOrigin(value: unknown) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const isProduction = url.hostname === "calorie-calculator-new.vercel.app";
    // Vercel's immutable Preview URLs use the project name without the
    // repository's "-new" suffix (for example, calorie-calculator-<id>).
    const isPreview =
      url.hostname.startsWith("calorie-calculator-") &&
      url.hostname.endsWith(".vercel.app");
    const isLocal =
      process.env.NODE_ENV !== "production" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if ((url.protocol === "https:" && (isProduction || isPreview)) ||
      (url.protocol === "http:" && isLocal)) {
      return url.origin;
    }
  } catch {
    // Invalid origins are rejected below.
  }

  return null;
}

export async function POST(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return failure("Supabase configuration is missing.", "MISSING_CONFIG", 500);

  let body: { callbackOrigin?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return failure("Invalid request body.", "VALIDATION_ERROR", 400);
  }

  const origin = isAllowedOrigin(body.callbackOrigin);
  const next =
    typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//")
      ? body.next
      : "/";
  if (!origin) return failure("Invalid callback origin.", "VALIDATION_ERROR", 400);

  let cookiesToSet: Parameters<SetAllCookies>[0] = [];
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies: Parameters<SetAllCookies>[0]) => { cookiesToSet = cookies; },
    },
  });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return failure("Could not start Google OAuth.", "OAUTH_INIT_FAILED", 502);

  const response = success({ url: data.url });
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
