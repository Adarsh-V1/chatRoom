"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Clock3, MessageSquareText, PhoneCall, UsersRound } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { LoadingScreen, PageContainer, PageHeader, PageShell } from "@/src/components/app/page-shell";
import { Badge } from "@/src/components/ui/badge";
import { Button, buttonClassName } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Avatar } from "@/src/features/ui/Avatar";
import { buildCallHref } from "@/src/features/workspace/conversations";
import { WorkspaceChecklist } from "@/src/features/workspace/WorkspaceChecklist";
import { useChatAuth } from "@/src/features/auth/useChatAuth";

function ConversationCard({
  title,
  subtitle,
  href,
  unreadCount,
  priority,
  action,
  avatarUrl,
}: {
  title: string;
  subtitle: string;
  href: string;
  unreadCount: number;
  priority?: boolean;
  action?: React.ReactNode;
  avatarUrl?: string | null;
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="flex min-w-0 flex-1 items-start gap-3">
          {avatarUrl ? <Avatar name={title} url={avatarUrl} size="sm" /> : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">{title}</div>
              {priority ? <Badge variant="warning">Priority</Badge> : null}
              {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : null}
            </div>
            <div className="mt-1 text-sm text-[color:var(--text-3)]">{subtitle}</div>
          </div>
        </Link>
        {action}
      </div>
    </div>
  );
}

export function WorkspaceHomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useChatAuth();
  const home = useQuery(api.workspace.getHome, auth.isLoggedIn ? { token: auth.token ?? "" } : "skip");
  const completeOnboarding = useMutation(api.workspace.completeOnboarding);
  const markOnboardingSeen = useMutation(api.workspace.markOnboardingSeen);
  const [completing, setCompleting] = useState(false);
  const [hasRedirectedResume, setHasRedirectedResume] = useState(false);

  useEffect(() => {
    if (!auth.isLoggedIn || !auth.token || !home) return;
    if (home.onboardingSeenAt) return;
    void markOnboardingSeen({ token: auth.token });
  }, [auth.isLoggedIn, auth.token, home, markOnboardingSeen]);

  useEffect(() => {
    if (!home || hasRedirectedResume) return;
    if (searchParams.get("resume") !== "1") return;
    if (!home.onboardingCompletedAt || !home.lastVisited?.route) return;

    setHasRedirectedResume(true);
    router.replace(home.lastVisited.route);
  }, [hasRedirectedResume, home, router, searchParams]);

  const firstSuggestedContact = useMemo(
    () => home?.suggestedContacts?.[0] ?? null,
    [home?.suggestedContacts]
  );

  if (!auth.isReady || home === undefined) {
    return (
      <LoadingScreen
        title="Loading inbox..."
        description="Pulling together unread counts, active calls, groups, and conversation history."
      />
    );
  }

  const showChecklist = !home.onboardingCompletedAt;

  return (
    <PageShell>
      <PageContainer>
        <PageHeader
          eyebrow="Inbox"
          title="Workspace home"
          description="One place to resume the right conversation instead of reopening a generic chat room every time."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{home.stats.unreadTotal} unread</Badge>
              <Button variant="outline" onClick={() => router.push("/chat/general")}>
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                Open general
              </Button>
            </div>
          }
        />

        {showChecklist ? (
          <div className="mb-4">
            <WorkspaceChecklist
              hasSuggestedContact={Boolean(firstSuggestedContact)}
              onOpenGeneral={() => router.push("/chat/general")}
              onStartDirectMessage={() => {
                if (!firstSuggestedContact) return;
                router.push(firstSuggestedContact.route);
              }}
              onBrowseGroups={() => router.push("/groups")}
              onTakeTour={() => router.push("/chat/general?tour=1")}
              onComplete={async () => {
                if (!auth.token || completing) return;
                setCompleting(true);
                try {
                  await completeOnboarding({ token: auth.token });
                } finally {
                  setCompleting(false);
                }
              }}
              completing={completing}
            />
          </div>
        ) : null}

        {!showChecklist && !home.lastVisited ? (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Choose where to start</CardTitle>
              <CardDescription>
                Open the general room, start a direct message, browse groups, or jump into an active call.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Button size="lg" onClick={() => router.push("/chat/general")}>
                Open general
              </Button>
              <Button size="lg" variant="outline" onClick={() => firstSuggestedContact && router.push(firstSuggestedContact.route)} disabled={!firstSuggestedContact}>
                Start a DM
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/groups")}>
                Browse groups
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const active = home.activeCalls[0];
                  if (!active) return;
                  router.push(buildCallHref(active.roomId, active.conversation.route));
                }}
                disabled={home.activeCalls.length === 0}
              >
                Resume a call
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            {home.lastVisited ? (
              <Card>
                <CardHeader>
                  <Badge variant="outline">Resume</Badge>
                  <CardTitle>Last visited conversation</CardTitle>
                  <CardDescription>We keep this server-side so you can resume from any device.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConversationCard
                    title={home.lastVisited.title}
                    subtitle={home.lastVisited.subtitle}
                    href={home.lastVisited.route}
                    unreadCount={home.lastVisited.unreadCount}
                    priority={home.lastVisited.priority}
                    action={
                      <Link href={home.lastVisited.route} className={buttonClassName("secondary", "sm")}>
                        Resume
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    }
                  />
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <Badge variant="secondary">Core</Badge>
                <CardTitle>Priority conversations</CardTitle>
                <CardDescription>Unread and starred destinations stay near the top of the inbox.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ConversationCard
                  title={home.general.title}
                  subtitle={home.general.subtitle}
                  href={home.general.route}
                  unreadCount={home.general.unreadCount}
                  priority={home.general.priority}
                />
                {home.priorityConversations.length > 0 ? (
                  home.priorityConversations
                    .filter((conversation) => conversation.route !== home.general.route)
                    .map((conversation) => (
                      <ConversationCard
                        key={conversation.route}
                        title={conversation.title}
                        subtitle={conversation.subtitle}
                        href={conversation.route}
                        unreadCount={conversation.unreadCount}
                        priority={conversation.priority}
                        avatarUrl={"avatarUrl" in conversation ? conversation.avatarUrl : null}
                      />
                    ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">
                    Nothing is starred yet. Use priority toggles in direct threads or rooms to pin key conversations here.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <Badge variant="secondary">Direct</Badge>
                  <CardTitle>Direct threads</CardTitle>
                  <CardDescription>Each person now has a dedicated route instead of only sidebar state.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {home.directThreads.length > 0 ? (
                    home.directThreads.map((thread) => (
                      <ConversationCard
                        key={thread.route}
                        title={thread.title}
                        subtitle={thread.subtitle}
                        href={thread.route}
                        unreadCount={thread.unreadCount}
                        priority={thread.priority}
                        avatarUrl={thread.avatarUrl}
                      />
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">
                      No direct threads yet. Use the quick contact cards to start the first one.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Badge variant="secondary">Groups</Badge>
                  <CardTitle>Joined groups</CardTitle>
                  <CardDescription>Group rooms remain separate routes but now appear in the shared inbox.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {home.groups.length > 0 ? (
                    home.groups.map((group) => (
                      <ConversationCard
                        key={group.route}
                        title={group.title}
                        subtitle={`${group.subtitle} · ${group.memberRole}`}
                        href={group.route}
                        unreadCount={group.unreadCount}
                        priority={group.priority}
                      />
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">
                      You have not joined any groups yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <Badge variant="outline">People</Badge>
                <CardTitle>Start a direct message</CardTitle>
                <CardDescription>Suggested contacts provide a faster first step than opening a blank room.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {home.suggestedContacts.map((contact) => (
                  <div
                    key={contact.route}
                    className="flex items-center justify-between gap-3 rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={contact.name} url={contact.avatarUrl} size="sm" />
                      <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">{contact.name}</div>
                    </div>
                    <Link href={contact.route} className={buttonClassName("secondary", "sm")}>
                      Message
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">Calls</Badge>
                <CardTitle>Active calls</CardTitle>
                <CardDescription>Calls keep their originating conversation so leaving the room returns you to context.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {home.activeCalls.length > 0 ? (
                  home.activeCalls.map((call) => (
                    <div
                      key={call.roomId}
                      className="rounded-[24px] border border-[color:var(--brand-border)] bg-[color:var(--surface-3)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[color:var(--text-1)]">
                            {call.conversation.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--text-3)]">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                            Started by {call.startedByName}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(buildCallHref(call.roomId, call.conversation.route))}
                        >
                          <PhoneCall className="h-4 w-4" aria-hidden="true" />
                          Join
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">
                    No calls are active right now.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge variant="outline">Invites</Badge>
                <CardTitle>Pending group invites</CardTitle>
                <CardDescription>Accept invites from here or on the groups page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {home.pendingInvites.length > 0 ? (
                  home.pendingInvites.filter(Boolean).map((invite) => (
                    <div
                      key={`${invite.groupSlug}-${invite.createdAt}`}
                      className="flex items-center justify-between gap-3 rounded-[24px] border border-[color:var(--border-1)] bg-[color:var(--surface-2)] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--text-1)]">{invite.groupName}</div>
                        <div className="text-sm text-[color:var(--text-3)]">/{invite.groupSlug}</div>
                      </div>
                      <Link href={invite.route} className={buttonClassName("secondary", "sm")}>
                        <UsersRound className="h-4 w-4" aria-hidden="true" />
                        Open
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[color:var(--border-1)] bg-[color:var(--muted-surface)] px-4 py-6 text-sm text-[color:var(--text-3)]">
                    No pending invites.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
