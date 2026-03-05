"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/src/components/app/page-shell";

type Props = {
  slug: string;
};

const GroupRoomClient = dynamic(
  () => import("@/src/features/groups/GroupRoomClient").then((m) => m.GroupRoomClient),
  {
    ssr: false,
    loading: () => <LoadingScreen title="Loading group room..." description="Preparing members, messages, and permissions." />,
  }
);

export function GroupRoomClientOnly({ slug }: Props) {
  return <GroupRoomClient slug={slug} />;
}
