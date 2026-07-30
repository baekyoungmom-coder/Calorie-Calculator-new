export const ACCOUNT_DELETION_CONFIRMATION = "회원 탈퇴";

export function hasValidAccountDeletionConfirmation(body: unknown) {
  if (!body || typeof body !== "object") return false;

  const value = body as {
    confirmation?: unknown;
    acknowledged?: unknown;
  };

  return (
    value.confirmation === ACCOUNT_DELETION_CONFIRMATION &&
    value.acknowledged === true
  );
}
