import type { Metadata } from "next";
import "./globals.css";
import "@livekit/components-styles";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AppShell } from "@/src/features/navigation/AppShell";
import { AppToaster } from "@/src/components/ui/sonner";

const metadataBase = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "ConvoLink",
    template: "%s · ConvoLink",
  },
  description: "A modern team chat workspace powered by Convex",
  applicationName: "ConvoLink",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/convolink-mark.svg",
    shortcut: "/convolink-mark.svg",
    apple: "/convolink-mark.svg",
  },
  openGraph: {
    title: "ConvoLink",
    description: "A modern team chat workspace powered by Convex.",
    type: "website",
    images: [{ url: "/convolink-og.svg", width: 1200, height: 630, alt: "ConvoLink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConvoLink",
    description: "A modern team chat workspace powered by Convex.",
    images: ["/convolink-og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ConvexClientProvider convexUrl={convexUrl}>
            <AppShell>{children}</AppShell>
            <AppToaster />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
