// Small, typed datasets used only by the server-page and export tests.
import type { Actor } from "@/domain/auth";
import type { PageResponse, UserResponse } from "@/lib/api/contracts";
import type {
  Activity, ActivitySubmission, Address, AttendanceRecord, Cohort, CohortEnrollment, Contract, ContractDocument,
  DocumentType, Learner, Lesson, LessonParticipant, Notification,
  NotificationRecipient, Organization, Person, PersonDocument,
  PersonTypeCode, RoleRecord, StoredFile,
} from "@/lib/api/domain-contracts";
import { apprenticeshipLessonDate, hasOnlineEligibleContract } from "@/lib/apprenticeship/policy";
import { PERSON_TYPE_OPTIONS, hasPersonType, isEligibleGuardian, isEligibleInstructor } from "@/lib/people/person-types";

const timestamps = { createdAt: "2026-01-12T12:00:00Z", updatedAt: "2026-09-10T12:00:00Z" };
const address: Address = {
  id: "test-address", postalCode: "83203000", street: "Rua de teste", streetNumber: "100",
  addressLine2: null, district: "Centro", city: "Paranaguá", stateCode: "PR", countryCode: "BR", ...timestamps,
};
function person(id: string, fullName: string, personTypes: PersonTypeCode[]): Person {
  return {
    id, fullName, personTypes, address, taxId: "00000000000", contactEmail: `${id}@example.test`,
    phoneNumber: "41999990000", birthDate: "2005-01-01", gender: null, status: "ACTIVE", ...timestamps,
  };
}
export const people: Person[] = [
  person("person-1", "Ana Aprendiz", ["LEARNER"]),
  person("person-2", "Bruno Aprendiz", ["LEARNER"]),
  person("instructor", "Carolina Instrutora", ["INSTRUCTOR"]),
  person("admin", "Administrador de teste", ["ADMIN"]),
];
export const learners: Learner[] = people.slice(0, 2).map((person, index) => ({
  id: `learner-${index + 1}`, personId: person.id, fullName: person.fullName,
  registrationNumber: index + 1, hasCompletedHighSchool: false, status: "ACTIVE", ...timestamps,
}));
export const organizations: Organization[] = ["EMPLOYER", "SCHOOL"].map((type, index) => ({
  id: `organization-${index + 1}`, parentOrganizationId: null, parentOrganizationName: null, address,
  organizationTypes: [type as "EMPLOYER" | "SCHOOL"], legalName: `Organização de teste ${index + 1}`,
  tradeName: `Organização ${index + 1}`, taxId: "00000000000000", contactEmail: "organization@example.test",
  phoneNumber: "4130000000", attendanceClosingDay: type === "EMPLOYER" ? 25 : null,
  status: "ACTIVE", ...timestamps,
}));
export const contracts: Contract[] = learners.map((learner, index) => ({
  id: `contract-${index + 1}`, learnerId: learner.id, learnerName: learner.fullName,
  learnerRegistrationNumber: learner.registrationNumber, employerId: organizations[0].id,
  employerName: organizations[0].tradeName!, schoolId: organizations[1].id,
  schoolName: organizations[1].tradeName, startDate: "2026-01-01", endDate: "2026-12-31",
  monthlySalary: 1234.56, weeklyWorkloadMinutes: index === 0 ? 1200 : 1800,
  status: "ACTIVE", statusHistory: [], schoolHistory: [], ...timestamps,
}));
export const cohorts: Cohort[] = [{
  id: "cohort-1", code: "QUINTA", name: "Turma de quinta-feira", defaultWeekday: 4,
  shiftCode: "MORNING", startDate: "2026-01-01", endDate: "2026-12-31", maxLearners: 30,
  status: "ACTIVE", statusHistory: [], ...timestamps,
}];
export const enrollments: CohortEnrollment[] = contracts.map((contract, index) => ({
  id: `enrollment-${index + 1}`, contractId: contract.id, cohortId: cohorts[0].id,
  learnerId: contract.learnerId, startDate: contract.startDate, endDate: contract.endDate,
  status: "ACTIVE", statusHistory: [], ...timestamps,
}));
export const lessons: Lesson[] = [0, 1].map((index) => ({
  id: `lesson-${index + 1}`, cohortId: cohorts[0].id, cohortCode: cohorts[0].code,
  cohortName: cohorts[0].name, instructorPersonId: people[2].id, instructorName: people[2].fullName,
  title: `Aula de teste ${index + 1}`, description: "Descrição obrigatória da aula de teste.",
  startsAt: `2026-09-${10 + index}T13:00:00Z`, endsAt: `2026-09-${10 + index}T17:00:00Z`,
  deliveryMode: "ONSITE", room: "Sala 1", meetingUrl: null, externalLessonUrl: null,
  status: "COMPLETED", ...timestamps,
}));
export const lessonParticipants: LessonParticipant[] = learners.map((learner, index) => ({
  id: `participant-${index + 1}`, lessonId: lessons[0].id, learnerId: learner.id,
  learnerName: learner.fullName, learnerRegistrationNumber: learner.registrationNumber,
  sourceEnrollmentId: null, assignedByUserId: "user-admin", participationType: "REGULAR",
  status: "EXPECTED", assignmentReason: null, assignedAt: timestamps.createdAt, updatedAt: timestamps.updatedAt,
}));
export const attendanceRecords: AttendanceRecord[] = lessonParticipants.map((participant, index) => ({
  id: `attendance-${index + 1}`, lessonParticipantId: participant.id, lessonId: participant.lessonId,
  learnerId: participant.learnerId, recordedByUserId: "user-admin", status: "PRESENT",
  checkInAt: lessons[0].startsAt, checkOutAt: lessons[0].endsAt,
  recordedAt: timestamps.updatedAt, notes: null, updatedAt: timestamps.updatedAt,
}));
export const activities: Activity[] = [{
  id: "activity-1", lessonId: lessons[0].id, createdByUserId: "user-admin",
  title: "Atividade de teste", description: "Descrição da atividade", availableAt: lessons[0].startsAt,
  dueAt: lessons[1].endsAt, maxScore: 10, status: "PUBLISHED", ...timestamps,
}];
export const submissions: ActivitySubmission[] = [{
  id: "submission-1", activityId: activities[0].id, learnerId: learners[0].id,
  learnerName: learners[0].fullName, learnerRegistrationNumber: learners[0].registrationNumber,
  gradedByUserId: "user-instructor", textAnswer: "Resposta de teste", status: "GRADED",
  submittedAt: lessons[0].endsAt, score: 8, feedback: "Atividade corrigida", gradedAt: timestamps.updatedAt, ...timestamps,
}];
export const documentTypes: DocumentType[] = [
  { id: 1, code: "IDENTITY", name: "Identificação", description: null, scope: "PERSON" },
  { id: 2, code: "CONTRACT", name: "Contrato", description: null, scope: "CONTRACT" },
];
function file(id: string): StoredFile {
  return {
    id, uploadedByUserId: "user-admin", originalName: `${id}.pdf`, mimeType: "application/pdf",
    sizeBytes: 100, checksumSha256: "a".repeat(64), createdAt: timestamps.createdAt,
  };
}
export const personDocuments: PersonDocument[] = [0, 1, 2].map((index) => ({
  id: `personal-document-${index + 1}`, personId: people[index === 2 ? 1 : 0].id,
  file: file(`personal-file-${index + 1}`), documentTypeId: 1, documentNumber: null,
  issuedOn: "2025-01-01", expiresOn: index === 1 ? "2027-01-01" : "2026-01-01",
  verificationStatus: index === 1 ? "VERIFIED" : "EXPIRED", verifiedByUserId: "user-admin",
  verifiedAt: timestamps.createdAt, statusHistory: [], ...timestamps,
}));
export const contractDocuments: ContractDocument[] = contracts.map((contract, index) => ({
  id: `contract-document-${index + 1}`, contractId: contract.id, file: file(`contract-file-${index + 1}`),
  documentTypeId: 2, versionNumber: 1, current: true, createdAt: timestamps.createdAt,
}));
export const users: UserResponse[] = [people[3], people[2]].map((person, index) => ({
  id: index === 0 ? "user-admin" : "user-instructor", personId: person.id,
  displayName: person.fullName, loginEmail: person.contactEmail!, status: "ACTIVE",
  roles: [index === 0 ? "ADMIN" : "INSTRUCTOR"], emailVerifiedAt: timestamps.createdAt,
  lockedUntil: null, lastLoginAt: timestamps.updatedAt, ...timestamps,
}));
export const roles: RoleRecord[] = [{ id: 1, code: "ADMIN", name: "Administrador", description: null }];
export const notifications: Notification[] = [{
  id: "notification-1", createdByUserId: users[0].id, audience: { type: "ALL", targetId: null },
  notificationType: "GENERAL", title: "Aviso de teste", message: "Mensagem de teste", actionUrl: null,
  contextType: null, contextId: null, payload: null, priority: "NORMAL", scheduledAt: null,
  expiresAt: null, ...timestamps,
}];
export const notificationRecipients: NotificationRecipient[] = [{
  ...notifications[0], id: "recipient-1", notificationId: notifications[0].id,
  recipientUserId: users[0].id, channel: "IN_APP", deliveryStatus: "DELIVERED",
  sentAt: timestamps.createdAt, deliveredAt: timestamps.createdAt, readAt: null, failureReason: null,
}];
export const mockActor: Actor = {
  id: users[0].id, userId: users[0].id, personId: people[3].id, name: users[0].displayName,
  shortName: "Administrador", email: users[0].loginEmail, initials: "AT", roles: ["ADMIN"],
  organizationIds: [], roleLabel: "Administrador", isActive: true, status: "Ativo", lastAccess: "Hoje",
};

function page<T>(items: T[], params: URLSearchParams): PageResponse<T> {
  const index = Number(params.get("page") ?? 0);
  const size = Number(params.get("size") ?? 20);
  const totalPages = Math.ceil(items.length / size);
  return {
    content: items.slice(index * size, (index + 1) * size), page: index, size,
    totalElements: items.length, totalPages, first: index === 0, last: index >= totalPages - 1,
  };
}
const collections: Record<string, { id: string | number }[]> = {
  people, learners, organizations, contracts, cohorts, lessons, activities, users, roles,
  notifications, "notification-recipients": notificationRecipients,
  "cohort-enrollments": enrollments, "activity-submissions": submissions,
  "lesson-participants": lessonParticipants, "attendance-records": attendanceRecords,
  "document-types": documentTypes, "person-documents": personDocuments, "contract-documents": contractDocuments,
};
type ApiResult = { status: number; data: unknown; message?: string };
type Item = Record<string, unknown>;
const found = (data: unknown): ApiResult => ({ status: 200, data });
const missing = (): ApiResult => ({ status: 404, data: null, message: "Test fixture not found" });

function search(resource: string, params: URLSearchParams, lookup: boolean): ApiResult {
  const collection = collections[resource];
  if (!collection) return missing();
  const purpose = params.get("purpose") ?? "";
  const expected: Record<string, string> = {
    guardian: "people", instructor: "people", participant: "learners", "contract-learner": "learners",
    employer: "organizations", school: "organizations",
  };
  const size = Number(params.get("size") ?? (lookup ? 5 : 20));
  const index = Number(params.get("page") ?? 0);
  const q = (params.get("q") ?? "").trim().toLocaleLowerCase("pt-BR");
  const personType = params.get("personType");
  if (!Number.isInteger(size) || size < 1 || size > (lookup ? 5 : 100)
    || !Number.isInteger(index) || index < 0 || q.length > 160
    || (lookup && expected[purpose] !== resource)
    || (personType && !PERSON_TYPE_OPTIONS.some((type) => type.code === personType))) {
    return { status: 400, data: null };
  }
  const lesson = lessons.find((item) => item.id === params.get("contextId"));
  if (purpose === "participant" && !lesson) return missing();
  const personFor = (item: Item) => people.find((person) => person.id === item.personId);
  const learnerFor = (item: Item) => learners.find((learner) => learner.id === item.learnerId);
  function searchable(item: Item): unknown[] {
    switch (resource) {
      case "people": return [item.fullName, item.taxId, item.contactEmail, item.phoneNumber];
      case "learners": return [item.registrationNumber, personFor(item)?.fullName];
      case "organizations": return [item.legalName, item.tradeName, item.taxId];
      case "contracts": {
        const learner = learnerFor(item);
        const employer = organizations.find((org) => org.id === item.employerId);
        return [item.id, learner?.registrationNumber, people.find((person) => person.id === learner?.personId)?.fullName, employer?.legalName];
      }
      case "lessons": {
        const cohort = cohorts.find((cohort) => cohort.id === item.cohortId);
        return [item.title, cohort?.code, cohort?.name];
      }
      case "users": return [item.displayName, item.loginEmail];
      default: return [item.title, item.name, item.code, item.description];
    }
  }
  const today = apprenticeshipLessonDate(new Date().toISOString());
  const items = (collection as unknown as Item[]).filter((item) => {
    if (params.has("status") && item.status !== params.get("status")) return false;
    if (personType && !(item.personTypes as string[] | undefined)?.includes(personType)) return false;
    if (q && !searchable(item).some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(q))) return false;
    if (!lookup) return true;
    switch (purpose) {
      case "guardian": return isEligibleGuardian(item as unknown as Person, today);
      case "instructor": return isEligibleInstructor(item as unknown as Person, users);
      case "contract-learner": return item.status === "ACTIVE" && personFor(item)?.status === "ACTIVE";
      case "participant": return item.status === "ACTIVE" && personFor(item)?.status === "ACTIVE"
        && !lessonParticipants.some((participant) => participant.lessonId === lesson!.id && participant.learnerId === item.id)
        && (lesson!.deliveryMode !== "ONLINE" || hasOnlineEligibleContract(String(item.id), contracts, apprenticeshipLessonDate(lesson!.startsAt)));
      case "employer": case "school": return item.status === "ACTIVE"
        && (item.organizationTypes as string[]).includes(purpose === "employer" ? "EMPLOYER" : "SCHOOL");
      default: return false;
    }
  }).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  params.set("size", String(size));
  const result = page(items, params);
  return found({ ...result, content: lookup ? result.content.map((item) => ({
    id: String(item.id), label: resource === "people" ? String(item.fullName)
      : resource === "learners" ? `${item.registrationNumber} · ${personFor(item)?.fullName}`
      : String(item.tradeName || item.legalName),
  })) : result.content });
}

export function mockApiGet(path: string): ApiResult {
  const url = new URL(path, "https://fixtures.example.test");
  const [resource, id, relation] = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const params = url.searchParams;
  if (resource === "search" || resource === "lookups") return search(id, params, resource === "lookups");
  if (resource === "person-documents" && !id) {
    const status = params.get("verificationStatus");
    if (status !== null && !["VERIFIED", "EXPIRED"].includes(status)) return { status: 400, data: null };
    const items = personDocuments.filter((document) => (!params.has("personId") || document.personId === params.get("personId"))
      && (!status || document.verificationStatus === status))
      .sort((a, b) => (status === "EXPIRED" ? (a.expiresOn ?? "").localeCompare(b.expiresOn ?? "")
        : b.createdAt.localeCompare(a.createdAt)) || a.id.localeCompare(b.id));
    return found(page(items, params));
  }
  if (resource === "contract-documents" && !id) return found(page(contractDocuments.filter((document) =>
    !params.has("contractId") || document.contractId === params.get("contractId")), params));
  if (resource === "learners" && !id && params.has("personId")) return found(page(learners.filter((learner) =>
    learner.personId === params.get("personId")), params));
  if (resource === "people" && !id && params.has("personType")) return found(page(people.filter((person) =>
    hasPersonType(person, params.get("personType")!)), params));
  if (resource === "attendance-records" && !id) {
    const records = attendanceRecords.filter((record) => {
      const lesson = lessons.find((lesson) => lesson.id === record.lessonId);
      if (!lesson) return false;
      const date = apprenticeshipLessonDate(lesson.startsAt);
      if (params.has("startDate") && date < params.get("startDate")!) return false;
      if (params.has("endDate") && date > params.get("endDate")!) return false;
      if (params.has("learnerId") && record.learnerId !== params.get("learnerId")) return false;
      const organizationId = params.get("organizationId");
      const activeOnly = params.get("activeContractsOnly") === "true";
      return !organizationId && !activeOnly || contracts.some((contract) => contract.learnerId === record.learnerId
        && (!organizationId || contract.employerId === organizationId || contract.schoolId === organizationId)
        && (!activeOnly || contract.status === "ACTIVE"));
    });
    return found(page(records, params));
  }
  if (resource === "lessons" && id === "me") return found(lessons);
  if (resource === "notification-recipients" && id === "me") return found(page(notificationRecipients, params));
  if (resource === "contracts" && id === "learner") return found(contracts.filter((contract) => contract.learnerId === relation));
  if (resource === "lessons" && relation === "files") return lessons.some((lesson) => lesson.id === id) ? found([]) : missing();
  if (resource === "activities" && id === "lesson") return found(activities.filter((activity) => activity.lessonId === relation));
  if (resource === "lesson-participants" && id === "lesson") return found(lessonParticipants.filter((participant) => participant.lessonId === relation));
  if (resource === "attendance-records" && id === "lesson") return found(attendanceRecords.filter((record) => record.lessonId === relation));
  const collection = collections[resource];
  if (!collection) return missing();
  if (!id) return found(page(collection, params));
  const record = collection.find((record) => String(record.id) === id);
  return record ? found(record) : missing();
}
