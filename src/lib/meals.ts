import calorieCatalog from "@/generated/calorie-catalog.json";

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

type CatalogEntry = {
  name: string;
  calories: number;
  normalizedName: string;
};

type CatalogMatch = {
  name: string;
  calories: number;
  count: number;
  matchType: "exact" | "contained" | "family";
};

const CATALOG: CatalogEntry[] = calorieCatalog.map((entry) => ({
  ...entry,
  normalizedName: normalizeFoodName(entry.name),
}));

function normalizeFoodName(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/gi, "");
}

function averageMatch(
  entries: CatalogEntry[],
  matchType: CatalogMatch["matchType"],
): CatalogMatch {
  const calories =
    entries.reduce((sum, entry) => sum + entry.calories, 0) / entries.length;

  return {
    name: entries[0].name,
    calories,
    count: entries.length,
    matchType,
  };
}

function findCatalogMatch(foodName: string): CatalogMatch | null {
  const normalizedInput = normalizeFoodName(foodName);
  if (!normalizedInput) return null;

  const exactEntries = CATALOG.filter(
    (entry) => entry.normalizedName === normalizedInput,
  );
  if (exactEntries.length) return averageMatch(exactEntries, "exact");

  const containedEntries = CATALOG.filter(
    (entry) =>
      entry.normalizedName.length >= 2 &&
      normalizedInput.includes(entry.normalizedName),
  );
  if (containedEntries.length) {
    const longestLength = Math.max(
      ...containedEntries.map((entry) => entry.normalizedName.length),
    );
    const longestName = containedEntries.find(
      (entry) => entry.normalizedName.length === longestLength,
    )?.normalizedName;
    const closestEntries = containedEntries.filter(
      (entry) => entry.normalizedName === longestName,
    );
    return averageMatch(closestEntries, "contained");
  }

  if (normalizedInput.length >= 2) {
    const familyEntries = CATALOG.filter((entry) =>
      entry.normalizedName.includes(normalizedInput),
    );
    if (familyEntries.length) return averageMatch(familyEntries, "family");
  }

  return null;
}

function amountMultiplier(amount: string) {
  const number = Number.parseFloat(amount.match(/\d+(\.\d+)?/)?.[0] ?? "1");
  if (!Number.isFinite(number) || number <= 0) {
    return { multiplier: 1, isConvertible: false };
  }

  if (/(?:kg|킬로그램|g|그램|ml|밀리리터|l|리터)(?:\s|$)/i.test(amount)) {
    return { multiplier: 1, isConvertible: false };
  }

  const hasCountUnit =
    /(인분|그릇|접시|공기|개|줄|봉|컵|조각|쪽|마리|팩|병|캔)/.test(amount);
  const isBareNumber = /^\s*\d+(?:\.\d+)?\s*$/.test(amount);

  if (!hasCountUnit && !isBareNumber) {
    return { multiplier: 1, isConvertible: false };
  }

  return {
    multiplier: Math.min(Math.max(number, 0.1), 10),
    isConvertible: true,
  };
}

function formatCalories(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

export function estimateMeal(draft: MealDraft): Required<
  Pick<MealDraft, "estimatedCalories" | "confidence" | "reason">
> {
  if (!draft.foodName.trim() || draft.foodName === "사진 속 음식") {
    return {
      estimatedCalories: 450,
      confidence: "low",
      reason:
        "사진만으로 만든 임시 추정치예요. 음식 이름과 양을 확인하면 기록이 더 정확해져요.",
    };
  }

  const match = findCatalogMatch(draft.foodName);
  const amount = amountMultiplier(draft.amount);
  const base = match?.calories ?? (draft.inputType === "photo" ? 450 : 350);
  const calories = Math.round(base * amount.multiplier);

  if (!match) {
    return {
      estimatedCalories: calories,
      confidence: "low",
      reason:
        "칼로리 정보 파일에서 일치하는 음식을 찾지 못해 임시 추정값을 표시했어요. 음식 이름과 결과를 확인해 주세요.",
    };
  }

  const sourceDescription =
    match.count > 1
      ? `칼로리 정보 파일의 '${match.name}' 관련 ${match.count}개 값 평균 ${formatCalories(match.calories)} kcal`
      : `칼로리 정보 파일의 '${match.name}' 1인분 ${formatCalories(match.calories)} kcal`;
  const amountDescription = amount.isConvertible
    ? `입력한 양을 ${formatCalories(amount.multiplier)}배 반영했어요.`
    : `파일에 1인분 중량 정보가 없어 '${draft.amount}'은(는) 1인분 기준으로 계산했어요.`;

  return {
    estimatedCalories: calories,
    confidence: match.matchType === "family" ? "low" : "medium",
    reason: `${sourceDescription}를 기준으로 ${amountDescription}`,
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
