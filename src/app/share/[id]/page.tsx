"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBriefPublicDB } from "@/lib/storage";
import { Brief } from "@/lib/types";
import BriefView from "@/components/BriefView";
import Logo from "@/components/Logo";

export default function SharePage() {
  const params = useParams();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    getBriefPublicDB(id).then((found) => {
      if (found) {
        setBrief(found);
      } else {
        setNotFound(true);
      }
    });
  }, [params.id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Brief not found
        </h1>
        <p className="text-muted mb-6">
          This brief may have been deleted or is not available on this device.
        </p>
        <Link
          href="/"
          className="text-accent hover:text-accent-soft transition-colors"
        >
          Create your own brief &rarr;
        </Link>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-edge border-t-accent" />
      </div>
    );
  }

  const formattedDate = new Date(brief.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="no-print border-b border-edge">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-muted text-sm">Shared brief</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {brief.title}
          </h1>
          <p className="text-muted text-sm">
            {brief.projectType} &middot; {formattedDate}
          </p>
        </div>

        <div className="bg-surface border border-edge rounded-xl p-8 md:p-12">
          <BriefView content={brief.content} />
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="no-print border-t border-edge py-12 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
          <span className="text-muted text-sm">Powered by Origo</span>
        </div>
        <Link
          href="/"
          className="text-accent hover:text-accent-soft text-sm font-medium transition-colors"
        >
          Create your own briefs &rarr;
        </Link>
      </footer>
    </div>
  );
}
