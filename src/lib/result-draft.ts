import type { MealDraft } from "./meals";

export function resolveResultCalories(
  draft: Pick<MealDraft, "estimatedCalories" | "finalCalories">,
  calculatedEstimatedCalories: number,
) {
  const estimatedCalories =
    draft.estimatedCalories ?? calculatedEstimatedCalories;

  return {
    estimatedCalories,
    finalCalories: draft.finalCalories ?? estimatedCalories,
  };
}
