"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/src/components/app/page-shell";

const ProfileClient = dynamic(() => import("@/src/features/profile/ProfileClient").then((m) => m.ProfileClient), {
  ssr: false,
  loading: () => <LoadingScreen title="Loading profile..." description="Preparing your account settings and avatar." />,
});

export function ProfileClientOnly() {
  return <ProfileClient />;
}
