import { NoticeInbox } from "@/components/portal/NoticeInbox";
import type { NotificationRecipient } from "@/lib/api/domain-contracts";
import { serverListPage } from "@/lib/api/pagination";
import { paginationProps, type ListPageProps } from "@/lib/pagination";
import { requireActor } from "@/lib/auth/session";

export default async function NoticesPage({ searchParams }: ListPageProps) {
  await requireActor();
  const query = await searchParams ?? {};
  const inbox = await serverListPage<NotificationRecipient>("/api/notification-recipients/me?channel=IN_APP", query);
  return <NoticeInbox key={inbox.page} initialNotices={inbox.content} pagination={paginationProps(inbox, query)} />;
}
