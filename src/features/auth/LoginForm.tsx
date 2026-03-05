"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { AvatarPicker } from "./AvatarPicker";
import { useAvatarPreview } from "./useAvatarPreview";

export type LoginFormValues = {
  name: string;
  password: string;
  avatarFile: File | null;
};

type Props = {
  title: string;
  subtitle: string;
  onSubmit: (values: LoginFormValues) => Promise<void>;
};

export function LoginForm({ title, subtitle, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarPreviewUrl = useAvatarPreview(avatarFile);

  const canSubmit = useMemo(() => {
    const n = name.trim();
    const p = password.trim();
    return Boolean(n) && Boolean(p);
  }, [name, password]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canSubmit) return;
              setError(null);
              setIsSubmitting(true);
              try {
                await onSubmit({
                  name: name.trim(),
                  password: password.trim(),
                  avatarFile,
                });
              } catch (err) {
                const message = err instanceof Error ? err.message : "Login failed";
                setError(message);
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <AvatarPicker file={avatarFile} previewUrl={avatarPreviewUrl} onChange={setAvatarFile} />
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            <div className="text-xs text-slate-500">
              New accounts need a strong password (8+ chars with letters, numbers, and a symbol). Legacy 4-5 letter passwords still work.
            </div>
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <Button type="submit" className="w-full" size="lg" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Entering..." : "Enter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
