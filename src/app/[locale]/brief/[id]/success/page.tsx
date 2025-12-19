"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BriefSuccessScreen from "@/components/BriefSuccessScreen";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";
import type { Brief } from "@/lib/types";

export default function BriefSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const briefId = params.id as string;
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useClerkSupabaseClient();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.push("/login");
      return;
    }

    async function loadBrief() {
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("id", briefId)
        .eq("user_id", user!.id)
        .single();

      if (error || !data) {
        router.push("/history");
        return;
      }

      setBrief({
        id: data.id,
        title: data.title,
        projectType: data.project_type,
        answers: data.answers,
        content: data.content,
        createdAt: data.created_at,
      });
      setLoading(false);
    }

    loadBrief();
  }, [isLoaded, isSignedIn, user, briefId, supabase, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-edge border-t-accent" />
      </div>
    );
  }

  if (!brief) return null;

  return (
    <BriefSuccessScreen
      briefId={briefId}
      title={brief.title}
      projectType={brief.projectType}
    />
  );
}
