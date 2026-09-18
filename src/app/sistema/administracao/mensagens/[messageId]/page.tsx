import { ContactMessageDetails } from "@/components/portal/ContactMessageDetails";
import type { ContactMessage } from "@/lib/api/domain-contracts";
import { serverApiGet } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

export default async function ContactMessagePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  await requireCapability("administration:read");
  const { messageId } = await params;
  const message = await serverApiGet<ContactMessage>(
    `/api/contact-messages/${encodeURIComponent(messageId)}`,
  );
  return <ContactMessageDetails initialMessage={message} />;
}
