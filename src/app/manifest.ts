import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/src/features/landing/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#edf3fb",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/convolink-mark.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/convolink-mark.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
