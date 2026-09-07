import Link from "next/link";
import {
  ActionLink,
  EmptyState,
  MetricLink,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import { can, hasRole, type Actor } from "@/domain/auth";
import type {
  Activity,
  Lesson,
  NotificationRecipient,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime, formatTime } from "@/lib/api/format";

export type DashboardData = {
  lessons: Lesson[];
  activities: Activity[];
  notices: NotificationRecipient[];
  learnerCount: number;
  contractCount: number;
  organizationCount: number;
};

function AccountWithoutRole({ actor }: { actor: Actor }) {
  return (
    <>
      <PageHeader
        eyebrow="Conta e acesso"
        title="Sua conta está ativa"
        description={`Olá, ${actor.shortName}. Sua pessoa e seu e-mail estão vinculados, mas a conta ainda não possui um perfil de acesso.`}
      />
      <Sheet accent>
        <EmptyState
          title="Nenhum perfil atribuído"
          description="A administração do INAT precisa atribuir um dos perfis válidos: administrador, instrutor, aprendiz ou gestor de empresa."
          icon="shield"
        />
      </Sheet>
    </>
  );
}

export function DashboardView({ actor, data }: { actor: Actor; data: DashboardData }) {
  if (actor.roles.length === 0) return <AccountWithoutRole actor={actor} />;

  const learner = hasRole(actor, "LEARNER");
  const manager = hasRole(actor, "EMPLOYER_MANAGER");
  const instructor = hasRole(actor, "INSTRUCTOR");
  const upcomingLessons = [...data.lessons]
    .filter((lesson) => lesson.status !== "CANCELLED")
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    .slice(0, 5);
  const unread = data.notices.filter((notice) => !notice.readAt);
  const pendingActivities = data.activities.filter((activity) =>
    ["DRAFT", "PUBLISHED"].includes(activity.status),
  );

  return (
    <>
      <PageHeader
        eyebrow="Central do dia"
        title={manager ? "Visão da organização" : learner ? "Meu percurso" : instructor ? "Minhas aulas" : "Operação do INAT"}
        description={`Olá, ${actor.shortName}. Estes dados foram carregados do backend para o seu perfil.`}
        action={can(actor, "agenda:read") ? <ActionLink href="/sistema/agenda" variant="secondary" icon="calendar">Ver agenda</ActionLink> : undefined}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {manager ? (
          <>
            <MetricLink href="/sistema/organizacoes" value={String(data.organizationCount).padStart(2, "0")} label="Organizações acessíveis" detail="Vínculos ativos da sua pessoa" />
            <MetricLink href="/sistema/aprendizes" value={String(data.learnerCount).padStart(2, "0")} label="Aprendizes vinculados" detail="Derivados dos contratos acessíveis" tone="clay" />
            <MetricLink href="/sistema/contratos" value={String(data.contractCount).padStart(2, "0")} label="Contratos" detail="Contratos das organizações vinculadas" tone="ink" />
          </>
        ) : (
          <>
            <MetricLink href="/sistema/aulas" value={String(data.lessons.length).padStart(2, "0")} label="Aulas acessíveis" detail="Inclui o histórico retornado pela API" />
            <MetricLink href="/sistema/atividades" value={String(pendingActivities.length).padStart(2, "0")} label="Atividades abertas" detail="Rascunhos e publicadas" tone="clay" />
            <MetricLink href="/sistema/avisos" value={String(unread.length).padStart(2, "0")} label="Avisos não lidos" detail="Canal interno da sua caixa" tone="ink" />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Sheet>
          <SectionHeading title="Próximas aulas" description="Ordenadas pela data informada pela API" icon="calendar" />
          {upcomingLessons.length ? (
            <div className="divide-y divide-[var(--inat-line)]">
              {upcomingLessons.map((lesson) => (
                <Link key={lesson.id} href={`/sistema/aulas/${lesson.id}`} className="group grid gap-3 p-4 hover:bg-[var(--inat-mist)]/35 sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:px-5">
                  <div><p className="font-mono text-sm font-semibold">{formatTime(lesson.startsAt)}</p><p className="mt-1 text-[0.625rem] text-[var(--inat-muted)]">{formatDateTime(lesson.startsAt)}</p></div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold group-hover:text-[var(--inat-teal-dark)]">{lesson.title}</p><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">Turma {lesson.cohortId} · {apiLabel(lesson.deliveryMode)}</p></div>
                  <StatusMark>{apiLabel(lesson.status)}</StatusMark>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Nenhuma aula disponível" description="A API não retornou aulas para este perfil." icon="calendar" />}
        </Sheet>

        <Sheet>
          <SectionHeading title="Avisos não lidos" icon="bell" action={<Link href="/sistema/avisos" className="text-xs font-semibold text-[var(--inat-teal-dark)]">Ver caixa</Link>} />
          {unread.length ? (
            <div className="divide-y divide-[var(--inat-line)]">{unread.slice(0, 4).map((notice) => <Link key={notice.id} href="/sistema/avisos" className="block p-4 hover:bg-[var(--inat-mist)]/35 sm:p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold leading-5">{notice.title}</p><StatusMark tone={["HIGH", "URGENT"].includes(notice.priority) ? "danger" : "neutral"}>{apiLabel(notice.priority)}</StatusMark></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--inat-muted)]">{notice.message}</p></Link>)}</div>
          ) : <EmptyState title="Nenhum aviso não lido" description="Sua caixa interna está em dia." icon="check" />}
        </Sheet>
      </div>
    </>
  );
}
