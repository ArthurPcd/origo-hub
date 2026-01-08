import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Helper to clean soft hyphens and invisible characters, and escape HTML
function cleanText(text: string): string {
  return text
    .replace(/\u00AD/g, "") // Remove soft hyphens
    .replace(/\u200B/g, "") // Remove zero-width spaces
    .replace(/\u200C/g, "") // Remove zero-width non-joiners
    .replace(/\u200D/g, "") // Remove zero-width joiners
    .replace(/\uFEFF/g, "") // Remove zero-width no-break spaces
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Helper to parse inline markdown (bold)
function parseInlineMarkdown(text: string): string {
  return cleanText(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// Convert markdown content to clean HTML
function markdownToHtml(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;
  let inOrderedList = false;
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      html += '<table class="brief-table">\n';
      tableRows.forEach((row, idx) => {
        const cells = row
          .trim()
          .split("|")
          .filter((c) => c.trim() !== "")
          .map((c) => c.trim());
        if (idx === 0) {
          html += "<thead><tr>";
          cells.forEach((cell) => {
            html += `<th>${parseInlineMarkdown(cell)}</th>`;
          });
          html += "</tr></thead>\n<tbody>\n";
        } else if (idx > 1) {
          // Skip separator row
          html += "<tr>";
          cells.forEach((cell) => {
            html += `<td>${parseInlineMarkdown(cell || "&nbsp;")}</td>`;
          });
          html += "</tr>\n";
        }
      });
      html += "</tbody></table>\n";
      tableRows = [];
      inTable = false;
    }
  };

  const flushList = () => {
    if (inList) {
      html += "</ul>\n";
      inList = false;
    }
    if (inOrderedList) {
      html += "</ol>\n";
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      inTable = true;
      tableRows.push(line);
      continue;
    }

    if (inTable) {
      flushTable();
    }

    // Headings
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

    // Unordered lists
    if (trimmed.match(/^[-*]\s+/)) {
      if (inOrderedList) flushList();
      if (!inList) {
        html += '<ul class="brief-list">\n';
        inList = true;
      }
      html += `<li>${parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>\n`;
      continue;
    }

    // Ordered lists
    if (trimmed.match(/^\d+\.\s+/)) {
      if (inList) flushList();
      if (!inOrderedList) {
        html += '<ol class="brief-list">\n';
        inOrderedList = true;
      }
      html += `<li>${parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""))}</li>\n`;
      continue;
    }

    // Empty lines
    if (trimmed === "") {
      flushList();
      continue;
    }

    // Regular paragraphs
    flushList();
    html += `<p>${parseInlineMarkdown(trimmed)}</p>\n`;
  }

  flushList();
  flushTable();

  return html;
}

// ─── PDF Theme System ────────────────────────────────────────────────────────

type PdfStyle = "classic" | "minimal" | "dark" | "executive" | "emerald";

const PDF_STYLE_ACCESS: Record<string, PdfStyle[]> = {
  free: ["classic"],
  starter: ["classic"],
  pro: ["classic", "minimal", "dark"],
  premium: ["classic", "minimal", "dark", "executive", "emerald"],
  enterprise: ["classic", "minimal", "dark", "executive", "emerald"],
};

function getPdfThemeCss(style: PdfStyle): string {
  switch (style) {
    case "minimal":
      return `
        .header { border-bottom: 1pt solid #e0e0e0; }
        .header-logo { color: #1a1a1a; font-weight: 300; letter-spacing: 4px; }
        .brief-table th { border-bottom: 1pt solid #1a1a1a; background: #f5f5f5; }
        .last-page-footer .footer-logo { color: #999; }
        h2, .section-title { border-bottom: none; color: #333; font-weight: 400; }
      `;
    case "dark":
      return `
        body { background: #111111; color: #e8e8e8; }
        .header { border-bottom: 2pt solid #00D9FF; }
        .header-logo { color: #00D9FF; }
        .header-title { color: #ffffff; }
        h2, .section-title { color: #ffffff; border-bottom: 1pt solid #333; }
        h3 { color: #e0e0e0; }
        strong { color: #ffffff; }
        em { color: #999; }
        p { color: #e8e8e8; }
        .brief-table { border-color: #333; }
        .brief-table th { background: #1e1e1e; color: #00D9FF; border-bottom: 2pt solid #00D9FF; }
        .brief-table td { color: #e0e0e0; border-bottom: 1pt solid #222; }
        .brief-list li { color: #e8e8e8; }
        div[style*="#f9f9f9"] { background: #1e1e1e !important; border-color: #333 !important; }
        div[style*="#666"] { color: #aaa !important; }
        div[style*="#1a1a1a"] { color: #e8e8e8 !important; }
        .last-page-footer { border-top: 1pt solid #333; }
        .last-page-footer .footer-date { color: #666; }
        .last-page-footer .footer-logo { color: #00D9FF; }
        .last-page-footer .footer-tagline, .last-page-footer .footer-copyright { color: #555; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      `;
    case "executive":
      return `
        body { background: #FDFBF7; color: #1C1C2E; }
        .header { border-bottom: 2pt solid #B8960C; }
        .header-logo { color: #1C1C2E; letter-spacing: 6px; font-weight: 300; }
        .header-title { color: #1C1C2E; }
        h2, .section-title { color: #1C1C2E; border-bottom: 1pt solid #B8960C; font-weight: 600; }
        h3 { color: #2D2D4E; }
        .brief-table th { background: #1C1C2E; color: #F5E6A3; border-bottom: 2pt solid #B8960C; }
        .brief-table td { color: #1C1C2E; }
        .brief-table { border-color: #D4B896; }
        .last-page-footer .footer-logo { color: #B8960C; }
        .last-page-footer { border-top: 1pt solid #D4B896; }
      `;
    case "emerald":
      return `
        .header { border-bottom: 2pt solid #10B981; }
        .header-logo { color: #10B981; }
        h2, .section-title { border-bottom: 1pt solid #D1FAE5; color: #064E3B; }
        h3 { color: #065F46; }
        .brief-table th { border-bottom: 2pt solid #10B981; background: #F0FDF4; color: #064E3B; }
        .brief-table { border-color: #A7F3D0; }
        .brief-table td { border-bottom: 1pt solid #D1FAE5; }
        .last-page-footer .footer-logo { color: #10B981; }
        .last-page-footer { border-top: 1pt solid #D1FAE5; }
      `;
    default: // classic
      return "";
  }
}

const CLASSIC_PDF_CREDIT_COST = 1;

// Vercel serverless configuration
export const maxDuration = 60; // 60 seconds for Puppeteer operations
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
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

    // Credit check + style validation
    const requestedStyle = (req.nextUrl.searchParams.get("style") || "classic") as PdfStyle;
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan, brief_count")
      .eq("user_id", userId)
      .maybeSingle();
    const userPlan = (sub?.plan || "free") as string;

    // Check credit availability (1 credit for classic PDF)
    const { PLANS } = await import("@/lib/stripe");
    const planConfig = PLANS[userPlan as keyof typeof PLANS];
    const briefLimit = planConfig?.briefs ?? 3;
    const currentCount = sub?.brief_count ?? 0;

    if (briefLimit !== -1 && currentCount + CLASSIC_PDF_CREDIT_COST > briefLimit) {
      return NextResponse.json(
        {
          error: "Not enough credits for PDF export",
          required: CLASSIC_PDF_CREDIT_COST,
          available: briefLimit - currentCount,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }
    const allowedStyles = PDF_STYLE_ACCESS[userPlan] ?? ["classic"];
    const pdfStyle: PdfStyle = allowedStyles.includes(requestedStyle) ? requestedStyle : "classic";
    const themeCss = getPdfThemeCss(pdfStyle);

    // Fetch the brief (RLS ensures user can only access their own briefs)
    const { data: brief, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId) // Explicit ownership check as defense-in-depth
      .single();

    if (error || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    // Parse sections
    const sections = brief.content.split(/\n(?=#+\s)/);
    let sectionsHtml = "";

    sections.forEach((section: string) => {
      const titleMatch = section.match(/#+\s(.+)/);
      const title = titleMatch ? titleMatch[1] : "";
      const content = titleMatch
        ? section.replace(/#+\s.+\n/, "").trim()
        : section.trim();

      if (title) {
        sectionsHtml += `<section class="brief-section">
          <h2 class="section-title">${cleanText(title)}</h2>
          ${markdownToHtml(content)}
        </section>\n`;
      } else {
        sectionsHtml += markdownToHtml(content);
      }
    });

    const formattedDate = new Date(brief.created_at).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 1.5cm 1.5cm 2cm 1.5cm;
      size: A4;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #2c2c2c;
      background: white;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12pt;
      margin-bottom: 20pt;
      border-bottom: 2pt solid #00D9FF;
    }

    .header-logo {
      font-size: 24pt;
      font-weight: bold;
      color: #00D9FF;
    }

    .header-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1a1a1a;
      text-align: right;
      flex: 1;
      margin-left: 20pt;
    }

    .brief-section {
      margin-bottom: 20pt;
      break-inside: avoid;
    }

    .section-title {
      font-size: 13pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 8pt;
      margin-top: 16pt;
      padding-bottom: 4pt;
      border-bottom: 1pt solid #e0e0e0;
      break-after: avoid;
      orphans: 3;
      widows: 3;
    }

    h2 {
      font-size: 13pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 8pt;
      margin-top: 16pt;
      break-after: avoid;
      orphans: 3;
      widows: 3;
    }

    h3 {
      font-size: 11pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 6pt;
      margin-top: 10pt;
      break-after: avoid;
      orphans: 3;
      widows: 3;
    }

    p {
      margin-bottom: 8pt;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }

    strong {
      font-weight: bold;
      color: #1a1a1a;
    }

    em {
      font-style: italic;
      color: #666;
    }

    .brief-list {
      margin: 10pt 0 10pt 20pt;
      break-inside: avoid;
    }

    .brief-list li {
      margin-bottom: 4pt;
      orphans: 2;
      widows: 2;
    }

    .brief-table {
      width: 100%;
      margin: 12pt 0;
      border-collapse: collapse;
      border: 1pt solid #d0d0d0;
      break-inside: avoid;
    }

    .brief-table th {
      background: #f8f9fa;
      padding: 8pt;
      font-size: 9pt;
      font-weight: bold;
      text-align: left;
      border-bottom: 2pt solid #00D9FF;
    }

    .brief-table td {
      padding: 8pt;
      font-size: 9pt;
      border-bottom: 1pt solid #e8e8e8;
    }

    .brief-table tr:last-child td {
      border-bottom: none;
    }

    .last-page-footer {
      margin-top: 30pt;
      padding-top: 12pt;
      border-top: 1pt solid #e0e0e0;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .last-page-footer .footer-date {
      font-size: 7pt;
      color: #999;
      font-style: italic;
      margin-bottom: 4pt;
    }

    .last-page-footer .footer-logo {
      font-size: 8pt;
      color: #00D9FF;
      font-weight: bold;
      margin-bottom: 4pt;
    }

    .last-page-footer .footer-tagline {
      font-size: 7pt;
      color: #999;
      margin-bottom: 3pt;
    }

    .last-page-footer .footer-copyright {
      font-size: 6pt;
      color: #AAA;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }

    /* Theme overrides */
    ${themeCss}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">ORIGO</div>
    <div class="header-title">${cleanText(brief.title)}</div>
  </div>

  ${brief.project_type ? `
  <div style="display: flex; gap: 10pt; margin-bottom: 20pt;">
    <div style="flex: 1; padding: 10pt; background: #f9f9f9; border: 1pt solid #e5e5e5;">
      <div style="font-size: 8pt; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 3pt;">Project Type</div>
      <div style="font-size: 10pt; color: #1a1a1a;">${cleanText(brief.project_type)}</div>
    </div>
    <div style="flex: 1; padding: 10pt; background: #f9f9f9; border: 1pt solid #e5e5e5;">
      <div style="font-size: 8pt; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 3pt;">Status</div>
      <div style="font-size: 10pt; color: #1a1a1a;">Active</div>
    </div>
  </div>
  ` : ''}

  ${sectionsHtml}

  <div class="last-page-footer">
    <div class="footer-date">Generated by ORIGO • ${formattedDate}</div>
    <div class="footer-logo">ORIGO</div>
    <div class="footer-tagline">AI-powered professional project brief generation</div>
    <div class="footer-copyright">© ${new Date().getFullYear()} Origo. All rights reserved.</div>
  </div>
</body>
</html>
    `;

    // Launch Puppeteer with Vercel-optimized config
    console.log("[PDF] Launching Puppeteer...");

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
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    console.log("[PDF] Browser launched, creating page...");
    const page = await browser.newPage();

    console.log("[PDF] Setting HTML content...");
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("[PDF] Generating PDF...");
    const pdfBuffer = await page.pdf({
      format: "a4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: "1.5cm",
        bottom: "1.5cm",
        left: "1.5cm",
        right: "1.5cm",
      },
      timeout: 30000,
    });

    console.log("[PDF] PDF generated successfully");
    await browser.close();

    // Consume 1 credit atomically after successful generation
    await supabase.rpc("consume_credits_atomic", {
      p_user_id: userId,
      p_amount: CLASSIC_PDF_CREDIT_COST,
      p_limit: briefLimit,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${brief.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
        "X-Credits-Used": String(CLASSIC_PDF_CREDIT_COST),
      },
    });
  } catch (error) {
    // Clean up browser if it was launched
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("[PDF] Error closing browser:", closeError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("[PDF] Generation failed:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: "PDF generation failed",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        suggestion: "Please try again or contact support if the issue persists",
      },
      { status: 500 }
    );
  }
}
