import { NextResponse } from "next/server";

export function apiError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: { code, message, ...(extra ?? {}) } },
    { status }
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
