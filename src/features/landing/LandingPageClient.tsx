"use client";

import Link from "next/link";
import { TextareaHTMLAttributes, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Bot, Mail, MessageSquareMore, Sparkles, Users, Video } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/src/components/app/brand-logo";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { loadAuth } from "@/src/features/auth/authStorage";
import { faqItems } from "@/src/features/landing/seo";
import { HeroScene } from "./HeroScene";
import { MiniScene } from "./MiniScene";
import { cn } from "@/src/lib/utils";

const navItems = [
  { label: "Features", href: "#overview" },
  { label: "Use cases", href: "#use-cases" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const featureCards = [
  {
    icon: MessageSquareMore,
    title: "Real-time team chat rooms",
    description: "Create focused spaces for projects, departments, and announcements without losing the thread.",
  },
  {
    icon: Users,
    title: "Direct messages and private groups",
    description: "Handle one-to-one conversations and smaller group discussions in the same workspace as public rooms.",
  },
  {
    icon: Video,
    title: "Presence and browser calls",
    description: "See who is online, jump into a call, and keep chat context close when a conversation moves faster live.",
  },
];

const flowCards = [
  {
    step: "01",
    title: "Remote teams",
    copy: "Keep project rooms, quick direct messages, and live calls in one place so decisions do not get scattered across tools.",
  },
  {
    step: "02",
    title: "Student and community groups",
    copy: "Run announcements, subgroup discussions, and ad-hoc calls from a workspace members can learn quickly.",
  },
  {
    step: "03",
    title: "Fast-moving operations",
    copy: "Use rooms for broad visibility, private groups for execution, and calls when text alone is too slow.",
  },
];

const motionRail = [
  "Real-time rooms",
  "Direct messages",
  "Private groups",
  "Presence indicators",
  "Browser calls",
  "Responsive workspace",
  "Convex-powered sync",
];

const cosmicPanel =
  "border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(10,19,41,0.84),rgba(7,13,29,0.74))] shadow-[0_34px_100px_-48px_rgba(2,6,23,0.88)] backdrop-blur-[26px]";
const cosmicInset = "border border-cyan-200/12 bg-[linear-gradient(180deg,rgba(15,27,55,0.78),rgba(8,15,34,0.7))]";
const cosmicScene =
  "bg-[radial-gradient(circle_at_20%_20%,rgba(110,231,255,0.16),transparent_34%),radial-gradient(circle_at_78%_24%,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,rgba(7,14,31,0.96),rgba(4,8,22,0.96))]";

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="theme-input min-h-32 w-full rounded-[22px] border px-4 py-3 text-sm font-medium text-[color:var(--text-1)] shadow-[0_10px_26px_-22px_rgba(2,6,23,0.7)] outline-none transition-all duration-200 placeholder:text-[color:var(--text-3)] focus:border-[color:var(--brand-border)] focus:bg-[color:var(--input-focus)] focus:ring-2 focus:ring-[color:var(--ring)]"
    />
  );
}

function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothRotateX = useSpring(rotateX, { stiffness: 180, damping: 18, mass: 0.8 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 180, damping: 18, mass: 0.8 });

  return (
    <motion.div
      style={{
        rotateX: smoothRotateX,
        rotateY: smoothRotateY,
        transformStyle: "preserve-3d",
      }}
      whileTap={{ scale: 0.99 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        rotateY.set((px - 0.5) * 10);
        rotateX.set((0.5 - py) * 10);
      }}
      onMouseLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

export function LandingPageClient() {
  const [storedAuth, setStoredAuth] = useState<{ name: string; token: string } | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const revealRootRef = useRef<HTMLDivElement | null>(null);

  const token = storedAuth?.token ?? "";
  const sessionUser = useQuery(api.auth.getSessionUser, token ? { token } : "skip");
  const submitContactForm = useMutation(api.contact.submitContactForm);

  const authState = !token ? "signed-out" : sessionUser === undefined ? "loading" : sessionUser ? "signed-in" : "signed-out";
  const ctaHref = "/chat?resume=1";
  const ctaLabel = authState === "signed-in" ? "Open workspace" : "Start chatting";
  const secondaryHref = authState === "signed-in" ? "#contact" : "#overview";
  const secondaryLabel = authState === "signed-in" ? "Talk to us" : "Explore features";

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -120]);
  const shellY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const cursorX = useMotionValue(-240);
  const cursorY = useMotionValue(-240);
  const glowX = useSpring(cursorX, { stiffness: 120, damping: 24 });
  const glowY = useSpring(cursorY, { stiffness: 120, damping: 24 });

  useEffect(() => {
    setStoredAuth(loadAuth());
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowStickyCta(window.scrollY > 560);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      reveals.forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 56, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: index * 0.04,
            scrollTrigger: {
              trigger: element,
              start: "top 82%",
            },
          }
        );
      });

      const parallax = gsap.utils.toArray<HTMLElement>("[data-parallax]");
      parallax.forEach((element, index) => {
        gsap.to(element, {
          yPercent: index % 2 === 0 ? -12 : 10,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }, revealRootRef);

    return () => ctx.revert();
  }, []);

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await submitContactForm({
        name: contactName,
        email: contactEmail,
        subject: contactSubject || undefined,
        message: contactMessage,
        source: "landing-page",
      });
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
      toast.success("Your message has been sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send your message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={revealRootRef}
      className="landing-cosmic relative overflow-x-clip"
      onMouseMove={(event) => {
        cursorX.set(event.clientX - 220);
        cursorY.set(event.clientY - 220);
      }}
    >
      <motion.div
        className="pointer-events-none fixed z-[1] h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.2)_0%,rgba(56,189,248,0.16)_34%,rgba(245,158,11,0.08)_54%,rgba(255,255,255,0)_72%)] blur-3xl"
        style={{ x: glowX, y: glowY }}
      />
      <div className="landing-cosmic-stars pointer-events-none absolute inset-0" />
      <div className="landing-cosmic-texture pointer-events-none absolute inset-0" />
      <div className="landing-cosmic-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-parallax
          className="absolute left-[-6rem] top-12 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.24),rgba(14,116,144,0.04)_72%,transparent_78%)] blur-3xl"
        />
        <div
          data-parallax
          className="absolute right-[-5rem] top-[24rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),rgba(2,132,199,0.04)_68%,transparent_76%)] blur-3xl"
        />
        <div
          data-parallax
          className="absolute left-[22%] top-[70rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.16),rgba(124,45,18,0.04)_66%,transparent_76%)] blur-3xl"
        />
      </div>

      <motion.div style={{ y: shellY }} className="relative">
        <header className="sticky top-0 z-50 border-b border-cyan-200/12 bg-[color:rgba(5,11,25,0.62)] shadow-[0_18px_50px_-34px_rgba(2,6,23,0.85)] backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <a href="#hero" className="min-w-0">
              <BrandLogo tagline="Live conversation system" />
            </a>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[color:var(--text-2)] transition hover:border-cyan-200/12 hover:bg-white/6 hover:text-[color:var(--text-1)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link href={ctaHref}>
                <Button size="sm">{ctaLabel}</Button>
              </Link>
            </div>
          </div>
          <motion.div className="h-px origin-left bg-linear-to-r from-emerald-500 via-cyan-500 to-amber-400" style={{ scaleX: scrollYProgress }} />
        </header>

        <main id="app-main">
          <section id="hero" className="relative min-h-[100svh] px-4 pb-16 pt-8 sm:px-6 sm:pb-24">
            <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.06fr_0.94fr]">
              <motion.div
                style={{ y: heroY }}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 pt-12 sm:pt-20"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/24 bg-[rgba(8,18,40,0.72)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 shadow-[0_18px_40px_-26px_rgba(34,211,238,0.24)]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Real-time collaboration workspace
                </div>
                <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[color:var(--text-1)] sm:text-6xl lg:text-7xl">
                  Real-time team chat, group messaging, and calls in{" "}
                  <span className="bg-linear-to-r from-cyan-200 via-sky-300 to-amber-300 bg-clip-text text-transparent">one workspace</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--text-2)] sm:text-lg">
                  ConvoLink helps teams manage chat rooms, direct messages, private groups, presence, and browser-based calls from a single collaboration surface built for fast communication.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={ctaHref}>
                    <Button size="lg" className="min-w-48">
                      {ctaLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                  <a href={secondaryHref}>
                    <Button variant="outline" size="lg" className="min-w-48">
                      {secondaryLabel}
                    </Button>
                  </a>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Team chat rooms", "Organize conversations by topic, project, or department."],
                    ["Direct and group messages", "Move from 1:1 threads to smaller collaboration spaces quickly."],
                    ["Calls and presence", "See who is online and launch browser conversations fast."],
                  ].map(([title, copy]) => (
                    <TiltCard key={title} className={cn("rounded-[28px] p-4", cosmicPanel)}>
                      <div className="text-sm font-semibold text-[color:var(--text-1)]">{title}</div>
                      <div className="mt-2 text-sm leading-6 text-[color:var(--text-2)]">{copy}</div>
                    </TiltCard>
                  ))}
                </div>
              </motion.div>

              <div className={cn("relative h-[34rem] min-h-[26rem] overflow-hidden rounded-[40px] lg:h-[44rem]", cosmicPanel)}>
                <HeroScene />
              </div>
            </div>
          </section>

          <section className="overflow-hidden border-y border-cyan-200/12 bg-[color:rgba(6,12,27,0.62)] py-4">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="flex w-max gap-3"
            >
              {[...motionRail, ...motionRail].map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-full border border-cyan-200/12 bg-[rgba(8,18,39,0.74)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-2)] shadow-[0_18px_40px_-30px_rgba(2,6,23,0.6)]"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          </section>

          <section id="overview" className="px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <div data-reveal className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Features</div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-1)] sm:text-5xl">
                  Everything teams need for faster communication in one place.
                </h2>
                <p className="mt-4 text-base leading-8 text-[color:var(--text-2)]">
                  ConvoLink combines team chat software, direct messaging, private group coordination, and live calling so work can move without constant tool switching.
                </p>
              </div>

              <div className="mt-12 grid gap-4 lg:grid-cols-3">
                {featureCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <TiltCard key={card.title} className={cn("rounded-[32px] p-6", cosmicPanel)}>
                      <article data-reveal>
                        <div className={cn("relative h-28 overflow-hidden rounded-[26px] border border-cyan-200/12", cosmicScene)}>
                          <MiniScene hue={card.title.includes("Real-time") ? 176 : card.title.includes("Direct") ? 197 : 38} />
                        </div>
                        <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/18 bg-[rgba(10,20,42,0.8)] text-cyan-100">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <h3 className="mt-5 text-2xl font-semibold tracking-tight text-[color:var(--text-1)]">{card.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--text-2)]">{card.description}</p>
                      </article>
                    </TiltCard>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="px-4 py-20 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.12fr_0.88fr]">
              <TiltCard className={cn("rounded-[36px] p-8", cosmicPanel)}>
                <div data-reveal>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Workspace flow</div>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-1)] sm:text-5xl">
                    Move from chat rooms to calls without changing products.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--text-2)]">
                    The workspace keeps conversations close together so teams can scan rooms, jump into direct threads, and start calls when typing is no longer enough.
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                      ["Rooms", "Shared channels for ongoing team topics"],
                      ["Groups", "Private collaboration spaces for smaller teams"],
                      ["Calls", "Live conversations launched from the same workspace"],
                    ].map(([title, copy]) => (
                      <motion.div
                        key={title}
                        whileHover={{ y: -6 }}
                        className={cn("rounded-[24px] p-4", cosmicInset)}
                      >
                        <div className="text-lg font-semibold text-[color:var(--text-1)]">{title}</div>
                        <div className="mt-2 text-sm leading-6 text-[color:var(--text-2)]">{copy}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TiltCard>

              <div className="grid gap-5">
                {[152, 28].map((hue, index) => (
                  <TiltCard key={hue} className={cn("rounded-[32px] p-5", cosmicPanel)}>
                    <div data-reveal className={cn("relative h-52 overflow-hidden rounded-[26px] border border-cyan-200/12", cosmicScene)}>
                      <MiniScene hue={hue} />
                    </div>
                    <div className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">
                      {index === 0 ? "Real-time state" : "Responsive surface"}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-[color:var(--text-1)]">
                      {index === 0 ? "Presence-aware collaboration" : "Built for desktop and mobile"}
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </section>

          <section id="use-cases" className="px-4 py-20 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div data-reveal className={cn("rounded-[36px] p-8", cosmicPanel)}>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Use cases</div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-1)]">
                  Built for teams, communities, and fast-moving projects.
                </h2>
                <p className="mt-4 text-base leading-8 text-[color:var(--text-2)]">
                  Whether the goal is daily team communication or quick coordination for smaller groups, ConvoLink keeps the most common collaboration paths in one place.
                </p>
                <div className={cn("mt-8 rounded-[28px] p-6", cosmicInset)}>
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                    <div className="text-sm font-semibold text-[color:var(--text-1)]">One workspace, fewer switches</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--text-2)]">
                    Shared rooms cover broad updates, direct threads handle focused discussion, and calls take over when a conversation needs faster resolution.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {flowCards.map((card) => (
                  <article
                    key={card.step}
                    data-reveal
                    className={cn("rounded-[32px] p-6", cosmicPanel)}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">{card.step}</div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--text-1)]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--text-2)]">{card.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-20 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div data-reveal className={cn("rounded-[36px] p-8", cosmicPanel)}>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">Why teams choose ConvoLink</div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-1)]">
                  Faster coordination starts with a simpler communication stack.
                </h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Rooms + DMs", "Public channels and direct conversations in one workspace"],
                    ["Live sync", "Real-time updates keep teams aligned as messages arrive"],
                    ["Built-in calls", "Switch from typing to live discussion without leaving the app"],
                  ].map(([value, label]) => (
                    <div key={label} className={cn("rounded-[26px] p-4", cosmicInset)}>
                      <div className="text-3xl font-semibold text-[color:var(--text-1)]">{value}</div>
                      <div className="mt-2 text-sm leading-6 text-[color:var(--text-2)]">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                data-reveal
                className="rounded-[36px] border border-cyan-200/12 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,rgba(9,17,36,0.92),rgba(5,10,23,0.88))] p-8 text-white shadow-[0_34px_100px_-44px_rgba(2,6,23,0.82)]"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Explore ConvoLink</div>
                <div className="mt-4 space-y-4">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-[24px] border border-white/12 bg-white/6 px-5 py-4 text-sm font-semibold transition hover:border-cyan-300/28 hover:bg-white/10"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-200/88">
                  Product overview, use cases, common questions, and contact options are all kept close so visitors can evaluate the workspace quickly.
                </p>
              </div>
            </div>
          </section>

          <section id="faq" className="px-4 py-20 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.86fr_1.14fr]">
              <div data-reveal className={cn("rounded-[36px] p-8", cosmicPanel)}>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-text)]">FAQ</div>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-1)] sm:text-5xl">
                  Common questions about the team chat workspace.
                </h2>
                <p className="mt-4 text-base leading-8 text-[color:var(--text-2)]">
                  These answers help visitors understand where ConvoLink fits before they create an account or reach out for onboarding help.
                </p>
              </div>

              <div className="grid gap-4">
                {faqItems.map((item) => (
                  <article key={item.question} data-reveal className={cn("rounded-[32px] p-6", cosmicPanel)}>
                    <h3 className="text-2xl font-semibold tracking-tight text-[color:var(--text-1)]">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--text-2)]">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="contact" className="px-4 py-20 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div data-reveal className={cn("rounded-[36px] p-8", cosmicPanel)}>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/22 bg-[rgba(8,18,40,0.74)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Contact
                </div>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-1)]">
                  Talk to the team about onboarding, fit, or feature questions.
                </h2>
                <p className="mt-4 text-base leading-8 text-[color:var(--text-2)]">
                  Use this form for implementation questions, onboarding help, partnership ideas, or feedback about the collaboration workspace. Submissions are stored through Convex.
                </p>
                <div className={cn("mt-8 rounded-[28px] p-5", cosmicInset)}>
                  <div className="flex items-center gap-3">
                    <MessageSquareMore className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                    <div className="text-sm font-semibold text-[color:var(--text-1)]">Structured product inquiries</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--text-2)]">
                    Name, email, subject, and message are saved in a structured way so follow-up can happen without repeating the same setup questions.
                  </p>
                </div>
              </div>

              <motion.form
                data-reveal
                onSubmit={handleContactSubmit}
                className={cn("rounded-[36px] p-8", cosmicPanel)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Name</span>
                    <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Your name" required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Email</span>
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                </div>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Subject</span>
                  <Input value={contactSubject} onChange={(event) => setContactSubject(event.target.value)} placeholder="What do you need help with?" />
                </label>
                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-text)]">Message</span>
                  <Textarea
                    value={contactMessage}
                    onChange={(event) => setContactMessage(event.target.value)}
                    placeholder="Tell us what you are trying to solve."
                    required
                  />
                </label>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-7 text-[color:var(--text-2)]">
                    Expect direct, product-focused replies. Keep the message specific so the first answer can be useful.
                  </p>
                  <Button type="submit" size="lg" disabled={submitting} className="min-w-44">
                    {submitting ? "Sending..." : "Send query"}
                  </Button>
                </div>
              </motion.form>
            </div>
          </section>
        </main>
      </motion.div>

      {showStickyCta ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] px-4">
          <div className="mx-auto flex max-w-xl justify-center">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-cyan-200/16 bg-[rgba(7,14,31,0.86)] px-4 py-3 shadow-[0_24px_60px_-36px_rgba(2,6,23,0.82)] backdrop-blur-2xl">
              <div className="hidden text-sm font-medium text-[color:var(--text-2)] sm:block">
                Ready to move from the landing page into the workspace?
              </div>
              <Link href={ctaHref}>
                <Button size="sm">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
