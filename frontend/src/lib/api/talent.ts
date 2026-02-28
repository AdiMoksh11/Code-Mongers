import api from "@/utils/axios";

export type CandidateListItem = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  role: string;
  scores: { efficiency: number; social: number; performance: number };
  topSkills: string[];
  onChainVerified?: boolean;
};

export type UserProject = {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CandidateProfile = CandidateListItem & {
  skills: { subject: string; A: number; fullMark: number }[];
  email: string | null;
  phone: string | null;
  resume?: {
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    uploadedAt?: string;
    fileSize?: number;
  } | null;
  projects?: UserProject[];
  verifiedCredentials: { id: string; issuer: string; name: string; date: string }[];
};

export async function searchLearners(params: { q?: string; skills?: string[]; page?: number; limit?: number }) {
  const { q = "", skills = [], page = 1, limit = 24 } = params;
  const skillsParam = skills.join(",");
  const res = await api.get(`/api/users/search`, { params: { q, skills: skillsParam, page, limit } });
  return res.data as { success: boolean; total: number; page: number; limit: number; candidates: CandidateListItem[] };
}

export async function fetchPublicProfile(userId: string) {
  const res = await api.get(`/api/users/${userId}/public-profile`);
  return res.data as { success: boolean; candidate: CandidateProfile };
}

export async function fetchPublicProfileSecure(userId: string) {
  const res = await api.get(`/api/users/${userId}/public-profile-secure`);
  return res.data as { success: boolean; candidate: CandidateProfile };
}
