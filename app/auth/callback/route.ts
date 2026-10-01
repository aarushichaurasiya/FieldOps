import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  if (!code) return NextResponse.redirect(new URL("/auth/login?error=Missing%20confirmation%20code.", url.origin));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, url.origin));

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", url.origin));
}
