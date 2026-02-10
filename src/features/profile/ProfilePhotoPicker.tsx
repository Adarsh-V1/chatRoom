"use client";

import React, { useEffect, useMemo, useRef } from "react";

import { Avatar } from "@/src/features/ui/Avatar";

type Props = {
  nameForFallback: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export function ProfilePhotoPicker({ nameForFallback, file, onFileChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          onFileChange(next);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      <div className="mt-5 rounded-2xl border theme-panel p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={nameForFallback} url={previewUrl} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-semibold theme-text">Profile photo</div>
              <div className="truncate text-xs theme-muted">
                {file ? file.name : "Optional — shows next to your name"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98] theme-chip"
            >
              {file ? "Change" : "Upload"}
            </button>
            {file ? (
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98] theme-chip"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
