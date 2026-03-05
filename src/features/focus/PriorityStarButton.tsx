"use client";

import React, { useMemo } from "react";
import { Star } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/src/components/ui/button";
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

  return (
    <Button
      variant={isOn ? "default" : "outline"}
      size="icon"
      onClick={() => {
        if (props.kind === "room") {
          void setRoomPriority({ token: props.token, room: props.room, priority: !isOn });
        } else {
          void setUserPriority({ token: props.token, otherName: props.otherName, priority: !isOn });
        }
      }}
      aria-label={isOn ? "Priority on" : "Priority off"}
      title={isOn ? "Priority enabled" : "Mark as priority"}
      className={isOn ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300" : undefined}
    >
      <Star className="h-4 w-4" fill={isOn ? "currentColor" : "none"} aria-hidden="true" />
    </Button>
  );
}
