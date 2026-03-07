import type { Metadata } from "next";
import "./globals.css";
import "@livekit/components-styles";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AppShell } from "@/src/features/navigation/AppShell";
import { AppToaster } from "@/src/components/ui/sonner";
import { siteDescription, siteKeywords, siteName } from "@/src/features/landing/seo";

const metadataBase = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: "/convolink-mark.svg",
    shortcut: "/convolink-mark.svg",
    apple: "/convolink-mark.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName,
    images: [{ url: "/convolink-og.svg", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
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
