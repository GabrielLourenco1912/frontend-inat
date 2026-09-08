import { AgendaView } from "@/components/portal/AgendaView";
import { can } from "@/domain/auth";
import { requireCapability } from "@/lib/auth/session";
import { accessibleLessons } from "@/lib/portal/data";

export default async function AgendaPage() {
  const actor = await requireCapability("agenda:read");
  const lessons = await accessibleLessons(actor);
  return <AgendaView lessons={lessons} canManage={can(actor, "lessons:manage")} />;
}
