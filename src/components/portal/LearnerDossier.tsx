"use client";

import { AttendanceExportButton } from "@/components/portal/AttendanceExportButton";
import { DetailLinksList } from "@/components/design-system/DetailLinksList";
import type { Pagination } from "@/lib/pagination";
import { DetailTabs } from "@/components/portal/DetailTabs";
import { PersonDocumentManager } from "@/components/portal/PersonDocumentManager";
import { LearnerEditor } from "@/components/portal/EntityEditors";
import { LearnerGuardianManager } from "@/components/portal/LearnerGuardianManager";
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
  guardianPeople: Person[];
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

export function LearnerDossier(props: Props) {
  const {
    learner, person, displayName, contracts, organizations, guardians, guardianPeople,
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
        <div><StatusMark>{apiLabel(learner.status)}</StatusMark><p className="mt-1.5 font-mono text-xs text-[var(--inat-muted)]">Matrícula {learner.registrationNumber}</p></div>
        {canManage ? <div className="ml-auto"><LearnerEditor learner={learner} /></div> : null}
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

        {tab === "responsaveis" && canSeeGuardians ? <LearnerGuardianManager learner={learner} guardians={guardians} people={guardianPeople} canManage={canManage} /> : null}

        {tab === "contrato" && canSeeSensitiveContract ? <Sheet><SectionHeading title="Contratos de aprendizagem" icon="briefcase" /><DetailLinksList
          items={contracts.map((contract) => ({ id: contract.id, href: `/sistema/contratos/${contract.id}`, title: contract.employerName || organizationMap.get(contract.employerId) || "Empresa indisponível",
            description: `${formatPeriod(contract.startDate, contract.endDate)} · ${formatMinutes(contract.weeklyWorkloadMinutes)} · ${formatCurrency(contract.monthlySalary)}`, status: contract.status }))}
          itemLabel="contrato" itemPlural="contratos" searchPlaceholder="Buscar empresa ou período"
          emptyTitle="Nenhum contrato acessível" emptyDescription="Não há contrato retornado para este aprendiz e perfil." emptyIcon="briefcase" /></Sheet> : null}

        {tab === "turmas" ? <Sheet><SectionHeading title="Histórico de matrículas" icon="layers" /><DetailLinksList
          items={enrollments.map((enrollment) => { const cohort = cohortMap.get(enrollment.cohortId); return { id: enrollment.id, href: `/sistema/turmas/${enrollment.cohortId}`,
            title: `${cohort?.code ?? "Turma indisponível"} · ${cohort?.name ?? "Turma"}`, description: formatPeriod(enrollment.startDate, enrollment.endDate), status: enrollment.status }; })}
          itemLabel="matrícula" itemPlural="matrículas" searchPlaceholder="Buscar código ou nome da turma"
          emptyTitle="Sem matrículas visíveis" emptyDescription="O backend só expõe a listagem consolidada de matrículas à administração." emptyIcon="layers" /></Sheet> : null}

        {tab === "frequencia" ? <Sheet><SectionHeading title="Aulas e frequência" description={attendance.length ? `${attendance.length} registro(s) de presença disponíveis` : "Sem frequência consolidada disponível para este perfil"} icon="calendar" stackOnMobile action={props.canExportAttendance ? <AttendanceExportButton scope="learners" id={learner.id} /> : undefined} /><DetailLinksList
          items={lessons.map((lesson) => { const record = attendanceMap.get(lesson.id); return { id: lesson.id, href: `/sistema/aulas/${lesson.id}`, title: lesson.title,
            description: `${formatDateTime(lesson.startsAt)} · ${apiLabel(lesson.deliveryMode)}`, status: record?.status ?? lesson.status }; })}
          itemLabel="aula" itemPlural="aulas" searchPlaceholder="Buscar aula ou modalidade"
          emptyTitle="Nenhuma aula acessível" emptyDescription="Não há aulas deste aprendiz disponíveis para o perfil atual." emptyIcon="calendar" /></Sheet> : null}

        {tab === "atividades" ? <Sheet><SectionHeading title="Atividades e entregas" icon="clipboard" /><DetailLinksList
          items={activities.map((activity) => { const submission = submissionMap.get(activity.id); const lesson = lessonMap.get(activity.lessonId); return { id: activity.id, href: `/sistema/atividades/${activity.id}`,
            title: activity.title, description: `${lesson?.title ?? "Aula indisponível"} · prazo ${formatDateTime(activity.dueAt)}`, status: submission?.status ?? "Sem entrega" }; })}
          itemLabel="atividade" itemPlural="atividades" searchPlaceholder="Buscar atividade ou aula"
          emptyTitle="Nenhuma atividade acessível" emptyDescription="Não há atividades relacionadas às aulas disponíveis." emptyIcon="clipboard" /></Sheet> : null}

        {tab === "documentos" && canSeeDocuments ? person ? <PersonDocumentManager key={`${person.id}:${props.documentPagination?.page}:${initialDocumentId ?? ""}`} person={person} documents={documents} pagination={props.documentPagination} focusedDocument={props.focusedDocument} documentTypes={documentTypes} initialDocumentId={initialDocumentId} /> : <Sheet><EmptyState title="Cadastro da pessoa indisponível" description="Não foi possível carregar a pessoa vinculada a este aprendiz." icon="person" /></Sheet> : null}
      </div>
    </>
  );
}
