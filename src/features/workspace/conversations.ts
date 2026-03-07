export type ConversationKind = "general" | "direct" | "group";

export type ConversationRef = {
  kind: ConversationKind;
  key: string;
  title: string;
  route: string;
  room: string;
};

export function buildGeneralConversationRef(): ConversationRef {
  return {
    kind: "general",
    key: "general",
    title: "General room",
    route: "/chat/general",
    room: "general",
  };
}

export function buildDirectRoom(currentUserName: string, otherUserName: string) {
  return [currentUserName.trim().toLowerCase(), otherUserName.trim().toLowerCase()]
    .sort()
    .join("-");
}

export function buildDirectConversationRef(currentUserName: string, otherUserName: string): ConversationRef {
  const key = otherUserName.trim().toLowerCase();
  return {
    kind: "direct",
    key,
    title: otherUserName.trim(),
    route: `/chat/direct/${encodeURIComponent(otherUserName.trim())}`,
    room: buildDirectRoom(currentUserName, otherUserName),
  };
}

export function buildGroupConversationRef(groupName: string, slug: string): ConversationRef {
  return {
    kind: "group",
    key: slug.trim().toLowerCase(),
    title: groupName.trim(),
    route: `/groups/${encodeURIComponent(slug.trim())}`,
    room: `group:${slug.trim().toLowerCase()}`,
  };
}

export function buildConversationRefFromRoom(room: string, currentUserName: string): ConversationRef | null {
  const trimmed = room.trim();
  if (!trimmed) return null;
  if (trimmed === "general") return buildGeneralConversationRef();
  if (trimmed.startsWith("group:")) {
    const slug = trimmed.slice("group:".length).trim().toLowerCase();
    return buildGroupConversationRef(slug, slug);
  }

  const parts = trimmed
    .toLowerCase()
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;

  const meLower = currentUserName.trim().toLowerCase();
  const other = parts.find((part) => part !== meLower);
  if (!other) return null;

  return buildDirectConversationRef(currentUserName, other);
}

export function buildCallHref(roomId: string, returnTo: string) {
  return `/call/${encodeURIComponent(roomId)}?returnTo=${encodeURIComponent(returnTo)}`;
}
