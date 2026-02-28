import { JobPosting, JobRecommendation, JobSearchFilters, UserProfile } from "@/types/jobs";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export class JobSearchService {
  static async searchJobs(
    query: string, 
    filters: Partial<JobSearchFilters> = {},
    userProfile?: UserProfile
  ): Promise<{ job: JobPosting; score: number }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.jobs) {
        console.log(`✅ Found ${data.jobs.length} jobs from ${data.source}`);
        
        // Calculate simple scores for display
        return data.jobs.map((job: JobPosting, index: number) => ({
          job,
          score: Math.max(95 - (index * 2), 60) // Simple scoring for display
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      
      // Fallback to static data if API fails
      console.log('🔄 Falling back to static data');
      return this.getStaticJobs(query, filters);
    }
  }
  
  static async getJobRecommendations(
    userSkills: string[],
    experienceLevel: string = "mid",
    userProfile?: Partial<UserProfile>
  ): Promise<JobRecommendation[]> {
    try {
      const fullUserProfile: UserProfile = {
        skills: userSkills,
        experience_level: experienceLevel,
        preferred_roles: userProfile?.preferred_roles || ['software developer'],
        location: userProfile?.location || '',
        salary_range: userProfile?.salary_range || { min: 0, max: 999999 },
        work_type: userProfile?.work_type || ''
      };

      const response = await fetch(`${API_BASE_URL}/api/jobs/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: fullUserProfile
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.recommendations) {
        console.log(`✅ Found ${data.recommendations.length} recommendations from ${data.source}`);
        return data.recommendations;
      } else {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      
      // Fallback to static recommendations
      console.log('🔄 Falling back to static recommendations');
      return this.getStaticRecommendations(userSkills, experienceLevel);
    }
  }

  // Static fallback methods (keep existing static data)
  private static getStaticJobs(query: string, filters: Partial<JobSearchFilters>): { job: JobPosting; score: number }[] {
    const mockJobs: JobPosting[] = [
      {
        id: "techcorp-senior-ds",
        title: "Senior Data Scientist",
        company: "TechCorp Inc",
        location: "San Francisco, CA",
        description: "We're looking for a Senior Data Scientist to join our AI team. You'll work on machine learning models, data analysis, and statistical modeling. Required skills include Python, SQL, machine learning, pandas, and scikit-learn. Experience with cloud platforms (AWS, GCP) is a plus.",
        skills_required: ["python", "sql", "machine learning", "pandas", "scikit-learn", "statistics", "data analysis"],
        experience_level: "senior",
        salary_range: "$130,000 - $180,000",
        job_type: "full-time",
        work_type: "hybrid",
        posted_date: "2024-01-15",
        source: "static",
        applicants: 23
      },
      {
        id: "ai-innovations-ml-eng",
        title: "Machine Learning Engineer",
        company: "AI Innovations",
        location: "Remote",
        description: "Join our ML engineering team to build and deploy machine learning systems at scale. We need someone with Python, TensorFlow/PyTorch, Docker, Kubernetes, and cloud experience. You'll work on MLOps, model deployment, and system architecture.",
        skills_required: ["python", "tensorflow", "pytorch", "docker", "kubernetes", "aws", "mlops"],
        experience_level: "mid",
        salary_range: "$110,000 - $150,000",
        job_type: "full-time",
        work_type: "remote",
        posted_date: "2024-01-12",
        source: "static",
        applicants: 45
      },
      {
        id: "finance-solutions-analyst",
        title: "Data Analyst",
        company: "Finance Solutions Ltd",
        location: "New York, NY",
        description: "Data Analyst position in financial services. Work with large datasets, create visualizations, and provide business insights. Requirements: SQL, Python, Excel, Tableau, and statistical analysis skills.",
        skills_required: ["sql", "python", "excel", "tableau", "statistics", "data visualization"],
        experience_level: "mid",
        salary_range: "$75,000 - $95,000",
        job_type: "full-time",
        work_type: "onsite",
        posted_date: "2024-01-10",
        source: "static",
        applicants: 67
      }
    ];

    const defaultFilters: JobSearchFilters = {
      location: "",
      experience_level: "",
      work_type: "",
      salary_min: 0,
      salary_max: 999999,
      skills: [],
      company_type: "",
      posted_within: "",
      ...filters
    };
    
    let filteredJobs = mockJobs;
    
    // Apply filters
    if (defaultFilters.experience_level) {
      filteredJobs = filteredJobs.filter(job => 
        job.experience_level === defaultFilters.experience_level
      );
    }
    
    if (defaultFilters.work_type) {
      filteredJobs = filteredJobs.filter(job => 
        job.work_type === defaultFilters.work_type
      );
    }
    
    if (defaultFilters.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(defaultFilters.location.toLowerCase())
      );
    }
    
    // Filter by query (title, company, description, skills)
    if (query.trim()) {
      const queryLower = query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(queryLower) ||
        job.company.toLowerCase().includes(queryLower) ||
        job.description.toLowerCase().includes(queryLower) ||
        job.skills_required.some(skill => skill.toLowerCase().includes(queryLower))
      );
    }
    
    // Calculate scores and sort
    const jobsWithScores = filteredJobs.map(job => ({
      job,
      score: this.calculateJobScore(job, query, defaultFilters)
    }));
    
    // Sort by score (highest first)
    jobsWithScores.sort((a, b) => b.score - a.score);
    
    return jobsWithScores;
  }

  private static calculateJobScore(job: JobPosting, query: string, filters: JobSearchFilters): number {
    let score = 0;
    
    // Title relevance (40% weight)
    const titleWords = job.title.toLowerCase().split(' ');
    const queryWords = query.toLowerCase().split(' ');
    const titleMatch = queryWords.some(word => 
      titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
    );
    if (titleMatch) score += 40;
    
    // Skills match (30% weight)
    const querySkills = query.toLowerCase().split(' ');
    const matchingSkills = job.skills_required.filter(skill => 
      querySkills.some(q => skill.toLowerCase().includes(q) || q.includes(skill.toLowerCase()))
    );
    const skillScore = (matchingSkills.length / Math.max(job.skills_required.length, 1)) * 30;
    score += skillScore;
    
    // Experience level match (15% weight)
    if (filters.experience_level && job.experience_level === filters.experience_level) {
      score += 15;
    }
    
    // Work type match (10% weight)
    if (filters.work_type && job.work_type === filters.work_type) {
      score += 10;
    }
    
    // Location match (5% weight)
    if (filters.location && job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  private static async getStaticRecommendations(
    userSkills: string[],
    experienceLevel: string = "mid"
  ): Promise<JobRecommendation[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockJobs: JobPosting[] = [
      {
        id: "techcorp-senior-ds",
        title: "Senior Data Scientist",
        company: "TechCorp Inc",
        location: "San Francisco, CA",
        description: "We're looking for a Senior Data Scientist to join our AI team.",
        skills_required: ["python", "sql", "machine learning", "pandas", "scikit-learn"],
        experience_level: "senior",
        salary_range: "$130,000 - $180,000",
        job_type: "full-time",
        work_type: "hybrid",
        source: "static"
      },
      {
        id: "ai-innovations-ml-eng",
        title: "Machine Learning Engineer",
        company: "AI Innovations",
        location: "Remote",
        description: "Join our ML engineering team to build and deploy machine learning systems at scale.",
        skills_required: ["python", "tensorflow", "pytorch", "docker", "kubernetes"],
        experience_level: "mid",
        salary_range: "$110,000 - $150,000",
        job_type: "full-time",
        work_type: "remote",
        source: "static"
      }
    ];
    
    const recommendations: JobRecommendation[] = mockJobs.map(job => {
      // Calculate skill match
      const matchingSkills = job.skills_required.filter(skill => 
        userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      const skillScore = (matchingSkills.length / job.skills_required.length) * 100;
      const experienceMatch = job.experience_level === experienceLevel ? 100 : 70;
      const roleRelevance = 80; // Base relevance
      const growthScore = job.experience_level === "senior" ? 95 : 85;
      
      const overallScore = (skillScore * 0.4 + experienceMatch * 0.3 + roleRelevance * 0.2 + growthScore * 0.1);
      
      const skillGaps = job.skills_required.filter(skill => 
        !userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      return {
        job,
        score: {
          skill_score: skillScore,
          role_relevance_score: roleRelevance,
          experience_match_score: experienceMatch,
          growth_score: growthScore,
          overall_score: overallScore
        },
        explanation: `This ${job.title} role matches ${matchingSkills.length} of your skills and offers great growth potential in ${job.company}.`,
        pros: [
          `Strong match with ${matchingSkills.length} of your skills`,
          `${job.experience_level} level position fits your experience`,
          `Competitive salary range: ${job.salary_range}`
        ],
        cons: skillGaps.length > 0 ? [
          `Requires additional skills: ${skillGaps.slice(0, 3).join(', ')}`
        ] : [],
        skill_gaps: skillGaps
      };
    });
    
    // Sort by overall score
    recommendations.sort((a, b) => b.score.overall_score - a.score.overall_score);
    
    return recommendations.slice(0, 10); // Return top 10
  }
}
