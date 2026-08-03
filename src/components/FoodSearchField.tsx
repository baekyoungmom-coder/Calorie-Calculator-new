"use client";

import { useId, useMemo, useState } from "react";
import {
  findCalorieFood,
  searchCalorieFoods,
} from "@/lib/meals";
import type { CalorieFood } from "@/lib/meals";

type FoodSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (food: CalorieFood) => void;
  noResultsMessage?: string;
};

export function FoodSearchField({
  value,
  onChange,
  onSelect,
  noResultsMessage = "일치하는 음식이 없어요. 다른 이름으로 검색해 주세요.",
}: FoodSearchFieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsId = useId();
  const selectedFood = useMemo(() => findCalorieFood(value), [value]);
  const suggestions = useMemo(() => searchCalorieFoods(value), [value]);

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
                key={food.normalizedName}
                type="button"
                role="option"
                aria-selected={
                  food.normalizedName === selectedFood?.normalizedName
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(food.name);
                  onSelect?.(food);
                  setShowSuggestions(false);
                }}
              >
                <span>{food.name}</span>
                <small>
                  {food.basisGrams
                    ? `${food.basisGrams.toLocaleString("ko-KR")}g당 ${Math.round(food.calories).toLocaleString()} kcal`
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
          {selectedFood.name} · {selectedFood.basisGrams
            ? `${selectedFood.basisGrams.toLocaleString("ko-KR")}g당`
            : "1인분"}{" "}
          {Math.round(selectedFood.calories).toLocaleString()} kcal
        </p>
      )}
    </div>
  );
}
