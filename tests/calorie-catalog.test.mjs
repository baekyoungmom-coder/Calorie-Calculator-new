import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateServingCalories,
  findExactCalorieFood,
  parseServingMultiplier,
  prepareCalorieCatalog,
  searchPreparedCalorieCatalog,
} from "../src/lib/calorie-catalog.ts";

const catalog = prepareCalorieCatalog([
  { name: "김밥", calories: 400 },
  { name: "김밥", calories: 440 },
  { name: "참치 김밥", calories: 500 },
  { name: "김치찌개", calories: 280 },
]);
const actualCatalog = prepareCalorieCatalog(
  JSON.parse(
    readFileSync(
      new URL("../src/generated/calorie-catalog.json", import.meta.url),
      "utf8",
    ),
  ),
);

test("같은 음식명은 1인분 칼로리 평균으로 합친다", () => {
  const food = findExactCalorieFood(catalog, "김 밥");

  assert.equal(food?.name, "김밥");
  assert.equal(food?.calories, 420);
  assert.equal(food?.count, 2);
});

test("음식 검색은 정확히 일치하는 항목을 먼저 보여준다", () => {
  const results = searchPreparedCalorieCatalog(catalog, "김밥");

  assert.deepEqual(
    results.map((food) => food.name),
    ["김밥", "참치 김밥"],
  );
});

test("인분 표현만 안전한 계산 배수로 변환한다", () => {
  assert.equal(parseServingMultiplier("0.5인분"), 0.5);
  assert.equal(parseServingMultiplier("2 인분"), 2);
  assert.equal(parseServingMultiplier("200g"), null);
  assert.equal(parseServingMultiplier("0인분"), null);
});

test("1인분 칼로리에 인분 배수를 적용하고 반올림한다", () => {
  assert.equal(calculateServingCalories(311, 0.5), 156);
  assert.equal(calculateServingCalories(420, 1.5), 630);
  assert.equal(calculateServingCalories(500, 2), 1000);
});

test("프로젝트 칼로리 파일에서 실제 음식을 검색하고 계산한다", () => {
  const riceCake = findExactCalorieFood(actualCatalog, "가래떡 떡국용");

  assert.ok(actualCatalog.length >= 600);
  assert.equal(riceCake?.calories, 311);
  assert.equal(calculateServingCalories(riceCake?.calories ?? 0, 1.5), 467);
});
