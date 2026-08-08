import { NextRequest } from "next/server";
import { failure, success } from "@/lib/server/api";
import { getAuthenticatedSupabase } from "@/lib/server/auth";
import {
  GUEST_TRIAL_COOKIE,
  GUEST_TRIAL_LIMIT,
  consumeGuestTrial,
  isValidTrialId,
  setGuestTrialCookie,
} from "@/lib/server/guest-trial";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabase();
  if (auth) {
    return success({
      mode: "authenticated" as const,
      limit: null,
      used: null,
      remaining: null,
      alreadyConsumed: false,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("요청 본문이 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  const trialId =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).trialId
      : null;
  if (!isValidTrialId(trialId)) {
    return failure("체험 요청 ID가 올바르지 않습니다.", "VALIDATION_ERROR", 400);
  }

  const result = consumeGuestTrial(
    request.cookies.get(GUEST_TRIAL_COOKIE)?.value,
    trialId,
  );

  if (!result.allowed) {
    return failure(
      "게스트 체험 3회를 모두 사용했습니다.",
      "GUEST_TRIAL_LIMIT_REACHED",
      429,
    );
  }

  const response = success({
    mode: "guest" as const,
    limit: GUEST_TRIAL_LIMIT,
    used: result.used,
    remaining: result.remaining,
    alreadyConsumed: result.alreadyConsumed,
  });

  if (result.changed) {
    setGuestTrialCookie(response, result.state);
  }

  return response;
}
