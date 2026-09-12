import { relatedRecords } from "@/lib/api/related";
import { paginationProps, type ListPageProps } from "@/lib/pagination";
import { accessibleLessonsPage } from "@/lib/portal/pagination";
import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { LessonCreator } from "@/components/portal/ResourceCreators";
import { can } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import { apiLabel, formatDateTimePeriod } from "@/lib/api/format";
import type { Cohort, Person } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

export default async function LessonsPage({ searchParams }: ListPageProps) {
  const query = await searchParams ?? {};
  const actor = await requireCapability("lessons:read");
  const page = await accessibleLessonsPage(actor, query);
  const lessons = page.content;
  const [cohorts, people] = hasRole(actor, "ADMIN")
    ? await Promise.all([
        relatedRecords<Cohort>("cohorts", lessons.map((lesson) => lesson.cohortId)),
        relatedRecords<Person>("people", lessons.map((lesson) => lesson.instructorPersonId)),
      ])
    : [[], []];
  const cohortNames = new Map(cohorts.map((cohort) => [cohort.id, cohort.code]));
  const personNames = new Map(people.map((person) => [person.id, person.fullName]));
  const records = lessons.map((lesson) => ({
    id: lesson.id,
    href: `/sistema/aulas/${lesson.id}`,
    title: lesson.title,
    schedule: formatDateTimePeriod(lesson.startsAt, lesson.endsAt),
    cohort: cohortNames.get(lesson.cohortId) ?? lesson.cohortId,
    instructor:
      personNames.get(lesson.instructorPersonId) ??
      (lesson.instructorPersonId === actor.personId ? actor.name : lesson.instructorPersonId),
    modality: apiLabel(lesson.deliveryMode),
    state: apiLabel(lesson.status),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Acadêmico"
        title="Aulas e chamada"
        description="Aulas organizadas por data, turma e próxima ação operacional."
        action={can(actor, "lessons:manage") ? <LessonCreator /> : undefined}
      />
      <DataList key={page.page} pagination={paginationProps(page, query)}
        records={records}
        itemLabel="aula"
        searchPlaceholder="Buscar por aula, turma ou instrutor"
        emptyDescription="Nenhuma aula acessível foi encontrada no backend."
        columns={[
          { key: "title", label: "Aula", primary: true },
          { key: "schedule", label: "Data e horário", mono: true },
          { key: "cohort", label: "Turma", mono: true },
          { key: "instructor", label: "Instrutor", hideBelow: "lg" },
          { key: "modality", label: "Modalidade", hideBelow: "lg" },
          { key: "state", label: "Estado" },
        ]}
      />
    </>
  );
}
