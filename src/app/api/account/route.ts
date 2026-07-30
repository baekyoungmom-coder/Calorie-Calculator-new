import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";
import { hasValidAccountDeletionConfirmation } from "@/lib/account-deletion";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedSupabase();
  if (!auth) return failure("로그인이 필요합니다.", "UNAUTHORIZED", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("요청 본문이 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  if (!hasValidAccountDeletionConfirmation(body)) {
    return failure(
      "회원 탈퇴 확인 문구와 삭제 동의를 확인해 주세요.",
      "VALIDATION_ERROR",
      400,
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return failure(
      "회원 탈퇴 기능의 서버 설정이 필요합니다.",
      "MISSING_SERVER_CONFIG",
      503,
    );
  }

  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) {
    return failure(
      "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      "ACCOUNT_DELETION_ERROR",
      500,
    );
  }

  // Auth 사용자 삭제 후에도 남아 있을 수 있는 현재 브라우저 세션을 정리한다.
  await auth.supabase.auth.signOut({ scope: "local" });

  return success({ deleted: true }, "회원 탈퇴가 완료되었습니다.");
}
