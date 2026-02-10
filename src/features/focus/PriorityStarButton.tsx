"use client";

import React, { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

type Props =
  | {
      token: string;
      kind: "room";
      room: string;
    }
  | {
      token: string;
      kind: "user";
      otherName: string;
    };

export function PriorityStarButton(props: Props) {
  const setRoomPriority = useMutation(api.priorities.setRoomPriority);
  const setUserPriority = useMutation(api.priorities.setUserPriority);

  const roomPriority = useQuery(
    api.priorities.getRoomPriority,
    props.kind === "room" ? { token: props.token, room: props.room } : "skip"
  );

  const userPriority = useQuery(
    api.priorities.getUserPriority,
    props.kind === "user" ? { token: props.token, otherName: props.otherName } : "skip"
  );

  const isOn = useMemo(() => {
    if (props.kind === "room") return Boolean(roomPriority?.priority);
    return Boolean(userPriority?.priority);
  }, [props.kind, roomPriority?.priority, userPriority?.priority]);

  const label = isOn ? "★" : "☆";

  return (
    <button
      type="button"
      onClick={() => {
        if (props.kind === "room") {
          void setRoomPriority({ token: props.token, room: props.room, priority: !isOn });
        } else {
          void setUserPriority({ token: props.token, otherName: props.otherName, priority: !isOn });
        }
      }}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold shadow-sm backdrop-blur transition " +
        (isOn
          ? "border-indigo-400/20 bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/25"
          : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10")
      }
      aria-label={isOn ? "Priority on" : "Priority off"}
      title={isOn ? "Priority" : "Mark as priority"}
    >
      {label}
    </button>
  );
}
