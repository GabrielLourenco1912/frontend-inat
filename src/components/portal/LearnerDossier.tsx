"use client";

import { AttendanceExportButton } from "@/components/portal/AttendanceExportButton";
import { PaginatedContent } from "@/components/design-system/ClientPagination";
import type { Pagination } from "@/lib/pagination";
import Link from "next/link";
import { DetailTabs } from "@/components/portal/DetailTabs";
import { PersonDocumentManager } from "@/components/portal/PersonDocumentManager";
import {
  DefinitionList,
  EmptyState,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import type {
  Activity,
  ActivitySubmission,
  AttendanceRecord,
  Cohort,
  CohortEnrollment,
  Contract,
  DocumentType,
  Learner,
  LearnerGuardian,
  Lesson,
  Organization,
  Person,
  PersonDocument,
} from "@/lib/api/domain-contracts";
import {
  apiLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMinutes,
  formatPeriod,
  maskTaxId,
} from "@/lib/api/format";

type DossierTab =
  | "dados"
  | "responsaveis"
  | "contrato"
  | "turmas"
  | "frequencia"
  | "atividades"
  | "documentos";

type Props = {
  activeTab: string;
  initialDocumentId?: string;
  learner: Learner;
  person: Person | null;
  displayName: string;
  contracts: Contract[];
  organizations: Organization[];
  guardians: LearnerGuardian[];
  enrollments: CohortEnrollment[];
  cohorts: Cohort[];
  lessons: Lesson[];
  attendance: AttendanceRecord[];
  activities: Activity[];
  submissions: ActivitySubmission[];
  documents: PersonDocument[];
  documentPagination?: Pagination;
  focusedDocument?: PersonDocument;
  documentTypes: DocumentType[];
  canSeeDocuments: boolean;
  canSeeSensitiveContract: boolean;
  canSeeGuardians: boolean;
  canManage: boolean;
  canExportAttendance?: boolean;
};

function EmptyPanel({ title, description, icon }: { title: string; description: string; icon: "people" | "briefcase" | "layers" | "calendar" | "clipboard" | "document" }) {
  return <EmptyState title={title} description={description} icon={icon} />;
}

export function LearnerDossier(props: Props) {
  const {
    learner, person, displayName, contracts, organizations, guardians,
    enrollments, cohorts, lessons, attendance, activities, submissions,
    documents, documentTypes, canSeeDocuments, canSeeSensitiveContract,
    canSeeGuardians, canManage, activeTab, initialDocumentId,
  } = props;
  const organizationMap = new Map(organizations.map((item) => [item.id, item.tradeName || item.legalName]));
  const cohortMap = new Map(cohorts.map((item) => [item.id, item]));
  const lessonMap = new Map(lessons.map((item) => [item.id, item]));
  const submissionMap = new Map(submissions.map((item) => [item.activityId, item]));
  const attendanceMap = new Map(attendance.map((item) => [item.lessonId, item]));
  const tabs: { id: DossierTab; label: string }[] = [
    { id: "dados", label: "Dados pessoais" },
    ...(canSeeGuardians ? [{ id: "responsaveis" as const, label: "Responsáveis" }] : []),
    ...(canSeeSensitiveContract ? [{ id: "contrato" as const, label: "Contratos" }] : []),
    { id: "turmas", label: "Turmas" },
    { id: "frequencia", label: "Aulas e frequência" },
    { id: "atividades", label: "Atividades" },
    ...(canSeeDocuments ? [{ id: "documentos" as const, label: "Documentos" }] : []),
  ];
  const tab = tabs.some((item) => item.id === activeTab) ? activeTab : "dados";
  const initials = displayName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <PageHeader
        eyebrow={`Matrícula ${learner.registrationNumber}`}
        title={displayName}
        description={learner.hasCompletedHighSchool ? "Ensino médio concluído" : "Ensino médio em curso"}
        backHref="/sistema/aprendizes"
        backLabel="Voltar para aprendizes"
        action={<StatusMark>{apiLabel(learner.status)}</StatusMark>}
      />

      <div className="mb-5 flex items-center gap-4 border border-[var(--inat-line)] bg-white p-4">
        <span className="grid size-11 place-items-center bg-[var(--inat-ink)] text-sm font-bold text-white">{initials || "AP"}</span>
        <div><StatusMark>{apiLabel(learner.status)}</StatusMark><p className="mt-1.5 font-mono text-xs text-[var(--inat-muted)]">{learner.id}</p></div>
        {canManage ? <span className="ml-auto text-xs text-[var(--inat-muted)]">Cadastro administrável pela equipe INAT</span> : null}
      </div>

      <DetailTabs activeTab={tab} tabs={tabs} label="Seções do dossiê" />

      <div className="mt-5">
        {tab === "dados" ? <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Sheet><SectionHeading title="Identificação e contato" icon="person" /><DefinitionList columns={2} items={person ? [
            { label: "Nome completo", value: person.fullName },
            { label: "CPF", value: maskTaxId(person.taxId), mono: true },
            { label: "Nascimento", value: formatDate(person.birthDate) },
            { label: "E-mail", value: person.contactEmail || "Não informado" },
            { label: "Telefone", value: person.phoneNumber },
            { label: "Gênero", value: person.gender || "Não informado" },
            { label: "Matrícula", value: learner.registrationNumber, mono: true },
            { label: "Escolaridade", value: learner.hasCompletedHighSchool ? "Ensino médio concluído" : "Ensino médio em curso" },
          ] : [
            { label: "Nome da conta", value: displayName },
            { label: "Matrícula", value: learner.registrationNumber, mono: true },
            { label: "Escolaridade", value: learner.hasCompletedHighSchool ? "Ensino médio concluído" : "Ensino médio em curso" },
            { label: "Dados pessoais", value: "Restritos à equipe administrativa" },
          ]} /></Sheet>
          <Sheet accent><SectionHeading title="Endereço" icon="map-pin" />{person ? <DefinitionList columns={1} items={[
            { label: "Logradouro", value: `${person.address.street}, ${person.address.streetNumber}${person.address.addressLine2 ? ` · ${person.address.addressLine2}` : ""}` },
            { label: "Bairro", value: person.address.district },
            { label: "Cidade", value: `${person.address.city}/${person.address.stateCode}` },
            { label: "CEP", value: person.address.postalCode, mono: true },
          ]} /> : <EmptyState title="Endereço protegido" description="O endpoint de pessoa é restrito ao administrador." icon="shield" />}</Sheet>
        </div> : null}

        {tab === "responsaveis" && canSeeGuardians ? <Sheet><SectionHeading title="Responsáveis vinculados" description="Vínculos retornados pelo cadastro do aprendiz." icon="people" />{guardians.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{guardians.map((guardian) => <div key={guardian.guardianPersonId} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"><div><h3 className="text-sm font-semibold">{guardian.guardianName}</h3><p className="mt-1 text-xs text-[var(--inat-muted)]">{guardian.relationshipType}</p></div><div className="flex gap-2">{guardian.primaryContact ? <StatusMark tone="success">Contato principal</StatusMark> : null}{guardian.legalGuardian ? <StatusMark>Responsável legal</StatusMark> : null}</div></div>)}</PaginatedContent></div> : <EmptyPanel title="Nenhum responsável vinculado" description="O backend não retornou responsáveis para este aprendiz." icon="people" />}</Sheet> : null}

        {tab === "contrato" && canSeeSensitiveContract ? <Sheet><SectionHeading title="Contratos de aprendizagem" icon="briefcase" />{contracts.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{contracts.map((contract) => <Link key={contract.id} href={`/sistema/contratos/${contract.id}`} className="grid gap-3 p-4 hover:bg-[var(--inat-mist)]/35 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"><div><p className="text-sm font-semibold">{organizationMap.get(contract.employerId) ?? contract.employerId}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{formatPeriod(contract.startDate, contract.endDate)} · {formatMinutes(contract.weeklyWorkloadMinutes)} · {formatCurrency(contract.monthlySalary)}</p></div><StatusMark>{apiLabel(contract.status)}</StatusMark></Link>)}</PaginatedContent></div> : <EmptyPanel title="Nenhum contrato acessível" description="Não há contrato retornado para este aprendiz e perfil." icon="briefcase" />}</Sheet> : null}

        {tab === "turmas" ? <Sheet><SectionHeading title="Histórico de matrículas" icon="layers" />{enrollments.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{enrollments.map((enrollment) => { const cohort = cohortMap.get(enrollment.cohortId); return <Link key={enrollment.id} href={`/sistema/turmas/${enrollment.cohortId}`} className="flex items-center justify-between gap-4 p-4 hover:bg-[var(--inat-mist)]/35 sm:p-5"><div><p className="font-mono text-xs font-bold">{cohort?.code ?? enrollment.cohortId}</p><p className="mt-1 text-sm font-semibold">{cohort?.name ?? "Turma"}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{formatPeriod(enrollment.startDate, enrollment.endDate)}</p></div><StatusMark>{apiLabel(enrollment.status)}</StatusMark></Link>; })}</PaginatedContent></div> : <EmptyPanel title="Sem matrículas visíveis" description="O backend só expõe a listagem consolidada de matrículas à administração." icon="layers" />}</Sheet> : null}

        {tab === "frequencia" ? <Sheet><SectionHeading title="Aulas e frequência" description={attendance.length ? `${attendance.length} registro(s) de presença disponíveis` : "Sem frequência consolidada disponível para este perfil"} icon="calendar" stackOnMobile action={props.canExportAttendance ? <AttendanceExportButton scope="learners" id={learner.id} /> : undefined} />{lessons.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{lessons.map((lesson) => { const record = attendanceMap.get(lesson.id); return <Link key={lesson.id} href={`/sistema/aulas/${lesson.id}`} className="grid gap-3 p-4 hover:bg-[var(--inat-mist)]/35 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"><div><p className="text-sm font-semibold">{lesson.title}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{formatDateTime(lesson.startsAt)} · {apiLabel(lesson.deliveryMode)}</p></div><StatusMark>{record ? apiLabel(record.status) : apiLabel(lesson.status)}</StatusMark></Link>; })}</PaginatedContent></div> : <EmptyPanel title="Nenhuma aula acessível" description="Não há aulas deste aprendiz disponíveis para o perfil atual." icon="calendar" />}</Sheet> : null}

        {tab === "atividades" ? <Sheet><SectionHeading title="Atividades e entregas" icon="clipboard" />{activities.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{activities.map((activity) => { const submission = submissionMap.get(activity.id); const lesson = lessonMap.get(activity.lessonId); return <Link key={activity.id} href={`/sistema/atividades/${activity.id}`} className="flex items-center gap-4 p-4 hover:bg-[var(--inat-mist)]/35 sm:p-5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{activity.title}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{lesson?.title ?? activity.lessonId} · prazo {formatDateTime(activity.dueAt)}</p></div><StatusMark>{submission ? apiLabel(submission.status) : "Sem entrega"}</StatusMark></Link>; })}</PaginatedContent></div> : <EmptyPanel title="Nenhuma atividade acessível" description="Não há atividades relacionadas às aulas disponíveis." icon="clipboard" />}</Sheet> : null}

        {tab === "documentos" && canSeeDocuments ? person ? <PersonDocumentManager key={`${person.id}:${props.documentPagination?.page}:${initialDocumentId ?? ""}`} person={person} documents={documents} pagination={props.documentPagination} focusedDocument={props.focusedDocument} documentTypes={documentTypes} initialDocumentId={initialDocumentId} /> : <Sheet><EmptyState title="Cadastro da pessoa indisponível" description="Não foi possível carregar a pessoa vinculada a este aprendiz." icon="person" /></Sheet> : null}
      </div>
    </>
  );
}
