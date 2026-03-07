"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart3, CalendarDays, ChartNoAxesCombined, Layers3, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

type DashboardStats = {
  kpis: {
    messages7d: number;
    filesShared7d: number;
    activeRooms7d: number;
    groupsJoined: number;
    pendingInvites: number;
    priorityTargets: number;
    activeDays7d: number;
  };
  weeklyVolume: Array<{ label: string; count: number }>;
  topRooms: Array<{ room: string; label: string; count: number }>;
  activityScore: number;
  sampledMessages: number;
};

type Props = {
  name: string;
  stats: DashboardStats | null | undefined;
};

function AreaChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const { points, areaPath, linePath, maxValue } = useMemo(() => {
    const width = 560;
    const height = 220;
    const paddingX = 24;
    const paddingY = 20;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const safeData = data.length > 0 ? data : [{ label: "-", count: 0 }];
    const max = Math.max(1, ...safeData.map((d) => d.count));

    const computed = safeData.map((item, index) => {
      const ratioX = safeData.length <= 1 ? 0 : index / (safeData.length - 1);
      const x = paddingX + ratioX * chartWidth;
      const y = paddingY + chartHeight - (item.count / max) * chartHeight;
      return { ...item, x, y };
    });

    const line = computed
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");

    const area = `${line} L${paddingX + chartWidth},${paddingY + chartHeight} L${paddingX},${paddingY + chartHeight} Z`;

    return {
      points: computed,
      linePath: line,
      areaPath: area,
      maxValue: max,
    };
  }, [data]);

  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(237,243,251,0.82)] p-3">
      <svg viewBox="0 0 560 220" className="h-52 w-full" role="img" aria-label="Weekly activity chart">
        <defs>
          <linearGradient id="profile-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(14,165,233,0.34)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0.04)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#profile-area-gradient)" />
        <path d={linePath} fill="none" stroke="rgba(14,165,233,0.95)" strokeWidth="3" strokeLinecap="round" />

        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="rgba(14,165,233,0.94)" />
            <text x={point.x} y={205} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
              {point.label}
            </text>
          </g>
        ))}

        <text x="24" y="20" className="fill-slate-500 text-[11px] font-semibold uppercase tracking-[0.2em]">
          Peak {maxValue}
        </text>
      </svg>
    </div>
  );
}

function RoomBars({ data }: { data: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.count));

  if (data.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:rgba(236,243,251,0.72)] px-4 py-6 text-sm text-[color:var(--text-3)]">
        No room activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = Math.max(8, Math.round((item.count / max) * 100));
        return (
          <div key={`${item.label}-${item.count}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="truncate font-semibold text-[color:var(--text-2)]">{item.label}</div>
              <div className="shrink-0 text-xs font-medium text-[color:var(--text-3)]">{item.count}</div>
            </div>
            <div className="h-2.5 rounded-full bg-cyan-100/70">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${width}%` }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.48, ease: [0.2, 0.8, 0.2, 1] }}
                className="h-full rounded-full bg-linear-to-r from-cyan-500 to-sky-500"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProfileDashboard({ name, stats }: Props) {
  const kpis = [
    {
      label: "Messages (7d)",
      value: stats?.kpis.messages7d ?? 0,
      icon: ChartNoAxesCombined,
      hint: "Conversation output",
    },
    {
      label: "Files shared",
      value: stats?.kpis.filesShared7d ?? 0,
      icon: Layers3,
      hint: "Attachments in the last week",
    },
    {
      label: "Active rooms",
      value: stats?.kpis.activeRooms7d ?? 0,
      icon: Activity,
      hint: "Unique rooms touched",
    },
    {
      label: "Groups joined",
      value: stats?.kpis.groupsJoined ?? 0,
      icon: CalendarDays,
      hint: "Member spaces",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.44, ease: [0.2, 0.9, 0.2, 1] }}
      className="mb-4 space-y-4"
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary">Profile dashboard</Badge>
            <CardTitle className="mt-2">{name}&apos;s activity insights</CardTitle>
            <CardDescription>
              Fast, lightweight analytics generated from indexed chat/group data.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Score: {stats?.activityScore ?? 0}/100</Badge>
            <Badge variant="outline">Sampled: {stats?.sampledMessages ?? 0} msgs</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.32, delay: index * 0.05 }}
                className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:rgba(216,228,243,0.82)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-text)]">
                    {item.label}
                  </div>
                  <Icon className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--text-1)]">
                  {item.value}
                </div>
                <div className="mt-1 text-xs text-[color:var(--text-3)]">{item.hint}</div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline">Weekly trend</Badge>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-700" aria-hidden="true" />
              Message activity over the last 7 days
            </CardTitle>
            <CardDescription>Scroll-safe animations with a pure SVG area chart (no extra chart dependency).</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart data={stats?.weeklyVolume ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="outline">Top rooms</Badge>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-700" aria-hidden="true" />
              Where you contribute most
            </CardTitle>
            <CardDescription>
              Pending invites: {stats?.kpis.pendingInvites ?? 0} · Priority targets: {stats?.kpis.priorityTargets ?? 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoomBars data={stats?.topRooms ?? []} />
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}
