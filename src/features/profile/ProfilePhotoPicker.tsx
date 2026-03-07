"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
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

      <Card className="mt-6 rounded-[24px] border-[color:var(--border-1)] bg-[color:var(--surface-4)] p-4 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={nameForFallback} url={previewUrl} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[color:var(--text-1)]">Profile photo</div>
              <div className="truncate text-sm text-[color:var(--text-3)]">
                {file ? file.name : "Optional. It appears beside your messages and calls."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {file ? "Replace" : "Upload"}
            </Button>
            {file ? (
              <Button variant="outline" size="sm" onClick={() => onFileChange(null)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </>
  );
}
