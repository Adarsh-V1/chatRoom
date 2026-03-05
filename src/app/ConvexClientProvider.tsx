"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { PageShell } from "@/src/components/app/page-shell";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function ConvexClientProvider({
  children,
  convexUrl,
}: {
  children: ReactNode;
  convexUrl?: string;
}) {
  const client = useMemo(() => (convexUrl ? new ConvexReactClient(convexUrl) : null), [convexUrl]);

  if (!client) {
    return (
      <PageShell>
        <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-2xl items-center justify-center">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Convex is not configured</CardTitle>
              <CardDescription>
                Set <code>NEXT_PUBLIC_CONVEX_URL</code> in your environment and restart the development server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload after configuring
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
