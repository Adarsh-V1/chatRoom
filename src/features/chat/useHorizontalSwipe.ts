"use client";

import type { TouchEvent } from "react";
import { useRef } from "react";

type SwipeOptions = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
};

export function useHorizontalSwipe({ onSwipeLeft, onSwipeRight, disabled = false }: SwipeOptions) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      if (disabled) return;
      const touch = event.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      if (disabled || !touchStartRef.current) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
        return;
      }

      if (deltaX < 0) {
        onSwipeLeft?.();
        return;
      }

      onSwipeRight?.();
    },
  };
}
