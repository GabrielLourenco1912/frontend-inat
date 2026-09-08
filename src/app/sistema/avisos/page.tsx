import { NoticeInbox } from "@/components/portal/NoticeInbox";
import type { PageResponse } from "@/lib/api/contracts";
import type { NotificationRecipient } from "@/lib/api/domain-contracts";
import { serverApiGet } from "@/lib/api/server";
import { requireActor } from "@/lib/auth/session";

export default async function NoticesPage() {
  await requireActor();
  const inbox = await serverApiGet<PageResponse<NotificationRecipient>>(
    "/api/notification-recipients/me?channel=IN_APP&page=0&size=100",
  );
  return <NoticeInbox initialNotices={inbox.content} />;
}
