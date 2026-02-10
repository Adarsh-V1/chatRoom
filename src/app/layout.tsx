import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik_Scribble } from "next/font/google";
import "./globals.css";
import "@livekit/components-styles";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AppShell } from "@/src/features/navigation/AppShell";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const rubikScribble = Rubik_Scribble({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fool",
});

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
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${rubikScribble.variable}
          antialiased
        `}
      >
        <ThemeProvider>
          <ConvexClientProvider convexUrl={convexUrl}>
            <AppShell>{children}</AppShell>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
