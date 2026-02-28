"""
Job Recommendation System for Career Assistant

This module ranks jobs based on skill overlap, role relevance, and growth opportunities.
Provides comprehensive job recommendations with detailed scoring and explanations.
"""

import math
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

from user_profile import UserProfile
from job_scraper import JobPosting
from skill_matcher import SkillMatcher, SkillAnalysis


class GrowthFactor(Enum):
    """Growth factors for different industries and roles."""
    HIGH = 1.3      # AI/ML, Cloud, Cybersecurity
    MEDIUM = 1.1    # Software Development, Data
    STANDARD = 1.0  # Traditional roles
    DECLINING = 0.8 # Legacy technologies


@dataclass
class JobScore:
    """Comprehensive scoring for a job recommendation."""
    
    skill_score: float          # 0-100: Based on skill overlap
    role_relevance_score: float # 0-100: How well role matches preferences
    experience_match_score: float # 0-100: Experience level compatibility
    growth_score: float         # 0-100: Industry/role growth potential
    location_score: float       # 0-100: Location preference match
    salary_score: float         # 0-100: Salary range compatibility
    overall_score: float        # 0-100: Weighted total score
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary for easy access."""
        return {
            "skill_score": self.skill_score,
            "role_relevance_score": self.role_relevance_score,
            "experience_match_score": self.experience_match_score,
            "growth_score": self.growth_score,
            "location_score": self.location_score,
            "salary_score": self.salary_score,
            "overall_score": self.overall_score
        }


@dataclass
class JobRecommendation:
    """A job recommendation with scoring and explanation."""
    
    job: JobPosting
    score: JobScore
    skill_analysis: SkillAnalysis
    explanation: str
    pros: List[str]
    cons: List[str]
    skill_gaps: List[str]
    learning_suggestions: Dict[str, List[str]]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "job": self.job.to_dict(),
            "score": self.score.to_dict(),
            "explanation": self.explanation,
            "pros": self.pros,
            "cons": self.cons,
            "skill_gaps": self.skill_gaps,
            "learning_suggestions": self.learning_suggestions
        }


class JobRecommendationEngine:
    """Advanced job recommendation engine with multiple ranking factors."""
    
    def __init__(self):
        self.skill_matcher = SkillMatcher()
        
        # Scoring weights (should sum to 1.0)
        self.weights = {
            "skill_match": 0.35,        # Most important
            "role_relevance": 0.25,     # Second most important
            "experience_match": 0.15,   # Important for fit
            "growth_potential": 0.15,   # Future prospects
            "location_match": 0.05,     # Lower priority
            "salary_match": 0.05        # Lower priority
        }
        
        # Growth factors for different keywords
        self.growth_keywords = {
            GrowthFactor.HIGH: [
                "ai", "artificial intelligence", "machine learning", "ml", "deep learning",
                "cloud", "aws", "azure", "gcp", "kubernetes", "docker",
                "cybersecurity", "security", "blockchain", "cryptocurrency",
                "data science", "big data", "analytics", "python", "react"
            ],
            GrowthFactor.MEDIUM: [
                "software", "developer", "engineer", "programming", "web development",
                "mobile", "ios", "android", "devops", "automation",
                "database", "sql", "api", "microservices"
            ],
            GrowthFactor.DECLINING: [
                "flash", "silverlight", "vb6", "cobol", "fortran",
                "internet explorer", "jquery", "legacy"
            ]
        }
        
        # Experience level mappings
        self.experience_mapping = {
            "entry": ["entry", "junior", "associate", "intern", "graduate"],
            "mid": ["mid", "intermediate", "experienced", "developer", "analyst"],
            "senior": ["senior", "lead", "principal", "architect", "manager"],
            "executive": ["director", "vp", "chief", "head", "executive"]
        }
    
    def calculate_skill_score(self, user_profile: UserProfile, job: JobPosting) -> Tuple[float, SkillAnalysis]:
        """Calculate skill overlap score between user and job."""
        skill_analysis = self.skill_matcher.analyze_skill_compatibility(
            user_profile.skills, 
            job.skills_required
        )
        
        # Convert match score to 0-100 scale
        skill_score = skill_analysis.overall_match_score * 100
        
        # Bonus for coverage percentage
        coverage_bonus = (skill_analysis.coverage_percentage / 100) * 10
        skill_score = min(skill_score + coverage_bonus, 100)
        
        return skill_score, skill_analysis
    
    def calculate_role_relevance_score(self, user_profile: UserProfile, job: JobPosting) -> float:
        """Calculate how well the job role matches user preferences."""
        job_title_lower = job.title.lower()
        score = 0.0
        max_score = 0.0
        
        for preferred_role in user_profile.preferred_roles:
            role_lower = preferred_role.lower()
            max_score += 100
            
            # Exact match
            if role_lower in job_title_lower:
                score += 100
            # Partial match
            else:
                # Check for keyword overlap
                role_words = set(role_lower.split())
                title_words = set(job_title_lower.split())
                overlap = len(role_words.intersection(title_words))
                if overlap > 0:
                    partial_score = (overlap / len(role_words)) * 80
                    score += partial_score
        
        return (score / max_score * 100) if max_score > 0 else 0
    
    def calculate_experience_match_score(self, user_profile: UserProfile, job: JobPosting) -> float:
        """Calculate experience level compatibility."""
        if not job.experience_level:
            return 75  # Neutral score if not specified
        
        user_level = user_profile.experience_level.lower()
        job_level = job.experience_level.lower()
        
        # Direct match
        if user_level == job_level:
            return 100
        
        # Check if user level keywords appear in job level
        user_keywords = self.experience_mapping.get(user_level, [])
        for keyword in user_keywords:
            if keyword in job_level:
                return 90
        
        # Experience progression logic
        level_hierarchy = ["entry", "mid", "senior", "executive"]
        
        try:
            user_index = level_hierarchy.index(user_level)
            job_index = level_hierarchy.index(job_level)
            
            difference = abs(user_index - job_index)
            
            if difference == 0:
                return 100
            elif difference == 1:
                # One level difference - still good
                if user_index > job_index:
                    return 85  # Overqualified but okay
                else:
                    return 70  # Stretch opportunity
            elif difference == 2:
                return 40  # Significant mismatch
            else:
                return 20  # Poor match
                
        except ValueError:
            return 50  # Unknown levels, neutral score
    
    def calculate_growth_score(self, job: JobPosting) -> float:
        """Calculate growth potential based on industry and technologies."""
        job_text = f"{job.title} {job.description}".lower()
        
        # Check for growth factor keywords
        for growth_factor, keywords in self.growth_keywords.items():
            for keyword in keywords:
                if keyword in job_text:
                    if growth_factor == GrowthFactor.HIGH:
                        return 95
                    elif growth_factor == GrowthFactor.MEDIUM:
                        return 75
                    elif growth_factor == GrowthFactor.DECLINING:
                        return 30
        
        # Default score if no specific keywords found
        return 60
    
    def calculate_location_score(self, user_profile: UserProfile, job: JobPosting) -> float:
        """Calculate location compatibility score."""
        if not user_profile.location or not job.location:
            return 75  # Neutral if not specified
        
        user_location = user_profile.location.lower()
        job_location = job.location.lower()
        
        # Handle remote work
        if "remote" in job_location:
            return 100
        
        # Exact location match
        if user_location in job_location or job_location in user_location:
            return 100
        
        # Same city
        user_parts = user_location.split(",")
        job_parts = job_location.split(",")
        
        if len(user_parts) > 0 and len(job_parts) > 0:
            if user_parts[0].strip() == job_parts[0].strip():
                return 90
        
        # Same state/region
        if len(user_parts) > 1 and len(job_parts) > 1:
            if user_parts[-1].strip() == job_parts[-1].strip():
                return 60
        
        return 30  # Different locations
    
    def calculate_salary_score(self, user_profile: UserProfile, job: JobPosting) -> float:
        """Calculate salary compatibility score."""
        if not user_profile.salary_range or not job.salary_range:
            return 75  # Neutral if not specified
        
        # Extract salary numbers from job posting
        import re
        salary_numbers = re.findall(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', job.salary_range)
        
        if len(salary_numbers) < 2:
            return 75  # Can't parse salary
        
        try:
            job_min = int(salary_numbers[0].replace(',', ''))
            job_max = int(salary_numbers[1].replace(',', ''))
            
            user_min = user_profile.salary_range["min"]
            user_max = user_profile.salary_range["max"]
            
            # Check for overlap
            if job_max >= user_min and job_min <= user_max:
                # Calculate overlap percentage
                overlap_start = max(job_min, user_min)
                overlap_end = min(job_max, user_max)
                overlap_size = overlap_end - overlap_start
                
                user_range_size = user_max - user_min
                overlap_percentage = overlap_size / user_range_size
                
                return min(80 + (overlap_percentage * 20), 100)
            
            # No overlap
            if job_max < user_min:
                return 20  # Too low
            else:
                return 40  # Too high (but might be negotiable)
                
        except (ValueError, IndexError):
            return 75  # Parsing error, neutral score
    
    def generate_job_explanation(self, recommendation: JobRecommendation) -> str:
        """Generate a detailed explanation for the job recommendation."""
        job = recommendation.job
        score = recommendation.score
        analysis = recommendation.skill_analysis
        
        explanation_parts = []
        
        # Opening statement
        explanation_parts.append(
            f"This {job.title} position at {job.company} is a "
            f"{self._get_match_quality(score.overall_score)} match for your profile."
        )
        
        # Skill analysis
        if score.skill_score >= 80:
            explanation_parts.append(
                f"Your skills align excellently with the requirements, "
                f"covering {analysis.coverage_percentage:.0f}% of the needed skills."
            )
        elif score.skill_score >= 60:
            explanation_parts.append(
                f"You have solid skill overlap with {analysis.coverage_percentage:.0f}% "
                f"coverage of requirements, with some growth opportunities."
            )
        else:
            explanation_parts.append(
                f"While there are skill gaps to address, this role offers significant "
                f"learning opportunities in {', '.join(analysis.missing_skills[:3])}."
            )
        
        # Role relevance
        if score.role_relevance_score >= 80:
            explanation_parts.append("The role closely matches your career preferences.")
        elif score.role_relevance_score >= 60:
            explanation_parts.append("This role aligns well with your career direction.")
        
        # Growth potential
        if score.growth_score >= 80:
            explanation_parts.append("The position is in a high-growth area with excellent future prospects.")
        elif score.growth_score >= 60:
            explanation_parts.append("The role offers good career growth opportunities.")
        
        return " ".join(explanation_parts)
    
    def _get_match_quality(self, score: float) -> str:
        """Get qualitative description of match quality."""
        if score >= 85:
            return "excellent"
        elif score >= 75:
            return "very good"
        elif score >= 65:
            return "good"
        elif score >= 50:
            return "fair"
        else:
            return "developing"
    
    def generate_pros_and_cons(self, job: JobPosting, score: JobScore, analysis: SkillAnalysis) -> Tuple[List[str], List[str]]:
        """Generate pros and cons for the job."""
        pros = []
        cons = []
        
        # Skill-based pros/cons
        if score.skill_score >= 80:
            pros.append(f"Strong skill match ({analysis.coverage_percentage:.0f}% coverage)")
        elif score.skill_score < 50:
            cons.append("Significant skill gaps to address")
        
        if len(analysis.additional_skills) > 2:
            pros.append("You bring additional valuable skills beyond requirements")
        
        # Experience match
        if score.experience_match_score >= 85:
            pros.append("Perfect experience level match")
        elif score.experience_match_score < 50:
            cons.append("Experience level mismatch")
        
        # Growth potential
        if score.growth_score >= 80:
            pros.append("High-growth industry/technology")
        elif score.growth_score < 40:
            cons.append("Limited growth potential in this area")
        
        # Location
        if score.location_score >= 90:
            pros.append("Excellent location match")
        elif score.location_score < 40:
            cons.append("Location may not be ideal")
        
        # Company and role specific
        if job.work_type == "remote":
            pros.append("Remote work opportunity")
        
        if job.salary_range:
            if score.salary_score >= 80:
                pros.append("Competitive salary range")
            elif score.salary_score < 40:
                cons.append("Salary may not meet expectations")
        
        return pros, cons
    
    def recommend_jobs(self, user_profile: UserProfile, jobs: List[JobPosting], top_k: int = 5) -> List[JobRecommendation]:
        """Generate top-k job recommendations with detailed analysis."""
        recommendations = []
        
        print(f"🤖 Analyzing {len(jobs)} jobs for recommendations...")
        
        for job in jobs:
            # Calculate all scores
            skill_score, skill_analysis = self.calculate_skill_score(user_profile, job)
            role_score = self.calculate_role_relevance_score(user_profile, job)
            experience_score = self.calculate_experience_match_score(user_profile, job)
            growth_score = self.calculate_growth_score(job)
            location_score = self.calculate_location_score(user_profile, job)
            salary_score = self.calculate_salary_score(user_profile, job)
            
            # Calculate weighted overall score
            overall_score = (
                skill_score * self.weights["skill_match"] +
                role_score * self.weights["role_relevance"] +
                experience_score * self.weights["experience_match"] +
                growth_score * self.weights["growth_potential"] +
                location_score * self.weights["location_match"] +
                salary_score * self.weights["salary_match"]
            )
            
            job_score = JobScore(
                skill_score=skill_score,
                role_relevance_score=role_score,
                experience_match_score=experience_score,
                growth_score=growth_score,
                location_score=location_score,
                salary_score=salary_score,
                overall_score=overall_score
            )
            
            # Generate learning suggestions
            learning_suggestions = self.skill_matcher.get_skill_improvement_suggestions(
                skill_analysis.missing_skills
            )
            
            # Create recommendation
            recommendation = JobRecommendation(
                job=job,
                score=job_score,
                skill_analysis=skill_analysis,
                explanation="",  # Will be generated
                pros=[],        # Will be generated
                cons=[],        # Will be generated
                skill_gaps=skill_analysis.missing_skills,
                learning_suggestions=learning_suggestions
            )
            
            # Generate explanation and pros/cons
            recommendation.explanation = self.generate_job_explanation(recommendation)
            recommendation.pros, recommendation.cons = self.generate_pros_and_cons(
                job, job_score, skill_analysis
            )
            
            recommendations.append(recommendation)
        
        # Sort by overall score and return top-k
        recommendations.sort(key=lambda x: x.score.overall_score, reverse=True)
        
        print(f"✅ Generated {len(recommendations)} recommendations")
        return recommendations[:top_k]


def demonstrate_recommendations():
    """Demonstrate the recommendation system."""
    from user_profile import create_sample_profile
    from job_scraper import JobPosting
    
    # Create sample user profile
    user_profile = create_sample_profile()
    
    # Create sample jobs
    sample_jobs = [
        JobPosting(
            title="Senior Data Scientist",
            company="Tech Corp",
            location="San Francisco, CA",
            description="Looking for a Senior Data Scientist with Python, ML, and SQL experience.",
            skills_required=["python", "machine learning", "sql", "pandas", "scikit-learn"],
            experience_level="senior",
            salary_range="$120,000 - $180,000",
            work_type="hybrid"
        ),
        JobPosting(
            title="Machine Learning Engineer",
            company="AI Startup",
            location="Remote",
            description="ML Engineer role requiring Python, TensorFlow, and cloud platforms.",
            skills_required=["python", "tensorflow", "aws", "docker", "kubernetes"],
            experience_level="mid",
            salary_range="$100,000 - $150,000",
            work_type="remote"
        ),
        JobPosting(
            title="Data Analyst",
            company="Finance Co",
            location="New York, NY",
            description="Data Analyst position requiring SQL, Excel, and basic Python.",
            skills_required=["sql", "excel", "python", "tableau"],
            experience_level="entry",
            salary_range="$60,000 - $80,000",
            work_type="onsite"
        )
    ]
    
    # Generate recommendations
    engine = JobRecommendationEngine()
    recommendations = engine.recommend_jobs(user_profile, sample_jobs, top_k=3)
    
    # Display results
    print("\n🎯 TOP JOB RECOMMENDATIONS")
    print("=" * 60)
    
    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. {rec.job.title} at {rec.job.company}")
        print(f"   Overall Score: {rec.score.overall_score:.1f}/100")
        print(f"   Location: {rec.job.location}")
        print(f"   Salary: {rec.job.salary_range}")
        print(f"\n   📝 {rec.explanation}")
        
        if rec.pros:
            print(f"\n   ✅ Pros:")
            for pro in rec.pros:
                print(f"      • {pro}")
        
        if rec.cons:
            print(f"\n   ⚠️  Considerations:")
            for con in rec.cons:
                print(f"      • {con}")
        
        if rec.skill_gaps:
            print(f"\n   📚 Skills to develop: {', '.join(rec.skill_gaps)}")
        
        print("-" * 60)


if __name__ == "__main__":
    demonstrate_recommendations()