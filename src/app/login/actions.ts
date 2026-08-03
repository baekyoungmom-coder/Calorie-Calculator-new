"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRequestOrigin(headerStore: Headers) {
  const origin = headerStore.get("origin");
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      console.warn("[auth] Request origin is not a valid URL.");
    }
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) return `${protocol}://${host}`;

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredOrigin) return null;

  try {
    const url = new URL(configuredOrigin);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    console.warn("[auth] NEXT_PUBLIC_APP_URL is not a valid URL.");
    return null;
  }
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login?error=missing-config");
  }

  const headerStore = await headers();
  const origin = getRequestOrigin(headerStore);
  const requestedPath = formData.get("next");
  const next =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
      ? requestedPath
      : "/";

  if (!origin) {
    console.error("[auth] Could not determine the application origin.");
    redirect("/login?error=oauth-origin");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    console.error("[auth] Google OAuth initialization failed.", {
      message: error?.message,
      status: error?.status,
    });
    redirect("/login?error=oauth-init");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
