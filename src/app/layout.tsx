import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AnalyticsProvider } from "@/components/Analytics";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://origo-beta.xyz"),
  title: {
    default: "ORIGO — AI-Powered Project Brief Generator | Pacaud Services",
    template: "%s | ORIGO",
  },
  description:
    "Generate professional project briefs in minutes with AI. ORIGO by Pacaud Services transforms vague ideas into structured, actionable briefs for agencies, freelancers, and teams.",
  keywords: [
    "origo",
    "pacaud services",
    "AI brief generator",
    "project brief tool",
    "brief generator",
    "client brief",
    "project scope",
    "agency tools",
    "freelance tools",
    "origo AI",
    "automated briefs",
    "project planning",
    "brief automation",
    "SaaS brief tool",
  ],
  authors: [{ name: "Pacaud Services" }],
  creator: "Pacaud Services",
  publisher: "Pacaud Services",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://origo-beta.xyz",
    title: "ORIGO — AI-Powered Project Brief Generator",
    description:
      "Generate professional project briefs in minutes with AI. Transform vague ideas into structured, actionable briefs.",
    siteName: "ORIGO",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ORIGO - AI Project Brief Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ORIGO — AI-Powered Project Brief Generator",
    description:
      "Generate professional project briefs in minutes with AI. By Pacaud Services.",
    images: ["/og-image.png"],
    creator: "@pacaudservices",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Analytics />
      </body>
    </html>
  );
}
