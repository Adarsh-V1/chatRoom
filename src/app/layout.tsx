import type { Metadata } from "next";
import "./globals.css";
import "@livekit/components-styles";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AppShell } from "@/src/features/navigation/AppShell";

export const metadata: Metadata = {
  title: "The Fool's Chat",
  description: "A chat application powered by Convex and Boredom",
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
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
