"use client";

import { ReactNode, useCallback } from "react";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { useSession } from "@/src/auth/useSession";
import { LoginForm, type LoginFormValues } from "./LoginForm";

type Props = {
  title: string;
  subtitle: string;
  children: (params: { token: string; username: string }) => ReactNode;
};

export function AuthGate({ title, subtitle, children }: Props) {
  const { token, sessionUser, setToken, isReady } = useSession();

  const loginOrRegister = useMutation(api.auth.loginOrRegister);
  const generateUploadUrl = useMutation(api.chats.generateUploadUrl);
  const setMyProfilePicture = useMutation(api.chats.setMyProfilePicture);

  const handleLogin = useCallback(
    async (values: LoginFormValues) => {
      const result = await loginOrRegister({
        name: values.name,
        password: values.password,
      });

      setToken(result.token);

      if (values.avatarFile) {
        const uploadUrl = await generateUploadUrl({});
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": values.avatarFile.type || "application/octet-stream",
          },
          body: values.avatarFile,
        });

        if (uploadResult.ok) {
          const json = (await uploadResult.json()) as { storageId: string };
          await setMyProfilePicture({
            token: result.token,
            storageId: json.storageId as Id<"_storage">,
          });
        }
      }
    },
    [generateUploadUrl, loginOrRegister, setMyProfilePicture, setToken]
  );

  if (!isReady) {
    return (
      <main className="min-h-screen w-full theme-page p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border theme-card p-8 shadow backdrop-blur">
            <div className="text-sm font-semibold theme-muted">Loading…</div>
          </div>
        </div>
      </main>
    );
  }

  if (token && sessionUser) {
    return <>{children({ token, username: sessionUser.name })}</>;
  }

  return (
    <main className="min-h-screen w-full theme-page p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
        <LoginForm title={title} subtitle={subtitle} onSubmit={handleLogin} />
      </div>
    </main>
  );
}
