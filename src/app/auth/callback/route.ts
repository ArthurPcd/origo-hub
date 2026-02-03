import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If it's a password recovery (reset password flow)
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // For email confirmation or regular login
      // Validate 'next' against whitelist to prevent open redirect
      const next = searchParams.get("next");
      const ALLOWED_PATHS = ['/brief/new', '/account', '/history', '/pricing', '/checkout'];
      const safePath = next && ALLOWED_PATHS.some(p => next.startsWith(p)) ? next : '/brief/new';
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
