export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills_required: string[];
  experience_level?: string;
  salary_range?: string;
  job_type?: string;
  work_type?: string;
  url?: string;
  posted_date?: string;
  source: string;
  applicants?: number;
}

export interface JobScore {
  skill_score: number;
  role_relevance_score: number;
  experience_match_score: number;
  growth_score: number;
  location_score?: number;
  overall_score: number;
}

export interface JobRecommendation {
  job: JobPosting;
  score: JobScore;
  explanation: string;
  pros: string[];
  cons: string[];
  skill_gaps: string[];
  learning_suggestions?: Record<string, string[]>;
}

export interface UserProfile {
  skills: string[];
  experience_level: string;
  preferred_roles: string[];
  location: string;
  salary_range: {
    min: number;
    max: number;
  };
  work_type: string;
  bio?: string;
  years_experience?: number;
  education_level?: string;
  certifications?: string[];
  industries?: string[];
  company_size_preference?: string;
  remote_preference?: boolean;
}

export interface JobSearchFilters {
  location: string;
  experience_level: string;
  work_type: string;
  salary_min: number;
  salary_max: number;
  skills: string[];
  company_type: string;
  posted_within: string;
}
