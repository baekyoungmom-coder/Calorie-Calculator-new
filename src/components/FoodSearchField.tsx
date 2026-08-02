"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  findCalorieFood,
  searchCalorieFoods,
} from "@/lib/meals";
import type { CalorieFood } from "@/lib/meals";

export type FoodSuggestion = CalorieFood & {
  source: "local" | "public";
  basisAmount?: number;
  basisUnit?: "g" | "ml";
  sourceLabel?: string;
  foodCode?: string;
};

type FoodSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (food: FoodSuggestion) => void;
  noResultsMessage?: string;
  usePublicDb?: boolean;
};

export function FoodSearchField({
  value,
  onChange,
  onSelect,
  noResultsMessage = "일치하는 음식이 없어요. 다른 이름으로 검색해 주세요.",
  usePublicDb = false,
}: FoodSearchFieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<FoodSuggestion[]>([]);
  const [selectedRemoteFood, setSelectedRemoteFood] = useState<FoodSuggestion | null>(null);
  const suggestionsId = useId();
  const localSelectedFood = useMemo<FoodSuggestion | null>(() => {
    const food = findCalorieFood(value);
    return food ? { ...food, source: "local" } : null;
  }, [value]);
  const localSuggestions = useMemo<FoodSuggestion[]>(
    () => searchCalorieFoods(value).map((food) => ({ ...food, source: "local" })),
    [value],
  );
  const selectedFood =
    selectedRemoteFood?.name === value ? selectedRemoteFood : localSelectedFood;
  const suggestions = remoteSuggestions.length > 0 ? remoteSuggestions : localSuggestions;

  useEffect(() => {
    if (!usePublicDb || value.trim().length < 2) {
      setRemoteSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const query = value.trim();

    async function searchPublicFoods() {
      try {
        const response = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: {
            source?: string;
            items?: Array<{
              name: string;
              calories: number;
              basisAmount?: number;
              basisUnit?: "g" | "ml";
              source?: string;
              foodCode?: string;
            }>;
          };
        };
        if (!response.ok || !payload.success || payload.data?.source !== "food_nutrition_master") {
          setRemoteSuggestions([]);
          return;
        }
        setRemoteSuggestions(
          (payload.data.items ?? []).map((food) => ({
            name: food.name,
            calories: food.calories,
            count: 1,
            normalizedName: food.name.normalize("NFKC").toLowerCase(),
            source: "public" as const,
            basisAmount: food.basisAmount,
            basisUnit: food.basisUnit,
            sourceLabel: food.source,
            foodCode: food.foodCode,
          })),
        );
      } catch {
        if (!controller.signal.aborted) setRemoteSuggestions([]);
      }
    }

    void searchPublicFoods();
    return () => controller.abort();
  }, [usePublicDb, value]);

  return (
    <div className="food-search-field">
      <label htmlFor={`${suggestionsId}-input`}>음식 이름</label>
      <div className="food-search">
        <input
          id={`${suggestionsId}-input`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          placeholder="예: 김밥, 된장찌개"
          maxLength={60}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls={suggestionsId}
          required
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="food-suggestions"
            id={suggestionsId}
            role="listbox"
            aria-label="음식 검색 결과"
          >
            {suggestions.map((food) => (
              <button
                key={food.foodCode ?? `${food.source}-${food.normalizedName}`}
                type="button"
                role="option"
                aria-selected={
                  food.normalizedName === selectedFood?.normalizedName
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(food.name);
                  setSelectedRemoteFood(food.source === "public" ? food : null);
                  onSelect?.(food);
                  setShowSuggestions(false);
                }}
              >
                <span>{food.name}</span>
                <small>
                  {food.source === "public" && food.basisAmount && food.basisUnit
                    ? `${food.basisAmount.toLocaleString()}${food.basisUnit} ${Math.round(food.calories).toLocaleString()} kcal`
                    : `1인분 ${Math.round(food.calories).toLocaleString()} kcal`}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
      {value && !selectedFood && suggestions.length === 0 && (
        <small className="food-search-help">{noResultsMessage}</small>
      )}
      {selectedFood && (
        <p className="food-match" role="status">
          <span>선택됨</span>
          {selectedFood.name} · {selectedFood.source === "public" && selectedFood.basisAmount && selectedFood.basisUnit
            ? `${selectedFood.basisAmount.toLocaleString()}${selectedFood.basisUnit}`
            : "1인분"}{" "}
          {Math.round(selectedFood.calories).toLocaleString()} kcal
        </p>
      )}
    </div>
  );
}
