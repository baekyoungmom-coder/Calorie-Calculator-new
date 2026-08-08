import type { NextResponse } from "next/server";

export const GUEST_TRIAL_COOKIE = "cc_guest_trials";
export const GUEST_TRIAL_LIMIT = 3;

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const TRIAL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type GuestTrialState = {
  version: 1;
  consumedTrialIds: string[];
};

export type GuestTrialResult = {
  allowed: boolean;
  alreadyConsumed: boolean;
  changed: boolean;
  used: number;
  remaining: number;
  state: GuestTrialState;
};

function emptyState(): GuestTrialState {
  return { version: 1, consumedTrialIds: [] };
}

export function isValidTrialId(value: unknown): value is string {
  return typeof value === "string" && TRIAL_ID_PATTERN.test(value);
}

export function parseGuestTrialCookie(value: string | undefined): GuestTrialState {
  if (!value) return emptyState();

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<GuestTrialState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.consumedTrialIds)) {
      return emptyState();
    }

    const consumedTrialIds = Array.from(
      new Set(parsed.consumedTrialIds.filter(isValidTrialId)),
    ).slice(0, GUEST_TRIAL_LIMIT);

    return { version: 1, consumedTrialIds };
  } catch {
    return emptyState();
  }
}

export function consumeGuestTrial(
  cookieValue: string | undefined,
  trialId: string,
): GuestTrialResult {
  const state = parseGuestTrialCookie(cookieValue);
  const alreadyConsumed = state.consumedTrialIds.includes(trialId);

  if (alreadyConsumed) {
    return {
      allowed: true,
      alreadyConsumed: true,
      changed: false,
      used: state.consumedTrialIds.length,
      remaining: GUEST_TRIAL_LIMIT - state.consumedTrialIds.length,
      state,
    };
  }

  if (state.consumedTrialIds.length >= GUEST_TRIAL_LIMIT) {
    return {
      allowed: false,
      alreadyConsumed: false,
      changed: false,
      used: GUEST_TRIAL_LIMIT,
      remaining: 0,
      state,
    };
  }

  const nextState: GuestTrialState = {
    version: 1,
    consumedTrialIds: [...state.consumedTrialIds, trialId],
  };

  return {
    allowed: true,
    alreadyConsumed: false,
    changed: true,
    used: nextState.consumedTrialIds.length,
    remaining: GUEST_TRIAL_LIMIT - nextState.consumedTrialIds.length,
    state: nextState,
  };
}

export function setGuestTrialCookie(
  response: NextResponse,
  state: GuestTrialState,
) {
  response.cookies.set(
    GUEST_TRIAL_COOKIE,
    Buffer.from(JSON.stringify(state), "utf8").toString("base64url"),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    },
  );
}
