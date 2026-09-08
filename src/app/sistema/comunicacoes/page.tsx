import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { NotificationComposer } from "@/components/portal/NotificationComposer";
import { DeliveryFailures } from "@/components/portal/DeliveryFailures";
import { requireCapability } from "@/lib/auth/session";
import type { UserResponse } from "@/lib/api/contracts";
import type {
  Cohort,
  Notification,
  NotificationRecipient,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";
import { serverApiAll } from "@/lib/api/server";

export default async function CommunicationsPage() {
  await requireCapability("communications:manage");
  const [notifications, recipients, users, cohorts] = await Promise.all([
    serverApiAll<Notification>("/api/notifications"),
    serverApiAll<NotificationRecipient>("/api/notification-recipients"),
    serverApiAll<UserResponse>("/api/users"),
    serverApiAll<Cohort>("/api/cohorts"),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user.displayName]));
  const cohortMap = new Map(cohorts.map((cohort) => [cohort.id, cohort.code]));
  const records = notifications.map((notification) => {
    const deliveries = recipients.filter(
      (recipient) => recipient.notificationId === notification.id,
    );
    const channels = [...new Set(deliveries.map((recipient) => apiLabel(recipient.channel)))];
    const failed = deliveries.filter((recipient) => recipient.deliveryStatus === "FAILED").length;
    const delivered = deliveries.filter((recipient) =>
      ["SENT", "DELIVERED"].includes(recipient.deliveryStatus),
    ).length;
    const target = notification.audience.targetId;
    const audience =
      notification.audience.type === "ALL"
        ? "Todos"
        : notification.audience.type === "USER"
          ? userMap.get(target ?? "") ?? target ?? "Usuário"
          : cohortMap.get(target ?? "") ?? target ?? "Turma";

    return {
      id: notification.id,
      title: notification.title,
      audience,
      channels: channels.join(" + ") || "—",
      scheduled: formatDateTime(notification.scheduledAt ?? notification.createdAt),
      delivery: failed ? `${failed} falha(s)` : `${delivered}/${deliveries.length} processados`,
      state: apiLabel(notification.priority),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Comunicação"
        title="Mensagens e entregas"
        description="Notificações internas e por e-mail, com público obrigatório e estado real de entrega."
        action={
          <NotificationComposer
            users={users.map((user) => ({ id: user.id, label: user.displayName }))}
            cohorts={cohorts.map((cohort) => ({ id: cohort.id, label: `${cohort.code} · ${cohort.name}` }))}
          />
        }
      />
      <DataList
        records={records}
        itemLabel="comunicação"
        searchPlaceholder="Buscar título ou público"
        emptyDescription="Nenhuma notificação foi criada no backend."
        columns={[
          { key: "title", label: "Mensagem", primary: true },
          { key: "audience", label: "Público" },
          { key: "channels", label: "Canais" },
          { key: "scheduled", label: "Agendamento", hideBelow: "lg" },
          { key: "delivery", label: "Entrega", hideBelow: "lg" },
          { key: "state", label: "Prioridade" },
        ]}
      />
      <DeliveryFailures
        recipients={recipients.filter((recipient) => recipient.deliveryStatus === "FAILED")}
        userNames={Object.fromEntries(users.map((user) => [user.id, user.displayName]))}
      />
    </>
  );
}
