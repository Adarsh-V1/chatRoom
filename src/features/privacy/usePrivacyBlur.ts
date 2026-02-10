"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Args = {
  idleMs: number;
};

export function usePrivacyBlur({ idleMs }: Args) {
  const [manualPrivacy, setManualPrivacy] = useState(false);
  const [idleBlurred, setIdleBlurred] = useState(false);
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleBlurred(false);
    };

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);

    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= idleMs) setIdleBlurred(true);
    }, 500);

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.clearInterval(interval);
    };
  }, [idleMs]);

  const isBlurred = useMemo(() => manualPrivacy || idleBlurred, [manualPrivacy, idleBlurred]);

  return {
    isBlurred,
    manualPrivacy,
    setManualPrivacy,
  };
}
