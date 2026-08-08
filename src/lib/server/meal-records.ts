export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const INPUT_TYPES = ["photo", "text", "both"] as const;
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export type MealType = (typeof MEAL_TYPES)[number];
export type InputType = (typeof INPUT_TYPES)[number];
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export type MealRecordPayload = {
  inputType: InputType;
  mealType: MealType;
  foodName: string;
  amount: string;
  memo: string | null;
  estimatedCalories: number;
  finalCalories: number;
  confidence: Confidence;
  estimateReason: string | null;
  recordedAt: string;
  recordedTimezone: string;
};

const isOneOf = <T extends readonly string[]>(value: unknown, values: T): value is T[number] =>
  typeof value === "string" && values.includes(value);

const validText = (value: unknown, min: number, max: number) =>
  typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

const validCalories = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000;

export function validateMealRecord(body: unknown): { value?: MealRecordPayload; errors: string[] } {
  if (!body || typeof body !== "object") return { errors: ["요청 본문이 올바르지 않습니다."] };
  const input = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isOneOf(input.inputType, INPUT_TYPES)) errors.push("입력 방식이 올바르지 않습니다.");
  if (!isOneOf(input.mealType, MEAL_TYPES)) errors.push("식사 종류가 올바르지 않습니다.");
  if (!validText(input.foodName, 1, 60)) errors.push("음식 이름은 1~60자로 입력해 주세요.");
  if (!validText(input.amount, 1, 30)) errors.push("음식 양은 1~30자로 입력해 주세요.");
  if (input.memo !== undefined && input.memo !== null && !validText(input.memo, 0, 200)) errors.push("메모는 200자 이하여야 합니다.");
  if (!validCalories(input.estimatedCalories)) errors.push("추정 칼로리는 0~10,000의 정수여야 합니다.");
  if (!validCalories(input.finalCalories)) errors.push("최종 칼로리는 0~10,000의 정수여야 합니다.");
  if (!isOneOf(input.confidence, CONFIDENCE_LEVELS)) errors.push("신뢰도가 올바르지 않습니다.");
  if (input.estimateReason !== undefined && input.estimateReason !== null && !validText(input.estimateReason, 0, 500)) errors.push("추정 설명은 500자 이하여야 합니다.");
  if (typeof input.recordedAt !== "string" || Number.isNaN(Date.parse(input.recordedAt))) errors.push("기록 시각이 올바르지 않습니다.");
  if (!validText(input.recordedTimezone, 1, 100)) errors.push("기기 시간대가 올바르지 않습니다.");

  if (errors.length) return { errors };

  return {
    errors: [],
    value: {
      inputType: input.inputType as InputType,
      mealType: input.mealType as MealType,
      foodName: (input.foodName as string).trim(),
      amount: (input.amount as string).trim(),
      memo: typeof input.memo === "string" && input.memo.trim() ? input.memo.trim() : null,
      estimatedCalories: input.estimatedCalories as number,
      finalCalories: input.finalCalories as number,
      confidence: input.confidence as Confidence,
      estimateReason: typeof input.estimateReason === "string" && input.estimateReason.trim() ? input.estimateReason.trim() : null,
      recordedAt: input.recordedAt as string,
      recordedTimezone: (input.recordedTimezone as string).trim(),
    },
  };
}

export function toMealRecord(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    inputType: row.input_type as InputType,
    mealType: row.meal_type as MealType,
    foodName: row.food_name as string,
    amount: row.amount as string,
    memo: row.memo as string | null,
    estimatedCalories: row.estimated_calories as number,
    finalCalories: row.final_calories as number,
    confidence: row.confidence as Confidence,
    reason: row.estimate_reason as string | null,
    recordedAt: row.recorded_at as string,
    recordedTimezone: row.recorded_timezone as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function getDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function zonedMidnightToUtc(year: number, month: number, day: number, timeZone: string) {
  const guess = new Date(Date.UTC(year, month - 1, day));
  const local = getDateParts(guess, timeZone);
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  return new Date(guess.getTime() - (localAsUtc - guess.getTime()));
}

export function getTodayRange(timeZone: string) {
  try {
    const now = getDateParts(new Date(), timeZone);
    const start = zonedMidnightToUtc(now.year, now.month, now.day, timeZone);
    const next = new Date(Date.UTC(now.year, now.month - 1, now.day + 1));
    const nextLocal = getDateParts(next, "UTC");
    const end = zonedMidnightToUtc(nextLocal.year, nextLocal.month, nextLocal.day, timeZone);
    return { start: start.toISOString(), end: end.toISOString() };
  } catch {
    return null;
  }
}
