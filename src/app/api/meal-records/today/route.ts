import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";
import { getTodayRange, toMealRecord } from "@/lib/server/meal-records";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  const timeZone = request.nextUrl.searchParams.get("timezone") ?? "UTC";
  const range = getTodayRange(timeZone);
  if (!range) return failure("기기 시간대가 올바르지 않습니다.", "VALIDATION_ERROR", 400);

  const { data, error } = await auth.supabase
    .from("meal_records")
    .select("*")
    .eq("user_id", auth.user.id)
    .gte("recorded_at", range.start)
    .lt("recorded_at", range.end)
    .order("recorded_at", { ascending: true });

  if (error) return failure("오늘 기록을 불러오지 못했습니다.", "DATABASE_ERROR", 500);
  const records = (data ?? []).map(toMealRecord);
  const totalCalories = records.reduce((sum, record) => sum + record.finalCalories, 0);

  return success({ date: range.start.slice(0, 10), timeZone, totalCalories, records });
}
