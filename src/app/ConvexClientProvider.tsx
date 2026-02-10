"use client";

import { ReactNode, useEffect, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function ConvexClientProvider({
    children,
    convexUrl,
}: {
    children: ReactNode;
    convexUrl?: string;
}) {
    const [client, setClient] = useState<ConvexReactClient | null>(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!convexUrl) {
            setClient(null);
            return;
        }
        setClient(new ConvexReactClient(convexUrl));
    }, [convexUrl]);

    if (!hydrated) {
        return null;
    }

    if (!client) {
        return (
            <main className="min-h-screen w-full p-6">
                <div className="mx-auto w-full max-w-2xl rounded-xl border border-black/10 p-6">
                    <h1 className="text-lg font-semibold">Convex not configured</h1>
                    <p className="mt-2 text-sm text-black/70">
                        Set <span className="font-mono">NEXT_PUBLIC_CONVEX_URL</span> in your environment
                        (or <span className="font-mono">.env.local</span>) and restart the server.
                    </p>
                </div>
            </main>
        );
    }

    return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

