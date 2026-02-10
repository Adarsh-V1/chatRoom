"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "./AppNav";

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
    <div className={showBottomNav ? "pb-24 md:pb-0" : ""}>
      <AppNav pathname={pathname} showBottomNav={showBottomNav} />
      {children}
    </div>
  );
}
