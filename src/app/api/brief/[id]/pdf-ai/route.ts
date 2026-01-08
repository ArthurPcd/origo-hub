import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { FeatureRepository } from "@/lib/repositories/features";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

// Plans allowed to use Brief+ + credit cost
const AI_PDF_ACCESS = ["pro", "premium", "enterprise"];
const AI_PDF_CREDIT_COST = 5;

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL_SONNET = "claude-sonnet-4-6";

// ─── HTML helpers (shared with /api/brief/[id]/pdf) ────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\u00AD/g, "")
    .replace(/\u200B/g, "")
    .replace(/\u200C/g, "")
    .replace(/\u200D/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseInlineMarkdown(text: string): string {
  return cleanText(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function markdownToHtml(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;
  let inOrderedList = false;

  const flushList = () => {
    if (inList) { html += "</ul>\n"; inList = false; }
    if (inOrderedList) { html += "</ol>\n"; inOrderedList = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      html += `<h3>${cleanText(trimmed.substring(4))}</h3>\n`;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      html += `<h2>${cleanText(trimmed.substring(3))}</h2>\n`;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      html += `<h1>${cleanText(trimmed.substring(2))}</h1>\n`;
      continue;
    }
    if (trimmed.match(/^[-*]\s+/)) {
      if (inOrderedList) flushList();
      if (!inList) { html += '<ul class="doc-list">\n'; inList = true; }
      html += `<li>${parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>\n`;
      continue;
    }
    if (trimmed.match(/^\d+\.\s+/)) {
      if (inList) flushList();
      if (!inOrderedList) { html += '<ol class="doc-list">\n'; inOrderedList = true; }
      html += `<li>${parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""))}</li>\n`;
      continue;
    }
    if (trimmed === "") { flushList(); continue; }

    flushList();
    html += `<p>${parseInlineMarkdown(trimmed)}</p>\n`;
  }
  flushList();
  return html;
}

// ─── Claude Sonnet: enrich brief into investor document ──────────────────────

async function enrichBriefForInvestors(
  briefContent: string,
  answers: Record<string, string>,
  apiKey: string
): Promise<string> {
  const systemPrompt = `You are an expert at writing high-impact investor and entrepreneur pitch documents.
Transform a project brief into a polished, compelling investor/entrepreneur document.

Structure your output as a professional document with these exact sections (use ## for section headings):

## Executive Summary
A punchy 2-3 paragraph overview. Lead with the opportunity, not the description.

## The Problem
What pain point does this solve? Why now? Make it visceral and concrete.

## The Solution
The unique approach. What makes this different from anything else on the market.

## Market Opportunity
Size, trends, timing. Who are the buyers, what do they value.

## Deliverables & Scope
Clear, concrete list of what will be built/delivered. Milestones.

## Timeline & Roadmap
Phased approach with key dates or relative durations.

## Investment & Budget
How resources will be deployed. ROI framing if applicable.

## Why Us / Why Now
The unfair advantage. Team, timing, technology.

## Next Steps
Clear, actionable call to action. What happens after this document.

Rules:
- Write in confident, direct business language
- No fluff, no filler, every sentence earns its place
- Use **bold** for key terms and metrics
- Keep each section tight: 3-6 sentences or a clean list
- Do NOT add a cover page or title — just the sections above`;

  const userMessage = `Project Brief Content:
${briefContent}

Additional Context:
- Project Type: ${answers.projectType || "Not specified"}
- Client / Stakeholders: ${answers.clientInfo || "Not specified"}
- Goals: ${answers.goals || "Not specified"}
- Target Audience: ${answers.targetAudience || "Not specified"}
- Deliverables: ${answers.deliverables || "Not specified"}
- Timeline: ${answers.timeline || "Not specified"}
- Budget: ${answers.budget || "Not specified"}
- Constraints: ${answers.constraints || "Not specified"}

Transform this into a compelling investor/entrepreneur document.`;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL_SONNET,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Empty response from Sonnet");
  return text;
}

// ─── Premium investor PDF template ───────────────────────────────────────────

function loadLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return ""; // fallback: no image
  }
}

function buildInvestorHtml(
  enrichedContent: string,
  title: string,
  projectType: string,
  createdAt: string
): string {
  const logoSrc = loadLogoBase64();
  const sections = enrichedContent.split(/\n(?=##\s)/);
  let sectionsHtml = "";

  sections.forEach((section) => {
    const titleMatch = section.match(/^##\s+(.+)/m);
    const sectionTitle = titleMatch ? titleMatch[1] : "";
    const content = titleMatch
      ? section.replace(/^##\s+.+\n/, "").trim()
      : section.trim();

    if (sectionTitle) {
      sectionsHtml += `
        <section class="doc-section">
          <div class="section-header">
            <h2 class="section-title">${cleanText(sectionTitle)}</h2>
          </div>
          <div class="section-body">${markdownToHtml(content)}</div>
        </section>`;
    } else if (content) {
      sectionsHtml += `<div class="section-body">${markdownToHtml(content)}</div>`;
    }
  });

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.65;
      color: #1a1a2e;
      background: #FAFAFA;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* ── Cover page ── */
    .cover {
      width: 100%;
      height: 297mm;
      background: #0a0a0f;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60pt 50pt 40pt;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: -80pt;
      right: -80pt;
      width: 300pt;
      height: 300pt;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,217,255,0.08) 0%, transparent 70%);
    }
    .cover-origo {
      display: flex;
      align-items: center;
      gap: 10pt;
    }
    .cover-origo img {
      height: 28pt;
      width: auto;
      object-fit: contain;
    }
    .cover-origo-text {
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 5px;
      color: #00D9FF;
      text-transform: uppercase;
    }
    .cover-center { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .cover-label {
      font-size: 8pt;
      color: rgba(255,255,255,0.3);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 16pt;
    }
    .cover-title {
      font-size: 28pt;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 16pt;
      max-width: 400pt;
    }
    .cover-type {
      display: inline-block;
      font-size: 8pt;
      font-weight: 600;
      color: #00D9FF;
      border: 1pt solid rgba(0,217,255,0.3);
      padding: 4pt 10pt;
      border-radius: 2pt;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .cover-date {
      font-size: 7pt;
      color: rgba(255,255,255,0.25);
    }
    .cover-badge {
      font-size: 7pt;
      color: rgba(0,217,255,0.5);
      letter-spacing: 2px;
    }
    .cover-line {
      width: 40pt;
      height: 2pt;
      background: #00D9FF;
      margin-bottom: 20pt;
    }

    /* ── Content pages ── */
    .content {
      padding: 40pt 50pt;
    }

    .doc-section {
      margin-bottom: 28pt;
      break-inside: avoid;
    }

    .section-header {
      margin-bottom: 10pt;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0a0a0f;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding-bottom: 6pt;
      border-bottom: 1.5pt solid #00D9FF;
      display: inline-block;
    }

    .section-body p {
      margin-bottom: 7pt;
      color: #2c2c3e;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }

    .section-body h3 {
      font-size: 10pt;
      font-weight: 600;
      color: #1a1a2e;
      margin: 10pt 0 5pt;
    }

    .section-body strong {
      font-weight: 700;
      color: #0a0a0f;
    }

    .section-body em {
      font-style: italic;
      color: #555;
    }

    .doc-list {
      margin: 6pt 0 8pt 16pt;
    }

    .doc-list li {
      margin-bottom: 4pt;
      color: #2c2c3e;
      orphans: 2;
      widows: 2;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 40pt;
      padding-top: 12pt;
      border-top: 1pt solid #e0e0e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .doc-footer-left {
      font-size: 7pt;
      color: #999;
    }

    .doc-footer-right {
      font-size: 7pt;
      font-weight: 700;
      color: #00D9FF;
      letter-spacing: 2px;
    }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-origo">
      ${logoSrc ? `<img src="${logoSrc}" alt="Origo" />` : ""}
      <span class="cover-origo-text">ORIGO</span>
    </div>
    <div class="cover-center">
      <div class="cover-label">AI Pro Document</div>
      <div class="cover-line"></div>
      <div class="cover-title">${cleanText(title)}</div>
      ${projectType ? `<div class="cover-type">${cleanText(projectType)}</div>` : ""}
    </div>
    <div class="cover-footer">
      <div class="cover-date">Prepared ${formattedDate}</div>
      <div class="cover-badge">ORIGO AI PRO · CONFIDENTIAL</div>
    </div>
  </div>

  <!-- Document Content -->
  <div class="content">
    ${sectionsHtml}

    <div class="doc-footer">
      <div class="doc-footer-left">Generated by Origo AI Pro · ${formattedDate} · Confidential</div>
      <div class="doc-footer-right" style="display:flex;align-items:center;gap:6pt;">
        ${logoSrc ? `<img src="${logoSrc}" alt="Origo" style="height:12pt;width:auto;" />` : ""}
        <span>ORIGO</span>
      </div>
    </div>
  </div>

</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser;

  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // 2. Plan check (with PDF_AI_ACCESS feature bypass)
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan, brief_count")
      .eq("user_id", userId)
      .maybeSingle();

    const userPlan = sub?.plan || "free";

    const featureRepo = new FeatureRepository(supabase, userId);
    const hasPdfAccessFeature = await featureRepo.hasFeature("PDF_AI_ACCESS");

    if (!hasPdfAccessFeature && !AI_PDF_ACCESS.includes(userPlan)) {
      return NextResponse.json(
        { error: "Brief+ requires Pro plan or above", upgrade_required: true, plan: userPlan },
        { status: 403 }
      );
    }

    // 3. Credit availability check (non-atomic — atomic deduction happens after generation)
    const { PLANS } = await import("@/lib/stripe");
    const planConfig = PLANS[userPlan as keyof typeof PLANS];
    const briefLimit = planConfig?.briefs ?? 25;
    const currentCount = sub?.brief_count ?? 0;

    if (!hasPdfAccessFeature && briefLimit !== -1 && currentCount + AI_PDF_CREDIT_COST > briefLimit) {
      return NextResponse.json(
        {
          error: "Not enough credits for Brief+",
          required: AI_PDF_CREDIT_COST,
          available: briefLimit - currentCount,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // 4. Fetch brief (RLS + explicit ownership check)
    const { data: brief, error: briefError } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    // 5. API key
    const apiKey = process.env.ORIGO_CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Service configuration error" }, { status: 500 });
    }

    // 6. Enrich brief with Claude Sonnet
    const enrichedContent = await enrichBriefForInvestors(
      brief.content,
      brief.answers || {},
      apiKey
    );

    // 7. Consume credits atomically (after successful generation)
    const { data: newCount } = await supabase.rpc("consume_credits_atomic", {
      p_user_id: userId,
      p_amount: AI_PDF_CREDIT_COST,
      p_limit: briefLimit,
    });

    if (newCount === -2) {
      return NextResponse.json(
        { error: "Not enough credits — concurrent request used them", upgrade_required: true },
        { status: 403 }
      );
    }

    // 8. Render PDF with Puppeteer
    const htmlContent = buildInvestorHtml(
      enrichedContent,
      brief.title,
      brief.project_type || "",
      brief.created_at
    );

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "a4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      timeout: 45000,
    });

    await browser.close();

    const safeTitle = brief.title.replace(/[^a-zA-Z0-9]/g, "_");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}_AI_Pro.pdf"`,
        "X-Credits-Used": String(AI_PDF_CREDIT_COST),
        "X-Credits-Remaining": briefLimit === -1 ? "-1" : String(briefLimit - (newCount as number)),
      },
    });
  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }

    console.error("[PDF-AI] Generation failed:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        error: "AI PDF generation failed",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
