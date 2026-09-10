import type {
  CurrentUserContextResponse,
  PageResponse,
  UserResponse,
} from "@/lib/api/contracts";
import type {
  Activity,
  ActivityFile,
  ActivitySubmission,
  Address,
  AttendanceRecord,
  Cohort,
  CohortEnrollment,
  Contract,
  ContractDocument,
  DocumentType,
  Learner,
  LearnerGuardian,
  Lesson,
  LessonParticipant,
  Notification,
  NotificationRecipient,
  Organization,
  OrganizationMembership,
  Person,
  PersonDocument,
  RoleRecord,
  StoredFile,
  SubmissionFile,
  UserRole,
} from "@/lib/api/domain-contracts";
import type { Actor, Role } from "@/domain/auth";
import {
  MOCK_TODAY,
  activities as portalActivities,
  cohorts as portalCohorts,
  communications as portalCommunications,
  contracts as portalContracts,
  documentTypes as portalDocumentTypes,
  documents as portalDocuments,
  files as portalFiles,
  learners as portalLearners,
  lessons as portalLessons,
  notices as portalNotices,
  organizations as portalOrganizations,
  participants as portalParticipants,
  people as portalPeople,
  submissions as portalSubmissions,
  users as portalUsers,
} from "@/mocks/portal-data";

const CREATED_AT = "2026-01-12T12:00:00.000Z";
const UPDATED_AT = "2026-08-21T11:45:00.000Z";
const ADMIN_USER_ID = "usr-admin-01";

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mockAddress(id: string, city = "Paranaguá", stateCode = "PR"): Address {
  return {
    id: `end-${id}`,
    postalCode: "83203-000",
    street: "Rua de demonstração",
    streetNumber: "100",
    addressLine2: null,
    district: "Centro",
    city,
    stateCode,
    countryCode: "BR",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
}

const extraPersonSeeds = [
  ...portalLearners.map((learner) => ({
    name: learner.name,
    email: learner.email,
    phone: learner.phone,
    birthDate: learner.birthDate,
  })),
  ...portalParticipants.map((participant) => ({
    name: participant.name,
    email: `${slug(participant.name)}@aluno.inat.org.br`,
    phone: "(41) 99999-0000",
    birthDate: "1 de janeiro de 2008",
  })),
  {
    name: "Carolina Mendes",
    email: "carolina.mendes@inat.org.br",
    phone: "(41) 99999-0101",
    birthDate: "10 de maio de 1988",
  },
  {
    name: "Marina Costa",
    email: "marina.costa@inat.org.br",
    phone: "(41) 99999-0102",
    birthDate: "8 de agosto de 1985",
  },
  {
    name: "Camila Ribeiro",
    email: "camila.ribeiro@inat.org.br",
    phone: "(41) 99999-0103",
    birthDate: "14 de fevereiro de 1990",
  },
  {
    name: "Lucas Almeida",
    email: "lucas.almeida@email.com",
    phone: "(41) 99999-0104",
    birthDate: "20 de outubro de 1992",
  },
];

const birthDates: Record<string, string> = {
  "14 de março de 2009": "2009-03-14",
  "22 de novembro de 2008": "2008-11-22",
  "9 de junho de 2007": "2007-06-09",
  "30 de janeiro de 2009": "2009-01-30",
  "18 de setembro de 2007": "2007-09-18",
  "1 de janeiro de 2008": "2008-01-01",
  "10 de maio de 1988": "1988-05-10",
  "8 de agosto de 1985": "1985-08-08",
  "14 de fevereiro de 1990": "1990-02-14",
  "20 de outubro de 1992": "1992-10-20",
};

const seededPeople = new Map<string, Person>();

for (const person of portalPeople) {
  const [city = "Paranaguá", stateCode = "PR"] = person.city.split(" · ");
  const learner = portalLearners.find((item) => item.name === person.name);
  seededPeople.set(person.name, {
    id: person.id,
    address: mockAddress(person.id, city, stateCode),
    fullName: person.name,
    taxId: person.document,
    contactEmail:
      person.contact.includes("@")
        ? person.contact
        : learner?.email ?? `${slug(person.name)}@email.com`,
    phoneNumber:
      person.contact.includes("@")
        ? learner?.phone ?? "(41) 99999-0000"
        : person.contact,
    birthDate: learner ? birthDates[learner.birthDate] ?? "2000-01-01" : "1985-01-01",
    gender: null,
    status: person.state === "Ativa" ? "ACTIVE" : "INACTIVE",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  });
}

for (const person of extraPersonSeeds) {
  if (seededPeople.has(person.name)) continue;
  const id = `pes-${slug(person.name)}`;
  seededPeople.set(person.name, {
    id,
    address: mockAddress(id),
    fullName: person.name,
    taxId: `***.${String(seededPeople.size + 100).padStart(3, "0")}.***-**`,
    contactEmail: person.email,
    phoneNumber: person.phone,
    birthDate: birthDates[person.birthDate] ?? "1990-01-01",
    gender: null,
    status: "ACTIVE",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  });
}

export const people: Person[] = [...seededPeople.values()];

function personId(name: string) {
  return seededPeople.get(name)?.id ?? `pes-${slug(name)}`;
}

const organizationStatus: Record<string, Organization["status"]> = {
  Ativa: "ACTIVE",
  "Em análise": "INACTIVE",
} as const;

export const organizations: Organization[] = portalOrganizations.map((organization) => {
  const [city = "Paranaguá", stateCode = "PR"] = organization.city.split(" · ");
  return {
    id: organization.id,
    parentOrganizationId: null,
    address: mockAddress(organization.id, city, stateCode),
    organizationType: organization.type === "Escola" ? "SCHOOL" : "EMPLOYER",
    legalName: organization.legalName,
    tradeName: organization.name,
    taxId: organization.document.replace(/\D/g, ""),
    contactEmail: `${slug(organization.contact)}@${slug(organization.name)}.com.br`,
    phoneNumber: "(41) 3422-0000",
    status: organizationStatus[organization.state] ?? "INACTIVE",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
});

function organizationId(name: string) {
  return organizations.find(
    (organization) => organization.tradeName === name || organization.legalName === name,
  )?.id;
}

const learnerStatus = {
  Ativo: "ACTIVE",
  Pendente: "INACTIVE",
  Suspenso: "SUSPENDED",
  Encerrado: "INACTIVE",
} as const;

const participantOnlyLearners = portalParticipants
  .filter((participant) => !portalLearners.some((learner) => learner.id === participant.learnerId))
  .map((participant) => ({
    id: participant.learnerId,
    name: participant.name,
    registration: participant.registration,
    education: "Ensino médio em curso",
    state: "Ativo" as const,
  }));

export const learners: Learner[] = [
  ...portalLearners.map((learner) => ({
    id: learner.id,
    personId: personId(learner.name),
    registrationNumber: learner.registration,
    hasCompletedHighSchool: learner.education.toLowerCase().includes("completo"),
    status: learnerStatus[learner.state],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  })),
  ...participantOnlyLearners.map((learner) => ({
    id: learner.id,
    personId: personId(learner.name),
    registrationNumber: learner.registration,
    hasCompletedHighSchool: false,
    status: learnerStatus[learner.state],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  })),
];

export const learnerGuardians: LearnerGuardian[] = portalLearners
  .filter((learner) => Number((birthDates[learner.birthDate] ?? "2000").slice(0, 4)) >= 2008)
  .map((learner, index) => ({
    learnerId: learner.id,
    guardianPersonId: personId("Sandra Souza"),
    guardianName: "Sandra Souza",
    relationshipType: index === 0 ? "MOTHER" : "RESPONSIBLE",
    legalGuardian: true,
    primaryContact: true,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  }));

const cohortPeriods: Record<string, [string, string]> = {
  "turma-adm-26a": ["2026-02-02", "2026-12-18"],
  "turma-ser-26b": ["2026-03-09", "2026-12-18"],
  "turma-adm-26c": ["2026-04-06", "2027-02-19"],
  "turma-ser-25a": ["2025-02-03", "2025-12-19"],
};

export const cohorts: Cohort[] = portalCohorts.map((cohort) => {
  const [startDate, endDate] = cohortPeriods[cohort.id] ?? [MOCK_TODAY, MOCK_TODAY];
  const firstScheduleToken = cohort.schedule.split(",")[0];
  const defaultWeekday = firstScheduleToken.startsWith("Ter")
    ? 2
    : firstScheduleToken.startsWith("Qua")
      ? 3
      : 1;
  return {
    id: cohort.id,
    code: cohort.code,
    name: cohort.name,
    defaultWeekday,
    shiftCode: cohort.schedule.includes("Tarde") ? "TARDE" : "MANHA",
    startDate,
    endDate,
    maxLearners: 30,
    status: cohort.state === "Encerrada" ? "COMPLETED" : "ACTIVE",
    statusHistory: [],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
});

function cohortId(code: string) {
  return cohorts.find((cohort) => cohort.code === code)?.id;
}

const contractPeriods: Record<string, [string, string]> = {
  "ctr-ana-2026": ["2026-02-02", "2027-01-31"],
  "ctr-bruno-2026": ["2026-02-02", "2027-01-31"],
  "ctr-gabriela-2026": ["2026-03-09", "2027-03-08"],
  "ctr-larissa-2026": ["2026-01-12", "2027-01-11"],
};

export const contracts: Contract[] = portalContracts.map((contract) => {
  const learner = portalLearners.find((item) => item.name === contract.learner);
  const [startDate, endDate] = contractPeriods[contract.id] ?? [MOCK_TODAY, MOCK_TODAY];
  return {
    id: contract.id,
    learnerId: learner?.id ?? `apr-${slug(contract.learner)}`,
    employerId: organizationId(contract.company) ?? "org-porto-sul",
    schoolId: contract.school === "—" ? null : organizationId(contract.school) ?? null,
    startDate,
    endDate,
    monthlySalary: Number(
      contract.salary.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
    ),
    weeklyWorkloadMinutes: Number(contract.workload.match(/\d+/)?.[0] ?? 20) * 60,
    status: contract.state === "Suspenso" ? "SUSPENDED" : "ACTIVE",
    statusHistory: [],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
});

export const enrollments: CohortEnrollment[] = portalLearners.flatMap((learner) => {
  const contract = contracts.find((item) => item.learnerId === learner.id);
  const targetCohortId = cohortId(learner.cohort);
  if (!contract || !targetCohortId) return [];
  return [{
    id: `mat-${learner.id}`,
    contractId: contract.id,
    cohortId: targetCohortId,
    learnerId: learner.id,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: learner.state === "Ativo" ? "ACTIVE" as const : "CANCELLED" as const,
    statusHistory: [],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  }];
});

function lessonDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

const lessonStatuses = {
  Agendada: "SCHEDULED",
  "Em andamento": "IN_PROGRESS",
  Concluída: "COMPLETED",
  Cancelada: "CANCELLED",
} as const;

export const lessons: Lesson[] = portalLessons.map((lesson) => {
  // Mock lessons follow the current domain contract: only onsite or online.
  const online = lesson.modality !== "Presencial";
  return {
    id: lesson.id,
    cohortId: cohortId(lesson.cohortCode) ?? "turma-adm-26a",
    instructorPersonId: personId(lesson.instructor),
    title: lesson.title,
    startsAt: lessonDateTime(lesson.date, lesson.start),
    endsAt: lessonDateTime(lesson.date, lesson.end),
    deliveryMode: online ? "ONLINE" : "ONSITE",
    room: online ? null : lesson.place,
    meetingUrl: online ? `https://meet.google.com/${slug(lesson.id)}` : null,
    externalLessonUrl: lesson.externalLessonUrl ?? null,
    status: lessonStatuses[lesson.state],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
});

function learnerIdByName(name: string) {
  return learners.find((learner) => learner.personId === personId(name))?.id;
}

const participationTypes = {
  Regular: "REGULAR",
  Remanejado: "TRANSFERRED",
  Reposição: "MAKEUP",
  Extra: "EXTRA",
} as const;

const attendanceStatuses = {
  Presente: "PRESENT",
  Ausente: "ABSENT",
  Justificada: "EXCUSED",
  Atraso: "LATE",
  Parcial: "PARTIAL",
} as const;

const participantLessonId = "aula-gestao-tempo";

export const lessonParticipants: LessonParticipant[] = portalParticipants.map((participant) => ({
  id: participant.id,
  lessonId: participantLessonId,
  learnerId: learnerIdByName(participant.name) ?? participant.learnerId,
  sourceEnrollmentId:
    enrollments.find((enrollment) => enrollment.learnerId === participant.learnerId)?.id ?? null,
  assignedByUserId: participant.participation === "Regular" ? null : ADMIN_USER_ID,
  participationType: participationTypes[participant.participation],
  status: "EXPECTED",
  assignmentReason: participant.origin ? `Origem: ${participant.origin}` : null,
  assignedAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

export const attendanceRecords: AttendanceRecord[] = portalParticipants.flatMap((participant) => {
  if (participant.status === "Sem registro") return [];
  const learnerId = learnerIdByName(participant.name) ?? participant.learnerId;
  return [{
    id: `freq-${participant.id}`,
    lessonParticipantId: participant.id,
    lessonId: participantLessonId,
    learnerId,
    recordedByUserId: ADMIN_USER_ID,
    status: attendanceStatuses[participant.status],
    checkInAt: participant.entry ? lessonDateTime(MOCK_TODAY, participant.entry) : null,
    checkOutAt: participant.exit ? lessonDateTime(MOCK_TODAY, participant.exit) : null,
    recordedAt: UPDATED_AT,
    notes: participant.note ?? null,
    updatedAt: UPDATED_AT,
  }];
});

const monthNumbers: Record<string, string> = {
  jan: "01",
  fev: "02",
  mar: "03",
  abr: "04",
  mai: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  set: "09",
  out: "10",
  nov: "11",
  dez: "12",
};

function portalDateTime(value: string) {
  const [dayLabel, time = "12:00"] = value.split(", ");
  let date = MOCK_TODAY;
  if (dayLabel !== "Hoje") {
    const [day = "21", month = "ago"] = dayLabel.split(" ");
    date = `2026-${monthNumbers[month] ?? "08"}-${day.padStart(2, "0")}`;
  }
  return lessonDateTime(date, time);
}

const activityStatuses = {
  Rascunho: "DRAFT",
  Publicada: "PUBLISHED",
  Encerrada: "CLOSED",
} as const;

export const activities: Activity[] = portalActivities.map((activity) => ({
  id: activity.id,
  lessonId:
    lessons.find((lesson) => lesson.title === activity.lesson)?.id ?? "aula-gestao-tempo",
  createdByUserId: ADMIN_USER_ID,
  title: activity.title,
  description: `Orientações para ${activity.title.toLocaleLowerCase("pt-BR")}.`,
  availableAt: portalDateTime(activity.availableAt),
  dueAt: portalDateTime(activity.dueAt),
  maxScore: activity.maxScore ?? null,
  status: activityStatuses[activity.state],
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

const submissionStatuses: Record<string, ActivitySubmission["status"]> = {
  Enviada: "SUBMITTED",
  Avaliada: "GRADED",
  Devolvida: "RETURNED",
  "Enviada com atraso": "LATE",
} as const;

export const submissions: ActivitySubmission[] = portalSubmissions.map((submission) => ({
  id: submission.id,
  activityId: "atividade-prioridades",
  learnerId: learnerIdByName(submission.learner) ?? `apr-${slug(submission.learner)}`,
  gradedByUserId: submission.state === "Avaliada" ? ADMIN_USER_ID : null,
  textAnswer: submission.response,
  status: submissionStatuses[submission.state] ?? "DRAFT",
  submittedAt: portalDateTime(submission.sentAt),
  score: submission.score ? Number(submission.score.replace(",", ".")) : null,
  feedback:
    submission.state === "Devolvida"
      ? "Detalhe melhor como pretende aplicar a matriz durante a semana."
      : null,
  gradedAt: submission.state === "Avaliada" ? UPDATED_AT : null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

function sizeBytes(value: string) {
  const amount = Number(value.replace(/[^\d,]/g, "").replace(",", "."));
  return Math.round(amount * (value.includes("MB") ? 1024 ** 2 : 1024));
}

export const storedFiles: StoredFile[] = portalFiles.map((file, index) => ({
  id: file.id,
  uploadedByUserId: ADMIN_USER_ID,
  originalName: file.name,
  mimeType: file.type,
  sizeBytes: sizeBytes(file.size),
  checksumSha256: String(index + 1).padStart(64, "0"),
  createdAt: CREATED_AT,
}));

function storedFileFor(name: string, index: number): StoredFile {
  return storedFiles.find((file) => file.originalName === name) ?? {
    id: `file-entrega-${index + 1}`,
    uploadedByUserId: ADMIN_USER_ID,
    originalName: name,
    mimeType: name.endsWith(".jpg") ? "image/jpeg" : "application/pdf",
    sizeBytes: 384_000 + index * 12_000,
    checksumSha256: String(index + 10).padStart(64, "0"),
    createdAt: CREATED_AT,
  };
}

export const activityFiles: ActivityFile[] = [{
  activityId: "atividade-prioridades",
  file: storedFiles[2],
  sortOrder: 0,
  createdAt: CREATED_AT,
}];

export const submissionFiles: SubmissionFile[] = portalSubmissions.map((submission, index) => ({
  submissionId: submission.id,
  file: storedFileFor(submission.attachment, index),
  createdAt: CREATED_AT,
}));

export const documentTypes: DocumentType[] = portalDocumentTypes.map((type, index) => ({
  id: index + 1,
  code: type.code,
  name: type.name,
  description: type.description,
  scope: type.code === "ASO" ? "BOTH" : "PERSON",
}));

const documentStatuses: Record<string, PersonDocument["verificationStatus"]> = {
  Pendente: "VERIFIED",
  Verificado: "VERIFIED",
  Rejeitado: "VERIFIED",
  Expirado: "EXPIRED",
} as const;

function dateOnly(value: string) {
  if (value === "Sem validade") return null;
  const [day = "21", month = "ago", year = "2026"] = value.split(" ");
  return `${year}-${monthNumbers[month] ?? "08"}-${day.padStart(2, "0")}`;
}

export const personDocuments: PersonDocument[] = portalDocuments.map((document, index) => {
  const documentType = documentTypes.find((type) => type.name === document.type) ?? documentTypes[0];
  const verificationStatus = documentStatuses[document.state] ?? "VERIFIED";
  const statusHistory: PersonDocument["statusHistory"] = [{
    id: `history-${document.id}-upload`,
    previousStatus: null,
    newStatus: "VERIFIED",
    changeReason: "ADMIN_UPLOAD",
    changedByUserId: ADMIN_USER_ID,
    changedAt: CREATED_AT,
  }];
  if (verificationStatus === "EXPIRED") {
    statusHistory.push({
      id: `history-${document.id}-expiration`,
      previousStatus: "VERIFIED",
      newStatus: "EXPIRED",
      changeReason: "AUTOMATIC_EXPIRATION",
      changedByUserId: null,
      changedAt: UPDATED_AT,
    });
  }
  return {
    id: document.id,
    personId: personId(document.person),
    file: storedFiles[index % storedFiles.length],
    documentTypeId: documentType.id,
    documentNumber: document.number === "—" ? null : document.number,
    issuedOn: null,
    expiresOn: dateOnly(document.validity),
    verificationStatus,
    verifiedByUserId: ADMIN_USER_ID,
    verifiedAt: CREATED_AT,
    statusHistory,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
});

export const contractDocuments: ContractDocument[] = contracts.map((contract, index) => ({
  id: `doc-contrato-${index + 1}`,
  contractId: contract.id,
  file: storedFiles[index % storedFiles.length],
  documentTypeId: documentTypes.find(
    (type) => type.scope === "CONTRACT" || type.scope === "BOTH",
  )?.id ?? documentTypes[index % documentTypes.length].id,
  versionNumber: 1,
  current: true,
  createdAt: CREATED_AT,
}));

const communicationNotifications: Notification[] = portalCommunications.map((communication) => ({
  id: communication.id,
  createdByUserId: ADMIN_USER_ID,
  audience: communication.audience.startsWith("Turma")
    ? { type: "COHORT", targetId: cohortId(communication.audience.replace("Turma ", "")) ?? null }
    : { type: "ALL", targetId: null },
  notificationType: "GENERAL",
  title: communication.title,
  message: `${communication.delivery}. ${communication.channels}.`,
  actionUrl: "/sistema/avisos",
  contextType: "COMMUNICATION",
  contextId: communication.id,
  payload: null,
  priority: "NORMAL",
  scheduledAt: communication.state === "Agendada" ? UPDATED_AT : null,
  expiresAt: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

const noticeNotifications: Notification[] = portalNotices.map((notice) => ({
  id: `notification-${notice.id}`,
  createdByUserId: ADMIN_USER_ID,
  audience: { type: "USER", targetId: ADMIN_USER_ID },
  notificationType: "GENERAL",
  title: notice.title,
  message: notice.message,
  actionUrl: notice.href,
  contextType: notice.context,
  contextId: notice.id,
  payload: null,
  priority: notice.priority === "Alta" ? "HIGH" : notice.priority === "Baixa" ? "LOW" : "NORMAL",
  scheduledAt: null,
  expiresAt: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

export const notifications: Notification[] = [
  ...communicationNotifications,
  ...noticeNotifications,
];

export const notificationRecipients: NotificationRecipient[] = portalNotices.map((notice) => ({
  id: notice.id,
  notificationId: `notification-${notice.id}`,
  recipientUserId: ADMIN_USER_ID,
  channel: "IN_APP",
  deliveryStatus: "DELIVERED",
  sentAt: CREATED_AT,
  deliveredAt: CREATED_AT,
  readAt: notice.read ? UPDATED_AT : null,
  failureReason: null,
  notificationType: "GENERAL",
  title: notice.title,
  message: notice.message,
  actionUrl: notice.href,
  contextType: notice.context,
  contextId: notice.id,
  priority: notice.priority === "Alta" ? "HIGH" : notice.priority === "Baixa" ? "LOW" : "NORMAL",
  scheduledAt: null,
  expiresAt: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

const currentRoles: RoleRecord[] = [
  { id: 1, code: "ADMIN", name: "Administrador", description: "Operação completa do sistema." },
  { id: 2, code: "INSTRUCTOR", name: "Instrutor", description: "Aulas, chamada, atividades e correções." },
  { id: 3, code: "LEARNER", name: "Aprendiz", description: "Percurso, aulas, atividades e avisos próprios." },
  { id: 4, code: "EMPLOYER_MANAGER", name: "Gestor de empresa", description: "Aprendizes e contratos da organização vinculada." },
];

export const roles = currentRoles;

function userRoles(value: string): Role[] {
  if (value.includes("ADMIN") || value.includes("STAFF")) return ["ADMIN"];
  if (value.includes("INSTRUCTOR")) return ["INSTRUCTOR"];
  if (value.includes("LEARNER")) return ["LEARNER"];
  return ["EMPLOYER_MANAGER"];
}

export const users: UserResponse[] = portalUsers.map((user) => ({
  id: user.id,
  personId: personId(user.person === "Não vinculada" ? user.name : user.person),
  displayName: user.name,
  loginEmail: user.email,
  status: user.state === "Ativo" ? "ACTIVE" : "INVITED",
  roles: userRoles(user.roles),
  emailVerifiedAt: user.state === "Ativo" ? CREATED_AT : null,
  lockedUntil: null,
  lastLoginAt: user.lastAccess === "Primeiro acesso" ? null : UPDATED_AT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}));

export const userRoleAssignments: UserRole[] = users.flatMap((user) =>
  (user.roles as Role[]).map((roleCode) => {
    const role = roles.find((item) => item.code === roleCode) ?? roles[0];
    return {
      userId: user.id,
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      grantedByUserId: ADMIN_USER_ID,
      grantedAt: CREATED_AT,
    };
  }),
);

export const organizationMemberships: OrganizationMembership[] = [
  {
    id: "membro-renata-porto-sul",
    personId: personId("Renata Alves"),
    organizationId: "org-porto-sul",
    membershipRole: "EMPLOYER_MANAGER",
    jobTitle: "Gestora de aprendizagem",
    startDate: "2026-01-12",
    endDate: null,
    status: "ACTIVE",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

const adminUser = users.find((user) => user.id === ADMIN_USER_ID) ?? users[0];

export const mockCurrentUser: CurrentUserContextResponse = {
  user: adminUser,
  learnerId: null,
  organizationIds: [],
};

export const mockActor: Actor = {
  id: adminUser.id,
  userId: adminUser.id,
  personId: adminUser.personId,
  name: adminUser.displayName,
  shortName: adminUser.displayName.split(" ")[0],
  email: adminUser.loginEmail,
  initials: adminUser.displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join(""),
  roles: ["ADMIN"],
  organizationIds: [],
  roleLabel: "Administrador",
  isActive: true,
  status: "Ativo",
  lastAccess: "Hoje, 07:42",
};

function page<T>(items: T[], searchParams: URLSearchParams): PageResponse<T> {
  const pageNumber = Math.max(0, Number(searchParams.get("page") ?? 0));
  const size = Math.max(1, Number(searchParams.get("size") ?? 20));
  const start = pageNumber * size;
  const content = items.slice(start, start + size);
  const totalPages = items.length ? Math.ceil(items.length / size) : 0;
  return {
    content,
    page: pageNumber,
    size,
    totalElements: items.length,
    totalPages,
    first: pageNumber === 0,
    last: totalPages === 0 || pageNumber >= totalPages - 1,
  };
}

const collections: Record<string, unknown[]> = {
  people,
  organizations,
  "organization-memberships": organizationMemberships,
  learners,
  cohorts,
  "cohort-enrollments": enrollments,
  contracts,
  lessons,
  "lesson-participants": lessonParticipants,
  "attendance-records": attendanceRecords,
  activities,
  "activity-submissions": submissions,
  "document-types": documentTypes,
  "person-documents": personDocuments,
  "contract-documents": contractDocuments,
  notifications,
  "notification-recipients": notificationRecipients,
  roles,
  users,
};

export type MockApiResult = {
  status: number;
  data: unknown;
  message?: string;
};

export function mockApiGet(path: string): MockApiResult {
  const url = new URL(path, "http://mock.inat.local");
  const segments = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [resource, id, relation] = segments;

  if (resource === "me") return { status: 200, data: mockCurrentUser };
  if (resource === "lessons" && id === "me") return { status: 200, data: lessons };
  if (resource === "notification-recipients" && id === "me" && relation === "unread-count") {
    return {
      status: 200,
      data: { count: notificationRecipients.filter((recipient) => !recipient.readAt).length },
    };
  }
  if (resource === "notification-recipients" && id === "me") {
    return { status: 200, data: page(notificationRecipients, url.searchParams) };
  }
  if (resource === "activities" && id === "lesson" && relation) {
    return { status: 200, data: activities.filter((activity) => activity.lessonId === relation) };
  }
  if (resource === "activity-submissions" && id === "learner" && relation) {
    return { status: 200, data: submissions.filter((submission) => submission.learnerId === relation) };
  }
  if (resource === "activity-submissions" && id === "activity" && relation) {
    return { status: 200, data: submissions.filter((submission) => submission.activityId === relation) };
  }
  if (resource === "lesson-participants" && id === "lesson" && relation) {
    return { status: 200, data: lessonParticipants.filter((participant) => participant.lessonId === relation) };
  }
  if (resource === "attendance-records" && id === "lesson" && relation) {
    return { status: 200, data: attendanceRecords.filter((record) => record.lessonId === relation) };
  }
  if (resource === "contracts" && id === "learner" && relation) {
    return { status: 200, data: contracts.filter((contract) => contract.learnerId === relation) };
  }
  if (resource === "contracts" && id === "organization" && relation) {
    return {
      status: 200,
      data: contracts.filter(
        (contract) => contract.employerId === relation || contract.schoolId === relation,
      ),
    };
  }
  if (resource === "learners" && id && relation === "guardians") {
    return { status: 200, data: learnerGuardians.filter((guardian) => guardian.learnerId === id) };
  }
  if (resource === "users" && id && relation === "roles") {
    return { status: 200, data: userRoleAssignments.filter((assignment) => assignment.userId === id) };
  }
  if (resource === "activities" && id && relation === "files") {
    return { status: 200, data: activityFiles.filter((item) => item.activityId === id) };
  }
  if (resource === "activity-submissions" && id && relation === "files") {
    return { status: 200, data: submissionFiles.filter((item) => item.submissionId === id) };
  }

  const collection = collections[resource];
  if (!collection) {
    return { status: 404, data: null, message: "Recurso mock não encontrado" };
  }
  if (!id) return { status: 200, data: page(collection, url.searchParams) };

  const item = collection.find(
    (candidate) =>
      typeof candidate === "object" &&
      candidate !== null &&
      "id" in candidate &&
      String(candidate.id) === id,
  );
  return item
    ? { status: 200, data: item }
    : { status: 404, data: null, message: "Registro mock não encontrado" };
}

export function mockMutationData(
  path: string,
  method: string,
  body: Record<string, unknown> | null,
) {
  if (method === "DELETE") return null;
  const segments = new URL(path, "http://mock.inat.local").pathname.split("/").filter(Boolean);
  const resource = segments.at(-1) ?? "registro";
  const pathId = segments.length > 2 && !["grade", "read", "delivery", "files", "roles"].includes(resource)
    ? resource
    : undefined;
  return {
    ...(body ?? {}),
    id: pathId ?? `mock-${slug(resource)}-${Date.now()}`,
    createdAt: CREATED_AT,
    updatedAt: new Date().toISOString(),
  };
}
