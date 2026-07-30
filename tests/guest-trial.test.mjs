import assert from "node:assert/strict";
import test from "node:test";
import {
  GUEST_TRIAL_LIMIT,
  consumeGuestTrial,
  parseGuestTrialCookie,
} from "../src/lib/server/guest-trial.ts";

const TRIAL_IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
];

function encodeState(state) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

test("같은 체험 ID를 다시 확인해도 횟수를 중복 차감하지 않는다", () => {
  const first = consumeGuestTrial(undefined, TRIAL_IDS[0]);
  const repeated = consumeGuestTrial(encodeState(first.state), TRIAL_IDS[0]);

  assert.equal(first.allowed, true);
  assert.equal(first.used, 1);
  assert.equal(repeated.allowed, true);
  assert.equal(repeated.alreadyConsumed, true);
  assert.equal(repeated.changed, false);
  assert.equal(repeated.used, 1);
});

test("게스트는 서로 다른 결과를 세 번까지 확인할 수 있다", () => {
  let cookie;

  for (let index = 0; index < GUEST_TRIAL_LIMIT; index += 1) {
    const result = consumeGuestTrial(cookie, TRIAL_IDS[index]);
    assert.equal(result.allowed, true);
    assert.equal(result.used, index + 1);
    cookie = encodeState(result.state);
  }

  const blocked = consumeGuestTrial(cookie, TRIAL_IDS[3]);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.used, GUEST_TRIAL_LIMIT);
  assert.equal(blocked.remaining, 0);
});

test("손상된 게스트 쿠키는 빈 상태로 안전하게 처리한다", () => {
  assert.deepEqual(parseGuestTrialCookie("not-valid-base64"), {
    version: 1,
    consumedTrialIds: [],
  });
});
