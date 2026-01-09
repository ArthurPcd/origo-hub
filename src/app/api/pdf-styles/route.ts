import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";

export const dynamic = "force-dynamic";

const PDF_STYLES = [
  { id: "classic", name: "Classic", description: "White background, cyan accents", plans: ["free", "starter", "pro", "premium", "enterprise"] },
  { id: "minimal", name: "Minimal", description: "Ultra clean, no decorative borders", plans: ["pro", "premium", "enterprise"] },
  { id: "dark", name: "Dark", description: "Dark background, glowing cyan accents", plans: ["pro", "premium", "enterprise"] },
  { id: "executive", name: "Executive", description: "Ivory background, gold accents", plans: ["premium", "enterprise"] },
  { id: "emerald", name: "Emerald", description: "White background, emerald green accents", plans: ["premium", "enterprise"] },
];

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClerkSupabaseClient();

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  const userPlan = sub?.plan || "free";
  const available = PDF_STYLES.filter(s => s.plans.includes(userPlan));

  return NextResponse.json({ styles: available, currentPlan: userPlan });
}
