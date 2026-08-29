import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/app/actions/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Untrusted: this lands in a Location header after a successful sign-in.
  const next = safeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  try {
    await syncUser();
  } catch (e) {
    // Session is valid but we couldn't persist the app-side user record
    // (most often a database connection / env-var problem).
    console.error("[auth/callback] syncUser failed:", e);
    return NextResponse.redirect(`${origin}/login?error=sync_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
