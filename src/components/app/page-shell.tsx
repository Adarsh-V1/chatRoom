"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/src/components/app/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";

export function PageShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.main
      id="app-main"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={cn("theme-page min-h-[calc(100dvh-var(--app-header-height))] w-full px-3 py-4 sm:px-4 sm:py-6", className)}
    >
      {children}
    </motion.main>
  );
}

export function PageContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full min-w-0 max-w-[1520px]", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-col gap-4 rounded-[32px] border border-[color:var(--border-1)] bg-[color:var(--surface-hero)] px-5 py-5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="space-y-2">
        {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">{eyebrow}</div> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text-1)] sm:text-4xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-[color:var(--text-2)]">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
    </motion.div>
  );
}

export function LoadingScreen({ title = "Loading...", description }: { title?: string; description?: string }) {
  return (
    <PageShell>
      <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-3 flex items-center gap-3">
              <motion.div
                className="h-9 w-9"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              >
                <BrandLogo mode="mark" size="sm" />
              </motion.div>
              <CardTitle>{title}</CardTitle>
            </div>
            {description ? <CardDescription>{description}</CardDescription> : null}
            <div className="mt-4 space-y-3">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex gap-3">
                <Skeleton className="h-16 flex-1 rounded-[22px]" />
                <Skeleton className="h-16 w-24 rounded-[22px]" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </PageContainer>
    </PageShell>
  );
}

export function CenteredState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <PageShell>
      <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          {action ? <CardContent>{action}</CardContent> : null}
        </Card>
      </PageContainer>
    </PageShell>
  );
}
