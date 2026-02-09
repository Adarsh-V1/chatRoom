"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function ConvexClientProvider({
    children,
}: {
    children: ReactNode
}) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    const client = useMemo(() => {
        if (!convexUrl) return null;
        return new ConvexReactClient(convexUrl);
    }, [convexUrl]);

    // Prevent Next build/prerender from crashing if env isn't available.
    // The chat pages will still require NEXT_PUBLIC_CONVEX_URL at runtime.
    if (!client) {
        return <>{children}</>;
    }

    return (
        <ConvexProvider client={client}>
            {children}
        </ConvexProvider>
    )
}

