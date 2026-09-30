import { relatedRecords } from "@/lib/api/related";
import { DetailLinksList } from "@/components/design-system/DetailLinksList";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CohortEnrollmentManager } from "@/components/portal/CohortEnrollmentManager";
import { CohortLifecycleManager } from "@/components/portal/LifecycleManagers";
import {
  DefinitionList,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import type {
  Cohort,
  CohortEnrollment,
  Contract,
  Learner,
  Lesson,
  Organization,
  Person,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime, formatPeriod } from "@/lib/api/format";
import { serverApiAll, serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

const weekdays = ["—", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ cohortId: string }>;
}) {
  const [, { cohortId }] = await Promise.all([
    requireCapability("cohorts:read"),
    params,
  ]);
  const cohort = await serverApiGetOrNull<Cohort>(
    `/api/cohorts/${encodeURIComponent(cohortId)}`,
  );
  if (!cohort) notFound();

  const [allEnrollments, allLessons] = await Promise.all([
    serverApiAll<CohortEnrollment>("/api/cohort-enrollments"),
    serverApiAll<Lesson>("/api/lessons"),
  ]);
  const enrollments = allEnrollments.filter((item) => item.cohortId === cohort.id);
  const contracts = await relatedRecords<Contract>("contracts", enrollments.map((item) => item.contractId));
  const [learners, organizations] = await Promise.all([
    relatedRecords<Learner>("learners", contracts.map((item) => item.learnerId)),
    relatedRecords<Organization>("organizations", contracts.map((item) => item.employerId)),
  ]);
  const people = await relatedRecords<Person>("people", learners.map((item) => item.personId));
  const lessons = allLessons
    .filter((lesson) => lesson.cohortId === cohort.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const personMap = new Map(people.map((person) => [person.id, person.fullName]));
  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]));
  const organizationMap = new Map(
    organizations.map((organization) => [organization.id, organization.tradeName || organization.legalName]),
  );
  const contractOptions = contracts.map((contract) => {
    const learner = learnerMap.get(contract.learnerId);
    const name = learner ? personMap.get(learner.personId) || learner.registrationNumber : contract.learnerId;
    return {
      contract,
      label: `${name} · ${organizationMap.get(contract.employerId) ?? contract.employerId}`,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow={cohort.code}
        title={cohort.name}
        description={`${weekdays[cohort.defaultWeekday] ?? cohort.defaultWeekday} · ${cohort.shiftCode} · ${formatPeriod(cohort.startDate, cohort.endDate)}`}
        backHref="/sistema/turmas"
        backLabel="Voltar para turmas"
        action={<StatusMark>{apiLabel(cohort.status)}</StatusMark>}
      />
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Sheet>
          <SectionHeading title="Informações da turma" icon="layers" />
          <DefinitionList columns={1} items={[
            { label: "Código", value: cohort.code, mono: true },
            { label: "Nome", value: cohort.name },
            { label: "Agenda padrão", value: `${weekdays[cohort.defaultWeekday] ?? cohort.defaultWeekday} · ${cohort.shiftCode}` },
            { label: "Período", value: formatPeriod(cohort.startDate, cohort.endDate) },
            { label: "Matrículas", value: String(enrollments.length) },
            { label: "Capacidade", value: cohort.maxLearners == null ? "Sem limite" : String(cohort.maxLearners) },
            { label: "Situação", value: <StatusMark>{apiLabel(cohort.status)}</StatusMark> },
          ]} />
        </Sheet>
        <Sheet>
          <SectionHeading title="Aulas" icon="calendar" action={<Link href="/sistema/agenda" className="text-xs font-semibold text-[var(--inat-teal-dark)]">Abrir agenda</Link>} />
          <DetailLinksList items={lessons.map((lesson) => ({ id: lesson.id, href: `/sistema/aulas/${lesson.id}`, title: lesson.title,
            description: `${formatDateTime(lesson.startsAt)} · ${apiLabel(lesson.deliveryMode)}`, status: lesson.status }))}
            itemLabel="aula" itemPlural="aulas" searchPlaceholder="Buscar aula ou modalidade"
            emptyTitle="Nenhuma aula planejada" emptyDescription="Esta turma ainda não possui aulas no backend." emptyIcon="calendar" />
        </Sheet>
      </div>
      <div className="mt-5"><CohortLifecycleManager cohort={cohort} today={today} hasOpenLessons={lessons.some((lesson) => lesson.status === "SCHEDULED" || lesson.status === "IN_PROGRESS")} reservedCount={enrollments.filter((enrollment) => enrollment.status === "PENDING" || enrollment.status === "ACTIVE").length} /></div>
      <div className="mt-5"><CohortEnrollmentManager cohort={cohort} enrollments={enrollments} contractOptions={contractOptions} today={today} /></div>
    </>
  );
}
