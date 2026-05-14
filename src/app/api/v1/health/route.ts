import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "cashconnect-api",
    version: "v1",
    time: new Date().toISOString(),
  });
}
