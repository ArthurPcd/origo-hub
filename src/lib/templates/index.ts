import { BriefAnswers } from "../types";

export interface Template {
  id: string;
  nameKey: string; // Translation key for template name
  descriptionKey: string; // Translation key for template description
  iconEmoji: string;
  defaultAnswers: Partial<BriefAnswers>;
}

export const templates: Template[] = [
  {
    id: "product-launch",
    nameKey: "productLaunch",
    descriptionKey: "productLaunchDesc",
    iconEmoji: "🚀",
    defaultAnswers: {
      projectType: "",
      clientInfo: "",
      goals: "",
      targetAudience: "",
      deliverables: "",
      timeline: "",
      budget: "",
      constraints: "",
    },
  },
  {
    id: "event-conference",
    nameKey: "eventConference",
    descriptionKey: "eventConferenceDesc",
    iconEmoji: "🎤",
    defaultAnswers: {
      projectType: "",
      clientInfo: "",
      goals: "",
      targetAudience: "",
      deliverables: "",
      timeline: "",
      budget: "",
      constraints: "",
    },
  },
  {
    id: "rebranding",
    nameKey: "rebranding",
    descriptionKey: "rebrandingDesc",
    iconEmoji: "✨",
    defaultAnswers: {
      projectType: "",
      clientInfo: "",
      goals: "",
      targetAudience: "",
      deliverables: "",
      timeline: "",
      budget: "",
      constraints: "",
    },
  },
  {
    id: "content-campaign",
    nameKey: "contentCampaign",
    descriptionKey: "contentCampaignDesc",
    iconEmoji: "📝",
    defaultAnswers: {
      projectType: "",
      clientInfo: "",
      goals: "",
      targetAudience: "",
      deliverables: "",
      timeline: "",
      budget: "",
      constraints: "",
    },
  },
  {
    id: "app-launch",
    nameKey: "appLaunch",
    descriptionKey: "appLaunchDesc",
    iconEmoji: "📱",
    defaultAnswers: {
      projectType: "",
      clientInfo: "",
      goals: "",
      targetAudience: "",
      deliverables: "",
      timeline: "",
      budget: "",
      constraints: "",
    },
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}
