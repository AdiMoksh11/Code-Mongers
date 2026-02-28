"""
Career Assistant - Main Application

An intelligent career assistant that helps users find relevant job opportunities
based on their skills, experience, and preferences. Provides personalized
job recommendations with detailed analysis and skill gap identification.
"""

import os
import sys
import json
import argparse
from typing import List, Optional
from datetime import datetime

# Add src directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
sys.path.insert(0, src_path)

# Import all the modules from src directory
try:
    from user_profile import UserProfile, UserProfileBuilder, create_sample_profile
    from job_scraper import JobAggregator, JobPosting
    from recommendation_engine import JobRecommendationEngine
    from job_analyzer import generate_comprehensive_report
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Current directory: {current_dir}")
    print(f"Src path: {src_path}")
    print(f"Src exists: {os.path.exists(src_path)}")
    if os.path.exists(src_path):
        print(f"Files in src: {os.listdir(src_path)}")
    sys.exit(1)


class CareerAssistant:
    """Main application class for the Career Assistant."""
    
    def __init__(self):
        self.job_aggregator = JobAggregator()
        self.recommendation_engine = JobRecommendationEngine()
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        
        # Create data directory if it doesn't exist
        os.makedirs(self.data_dir, exist_ok=True)
    
    def create_user_profile(self, interactive: bool = True) -> UserProfile:
        """Create a user profile either interactively or with sample data."""
        if interactive:
            print("👋 Welcome to the Career Assistant!")
            print("Let's create your professional profile.\n")
            try:
                profile = UserProfileBuilder.build_interactive_profile()
                return profile
            except (KeyboardInterrupt, EOFError):
                print("\n\n⚠️  Profile creation cancelled. Using sample profile for demonstration.")
                return create_sample_profile()
        else:
            print("📝 Using sample profile for demonstration...")
            return create_sample_profile()
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for jobs using the job aggregator."""
        print(f"\n🔍 Searching for '{query}' jobs...")
        if location:
            print(f"📍 Location: {location}")
        
        jobs = self.job_aggregator.search_all_sources(query, location, limit // 2)
        
        if not jobs:
            print("⚠️  No jobs found. Using sample data for demonstration.")
            jobs = self._get_sample_jobs()
        
        return jobs
    
    def _get_sample_jobs(self) -> List[JobPosting]:
        """Get sample jobs for demonstration when scraping fails."""
        return [
            JobPosting(
                title="Senior Data Scientist",
                company="TechCorp Inc",
                location="San Francisco, CA",
                description="We're looking for a Senior Data Scientist to join our AI team. You'll work on machine learning models, data analysis, and statistical modeling. Required skills include Python, SQL, machine learning, pandas, and scikit-learn. Experience with cloud platforms (AWS, GCP) is a plus.",
                skills_required=["python", "sql", "machine learning", "pandas", "scikit-learn", "statistics", "data analysis"],
                experience_level="senior",
                salary_range="$130,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                source="sample"
            ),
            JobPosting(
                title="Machine Learning Engineer",
                company="AI Innovations",
                location="Remote",
                description="Join our ML engineering team to build and deploy machine learning systems at scale. We need someone with Python, TensorFlow/PyTorch, Docker, Kubernetes, and cloud experience. You'll work on MLOps, model deployment, and system architecture.",
                skills_required=["python", "tensorflow", "pytorch", "docker", "kubernetes", "aws", "mlops"],
                experience_level="mid",
                salary_range="$110,000 - $150,000",
                job_type="full-time",
                work_type="remote",
                source="sample"
            ),
            JobPosting(
                title="Data Analyst",
                company="Finance Solutions Ltd",
                location="New York, NY",
                description="Data Analyst position in financial services. Work with large datasets, create visualizations, and provide business insights. Requirements: SQL, Python, Excel, Tableau, and statistical analysis skills.",
                skills_required=["sql", "python", "excel", "tableau", "statistics", "data visualization"],
                experience_level="mid",
                salary_range="$75,000 - $95,000",
                job_type="full-time",
                work_type="onsite",
                source="sample"
            ),
            JobPosting(
                title="Python Developer",
                company="WebTech Solutions",
                location="Austin, TX",
                description="Full-stack Python developer role. Build web applications using Django/Flask, work with databases, and integrate APIs. Skills needed: Python, Django, JavaScript, HTML/CSS, PostgreSQL, Git.",
                skills_required=["python", "django", "javascript", "html", "css", "postgresql", "git"],
                experience_level="mid",
                salary_range="$85,000 - $115,000",
                job_type="full-time",
                work_type="hybrid",
                source="sample"
            ),
            JobPosting(
                title="Junior Data Scientist",
                company="StartupTech",
                location="Boston, MA",
                description="Entry-level Data Scientist position perfect for recent graduates. Work on predictive modeling, data cleaning, and analysis. Training provided. Requirements: Python, SQL, basic machine learning knowledge.",
                skills_required=["python", "sql", "machine learning", "pandas", "statistics"],
                experience_level="entry",
                salary_range="$65,000 - $85,000",
                job_type="full-time",
                work_type="onsite",
                source="sample"
            ),
            JobPosting(
                title="Cloud Data Engineer",
                company="CloudFirst Corp",
                location="Seattle, WA",
                description="Design and implement cloud-based data pipelines. Work with AWS services, Apache Spark, and big data technologies. Requirements: Python, SQL, AWS, Spark, data engineering experience.",
                skills_required=["python", "sql", "aws", "spark", "data engineering", "etl"],
                experience_level="senior",
                salary_range="$120,000 - $160,000",
                job_type="full-time",
                work_type="hybrid",
                source="sample"
            )
        ]
    
    def get_recommendations(self, user_profile: UserProfile, jobs: List[JobPosting], top_k: int = None):
        """Get job recommendations based on user profile."""
        # If no top_k specified, show all jobs
        if top_k is None:
            top_k = len(jobs)
        
        print(f"\n🤖 Analyzing {len(jobs)} jobs to find your best matches...")
        
        recommendations = self.recommendation_engine.recommend_jobs(
            user_profile, jobs, top_k
        )
        
        return recommendations
    
    def display_recommendations(self, recommendations, detailed: bool = True):
        """Display job recommendations to the user."""
        if not recommendations:
            print("😔 No suitable job recommendations found.")
            return
        
        print(f"\n🎯 TOP {len(recommendations)} JOB RECOMMENDATIONS")
        print("=" * 80)
        
        for i, rec in enumerate(recommendations, 1):
            job = rec.job
            score = rec.score
            
            print(f"\n{i}. {job.title}")
            print(f"   Company: {job.company}")
            print(f"   Location: {job.location}")
            print(f"   Salary: {job.salary_range or 'Not specified'}")
            print(f"   Work Type: {job.work_type or 'Not specified'}")
            print(f"   Overall Score: {score.overall_score:.1f}/100")
            
            if detailed:
                print(f"\n   📊 Score Breakdown:")
                print(f"      • Skill Match: {score.skill_score:.1f}/100")
                print(f"      • Role Relevance: {score.role_relevance_score:.1f}/100")
                print(f"      • Experience Fit: {score.experience_match_score:.1f}/100")
                print(f"      • Growth Potential: {score.growth_score:.1f}/100")
                
                print(f"\n   📝 Why this job fits:")
                print(f"      {rec.explanation}")
                
                if rec.pros:
                    print(f"\n   ✅ Strengths:")
                    for pro in rec.pros[:3]:  # Show top 3
                        print(f"      • {pro}")
                
                if rec.cons:
                    print(f"\n   ⚠️  Considerations:")
                    for con in rec.cons[:3]:  # Show top 3
                        print(f"      • {con}")
                
                if rec.skill_gaps:
                    print(f"\n   📚 Skills to develop:")
                    print(f"      {', '.join(rec.skill_gaps[:5])}")
                    
                    # Show learning suggestions for top skill gap
                    if rec.learning_suggestions and rec.skill_gaps:
                        top_skill = rec.skill_gaps[0]
                        if top_skill in rec.learning_suggestions:
                            print(f"\n   💡 How to learn {top_skill}:")
                            for suggestion in rec.learning_suggestions[top_skill][:2]:
                                print(f"      • {suggestion}")
            
            print("-" * 80)
    
    def save_results(self, user_profile: UserProfile, recommendations, filename: Optional[str] = None):
        """Save results to files."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"career_recommendations_{timestamp}"
        
        # Save detailed report
        report_file = os.path.join(self.data_dir, f"{filename}_report.txt")
        comprehensive_report = generate_comprehensive_report(recommendations, user_profile)
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(comprehensive_report)
        
        # Save JSON data
        json_file = os.path.join(self.data_dir, f"{filename}_data.json")
        data = {
            "user_profile": {
                "skills": user_profile.skills,
                "experience_level": user_profile.experience_level,
                "preferred_roles": user_profile.preferred_roles,
                "location": user_profile.location,
                "salary_range": user_profile.salary_range,
                "work_type": user_profile.work_type
            },
            "recommendations": [rec.to_dict() for rec in recommendations],
            "generated_at": datetime.now().isoformat()
        }
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results saved:")
        print(f"   📄 Detailed report: {report_file}")
        print(f"   📊 Data file: {json_file}")
    
    def run_interactive_session(self):
        """Run an interactive career assistance session."""
        print("🚀 CAREER ASSISTANT")
        print("=" * 50)
        print("Find the perfect job match based on your skills and preferences!\n")
        
        try:
            # Step 1: Create user profile
            profile = self.create_user_profile(interactive=True)
            
            # Step 2: Get job search parameters
            print("\n🔍 JOB SEARCH PARAMETERS")
            print("-" * 30)
            
            # Use preferred roles to build search query
            if profile.preferred_roles:
                default_query = profile.preferred_roles[0]
                query = input(f"Job search keywords (default: {default_query}): ").strip()
                if not query:
                    query = default_query
            else:
                query = input("Job search keywords (e.g., 'data scientist', 'software engineer'): ").strip()
                if not query:
                    query = "software engineer"
            
            location = input(f"Location (default: {profile.location or 'Any'}): ").strip()
            if not location and profile.location:
                location = profile.location
            
            try:
                limit = int(input("Number of jobs to search (default: 25): ").strip() or "25")
            except ValueError:
                limit = 25
            
            # Step 3: Search for jobs
            jobs = self.search_jobs(query, location, limit)
            
            # Step 4: Get recommendations (show all jobs)
            recommendations = self.get_recommendations(profile, jobs)
            
            # Step 5: Display results
            self.display_recommendations(recommendations, detailed=True)
            
            # Step 6: Save results
            save_results = input("\n💾 Save results to files? (y/N): ").strip().lower()
            if save_results in ['y', 'yes']:
                self.save_results(profile, recommendations)
            
            print("\n✨ Thank you for using Career Assistant! Good luck with your job search! 🍀")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye! Thanks for using Career Assistant!")
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")
            print("Please try again or contact support.")
    
    def run_batch_mode(self, query: str, location: str = "", limit: int = 25, save: bool = True):
        """Run in batch mode with predefined parameters."""
        print("🚀 CAREER ASSISTANT - BATCH MODE")
        print("=" * 50)
        
        # Use sample profile
        profile = create_sample_profile()
        print(f"📝 Using sample profile: {profile.experience_level} level professional")
        print(f"   Skills: {', '.join(profile.skills[:5])}...")
        print(f"   Preferred roles: {', '.join(profile.preferred_roles)}")
        
        # Search jobs
        jobs = self.search_jobs(query, location, limit)
        
        # Get recommendations (show all jobs)
        recommendations = self.get_recommendations(profile, jobs)
        
        # Display results
        self.display_recommendations(recommendations, detailed=True)
        
        # Save results
        if save:
            self.save_results(profile, recommendations)
        
        return recommendations


def main():
    """Main entry point for the Career Assistant application."""
    parser = argparse.ArgumentParser(
        description="Career Assistant - Find your perfect job match!",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python career_assistant.py                           # Interactive mode
  python career_assistant.py --batch "data scientist" # Batch mode
  python career_assistant.py --batch "python developer" --location "San Francisco" --limit 30
        """
    )
    
    parser.add_argument(
        "--batch", 
        type=str, 
        help="Run in batch mode with specified job query"
    )
    
    parser.add_argument(
        "--location", 
        type=str, 
        default="", 
        help="Job location (default: any location)"
    )
    
    parser.add_argument(
        "--limit", 
        type=int, 
        default=25, 
        help="Number of jobs to search (default: 25)"
    )
    
    parser.add_argument(
        "--no-save", 
        action="store_true", 
        help="Don't save results to files"
    )
    
    args = parser.parse_args()
    
    # Create and run career assistant
    assistant = CareerAssistant()
    
    if args.batch:
        assistant.run_batch_mode(
            query=args.batch,
            location=args.location,
            limit=args.limit,
            save=not args.no_save
        )
    else:
        assistant.run_interactive_session()


if __name__ == "__main__":
    main()