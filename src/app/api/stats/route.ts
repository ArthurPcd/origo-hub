import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
// Revalidate every 5 minutes so the counter reflects real growth
export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { count, error } = await supabase
      .from("briefs")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    // Never expose less than the baseline (1246 at launch)
    const total = Math.max(count ?? 0, 1246);

    return NextResponse.json({ total }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    // Fallback to baseline — never show 0 to visitors
    return NextResponse.json({ total: 1246 });
  }
}
