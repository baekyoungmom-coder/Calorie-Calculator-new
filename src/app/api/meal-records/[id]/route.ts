import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";
import { toMealRecord, validateMealRecord } from "@/lib/server/meal-records";

type Context = { params: Promise<{ id: string }> };

function validId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function findRecord(id: string) {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return { error: failure("로그인이 필요합니다.", "UNAUTHORIZED", 401) };
  if (!validId(id)) return { error: failure("기록 ID가 올바르지 않습니다.", "VALIDATION_ERROR", 400) };

  const { data, error } = await auth.supabase
    .from("meal_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) return { error: failure("식사 기록을 불러오지 못했습니다.", "DATABASE_ERROR", 500) };
  if (!data) return { error: failure("식사 기록을 찾을 수 없습니다.", "NOT_FOUND", 404) };
  return { auth, record: data };
}

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const result = await findRecord(id);
  if ("error" in result) return result.error;
  return success({ record: toMealRecord(result.record) });
}

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const result = await findRecord(id);
  if ("error" in result) return result.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return failure("요청 본문이 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  const current = toMealRecord(result.record);
  const { value, errors } = validateMealRecord({
    inputType: current.inputType,
    mealType: current.mealType,
    foodName: current.foodName,
    amount: current.amount,
    memo: current.memo,
    estimatedCalories: current.estimatedCalories,
    finalCalories: current.finalCalories,
    confidence: current.confidence,
    estimateReason: current.reason,
    recordedAt: current.recordedAt,
    recordedTimezone: current.recordedTimezone,
    ...body,
  });
  if (!value) return failure("입력값이 올바르지 않습니다.", "VALIDATION_ERROR", 400, errors);

  const { data, error } = await result.auth.supabase
    .from("meal_records")
    .update({
      input_type: value.inputType,
      meal_type: value.mealType,
      food_name: value.foodName,
      amount: value.amount,
      memo: value.memo,
      estimated_calories: value.estimatedCalories,
      final_calories: value.finalCalories,
      confidence: value.confidence,
      estimate_reason: value.estimateReason,
      recorded_at: value.recordedAt,
      recorded_timezone: value.recordedTimezone,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return failure("식사 기록을 수정하지 못했습니다.", "DATABASE_ERROR", 500);
  return success({ record: toMealRecord(data) }, "식사 기록을 수정했습니다.");
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const result = await findRecord(id);
  if ("error" in result) return result.error;

  const { error } = await result.auth.supabase.from("meal_records").delete().eq("id", id);
  if (error) return failure("식사 기록을 삭제하지 못했습니다.", "DATABASE_ERROR", 500);
  return success({ deleted: true }, "식사 기록을 삭제했습니다.");
}
