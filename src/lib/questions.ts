import { BriefAnswers } from "./types";

// Question IDs that match the BriefAnswers keys
export const questionIds = [
  "projectType",
  "clientInfo",
  "goals",
  "targetAudience",
  "deliverables",
  "timeline",
  "budget",
  "constraints",
] as const;

// Project type options - these map to brief.new.questions.projectType.options
export const projectTypeOptionKeys = [
  "website",
  "webApp",
  "mobileApp",
  "ecommerce",
  "saas",
  "redesign",
  "other",
] as const;

// Question metadata (type and required status don't need translation)
export const questionMetadata: Record<keyof BriefAnswers, { type: "select" | "text" | "textarea", required: boolean }> = {
  projectType: { type: "select", required: true },
  clientInfo: { type: "textarea", required: true },
  goals: { type: "textarea", required: true },
  targetAudience: { type: "textarea", required: true },
  deliverables: { type: "textarea", required: true },
  timeline: { type: "textarea", required: true },
  budget: { type: "text", required: false },
  constraints: { type: "textarea", required: false },
};
