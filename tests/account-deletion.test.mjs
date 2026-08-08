import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  hasValidAccountDeletionConfirmation,
} from "../src/lib/account-deletion.ts";

test("확인 문구와 삭제 동의가 모두 있어야 회원 탈퇴 요청을 허용한다", () => {
  assert.equal(
    hasValidAccountDeletionConfirmation({
      confirmation: ACCOUNT_DELETION_CONFIRMATION,
      acknowledged: true,
    }),
    true,
  );
});

test("확인 문구가 다르거나 삭제 동의가 없으면 회원 탈퇴 요청을 거부한다", () => {
  assert.equal(
    hasValidAccountDeletionConfirmation({
      confirmation: "탈퇴",
      acknowledged: true,
    }),
    false,
  );
  assert.equal(
    hasValidAccountDeletionConfirmation({
      confirmation: ACCOUNT_DELETION_CONFIRMATION,
      acknowledged: false,
    }),
    false,
  );
  assert.equal(hasValidAccountDeletionConfirmation(null), false);
});
