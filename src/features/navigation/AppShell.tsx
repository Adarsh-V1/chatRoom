"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "./AppNav";
import { SettingsSync } from "@/src/features/settings/SettingsSync";

interface AppShellProps {
  children: ReactNode;
}

const HIDE_BOTTOM_NAV_PREFIXES = ["/call"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "";
  const showBottomNav = !HIDE_BOTTOM_NAV_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  return (
    <div>
      <AppNav pathname={pathname} showBottomNav={showBottomNav} />
      <SettingsSync />
      {children}
    </div>
  );
}
