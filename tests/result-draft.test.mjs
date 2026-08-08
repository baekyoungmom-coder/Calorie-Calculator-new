import assert from "node:assert/strict";
import test from "node:test";
import { resolveResultCalories } from "../src/lib/result-draft.ts";

test("수정값이 없으면 계산된 추정치를 최종값으로 사용한다", () => {
  assert.deepEqual(resolveResultCalories({}, 306), {
    estimatedCalories: 306,
    finalCalories: 306,
  });
});

test("사용자 수정값은 원래 추정값을 덮어쓰지 않는다", () => {
  assert.deepEqual(
    resolveResultCalories(
      { estimatedCalories: 306, finalCalories: 420 },
      999,
    ),
    {
      estimatedCalories: 306,
      finalCalories: 420,
    },
  );
});
