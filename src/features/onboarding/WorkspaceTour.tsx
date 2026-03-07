"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";

type TourStep = {
  id: string;
  title: string;
  description: string;
};

const steps: TourStep[] = [
  {
    id: "status",
    title: "Start with who is here",
    description: "This header area shows your active identity and room context so you always know where you are speaking.",
  },
  {
    id: "people",
    title: "People stay one move away",
    description: "Use this panel to jump into direct threads, scan presence, and keep priority contacts close.",
  },
  {
    id: "actions",
    title: "Calls and priorities live here",
    description: "The action cluster lets you star a room, open the people drawer on mobile, or start a call instantly.",
  },
  {
    id: "composer",
    title: "This is your command line",
    description: "Write messages, drop files, and trigger emoji without leaving the conversation flow.",
  },
];

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getRectForStep(stepId: string): HighlightRect | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${stepId}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(rect.top - 12, 12),
    left: Math.max(rect.left - 12, 12),
    width: Math.max(rect.width + 24, 140),
    height: Math.max(rect.height + 24, 68),
  };
}

function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  rect,
  onBack,
  onNext,
  onClose,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  rect: HighlightRect | null;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const position = useMemo(() => {
    const tooltipWidth = 320;
    const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
    if (!rect) {
      return { top: 80, left: 24 };
    }

    const gap = 18;
    const top = rect.top + rect.height + gap;
    const left = Math.min(
      Math.max(rect.left, 24),
      viewportWidth - tooltipWidth - 24
    );

    if (top + 230 < viewportHeight) {
      return { top, left };
    }

    return {
      top: Math.max(rect.top - 210, 24),
      left,
    };
  }, [rect]);

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className="fixed z-[91] w-[min(20rem,calc(100vw-2rem))] rounded-[30px] border border-white/20 bg-[rgba(12,20,36,0.9)] p-5 text-white shadow-[0_40px_120px_-60px_rgba(2,6,23,0.8)] backdrop-blur-2xl"
      style={position}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
        Tour {stepIndex + 1} / {totalSteps}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{step.title}</div>
      <p className="mt-3 text-sm leading-7 text-slate-200">{step.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onClose} className="border-white/20 bg-white/6 text-white hover:bg-white/10 hover:text-white">
          End tour
        </Button>
        {stepIndex > 0 ? (
          <Button variant="outline" size="sm" onClick={onBack} className="border-white/20 bg-white/6 text-white hover:bg-white/10 hover:text-white">
            Back
          </Button>
        ) : null}
        <Button size="sm" onClick={onNext}>
          {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </motion.div>
  );
}

export function TourPrompt({
  open,
  onClose,
  onStart,
}: {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[88] flex items-end justify-center bg-[rgba(8,15,29,0.32)] p-4 sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className="w-full max-w-lg rounded-[34px] border border-white/35 bg-[color:rgba(244,248,253,0.92)] p-7 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur-2xl"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Optional tour</div>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--text-1)]">Want a quick tour of the workspace?</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-2)]">
              It takes less than a minute and points out the core areas: people, actions, and the message composer.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" onClick={onStart}>
                Start tour
              </Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Maybe later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function WorkspaceTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);

  const step = steps[stepIndex];

  useEffect(() => {
    if (!open) return;

    const update = () => {
      setRect(getRectForStep(steps[stepIndex].id));
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, stepIndex]);

  const handleNext = () => {
    if (stepIndex === steps.length - 1) {
      onClose();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[89] bg-[rgba(2,6,23,0.55)]"
          />
          {rect ? (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="pointer-events-none fixed z-[90] rounded-[28px] border border-cyan-300/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.42),0_0_0_1px_rgba(255,255,255,0.12),0_20px_60px_-22px_rgba(34,211,238,0.4)]"
              style={rect}
            />
          ) : null}
          <TourTooltip
            step={step}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            rect={rect}
            onBack={() => setStepIndex((current) => Math.max(current - 1, 0))}
            onNext={handleNext}
            onClose={onClose}
          />
        </>
      ) : null}
    </AnimatePresence>
  );
}
