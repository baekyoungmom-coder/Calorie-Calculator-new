import assert from "node:assert/strict";
import test from "node:test";
import { validateMealRecord } from "../src/lib/server/meal-records.ts";

const validRecord = {
  inputType: "text",
  mealType: "lunch",
  foodName: "김밥",
  amount: "1인분",
  memo: "",
  estimatedCalories: 306,
  finalCalories: 420,
  confidence: "medium",
  estimateReason: "칼로리 정보 파일 기준 추정치",
  recordedAt: "2026-07-30T03:00:00.000Z",
  recordedTimezone: "Asia/Seoul",
};

test("추정 칼로리와 사용자가 수정한 최종 칼로리를 구분해 검증한다", () => {
  const result = validateMealRecord(validRecord);

  assert.deepEqual(result.errors, []);
  assert.equal(result.value?.estimatedCalories, 306);
  assert.equal(result.value?.finalCalories, 420);
});

test("허용 범위를 벗어난 최종 칼로리는 저장하지 않는다", () => {
  const result = validateMealRecord({
    ...validRecord,
    finalCalories: 10001,
  });

  assert.equal(result.value, undefined);
  assert.match(result.errors.join(" "), /최종 칼로리/);
});
