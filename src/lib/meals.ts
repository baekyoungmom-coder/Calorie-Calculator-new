import calorieCatalog from "@/generated/calorie-catalog.json";
import {
  calculateGramCalories,
  calculateServingCalories,
  findExactCalorieFood,
  parseGramAmount,
  parseServingMultiplier,
  prepareCalorieCatalog,
  searchPreparedCalorieCatalog,
} from "@/lib/calorie-catalog";
export type { CalorieFood } from "@/lib/calorie-catalog";
export { parseServingMultiplier } from "@/lib/calorie-catalog";
import type { CalorieFood } from "@/lib/calorie-catalog";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type InputType = "photo" | "text";

export type MealDraft = {
  trialId: string;
  inputType: InputType;
  foodName: string;
  amount: string;
  mealType: MealType;
  memo: string;
  recordedAt: string;
  imageName?: string;
  foodSourceCode?: string;
  foodBasisGrams?: number;
  calorieSource?: "catalog" | "manual";
  estimatedCalories?: number;
  finalCalories?: number;
  confidence?: "low" | "medium" | "high";
  reason?: string;
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const CATALOG = prepareCalorieCatalog(calorieCatalog);

export const SERVING_OPTIONS = [0.5, 1, 1.5, 2, 3] as const;

export function findCalorieFood(foodName: string): CalorieFood | null {
  return findExactCalorieFood(CATALOG, foodName);
}

export function searchCalorieFoods(foodName: string, limit = 6) {
  return searchPreparedCalorieCatalog(CATALOG, foodName, limit);
}

function parseAmount(amount: string) {
  const grams = parseGramAmount(amount);
  if (grams !== null) return { type: "gram" as const, grams };

  const multiplier = parseServingMultiplier(amount);
  if (multiplier === null) {
    return { type: "unknown" as const };
  }

  return {
    type: "serving" as const,
    servings: multiplier,
  };
}

function formatCalories(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

export function estimateMeal(draft: MealDraft): Required<
  Pick<MealDraft, "estimatedCalories" | "confidence" | "reason">
> & {
  matchedFoodName: string | null;
  caloriesPerServing: number | null;
  basisGrams: number | null;
  grams: number | null;
  servings: number | null;
} {
  if (!draft.foodName.trim() || draft.foodName === "사진 속 음식") {
    return {
      estimatedCalories: 450,
      confidence: "low",
      reason:
        "사진만으로 만든 임시 추정치예요. 음식 이름과 양을 확인하면 기록이 더 정확해져요.",
      matchedFoodName: null,
      caloriesPerServing: null,
      basisGrams: null,
      grams: null,
      servings: null,
    };
  }

  const match = findCalorieFood(draft.foodName);
  const amount = parseAmount(draft.amount);
  const base = match?.calories ?? (draft.inputType === "photo" ? 450 : 350);
  const calories =
    amount.type === "gram" && match?.basisGrams
      ? calculateGramCalories(base, match.basisGrams, amount.grams)
      : calculateServingCalories(
          base,
          amount.type === "serving" ? amount.servings : 1,
        );

  if (!match) {
    return {
      estimatedCalories: calories,
      confidence: "low",
      reason:
        "칼로리 정보 파일에서 정확히 일치하는 음식을 찾지 못해 임시 추정값을 표시했어요. 음식 이름과 결과를 직접 확인해 주세요.",
      matchedFoodName: null,
      caloriesPerServing: null,
      basisGrams: null,
      grams: amount.type === "gram" ? amount.grams : null,
      servings: amount.type === "serving" ? amount.servings : null,
    };
  }

  const sourceDescription =
    match.basisGrams
      ? `${match.source ?? "공식 식품영양성분 DB"}의 '${match.name}' ${formatCalories(match.basisGrams)}g당 ${formatCalories(match.calories)} kcal`
      : match.count > 1
      ? `칼로리 정보 파일의 '${match.name}' 관련 ${match.count}개 값 평균 ${formatCalories(match.calories)} kcal`
      : `칼로리 정보 파일의 '${match.name}' 1인분 ${formatCalories(match.calories)} kcal`;
  const amountDescription =
    amount.type === "gram" && match.basisGrams
      ? `${formatCalories(amount.grams)}g을 기준량에 비례해 계산했어요.`
      : amount.type === "serving"
        ? `입력한 양을 ${formatCalories(amount.servings)}배 반영했어요.`
        : `입력한 양의 단위를 계산에 반영하지 못해 1인분 기준으로 표시했어요.`;

  return {
    estimatedCalories: calories,
    confidence: "medium",
    reason: `${sourceDescription}를 기준으로 ${amountDescription}`,
    matchedFoodName: match.name,
    caloriesPerServing: match.calories,
    basisGrams: match.basisGrams ?? null,
    grams: amount.type === "gram" ? amount.grams : null,
    servings: amount.type === "serving" ? amount.servings : null,
  };
}

const DRAFT_KEY = "calorie-calculator-draft";

export function createTrialId() {
  return crypto.randomUUID();
}

export function setDraft(draft: MealDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function getDraft(): MealDraft | null {
  try {
    const draft = JSON.parse(
      sessionStorage.getItem(DRAFT_KEY) ?? "null",
    ) as MealDraft | null;
    if (!draft) return null;

    if (!draft.trialId) {
      const migratedDraft = { ...draft, trialId: createTrialId() };
      setDraft(migratedDraft);
      return migratedDraft;
    }

    return draft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
