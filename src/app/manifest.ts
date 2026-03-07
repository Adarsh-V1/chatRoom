import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ConvoLink",
    short_name: "ConvoLink",
    description: "A modern team chat workspace powered by Convex.",
    start_url: "/chat",
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
