/**
 * Multi-Agent Brief Generation
 *
 * Plan-based agent dispatch:
 * - Free / Starter : 1 Haiku agent  (standard)
 * - Pro            : 2 Haiku agents in parallel → merge complementary sections
 * - Premium        : 3 Haiku agents + 1 Sonnet coordinator → intelligent synthesis
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";
const MODEL_SONNET = "claude-sonnet-4-6";

// ─── Per-agent system prompts ───────────────────────────────────────────────

const AGENT_1_SYSTEM = `You are an expert project manager writing a professional project brief.
Focus on: project overview, context, goals, objectives, scope (what is included / excluded), key deliverables and expected outcomes.
Write in markdown with clear ## section headings. Be thorough, concrete, and professional.`;

const AGENT_2_SYSTEM = `You are a senior technical lead writing the technical part of a project brief.
Focus on: technical requirements, architecture decisions, integration points, team roles and responsibilities, estimated timeline with milestones, risks and mitigation strategies, success metrics and KPIs.
Write in markdown with clear ## section headings. Be thorough, concrete, and professional.`;

const AGENT_3_SYSTEM = `You are a strategic business analyst writing a strategic project brief.
Focus on: business context and problem statement, strategic alignment, stakeholder analysis, budget considerations, dependencies and constraints, alternative approaches considered, governance and sign-off requirements.
Write in markdown with clear ## section headings. Be thorough, concrete, and professional.`;

const COORDINATOR_SYSTEM = `You are a senior project director reviewing multiple brief drafts from different specialists.
Your task: synthesize the best comprehensive project brief by taking the strongest, most concrete and actionable elements from each draft.
Rules:
- Eliminate duplicates; keep the best version of each topic
- Structure logically with clear ## section headings
- Preserve technical accuracy and concrete details
- Output one unified, professional project brief in markdown
- Do NOT mention that this was synthesized from multiple drafts`;

// ─── Core API call ───────────────────────────────────────────────────────────

async function callAgent(
  prompt: string,
  apiKey: string,
  systemPrompt: string,
  model: string = MODEL_HAIKU,
  maxTokens: number = 4096
): Promise<string> {
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Empty response from agent");
  return text;
}

// ─── Single agent (Free / Starter) ──────────────────────────────────────────

export async function generateSingle(prompt: string, apiKey: string): Promise<string> {
  return callAgent(prompt, apiKey, AGENT_1_SYSTEM, MODEL_HAIKU, 4096);
}

// ─── Pro: 2 Haiku agents → merge sections ───────────────────────────────────

export async function generatePro(prompt: string, apiKey: string): Promise<string> {
  const [overview, technical] = await Promise.all([
    callAgent(prompt, apiKey, AGENT_1_SYSTEM, MODEL_HAIKU, 2048),
    callAgent(prompt, apiKey, AGENT_2_SYSTEM, MODEL_HAIKU, 2048),
  ]);

  // Merge: overview sections first, then technical sections
  // Deduplicate by removing sections from draft 2 already present in draft 1
  const merged = mergeDrafts(overview, technical);
  return merged;
}

// ─── Premium: 3 Haiku + 1 Sonnet coordinator ────────────────────────────────

export async function generatePremium(prompt: string, apiKey: string): Promise<string> {
  // Phase 1: 3 specialist Haiku agents in parallel
  const [draft1, draft2, draft3] = await Promise.all([
    callAgent(prompt, apiKey, AGENT_1_SYSTEM, MODEL_HAIKU, 2048),
    callAgent(prompt, apiKey, AGENT_2_SYSTEM, MODEL_HAIKU, 2048),
    callAgent(prompt, apiKey, AGENT_3_SYSTEM, MODEL_HAIKU, 2048),
  ]);

  // Phase 2: Sonnet synthesizes the 3 drafts
  const coordinatorPrompt = `
PROJECT REQUEST:
${prompt}

---
DRAFT 1 (Project Manager perspective):
${draft1}

---
DRAFT 2 (Technical Lead perspective):
${draft2}

---
DRAFT 3 (Strategic Analyst perspective):
${draft3}
`;

  return callAgent(
    coordinatorPrompt,
    apiKey,
    COORDINATOR_SYSTEM,
    MODEL_SONNET,
    6000
  );
}

// ─── Idée Express: single idea → 5-section structured document ──────────────

const IDEA_EXPRESS_SYSTEM = `You are an expert business analyst and product strategist. Transform a rough idea into a complete, investor-ready document package.

Given a project idea, generate EXACTLY these 5 sections with professional depth:

## 1. PRÉSENTATION DU PROJET
- Concept en 1-2 phrases percutantes
- Problème résolu et opportunité marché
- Proposition de valeur unique
- Utilisateurs cibles principaux
- Modèle de revenus envisagé

## 2. MVP — Produit Minimum Viable
- 5-7 fonctionnalités core (avec description courte de chaque)
- Ce qui est explicitement exclu de la V1
- Métriques de succès du MVP
- Stack technique recommandée

## 3. POC — Preuve de Concept
- Approche de validation technique
- Hypothèses clés à tester
- Ressources minimum nécessaires (temps + budget)
- Durée estimée et résultat attendu

## 4. DEVIS ESTIMATIF
- Phases de développement avec timeline (en semaines)
- Composition d'équipe recommandée
- Décomposition budgétaire (design, développement, infrastructure, marketing)
- Fourchette budgétaire totale estimée

## 5. BRIEF SIMPLIFIÉ
- Résumé exécutif en 1 paragraphe
- 3 décisions clés à prendre maintenant
- Prochaines étapes recommandées

Réponds dans la langue de l'idée fournie. Sois concret, actionnable et professionnel. Utilise des titres markdown clairs (## pour les sections, ### pour les sous-sections).`;

// ─── Doc type focus instructions ─────────────────────────────────────────────

const DOC_TYPE_FOCUS: Record<string, string> = {
  presentation: `Tu génères les 5 sections habituelles, mais avec un accent particulier sur la section PRÉSENTATION DU PROJET : développe-la en profondeur avec le storytelling du projet, l'opportunité marché détaillée, et la proposition de valeur convaincante. Les autres sections restent présentes mais plus concises.`,
  mvp: `Tu génères les 5 sections habituelles, mais avec un accent particulier sur la section MVP : détaille exhaustivement chaque fonctionnalité (user stories, critères d'acceptation, priorité MoSCoW), la roadmap de développement et les métriques de succès. Les autres sections restent présentes mais plus concises.`,
  poc: `Tu génères les 5 sections habituelles, mais avec un accent particulier sur la section POC : détaille le plan de validation technique étape par étape, les risques à tester en priorité, le protocole d'expérimentation et les critères de go/no-go. Les autres sections restent présentes mais plus concises.`,
  devis: `Tu génères les 5 sections habituelles, mais avec un accent particulier sur la section DEVIS ESTIMATIF : fournis une décomposition budgétaire très détaillée par phase et par corps de métier, plusieurs scénarios (minimum / optimal / premium), et une analyse coût/bénéfice. Les autres sections restent présentes mais plus concises.`,
  brief: `Tu génères les 5 sections avec une profondeur équilibrée. C'est le document complet standard.`,
};

export async function generateIdeaExpress(
  idea: string,
  plan: string,
  apiKey: string,
  docType?: string
): Promise<string> {
  const model =
    plan === "premium" || plan === "enterprise" ? MODEL_SONNET : MODEL_HAIKU;
  const maxTokens = model === MODEL_SONNET ? 6000 : 4096;

  const resolvedDocType = docType && DOC_TYPE_FOCUS[docType] ? docType : "brief";
  const focusInstruction = DOC_TYPE_FOCUS[resolvedDocType];

  const prompt = `Transforme cette idée en un document structuré complet :

${idea}

${focusInstruction}

Génère les 5 sections demandées avec profondeur et précision.`;

  return callAgent(prompt, apiKey, IDEA_EXPRESS_SYSTEM, model, maxTokens);
}

// ─── Plan dispatcher ─────────────────────────────────────────────────────────

export async function generateByPlan(
  prompt: string,
  plan: string,
  apiKey: string
): Promise<string> {
  switch (plan) {
    case "pro":
      return generatePro(prompt, apiKey);
    case "premium":
    case "enterprise":
      return generatePremium(prompt, apiKey);
    default:
      return generateSingle(prompt, apiKey);
  }
}

// ─── Section merge utility ───────────────────────────────────────────────────

function mergeDrafts(draft1: string, draft2: string): string {
  // Extract section headings from draft 1
  const sectionsInDraft1 = new Set(
    [...draft1.matchAll(/^##\s+(.+)$/gm)].map((m) =>
      m[1].toLowerCase().replace(/[^a-z0-9]/g, "")
    )
  );

  // Split draft 2 into sections
  const sections2 = draft2.split(/(?=^##\s)/gm).filter((s) => s.trim());

  // Keep only sections from draft 2 that are not already in draft 1
  const uniqueSections2 = sections2.filter((section) => {
    const headingMatch = section.match(/^##\s+(.+)$/m);
    if (!headingMatch) return false;
    const key = headingMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "");
    return !sectionsInDraft1.has(key);
  });

  return draft1 + (uniqueSections2.length > 0 ? "\n\n" + uniqueSections2.join("\n\n") : "");
}
