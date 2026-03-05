"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/src/components/app/page-shell";

const SettingsClient = dynamic(
  () => import("@/src/features/settings/SettingsClient").then((m) => m.SettingsClient),
  {
    ssr: false,
    loading: () => <LoadingScreen title="Loading settings..." description="Fetching your personal preferences and controls." />,
  }
);

export function SettingsClientOnly() {
  return <SettingsClient />;
}
