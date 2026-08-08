import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";

const MIN_DAILY_CALORIE_GOAL = 500;
const MAX_DAILY_CALORIE_GOAL = 10000;

export async function GET() {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("display_name, email, avatar_url, daily_calorie_goal")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) return failure("프로필을 불러오지 못했습니다.", "DATABASE_ERROR", 500);

  return success({
    userId: auth.user.id,
    name: profile?.display_name ?? auth.user.user_metadata?.full_name ?? auth.user.email?.split("@")[0] ?? "사용자",
    email: profile?.email ?? auth.user.email ?? null,
    avatarUrl: profile?.avatar_url ?? auth.user.user_metadata?.avatar_url ?? null,
    dailyCalorieGoal: profile?.daily_calorie_goal ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("요청 본문이 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  if (!body || typeof body !== "object" || !("dailyCalorieGoal" in body)) {
    return failure("하루 목표 칼로리를 입력해 주세요.", "VALIDATION_ERROR", 400);
  }

  const dailyCalorieGoal = (body as { dailyCalorieGoal: unknown }).dailyCalorieGoal;
  const isValidGoal =
    dailyCalorieGoal === null ||
    (typeof dailyCalorieGoal === "number" &&
      Number.isInteger(dailyCalorieGoal) &&
      dailyCalorieGoal >= MIN_DAILY_CALORIE_GOAL &&
      dailyCalorieGoal <= MAX_DAILY_CALORIE_GOAL);

  if (!isValidGoal) {
    return failure(
      `하루 목표 칼로리는 ${MIN_DAILY_CALORIE_GOAL.toLocaleString("ko-KR")}~${MAX_DAILY_CALORIE_GOAL.toLocaleString("ko-KR")}kcal 범위의 정수로 입력해 주세요.`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .update({ daily_calorie_goal: dailyCalorieGoal })
    .eq("id", auth.user.id)
    .select("daily_calorie_goal")
    .single();

  if (error || !profile) {
    return failure("목표 칼로리를 저장하지 못했습니다.", "DATABASE_ERROR", 500);
  }

  return success(
    { dailyCalorieGoal: profile.daily_calorie_goal ?? null },
    dailyCalorieGoal === null
      ? "목표 칼로리를 해제했습니다."
      : "목표 칼로리를 저장했습니다.",
  );
}
