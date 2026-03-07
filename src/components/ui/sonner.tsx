"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={false}
      visibleToasts={4}
      toastOptions={{
        duration: 3200,
        className:
          "border border-[color:var(--border-1)] bg-[color:rgba(241,247,254,0.94)] text-[color:var(--text-1)] shadow-[var(--shadow-soft)] backdrop-blur-xl",
      }}
    />
  );
}
