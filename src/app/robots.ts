import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/brief/", "/history", "/account", "/setup"],
    },
    sitemap: "https://origo-beta.xyz/sitemap.xml",
  };
}
