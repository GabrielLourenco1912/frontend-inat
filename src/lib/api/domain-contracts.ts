export type RecordStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type OrganizationType = "EMPLOYER" | "SCHOOL";
export type CohortStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type EnrollmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ContractStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ENDED" | "CANCELLED";
export type DeliveryMode = "ONSITE" | "ONLINE";
export type LessonStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ParticipationType = "REGULAR" | "TRANSFERRED" | "MAKEUP" | "EXTRA";
export type ParticipationStatus = "EXPECTED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | "PARTIAL";
export type ActivityStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";
export type SubmissionStatus = "DRAFT" | "SUBMITTED" | "LATE" | "GRADED" | "RETURNED";
export type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
export type NotificationAudienceType = "USER" | "COHORT" | "ALL";
export type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type NotificationDeliveryStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

export type Address = {
  id: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  addressLine2: string | null;
  district: string;
  city: string;
  stateCode: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: string;
  address: Address;
  fullName: string;
  taxId: string;
  contactEmail: string | null;
  phoneNumber: string;
  birthDate: string;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  parentOrganizationId: string | null;
  address: Address;
  organizationType: OrganizationType;
  legalName: string;
  tradeName: string | null;
  taxId: string;
  contactEmail: string;
  phoneNumber: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMembership = {
  id: string;
  personId: string;
  organizationId: string;
  membershipRole: string;
  jobTitle: string | null;
  startDate: string;
  endDate: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type Learner = {
  id: string;
  personId: string;
  registrationNumber: string;
  hasCompletedHighSchool: boolean;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
};

export type LearnerGuardian = {
  learnerId: string;
  guardianPersonId: string;
  guardianName: string;
  relationshipType: string;
  legalGuardian: boolean;
  primaryContact: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Cohort = {
  id: string;
  code: string;
  name: string;
  defaultWeekday: number;
  shiftCode: string;
  startDate: string;
  endDate: string | null;
  status: CohortStatus;
  createdAt: string;
  updatedAt: string;
};

export type CohortEnrollment = {
  id: string;
  contractId: string;
  cohortId: string;
  learnerId: string;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type Contract = {
  id: string;
  learnerId: string;
  employerId: string;
  schoolId: string | null;
  startDate: string;
  endDate: string | null;
  monthlySalary: number;
  weeklyWorkloadMinutes: number;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
};

export type Lesson = {
  id: string;
  cohortId: string;
  instructorPersonId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  deliveryMode: DeliveryMode;
  room: string | null;
  meetingUrl: string | null;
  externalLessonUrl: string | null;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
};

export type LessonParticipant = {
  id: string;
  lessonId: string;
  learnerId: string;
  sourceEnrollmentId: string | null;
  assignedByUserId: string | null;
  participationType: ParticipationType;
  status: ParticipationStatus;
  assignmentReason: string | null;
  assignedAt: string;
  updatedAt: string;
};

export type AttendanceRecord = {
  id: string;
  lessonParticipantId: string;
  lessonId: string;
  learnerId: string;
  recordedByUserId: string;
  status: AttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  recordedAt: string;
  notes: string | null;
  updatedAt: string;
};

export type Activity = {
  id: string;
  lessonId: string;
  createdByUserId: string;
  title: string;
  description: string;
  availableAt: string;
  dueAt: string;
  maxScore: number | null;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
};

export type ActivitySubmission = {
  id: string;
  activityId: string;
  learnerId: string;
  gradedByUserId: string | null;
  textAnswer: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredFile = {
  id: string;
  uploadedByUserId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  createdAt: string;
};

export type ActivityFile = {
  activityId: string;
  file: StoredFile;
  sortOrder: number;
  createdAt: string;
};

export type SubmissionFile = {
  submissionId: string;
  file: StoredFile;
  createdAt: string;
};

export type DocumentType = {
  id: number;
  code: string;
  name: string;
  description: string | null;
};

export type PersonDocument = {
  id: string;
  personId: string;
  file: StoredFile;
  documentTypeId: number;
  documentNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  verificationStatus: DocumentVerificationStatus;
  verifiedByUserId: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContractDocument = {
  id: string;
  contractId: string;
  file: StoredFile;
  documentTypeId: number;
  versionNumber: number;
  current: boolean;
  createdAt: string;
};

export type Notification = {
  id: string;
  createdByUserId: string;
  audience: { type: NotificationAudienceType; targetId: string | null };
  notificationType: string;
  title: string;
  message: string;
  actionUrl: string | null;
  contextType: string | null;
  contextId: string | null;
  payload: string | null;
  priority: NotificationPriority;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationRecipient = {
  id: string;
  notificationId: string;
  recipientUserId: string;
  channel: NotificationChannel;
  deliveryStatus: NotificationDeliveryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failureReason: string | null;
  notificationType: string;
  title: string;
  message: string;
  actionUrl: string | null;
  contextType: string | null;
  contextId: string | null;
  priority: NotificationPriority;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoleRecord = {
  id: number;
  code: string;
  name: string;
  description: string | null;
};

export type UserRole = {
  userId: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  grantedByUserId: string;
  grantedAt: string;
};
