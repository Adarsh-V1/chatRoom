"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

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
};

export function LoginCard({ title, subtitle, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const n = name.trim();
    const p = password.trim();
    return n.length > 0 && p.length > 0 && !submitting;
  }, [name, password, submitting]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const trimmedName = name.trim();
        const trimmedPassword = password.trim();
        if (!trimmedName || !trimmedPassword) return;

        setSubmitting(true);
        try {
          await onSubmit({ name: trimmedName, password: trimmedPassword, profileFile });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Login failed";
          setError(message);
        } finally {
          setSubmitting(false);
        }
      }}
      className="w-full rounded-2xl border theme-card p-8 shadow backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold theme-text">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm theme-muted">{subtitle}</p> : null}
        </div>
        <div className="hidden sm:block rounded-full border px-3 py-1 text-xs font-semibold theme-chip theme-muted">
          LOGIN
        </div>
      </div>

      <ProfilePhotoPicker nameForFallback={name || "You"} file={profileFile} onFileChange={setProfileFile} />

      <label className="mt-5 block">
        <div className="text-xs font-semibold tracking-widest theme-faint">USERNAME</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name…"
          className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
          autoFocus
        />
      </label>

      <label className="mt-4 block">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold tracking-widest theme-faint">PASSWORD</div>
          <div className="text-xs theme-faint">4–5 letters</div>
        </div>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="e.g. abcd"
          type="password"
          inputMode="text"
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 theme-input"
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
        {submitting ? "Entering…" : "Enter"}
      </button>
    </motion.form>
  );
}
