import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";

export async function GET() {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) return failure("프로필을 불러오지 못했습니다.", "DATABASE_ERROR", 500);

  return success({
    userId: auth.user.id,
    name: profile?.display_name ?? auth.user.user_metadata?.full_name ?? auth.user.email?.split("@")[0] ?? "사용자",
    email: profile?.email ?? auth.user.email ?? null,
    avatarUrl: profile?.avatar_url ?? auth.user.user_metadata?.avatar_url ?? null,
  });
}
