"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";

type Props = {
  onCredential: (credential: string) => Promise<void>;
  disabled?: boolean;
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-script";

export function GoogleSignInButton({ onCredential, disabled }: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;

    const initialize = () => {
      const googleId = window.google?.accounts?.id;
      if (!googleId) return;

      googleId.initialize({
        client_id: clientId,
        auto_select: true,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        callback: (response) => {
          const credential = response?.credential;
          if (!credential) return;

          setBusy(true);
          void onCredentialRef.current(credential).finally(() => {
            setBusy(false);
          });
        },
      });

      setReady(true);
      googleId.prompt();
    };

    if (window.google?.accounts?.id) {
      initialize();
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", initialize, { once: true });
      return () => existing.removeEventListener("load", initialize);
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        const googleId = window.google?.accounts?.id;
        if (!googleId) return;
        googleId.prompt();
      }}
      disabled={disabled || busy || !ready}
    >
      {busy ? "Signing in with Google..." : "Continue with Google"}
    </Button>
  );
}
