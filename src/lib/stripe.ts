// Plans configuration (shared, client-safe)

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    briefs: 3,
    folders: 0,
    features: [
      "3 project briefs per month",
      "Idée Express (Présentation, MVP, POC, Devis, Brief)",
      "Classic PDF export",
    ],
  },
  starter: {
    name: "Starter",
    price: 4.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    briefs: 10,
    folders: 1,
    features: [
      "10 project briefs per month",
      "Idée Express + Brief Guidé",
      "Classic PDF export",
      "1 dossier de classement",
      "Brief history & sharing",
    ],
  },
  pro: {
    name: "Pro",
    price: 14.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    briefs: 50,
    folders: 5,
    features: [
      "50 project briefs per month",
      "Idée Express + Brief Guidé",
      "Classic PDF export",
      "Brief+",
      "5 dossiers de classement",
      "Brief templates library",
      "Advanced PDF customization",
      "Priority support",
    ],
  },
  premium: {
    name: "Premium",
    price: 29.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    briefs: 100,
    folders: 10,
    features: [
      "100 project briefs per month",
      "Idée Express + Brief Guidé",
      "Classic PDF export",
      "Brief+",
      "10 dossiers de classement",
      "Custom AI Agent",
      "Brief templates library",
      "Custom branding on PDFs",
      "Brief history & sharing",
      "24/7 priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null, // Custom pricing
    priceId: null,
    briefs: -1, // unlimited
    folders: -1, // unlimited
    features: [
      "Unlimited project briefs",
      "Unlimited Origo AI credits",
      "Brief+",
      "Dedicated account manager",
      "Custom integrations",
      "SSO & advanced security",
      "SLA guarantee",
      "White-label option",
      "Custom contract",
    ],
  },
};
