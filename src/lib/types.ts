export interface Brief {
  id: string;
  title: string;
  projectType: string;
  answers: BriefAnswers;
  content: string;
  createdAt: string;

  // Phase 2: Skin UI System
  folderId?: string;
  skinId?: string;
  customLogoUrl?: string;
  customTitle?: string;
  bookViewerEnabled?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: "free" | "starter" | "pro" | "premium";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: "active" | "canceled" | "past_due";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  briefCount: number;
  createdAt: string;
}

export interface BriefAnswers {
  projectType: string;
  clientInfo: string;
  goals: string;
  targetAudience: string;
  deliverables: string;
  timeline: string;
  budget: string;
  constraints: string;
}

export interface Question {
  id: keyof BriefAnswers;
  label: string;
  title: string;
  description: string;
  type: "select" | "text" | "textarea";
  placeholder: string;
  options?: string[];
  required: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 2: Briefs Skin UI + Animation Identity Types
// ═══════════════════════════════════════════════════════════════════════════

export interface BriefFolder {
  id: string;
  userId: string;
  name: string;
  color: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkinConfig {
  borderStyle: string;
  showLogo: boolean;
  bookMode: boolean;
  accentColor: string;
}

export interface BriefSkin {
  id: string;
  name: string;
  tier: 'collector' | 'pro' | 'premium';
  config: SkinConfig;
  createdAt: string;
}

export interface UserFeatureActivation {
  id: string;
  userId: string;
  featureCode: string;
  activationCodeUsed?: string;
  activatedAt: string;
  expiresAt?: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  featureCode: string;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
