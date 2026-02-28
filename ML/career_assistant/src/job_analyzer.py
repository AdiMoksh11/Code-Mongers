"""
Job Analysis and Explanation Module for Career Assistant

This module provides detailed analysis and explanations for job recommendations,
including company reputation analysis, industry growth insights, and personalized advice.
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import re
from datetime import datetime

from job_scraper import JobPosting
from recommendation_engine import JobRecommendation
from user_profile import UserProfile


@dataclass
class CompanyInsight:
    """Insights about a company."""
    
    company_name: str
    industry: str
    company_size: str          # "startup", "small", "medium", "large", "enterprise"
    reputation_score: float    # 0-100
    growth_stage: str         # "early", "growth", "mature", "declining"
    culture_keywords: List[str]
    notable_benefits: List[str]
    remote_friendly: bool
    

@dataclass
class IndustryInsight:
    """Insights about an industry or technology sector."""
    
    sector: str
    growth_rate: str          # "high", "medium", "low", "declining"
    job_demand: str           # "very high", "high", "medium", "low"
    average_salary_trend: str # "increasing", "stable", "decreasing"
    future_outlook: str       # "excellent", "good", "fair", "uncertain"
    key_trends: List[str]
    emerging_skills: List[str]


class JobAnalyzer:
    """Comprehensive job analysis engine."""
    
    def __init__(self):
        self.company_database = self._load_company_data()
        self.industry_insights = self._load_industry_insights()
        self.salary_benchmarks = self._load_salary_benchmarks()
    
    def _load_company_data(self) -> Dict[str, CompanyInsight]:
        """Load company reputation and insight data."""
        # In a real implementation, this would come from a database or API
        return {
            "google": CompanyInsight(
                company_name="Google",
                industry="Technology",
                company_size="enterprise",
                reputation_score=95,
                growth_stage="mature",
                culture_keywords=["innovative", "data-driven", "collaborative"],
                notable_benefits=["Excellent health insurance", "Stock options", "Learning budget"],
                remote_friendly=True
            ),
            "microsoft": CompanyInsight(
                company_name="Microsoft",
                industry="Technology",
                company_size="enterprise",
                reputation_score=92,
                growth_stage="mature",
                culture_keywords=["inclusive", "growth mindset", "global"],
                notable_benefits=["Comprehensive benefits", "Flexible work", "Career development"],
                remote_friendly=True
            ),
            "amazon": CompanyInsight(
                company_name="Amazon",
                industry="Technology/E-commerce",
                company_size="enterprise",
                reputation_score=78,
                growth_stage="mature",
                culture_keywords=["customer obsessed", "fast-paced", "high standards"],
                notable_benefits=["Stock options", "Career advancement", "Global opportunities"],
                remote_friendly=False
            ),
            "netflix": CompanyInsight(
                company_name="Netflix",
                industry="Media/Technology",
                company_size="large",
                reputation_score=85,
                growth_stage="mature",
                culture_keywords=["freedom", "responsibility", "high performance"],
                notable_benefits=["Unlimited PTO", "Top of market pay", "Stock options"],
                remote_friendly=True
            ),
            # Default for unknown companies
            "unknown": CompanyInsight(
                company_name="Unknown Company",
                industry="Various",
                company_size="unknown",
                reputation_score=65,
                growth_stage="unknown",
                culture_keywords=["professional"],
                notable_benefits=["Standard benefits"],
                remote_friendly=False
            )
        }
    
    def _load_industry_insights(self) -> Dict[str, IndustryInsight]:
        """Load industry growth and trend insights."""
        return {
            "artificial intelligence": IndustryInsight(
                sector="Artificial Intelligence",
                growth_rate="high",
                job_demand="very high",
                average_salary_trend="increasing",
                future_outlook="excellent",
                key_trends=["Generative AI", "MLOps", "AI Ethics", "Edge AI"],
                emerging_skills=["Large Language Models", "Prompt Engineering", "AI Safety"]
            ),
            "cloud computing": IndustryInsight(
                sector="Cloud Computing",
                growth_rate="high",
                job_demand="very high",
                average_salary_trend="increasing",
                future_outlook="excellent",
                key_trends=["Multi-cloud", "Serverless", "Container orchestration", "DevOps"],
                emerging_skills=["Kubernetes", "Terraform", "Site Reliability Engineering"]
            ),
            "data science": IndustryInsight(
                sector="Data Science",
                growth_rate="medium",
                job_demand="high",
                average_salary_trend="stable",
                future_outlook="good",
                key_trends=["Real-time analytics", "AutoML", "Data governance", "Privacy"],
                emerging_skills=["MLOps", "Data mesh", "Federated learning"]
            ),
            "cybersecurity": IndustryInsight(
                sector="Cybersecurity",
                growth_rate="high",
                job_demand="very high",
                average_salary_trend="increasing",
                future_outlook="excellent",
                key_trends=["Zero trust", "Cloud security", "AI-powered threats", "Privacy"],
                emerging_skills=["Cloud security", "Threat hunting", "Security automation"]
            ),
            "web development": IndustryInsight(
                sector="Web Development",
                growth_rate="medium",
                job_demand="high",
                average_salary_trend="stable",
                future_outlook="good",
                key_trends=["JAMstack", "Progressive Web Apps", "WebAssembly", "Micro-frontends"],
                emerging_skills=["React", "TypeScript", "GraphQL", "Serverless"]
            ),
            "mobile development": IndustryInsight(
                sector="Mobile Development",
                growth_rate="medium",
                job_demand="medium",
                average_salary_trend="stable",
                future_outlook="fair",
                key_trends=["Cross-platform", "5G applications", "AR/VR", "IoT integration"],
                emerging_skills=["Flutter", "React Native", "SwiftUI", "Kotlin Multiplatform"]
            )
        }
    
    def _load_salary_benchmarks(self) -> Dict[str, Dict[str, int]]:
        """Load salary benchmarks by role and experience level."""
        return {
            "data scientist": {
                "entry": 75000,
                "mid": 110000,
                "senior": 150000,
                "executive": 200000
            },
            "software engineer": {
                "entry": 70000,
                "mid": 100000,
                "senior": 140000,
                "executive": 180000
            },
            "machine learning engineer": {
                "entry": 80000,
                "mid": 120000,
                "senior": 160000,
                "executive": 220000
            },
            "product manager": {
                "entry": 85000,
                "mid": 125000,
                "senior": 165000,
                "executive": 250000
            },
            "data analyst": {
                "entry": 55000,
                "mid": 75000,
                "senior": 95000,
                "executive": 125000
            }
        }
    
    def get_company_insight(self, company_name: str) -> CompanyInsight:
        """Get insights about a company."""
        company_key = company_name.lower().strip()
        
        # Try exact match first
        if company_key in self.company_database:
            return self.company_database[company_key]
        
        # Try partial match
        for key, insight in self.company_database.items():
            if key in company_key or company_key in key:
                return insight
        
        # Return default
        default_insight = self.company_database["unknown"]
        default_insight.company_name = company_name
        return default_insight
    
    def detect_industry_sector(self, job: JobPosting) -> str:
        """Detect the industry sector from job posting."""
        job_text = f"{job.title} {job.description}".lower()
        
        # Check for AI/ML keywords
        ai_keywords = ["ai", "artificial intelligence", "machine learning", "deep learning", "neural", "tensorflow", "pytorch"]
        if any(keyword in job_text for keyword in ai_keywords):
            return "artificial intelligence"
        
        # Check for cloud keywords
        cloud_keywords = ["cloud", "aws", "azure", "gcp", "kubernetes", "docker", "devops"]
        if any(keyword in job_text for keyword in cloud_keywords):
            return "cloud computing"
        
        # Check for data science keywords
        data_keywords = ["data scientist", "data analysis", "analytics", "pandas", "sql", "statistics"]
        if any(keyword in job_text for keyword in data_keywords):
            return "data science"
        
        # Check for security keywords
        security_keywords = ["security", "cybersecurity", "infosec", "penetration", "vulnerability"]
        if any(keyword in job_text for keyword in security_keywords):
            return "cybersecurity"
        
        # Check for web development keywords
        web_keywords = ["web developer", "frontend", "backend", "react", "angular", "vue", "html", "css"]
        if any(keyword in job_text for keyword in web_keywords):
            return "web development"
        
        # Check for mobile keywords
        mobile_keywords = ["mobile", "ios", "android", "swift", "kotlin", "react native", "flutter"]
        if any(keyword in job_text for keyword in mobile_keywords):
            return "mobile development"
        
        return "general technology"
    
    def get_industry_insight(self, sector: str) -> Optional[IndustryInsight]:
        """Get insights about an industry sector."""
        return self.industry_insights.get(sector.lower())
    
    def analyze_salary_competitiveness(self, job: JobPosting, user_profile: UserProfile) -> Dict[str, any]:
        """Analyze how competitive the job's salary is."""
        if not job.salary_range:
            return {"status": "unknown", "message": "Salary not specified"}
        
        # Extract salary numbers
        import re
        salary_numbers = re.findall(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', job.salary_range)
        
        if len(salary_numbers) < 2:
            return {"status": "unknown", "message": "Cannot parse salary range"}
        
        try:
            job_min = int(salary_numbers[0].replace(',', ''))
            job_max = int(salary_numbers[1].replace(',', ''))
            job_avg = (job_min + job_max) // 2
            
            # Find relevant benchmark
            job_title_lower = job.title.lower()
            benchmark_salary = None
            
            for role, salaries in self.salary_benchmarks.items():
                if role in job_title_lower:
                    benchmark_salary = salaries.get(user_profile.experience_level, salaries["mid"])
                    break
            
            if not benchmark_salary:
                return {"status": "unknown", "message": "No benchmark data available"}
            
            # Calculate competitiveness
            difference_pct = ((job_avg - benchmark_salary) / benchmark_salary) * 100
            
            if difference_pct >= 15:
                status = "above_market"
                message = f"Salary is {difference_pct:.0f}% above market average"
            elif difference_pct >= 5:
                status = "competitive"
                message = f"Salary is {difference_pct:.0f}% above market average"
            elif difference_pct >= -5:
                status = "market_rate"
                message = "Salary is at market rate"
            elif difference_pct >= -15:
                status = "below_market"
                message = f"Salary is {abs(difference_pct):.0f}% below market average"
            else:
                status = "significantly_below"
                message = f"Salary is {abs(difference_pct):.0f}% below market average"
            
            return {
                "status": status,
                "message": message,
                "job_range": f"${job_min:,} - ${job_max:,}",
                "market_benchmark": f"${benchmark_salary:,}",
                "difference_pct": difference_pct
            }
            
        except (ValueError, IndexError):
            return {"status": "unknown", "message": "Error parsing salary data"}
    
    def generate_detailed_explanation(self, recommendation: JobRecommendation, user_profile: UserProfile) -> str:
        """Generate a comprehensive explanation for why this job is recommended."""
        job = recommendation.job
        score = recommendation.score
        
        explanations = []
        
        # Company analysis
        company_insight = self.get_company_insight(job.company)
        if company_insight.reputation_score >= 80:
            explanations.append(
                f"{job.company} is a well-regarded company in the {company_insight.industry} "
                f"industry with a strong reputation for {', '.join(company_insight.culture_keywords[:2])}."
            )
        
        # Industry analysis
        sector = self.detect_industry_sector(job)
        industry_insight = self.get_industry_insight(sector)
        if industry_insight:
            if industry_insight.growth_rate == "high":
                explanations.append(
                    f"The {industry_insight.sector} sector is experiencing high growth with "
                    f"{industry_insight.job_demand} job demand and {industry_insight.average_salary_trend} salaries."
                )
            explanations.append(
                f"Key industry trends include {', '.join(industry_insight.key_trends[:3])}."
            )
        
        # Skill analysis
        coverage = recommendation.skill_analysis.coverage_percentage
        if coverage >= 80:
            explanations.append(
                f"Your skill set covers {coverage:.0f}% of the job requirements, "
                f"indicating excellent technical fit."
            )
        elif coverage >= 60:
            explanations.append(
                f"You meet {coverage:.0f}% of the technical requirements, "
                f"with opportunities to grow in {', '.join(recommendation.skill_gaps[:2])}."
            )
        
        # Career progression
        if score.experience_match_score >= 85:
            explanations.append("This role aligns perfectly with your current experience level.")
        elif score.experience_match_score >= 70:
            explanations.append("This represents a good step forward in your career progression.")
        
        # Salary analysis
        salary_analysis = self.analyze_salary_competitiveness(job, user_profile)
        if salary_analysis["status"] in ["above_market", "competitive"]:
            explanations.append(f"The compensation is competitive - {salary_analysis['message'].lower()}.")
        
        return " ".join(explanations)
    
    def generate_growth_opportunities(self, recommendation: JobRecommendation) -> List[str]:
        """Generate growth opportunities for this role."""
        opportunities = []
        job = recommendation.job
        
        # Detect sector for growth opportunities
        sector = self.detect_industry_sector(job)
        industry_insight = self.get_industry_insight(sector)
        
        if industry_insight:
            if industry_insight.future_outlook in ["excellent", "good"]:
                opportunities.append(
                    f"Strong industry growth potential in {industry_insight.sector}"
                )
            
            if industry_insight.emerging_skills:
                opportunities.append(
                    f"Opportunity to learn emerging skills: {', '.join(industry_insight.emerging_skills[:3])}"
                )
        
        # Company-based opportunities
        company_insight = self.get_company_insight(job.company)
        if company_insight.growth_stage in ["early", "growth"]:
            opportunities.append("High growth potential at an expanding company")
        
        if company_insight.company_size == "large" or company_insight.company_size == "enterprise":
            opportunities.append("Access to diverse projects and career paths at a large organization")
        
        # Role-specific opportunities
        job_title_lower = job.title.lower()
        if "senior" in job_title_lower:
            opportunities.append("Leadership and mentoring opportunities")
        if "lead" in job_title_lower or "principal" in job_title_lower:
            opportunities.append("Technical leadership and architecture responsibilities")
        
        return opportunities[:5]  # Return top 5 opportunities
    
    def generate_learning_path(self, recommendation: JobRecommendation) -> Dict[str, List[str]]:
        """Generate a detailed learning path for skill gaps."""
        skill_gaps = recommendation.skill_gaps
        learning_path = {}
        
        # Detailed learning suggestions for common skills
        skill_resources = {
            "python": {
                "beginner": ["Python.org tutorial", "Codecademy Python course", "Automate the Boring Stuff"],
                "intermediate": ["Real Python tutorials", "Python Tricks book", "Build 10 Python projects"],
                "advanced": ["Effective Python book", "Python design patterns", "Contribute to open source"]
            },
            "machine learning": {
                "beginner": ["Andrew Ng Coursera course", "Hands-On ML book", "Kaggle Learn"],
                "intermediate": ["Fast.ai course", "Scikit-learn documentation", "Kaggle competitions"],
                "advanced": ["Research papers", "Implement algorithms from scratch", "MLOps practices"]
            },
            "aws": {
                "beginner": ["AWS Cloud Practitioner cert", "AWS free tier tutorials", "A Cloud Guru"],
                "intermediate": ["AWS Solutions Architect cert", "Build cloud projects", "AWS Well-Architected"],
                "advanced": ["AWS Professional certifications", "Design enterprise solutions", "AWS re:Invent talks"]
            },
            "react": {
                "beginner": ["React official tutorial", "FreeCodeCamp React", "Build a portfolio site"],
                "intermediate": ["React hooks deep dive", "State management (Redux)", "Testing with Jest"],
                "advanced": ["React patterns", "Performance optimization", "Next.js framework"]
            }
        }
        
        for skill in skill_gaps:
            skill_lower = skill.lower()
            if skill_lower in skill_resources:
                learning_path[skill] = skill_resources[skill_lower]["beginner"]
            else:
                learning_path[skill] = [
                    f"Online course in {skill}",
                    f"Practice {skill} with hands-on projects",
                    f"Join {skill} community forums and discussions"
                ]
        
        return learning_path


def generate_comprehensive_report(recommendations: List[JobRecommendation], user_profile: UserProfile) -> str:
    """Generate a comprehensive report of all recommendations."""
    analyzer = JobAnalyzer()
    
    report_sections = []
    
    # Header
    report_sections.append("🎯 CAREER ASSISTANT RECOMMENDATION REPORT")
    report_sections.append("=" * 60)
    report_sections.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_sections.append(f"User: {user_profile.experience_level.title()} level professional")
    report_sections.append(f"Skills: {', '.join(user_profile.skills[:5])}{'...' if len(user_profile.skills) > 5 else ''}")
    report_sections.append("")
    
    # Executive Summary
    if recommendations:
        avg_score = sum(rec.score.overall_score for rec in recommendations) / len(recommendations)
        report_sections.append("📊 EXECUTIVE SUMMARY")
        report_sections.append("-" * 30)
        report_sections.append(f"• Found {len(recommendations)} high-quality job matches")
        report_sections.append(f"• Average compatibility score: {avg_score:.1f}/100")
        report_sections.append(f"• Top recommendation: {recommendations[0].job.title} at {recommendations[0].job.company}")
        report_sections.append("")
    
    # Detailed recommendations
    for i, rec in enumerate(recommendations, 1):
        report_sections.append(f"🔍 RECOMMENDATION #{i}")
        report_sections.append("-" * 40)
        report_sections.append(f"Position: {rec.job.title}")
        report_sections.append(f"Company: {rec.job.company}")
        report_sections.append(f"Location: {rec.job.location}")
        report_sections.append(f"Overall Score: {rec.score.overall_score:.1f}/100")
        report_sections.append("")
        
        # Detailed explanation
        detailed_explanation = analyzer.generate_detailed_explanation(rec, user_profile)
        report_sections.append(f"📝 Analysis: {detailed_explanation}")
        report_sections.append("")
        
        # Growth opportunities
        growth_ops = analyzer.generate_growth_opportunities(rec)
        if growth_ops:
            report_sections.append("🚀 Growth Opportunities:")
            for op in growth_ops:
                report_sections.append(f"   • {op}")
            report_sections.append("")
        
        # Skill gaps and learning path
        if rec.skill_gaps:
            report_sections.append(f"📚 Skills to Develop: {', '.join(rec.skill_gaps)}")
            learning_path = analyzer.generate_learning_path(rec)
            for skill, resources in list(learning_path.items())[:2]:  # Show top 2
                report_sections.append(f"   {skill}: {', '.join(resources[:2])}")
            report_sections.append("")
        
        report_sections.append("=" * 60)
        report_sections.append("")
    
    return "\n".join(report_sections)


if __name__ == "__main__":
    # Demonstration
    from user_profile import create_sample_profile
    from job_scraper import JobPosting
    from recommendation_engine import JobRecommendationEngine
    
    # Create sample data
    user_profile = create_sample_profile()
    sample_jobs = [
        JobPosting(
            title="Senior Data Scientist",
            company="Google",
            location="Mountain View, CA",
            description="Senior Data Scientist role focusing on machine learning and AI applications.",
            skills_required=["python", "machine learning", "tensorflow", "sql", "statistics"],
            experience_level="senior",
            salary_range="$150,000 - $200,000",
            work_type="hybrid"
        )
    ]
    
    # Generate recommendations
    engine = JobRecommendationEngine()
    recommendations = engine.recommend_jobs(user_profile, sample_jobs, top_k=1)
    
    # Generate comprehensive report
    report = generate_comprehensive_report(recommendations, user_profile)
    print(report)