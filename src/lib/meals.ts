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
  estimatedCalories?: number;
  confidence?: "low" | "medium" | "high";
  reason?: string;
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const FOOD_CALORIES: Array<[string, number]> = [
  ["김밥", 420],
  ["비빔밥", 560],
  ["샐러드", 180],
  ["치킨", 680],
  ["라면", 500],
  ["밥", 310],
  ["피자", 650],
  ["햄버거", 520],
  ["샌드위치", 380],
  ["사과", 95],
  ["바나나", 105],
  ["계란", 80],
  ["커피", 15],
];

function amountMultiplier(amount: string) {
  const number = Number.parseFloat(amount.match(/\d+(\.\d+)?/)?.[0] ?? "1");
  if (!Number.isFinite(number) || number <= 0) return 1;
  if (/g|그램/i.test(amount)) return Math.max(0.25, number / 200);
  return Math.min(number, 5);
}

export function estimateMeal(draft: MealDraft): Required<
  Pick<MealDraft, "estimatedCalories" | "confidence" | "reason">
> {
  const match = FOOD_CALORIES.find(([name]) => draft.foodName.includes(name));
  const base = match?.[1] ?? (draft.inputType === "photo" ? 450 : 350);
  const calories = Math.round(base * amountMultiplier(draft.amount));

  if (!draft.foodName.trim() || draft.foodName === "사진 속 음식") {
    return {
      estimatedCalories: 450,
      confidence: "low",
      reason:
        "사진만으로 만든 임시 추정치예요. 음식 이름과 양을 확인하면 기록이 더 정확해져요.",
    };
  }

  return {
    estimatedCalories: calories,
    confidence: match ? "medium" : "low",
    reason: match
      ? "입력한 음식 이름과 양을 기준으로 추정했어요."
      : "입력 정보를 기준으로 한 대략적인 값이에요. 결과를 확인하고 수정해 주세요.",
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
