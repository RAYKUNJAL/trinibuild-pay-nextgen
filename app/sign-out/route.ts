import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function handle() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  return NextResponse.redirect(url);
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
