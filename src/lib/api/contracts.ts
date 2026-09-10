import type { Role } from "@/domain/auth";

export type ApiResponse<T> = {
  timestamp: string;
  status: string;
  message: string;
  data: T;
};

export type ApiFieldError = {
  field: string;
  message: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type AuthChallengePurpose =
  | "EMAIL_VERIFICATION"
  | "MFA_LOGIN"
  | "PASSWORD_RESET";

export type AuthChallengeResponse = {
  challengeId: string;
  purpose: AuthChallengePurpose;
  maskedEmail: string;
  expiresAt: string;
  maxAttempts: number;
};

export type BackendAccessTokenResponse = {
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  subject: string;
  token: string;
  refreshTokenExpiresAt: string;
};

export type SessionTokenResponse = Omit<BackendAccessTokenResponse, "token">;

export type UserAccountStatus = "INVITED" | "ACTIVE" | "LOCKED" | "DISABLED";

export type UserResponse = {
  id: string;
  personId: string;
  displayName: string;
  loginEmail: string;
  status: UserAccountStatus;
  roles: Role[] | string[];
  emailVerifiedAt: string | null;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CurrentUserContextResponse = {
  user: UserResponse;
  learnerId: string | null;
  organizationIds: string[];
};
