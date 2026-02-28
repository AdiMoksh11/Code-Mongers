export type CredentialType = "certificate" | "degree" | "license" | "badge";
export type CredentialStatus = "verified" | "pending";
export type AddMethod = "sync" | "upload" | "manual";
export type SortKey = "newest" | "oldest" | "az" | "za" | "pointsDesc" | "pointsAsc";

export interface Credential {
  credentialHash?: string;
  _id?: string;
  title: string;
  issuer: string;
  type: CredentialType;
  status: CredentialStatus;
  issueDate: string; // ISO
  description?: string;
  skills: string[];
  credentialUrl?: string;
  imageUrl?: string;
  nsqfLevel?: number;
  blockchainAddress?: string;
  transactionHash?: string;
  issuerLogo?: string;
  credentialId?: string;
  creditPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Platform {
  key: string;
  name: string;
  logo: string;
}

export interface SkillsData {
  categories: any;
  allSkills: string[];
  filterCategories: any[];
}

export interface CredentialDetails {
  credential: Credential;
  anchored?: boolean;
  blockchain?: {
    verified: boolean;
    issuer: string;
    timestampDate: string;
  };
  verificationUrl?: string;
}

export interface OnChainDetails {
  issuer: string;
  timestamp: number;
}

export interface CredentialFormValues {
  title: string;
  issuer: string;
  type: CredentialType;
  issueDate: any; // dayjs object
  description?: string;
  skills: string;
  credentialUrl?: string;
  nsqfLevel?: number;
  blockchainAddress?: string;
  transactionHash?: string;
  credentialId?: string;
  creditPoints?: number;
}

export interface CredentialFilters {
  search: string;
  typeFilter: string;
  statusFilter: string;
  issuerFilter: string;
  sortKey: SortKey;
}
