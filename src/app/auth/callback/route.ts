import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function loginErrorRedirect(url: URL, error: string) {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");
  const providerErrorDescription = url.searchParams.get("error_description");
  const requestedPath = url.searchParams.get("next");
  const next =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/";

  if (providerError) {
    console.error("[auth] OAuth provider returned an error.", {
      error: providerError,
      description: providerErrorDescription,
    });
    return loginErrorRedirect(url, "oauth-provider");
  }

  if (code) {
    const config = getSupabaseConfig();
    if (!config) return loginErrorRedirect(url, "missing-config");

    // Supabase가 발급한 세션 쿠키를 같은 redirect 응답에 실어야
    // Vercel 환경에서도 다음 요청부터 로그인 상태가 유지된다.
    const response = NextResponse.redirect(new URL(next, url.origin));
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    const result = await supabase.auth.exchangeCodeForSession(code);

    if (result && !result.error) {
      return response;
    }

    console.error("[auth] OAuth code exchange failed.", {
      message: result?.error?.message,
      status: result?.error?.status,
    });
    return loginErrorRedirect(url, "oauth-exchange");
  }

  console.error("[auth] OAuth callback arrived without a code.");
  return loginErrorRedirect(url, "oauth-callback");
}
