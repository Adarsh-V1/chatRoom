"use client";

import { ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingScreen, PageContainer, PageShell } from "@/src/components/app/page-shell";
import { LoginCard } from "@/src/features/auth/LoginCard";
import { sanitizeReturnTo } from "@/src/features/auth/returnTo";
import { useChatAuth } from "@/src/features/auth/useChatAuth";

type Props = {
  title: string;
  subtitle: string;
  returnTo?: string | null;
  loadingTitle?: string;
  loadingDescription?: string;
  children: ReactNode;
};

export function ProtectedRoute({
  title,
  subtitle,
  returnTo,
  loadingTitle = "Loading workspace...",
  loadingDescription = "Checking your session and restoring the requested view.",
  children,
}: Props) {
  const router = useRouter();
  const auth = useChatAuth();
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.users.setMyProfilePicture);

  const nextHref = useMemo(
    () => sanitizeReturnTo(returnTo) ?? "/chat?resume=1",
    [returnTo]
  );

  if (!auth.isReady) {
    return <LoadingScreen title={loadingTitle} description={loadingDescription} />;
  }

  if (!auth.isLoggedIn) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
          <div className="w-full max-w-xl">
            <LoginCard
              title={title}
              subtitle={subtitle}
              onGoogleSubmit={async (credential) => {
                const result = await auth.loginWithGoogle(credential);
                router.push(nextHref);
                return result;
              }}
              onSubmit={async ({ name, password, profileFile }) => {
                const result = await auth.login({ name, password });

                if (profileFile) {
                  const uploadUrl = await generateUploadUrl({ token: result.token });
                  const response = await fetch(uploadUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": profileFile.type || "application/octet-stream",
                    },
                    body: profileFile,
                  });

                  if (response.ok) {
                    const json = (await response.json()) as { storageId: string };
                    await setMyProfilePicture({
                      token: result.token,
                      storageId: json.storageId as Id<"_storage">,
                    });
                  }
                }

                router.push(nextHref);
              }}
            />
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  return <>{children}</>;
}
