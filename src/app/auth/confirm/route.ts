import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Validate 'next' against whitelist to prevent open redirect
  const ALLOWED_PATHS = ['/brief/new', '/account', '/history', '/pricing', '/checkout'];
  const rawNext = searchParams.get("next");
  const next = rawNext && ALLOWED_PATHS.some(p => rawNext.startsWith(p)) ? rawNext : '/brief/new';

  // Token hash is required
  if (!token_hash) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabase = await createClient();

  // Verify the token
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type === "recovery" ? "recovery" : "email",
  });

  if (error) {
    console.error("Token verification error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=invalid_token&message=${encodeURIComponent(error.message)}`
    );
  }

  // If it's a password recovery, redirect to reset password page
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // For email confirmation, redirect to the next page or dashboard
  return NextResponse.redirect(`${origin}${next}`);
}
