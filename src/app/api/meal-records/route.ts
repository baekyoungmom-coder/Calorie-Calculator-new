import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";
import { toMealRecord, validateMealRecord } from "@/lib/server/meal-records";

export async function GET() {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  const { data, error } = await auth.supabase
    .from("meal_records")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("recorded_at", { ascending: false });

  if (error) return failure("식사 기록을 불러오지 못했습니다.", "DATABASE_ERROR", 500);
  return success({ records: (data ?? []).map(toMealRecord) });
}

export async function DELETE() {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  const { data, error } = await auth.supabase
    .from("meal_records")
    .delete()
    .eq("user_id", auth.user.id)
    .select("id");

  if (error) {
    return failure("전체 식사 기록을 삭제하지 못했습니다.", "DATABASE_ERROR", 500);
  }

  return success(
    { deletedCount: data?.length ?? 0 },
    "전체 식사 기록을 삭제했습니다.",
  );
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("기록을 저장하려면 로그인이 필요합니다.", "UNAUTHORIZED", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("요청 본문이 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  const { value, errors } = validateMealRecord(body);
  if (!value) return failure("입력값이 올바르지 않습니다.", "VALIDATION_ERROR", 400, errors);

  const { data: record, error: recordError } = await auth.supabase
    .from("meal_records")
    .insert({
      user_id: auth.user.id,
      input_type: value.inputType,
      meal_type: value.mealType,
      food_name: value.foodName,
      amount: value.amount,
      memo: value.memo,
      estimated_calories: value.estimatedCalories,
      final_calories: value.finalCalories,
      confidence: value.confidence,
      estimate_reason: value.estimateReason,
      food_source_code: value.foodSourceCode,
      food_basis_grams: value.foodBasisGrams,
      recorded_at: value.recordedAt,
      recorded_timezone: value.recordedTimezone,
    })
    .select()
    .single();

  if (recordError || !record) return failure("식사 기록을 저장하지 못했습니다.", "DATABASE_ERROR", 500);

  const { error: estimateError } = await auth.supabase.from("calorie_estimates").insert({
    meal_record_id: record.id,
    estimated_calories: value.estimatedCalories,
    confidence: value.confidence,
    summary_text: value.estimateReason,
  });

  if (estimateError) {
    await auth.supabase.from("meal_records").delete().eq("id", record.id);
    return failure("추정 결과를 저장하지 못했습니다.", "DATABASE_ERROR", 500);
  }

  return success({ record: toMealRecord(record) }, "식사 기록을 저장했습니다.");
}
