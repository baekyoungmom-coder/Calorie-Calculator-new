import { NextResponse } from "next/server";

export function success<T>(data: T, message = "OK") {
  return NextResponse.json({ success: true, message, data, error: null });
}

export function failure(message: string, code: string, status: number, details: string[] = []) {
  return NextResponse.json(
    { success: false, message, data: null, error: { code, details } },
    { status },
  );
}
