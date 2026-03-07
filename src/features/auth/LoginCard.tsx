"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { BrandLogo } from "@/src/components/app/brand-logo";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { GoogleSignInButton } from "@/src/features/auth/GoogleSignInButton";
import { ProfilePhotoPicker } from "@/src/features/profile/ProfilePhotoPicker";

type SubmitArgs = {
  name: string;
  password: string;
  profileFile: File | null;
};

type Props = {
  title: string;
  subtitle?: string;
  onSubmit: (args: SubmitArgs) => Promise<void>;
  onGoogleSubmit?: (credential: string) => Promise<{ name?: string } | void>;
};

export function LoginCard({ title, subtitle, onSubmit, onGoogleSubmit }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();
    return trimmedName.length > 0 && trimmedPassword.length > 0 && !submitting;
  }, [name, password, submitting]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[color:var(--border-1)] bg-linear-to-r from-[rgba(224,235,248,0.96)] via-[rgba(231,242,251,0.92)] to-[rgba(248,233,197,0.84)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <BrandLogo size="sm" tagline="Secure chat" className="mb-3" />
              <Badge variant="secondary" className="mb-3">Secure entry</Badge>
              <CardTitle className="text-2xl">{title}</CardTitle>
              {subtitle ? <CardDescription className="mt-2 max-w-md">{subtitle}</CardDescription> : null}
            </div>
            <div className="hidden rounded-2xl border border-emerald-300/55 bg-emerald-50/78 px-3 py-2 text-xs font-medium text-emerald-900 sm:block">
              ConvoLink
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <ProfilePhotoPicker nameForFallback={name || "You"} file={profileFile} onFileChange={setProfileFile} />

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const trimmedName = name.trim();
              const trimmedPassword = password.trim();
              if (!trimmedName || !trimmedPassword) return;

              setSubmitting(true);
              try {
                await onSubmit({ name: trimmedName, password: trimmedPassword, profileFile });
                toast.success(`Welcome to ConvoLink, ${trimmedName}`);
              } catch (err) {
                const message = err instanceof Error ? err.message : "Login failed";
                setError(message);
                toast.error(message);
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Username</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </label>

            <label className="block space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Password</span>
                <span className="text-xs text-slate-400">Strong password recommended</span>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  type="password"
                  inputMode="text"
                  autoComplete="current-password"
                  className="pl-9"
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
              {submitting ? "Entering..." : "Enter workspace"}
            </Button>
          </form>

          {onGoogleSubmit ? (
            <div className="space-y-2 border-t border-[color:var(--border-1)] pt-4">
              <div className="text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Or</div>
              <GoogleSignInButton
                disabled={submitting}
                onCredential={async (credential) => {
                  setError(null);
                  setSubmitting(true);
                  try {
                    const result = await onGoogleSubmit(credential);
                    const welcomeName = result && typeof result === "object" && "name" in result
                      ? (result.name ?? "there")
                      : "there";
                    toast.success(`Welcome to ConvoLink, ${welcomeName}`);
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Google login failed";
                    setError(message);
                    toast.error(message);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
