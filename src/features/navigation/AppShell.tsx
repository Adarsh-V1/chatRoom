"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "./AppNav";
import { NotificationManager } from "@/src/features/notifications/NotificationManager";
import { SettingsSync } from "@/src/features/settings/SettingsSync";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    return <div className="theme-page min-h-screen text-[color:var(--text-1)]">{children}</div>;
  }

  return (
    <div className="theme-page min-h-screen text-[color:var(--text-1)]">
      <a href="#app-main" className="skip-link">
        Skip to main content
      </a>
      <AppNav pathname={pathname} />
      <SettingsSync />
      <NotificationManager />
      {children}
    </div>
  );
}
