import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function loginErrorRedirect(url: URL, error: string) {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
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
    const supabase = await createClient();
    const result = await supabase?.auth.exchangeCodeForSession(code);

    if (result && !result.error) {
      return NextResponse.redirect(new URL(next, url.origin));
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
