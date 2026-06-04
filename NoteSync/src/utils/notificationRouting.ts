import { Notification } from "../data/mockData";

export type NotificationTargetTab = "notes" | "proposals" | "comments";

export type NotificationRouteTarget = {
  noteId: string;
  initialTab: NotificationTargetTab;
};

type NotificationLike = {
  type?: Notification["type"];
  data?: {
    noteId?: string;
    initialTab?: NotificationTargetTab;
  };
};

const defaultTabByType: Record<Notification["type"], NotificationTargetTab> = {
  proposal_approved: "proposals",
  proposal_rejected: "proposals",
  comment: "comments",
  locked: "notes",
  proposal_submitted: "proposals",
};

export const resolveNotificationRoute = (
  notification: NotificationLike,
): NotificationRouteTarget | null => {
  const noteId = notification.data?.noteId;
  if (!noteId || !notification.type) {
    return null;
  }

  return {
    noteId,
    initialTab:
      notification.data?.initialTab ?? defaultTabByType[notification.type],
  };
};
