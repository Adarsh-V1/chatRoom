"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

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
    return Boolean(n) && /^[A-Za-z]{4,5}$/.test(p);
  }, [name, password]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
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
      className="w-full rounded-2xl border theme-card p-8 shadow backdrop-blur"
    >
      <h2 className="text-xl font-bold theme-text">{title}</h2>
      <p className="mt-1 text-sm theme-muted">{subtitle}</p>

      <AvatarPicker file={avatarFile} previewUrl={avatarPreviewUrl} onChange={setAvatarFile} />

      <div className="mt-5">
        <label className="block text-xs font-semibold tracking-widest theme-faint">
          USERNAME
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
          autoFocus
        />
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold tracking-widest theme-faint">
          PASSWORD (4–5 LETTERS)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="abcd"
          className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 theme-input"
        />
        <div className="mt-2 text-xs theme-faint">
          Letters only: A–Z, length 4 or 5.
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Entering…" : "Enter"}
      </button>
    </motion.form>
  );
}
