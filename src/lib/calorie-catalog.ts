export type RawCalorieFood = {
  id?: string;
  name: string;
  calories: number;
  basisGrams?: number;
  source?: string;
  sourceCode?: string;
  sourceUpdatedAt?: string | null;
};

export type CalorieFood = RawCalorieFood & {
  count: number;
  normalizedName: string;
};

export function normalizeFoodName(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/gi, "");
}

export function prepareCalorieCatalog(
  entries: RawCalorieFood[],
): CalorieFood[] {
  const grouped = new Map<
    string,
    { name: string; totalCalories: number; count: number }
  >();

  for (const entry of entries) {
    const normalizedName = normalizeFoodName(entry.name);
    if (!normalizedName || !Number.isFinite(entry.calories)) continue;

    if (entry.id) {
      grouped.set(entry.id, {
        name: entry.name,
        totalCalories: entry.calories,
        count: 1,
      });
      continue;
    }

    const existing = grouped.get(normalizedName);
    if (existing) {
      existing.totalCalories += entry.calories;
      existing.count += 1;
      continue;
    }

    grouped.set(normalizedName, {
      name: entry.name,
      totalCalories: entry.calories,
      count: 1,
    });
  }

  return Array.from(grouped, ([key, entry]) => {
    const original = entries.find((candidate) => candidate.id === key);
    return {
      ...(original ?? {}),
      name: entry.name,
      calories: entry.totalCalories / entry.count,
      count: entry.count,
      normalizedName: normalizeFoodName(entry.name),
    };
  });
}

export function findExactCalorieFood(
  catalog: CalorieFood[],
  foodName: string,
) {
  const normalizedName = normalizeFoodName(foodName);
  if (!normalizedName) return null;

  return (
    catalog.find((entry) => entry.normalizedName === normalizedName) ?? null
  );
}

export function searchPreparedCalorieCatalog(
  catalog: CalorieFood[],
  query: string,
  limit = 6,
) {
  const normalizedQuery = normalizeFoodName(query);
  if (!normalizedQuery) return [];

  return catalog
    .map((entry) => {
      let score = Number.POSITIVE_INFINITY;

      if (entry.basisGrams && entry.normalizedName.startsWith(normalizedQuery)) {
        score = entry.name.includes("생것") ? -1 : 0;
      } else if (entry.normalizedName === normalizedQuery) score = 1;
      else if (entry.normalizedName.startsWith(normalizedQuery)) score = 2;
      else if (entry.normalizedName.includes(normalizedQuery)) score = 3;

      return { entry, score };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.entry.normalizedName.length - right.entry.normalizedName.length ||
        left.entry.name.localeCompare(right.entry.name, "ko"),
    )
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export function parseServingMultiplier(amount: string) {
  const match = amount
    .trim()
    .match(
      /^(\d+(?:\.\d+)?)\s*(?:인분|그릇|접시|공기|개|줄|봉|컵|조각|쪽|마리|팩|병|캔)?$/,
    );
  if (!match) return null;

  const servings = Number.parseFloat(match[1]);
  if (!Number.isFinite(servings) || servings < 0.1 || servings > 10) {
    return null;
  }

  return servings;
}

export function calculateServingCalories(
  caloriesPerServing: number,
  servings: number,
) {
  return Math.round(caloriesPerServing * servings);
}

export function calculateGramCalories(
  caloriesPerBasis: number,
  basisGrams: number,
  grams: number,
) {
  return Math.round((caloriesPerBasis * grams) / basisGrams);
}

export function parseGramAmount(amount: string) {
  const match = amount.trim().match(/^(\d+(?:\.\d+)?)\s*(?:g|그램)$/i);
  if (!match) return null;

  const grams = Number.parseFloat(match[1]);
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) return null;

  return grams;
}
