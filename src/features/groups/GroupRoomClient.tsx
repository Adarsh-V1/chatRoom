"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Crown, PhoneCall, Send, UserPlus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { CenteredState, LoadingScreen, PageContainer, PageHeader, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { ChatFeed } from "@/src/features/chat/chatFeed";
import { ChatForm } from "@/src/features/chat/chatForm";
import { useChatAuth } from "@/src/features/auth/useChatAuth";
import { buildCallHref, buildGroupConversationRef } from "@/src/features/workspace/conversations";

const GROUP_ROOM_PREFIX = "group:";

type Props = {
  slug: string;
};

export function GroupRoomClient({ slug }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useChatAuth();
  const token = auth.token ?? "";
  const joinGroup = useMutation(api.groups.joinGroup);
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const inviteMember = useMutation(api.groups.inviteMember);
  const startCall = useMutation(api.calls.startCall);
  const endCall = useMutation(api.calls.endCall);
  const saveLastVisited = useMutation(api.workspace.saveLastVisited);

  const group = useQuery(api.groups.getGroupBySlug, { slug });
  const membership = useQuery(api.groups.getMyMembership, auth.isLoggedIn && group ? { token, groupId: group._id } : "skip");
  const invite = useQuery(api.groups.getMyInviteForGroup, auth.isLoggedIn && group ? { token, groupId: group._id } : "skip");
  const members = useQuery(api.groups.listGroupMembers, auth.isLoggedIn && group ? { token, groupId: group._id } : "skip");
  const activeCall = useQuery(
    api.calls.getActiveCall,
    auth.isLoggedIn && group ? { token, conversationId: `${GROUP_ROOM_PREFIX}${group.slug}` } : "skip"
  );

  const [inviteName, setInviteName] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const room = useMemo(() => `${GROUP_ROOM_PREFIX}${group?.slug ?? slug}`, [group?.slug, slug]);
  const canJoin = Boolean(group && (group.isPublic || invite));
  const isOwner = membership?.role === "owner";

  useEffect(() => {
    if (!auth.isLoggedIn || !token || !group) return;
    void saveLastVisited({
      token,
      conversationRef: buildGroupConversationRef(group.name, group.slug),
    });
  }, [auth.isLoggedIn, group, saveLastVisited, token]);

  if (!auth.isReady) {
    return <LoadingScreen title="Loading group room..." description="Checking access and bringing in recent messages." />;
  }

  if (group === null) {
    return (
      <CenteredState
        title="Group not found"
        description="The link may be outdated, the slug may be wrong, or the room has been removed."
        action={<Button variant="outline" onClick={() => router.push("/groups")}>Back to groups</Button>}
      />
    );
  }

  if (!group) {
    return <LoadingScreen title="Loading group details..." description="Preparing permissions, members, and room context." />;
  }

  if (!membership) {
    return (
      <CenteredState
        title={group.name}
        description={group.description ?? `${group.isPublic ? "Public" : "Private"} group · /${group.slug}`}
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push("/groups")}>Back</Button>
            <Button disabled={!canJoin} onClick={async () => await joinGroup({ token, groupId: group._id })}>
              {canJoin ? "Join group" : "Invite required"}
            </Button>
          </div>
        }
      />
    );
  }

  const joinOrStartCall = async () => {
    if (!group) return;

    if (activeCall?.roomId) {
      router.push(buildCallHref(activeCall.roomId, pathname));
      return;
    }

    const result = await startCall({ token, conversationId: room });
    router.push(buildCallHref(result.roomId, pathname));
  };

  const isCallStarter = Boolean(
    activeCall?.startedByName && auth.name && activeCall.startedByName.trim().toLowerCase() === auth.name.trim().toLowerCase()
  );

  return (
    <PageShell className="flex h-[calc(100dvh-var(--app-header-height))] min-h-0 flex-col overflow-hidden">
      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          eyebrow="Group room"
          title={group.name}
          description={group.description ?? `Collaborate in /${group.slug} with shared messages and member access controls.`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={group.isPublic ? "success" : "secondary"}>{group.isPublic ? "Public" : "Private"}</Badge>
              <Badge variant="outline">/{group.slug}</Badge>
              <Button variant="secondary" size="sm" onClick={joinOrStartCall}>
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                {activeCall?.roomId ? "Join call" : "Start call"}
              </Button>
            </div>
          }
        />

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <Card className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-[color:var(--border-1)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Conversation</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[color:var(--text-2)]">
                  <span>{members?.length ?? 0} members</span>
                  {isOwner ? <Badge variant="warning">Owner</Badge> : <Badge variant="outline">{membership.role}</Badge>}
                  {activeCall?.roomId ? <Badge variant="secondary">Active call</Badge> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => router.push("/groups")}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Groups
                </Button>
                {!isOwner ? (
                  <Button
                    variant="outline"
                    className="border-rose-300/80 text-rose-700 hover:border-rose-400/80 hover:bg-rose-50/90"
                    onClick={async () => {
                      await leaveGroup({ token, groupId: group._id });
                      router.push("/groups");
                    }}
                  >
                    Leave
                  </Button>
                ) : null}
              </div>
            </div>

            {activeCall?.roomId ? (
              <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[color:var(--brand-border)] bg-[color:var(--surface-3)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => router.push(buildCallHref(activeCall.roomId, pathname))}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-text)]">Active call</div>
                    <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">
                      {activeCall.startedByName ? `Started by ${activeCall.startedByName}` : "A call is already in progress"}
                    </div>
                  </div>
                  <Badge variant="default">Join now</Badge>
                </button>
                {isCallStarter ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (!token) return;
                      void endCall({ token, roomId: activeCall.roomId });
                    }}
                  >
                    End call
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatFeed currentUser={auth.name ?? ""} room={room} token={token} />
              <ChatForm token={token} room={room} />
            </div>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <Badge variant="secondary">Members</Badge>
                <CardTitle>People in this room</CardTitle>
                <CardDescription>Roles update immediately based on ownership and invites.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {members && members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-4)] px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">{member.name}</div>
                        <div className="text-sm text-[color:var(--text-3)]">{member.role}</div>
                      </div>
                      {member.role === "owner" ? <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" /> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">No members yet.</div>
                )}
              </CardContent>
            </Card>

            {isOwner ? (
              <Card>
                <CardHeader>
                  <Badge variant="outline">Invite</Badge>
                  <CardTitle>Add a member</CardTitle>
                  <CardDescription>Invite one username at a time. Existing members are skipped automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Username</span>
                    <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Username" />
                  </label>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      if (!inviteName.trim()) return;
                      setInviteStatus(null);
                      try {
                        const result = await inviteMember({ token, groupId: group._id, userName: inviteName.trim() });
                        setInviteStatus(result.invited ? "Invite sent" : "User already invited");
                        setInviteName("");
                      } catch (err) {
                        setInviteStatus(err instanceof Error ? err.message : "Invite failed");
                      }
                    }}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Send invite
                  </Button>
                  {inviteStatus ? (
                    <div className="rounded-2xl border border-[color:var(--border-1)] bg-[color:var(--surface-4)] px-4 py-3 text-sm text-[color:var(--text-2)]">{inviteStatus}</div>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <Badge variant="outline">Access</Badge>
                  <CardTitle>Member actions</CardTitle>
                  <CardDescription>Owners manage invitations. Members can participate immediately.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full justify-center" onClick={() => router.push("/groups")}>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Browse other groups
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
