"use client";

import { useRef } from "react";

type Props = {
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
};

export function AvatarPicker({ file, previewUrl, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          onChange(next);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-200">
                  +
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Profile photo</div>
              <div className="mt-0.5 truncate text-xs text-slate-300">
                {file ? file.name : "Upload an avatar (optional)"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98]"
            >
              {file ? "Change" : "Choose"}
            </button>

            {file ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 active:scale-[0.98]"
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
