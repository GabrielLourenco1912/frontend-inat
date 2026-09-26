import { apiLabel } from "@/lib/api/format";
import type {
  CohortStatus,
  ContactMessageStatus,
  ContractStatus,
  LessonStatus,
  RecordStatus,
} from "@/lib/api/domain-contracts";

function options<T extends string>(statuses: readonly T[]) {
  return statuses.map((value) => ({ value, label: apiLabel(value) }));
}

export const recordStatusOptions = options(["ACTIVE", "INACTIVE", "SUSPENDED"] satisfies RecordStatus[]);
export const contractStatusOptions = options(["DRAFT", "ACTIVE", "SUSPENDED", "ENDED", "CANCELLED"] satisfies ContractStatus[]);
export const cohortStatusOptions = options(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] satisfies CohortStatus[]);
export const lessonStatusOptions = options(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] satisfies LessonStatus[]);
export const contactMessageStatusOptions = options(["NEW", "READ", "ARCHIVED"] satisfies ContactMessageStatus[]);
