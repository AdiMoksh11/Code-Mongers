"""
Test script to verify all Career Assistant components work correctly.
Run this to ensure the system is properly set up.
"""

import sys
import os

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
sys.path.insert(0, src_path)

def test_imports():
    """Test that all modules can be imported."""
    print("🧪 Testing module imports...")
    
    try:
        from user_profile import UserProfile, create_sample_profile
        print("✅ user_profile module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import user_profile: {e}")
        return False
    
    try:
        from job_scraper import JobAggregator, JobPosting
        print("✅ job_scraper module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import job_scraper: {e}")
        return False
    
    try:
        from skill_matcher import SkillMatcher
        print("✅ skill_matcher module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import skill_matcher: {e}")
        return False
    
    try:
        from recommendation_engine import JobRecommendationEngine
        print("✅ recommendation_engine module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import recommendation_engine: {e}")
        return False
    
    try:
        from job_analyzer import generate_comprehensive_report
        print("✅ job_analyzer module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import job_analyzer: {e}")
        return False
    
    return True

def test_basic_functionality():
    """Test basic functionality of key components."""
    print("\n🧪 Testing basic functionality...")
    
    try:
        # Test user profile creation
        from user_profile import create_sample_profile
        profile = create_sample_profile()
        print(f"✅ Sample profile created: {profile.experience_level} level with {len(profile.skills)} skills")
        
        # Test job scraper (sample data)
        from job_scraper import JobAggregator
        aggregator = JobAggregator()
        jobs = aggregator.search_all_sources("data scientist", "", 5)
        print(f"✅ Job search completed: Found {len(jobs)} jobs")
        
        # Test skill matching
        from skill_matcher import SkillMatcher
        matcher = SkillMatcher()
        if jobs:
            analysis = matcher.analyze_skill_compatibility(profile.skills, jobs[0].skills_required)
            print(f"✅ Skill analysis completed: {analysis.coverage_percentage:.1f}% coverage")
        
        # Test recommendations
        from recommendation_engine import JobRecommendationEngine
        engine = JobRecommendationEngine()
        recommendations = engine.recommend_jobs(profile, jobs, 3)
        print(f"✅ Recommendations generated: {len(recommendations)} jobs ranked")
        
        if recommendations:
            print(f"   Top recommendation: {recommendations[0].job.title} (Score: {recommendations[0].score.overall_score:.1f})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during functionality test: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 CAREER ASSISTANT - SYSTEM TEST")
    print("=" * 50)
    
    # Test imports
    imports_ok = test_imports()
    
    if not imports_ok:
        print("\n❌ Import tests failed. Please check your setup.")
        return False
    
    # Test functionality
    functionality_ok = test_basic_functionality()
    
    if not functionality_ok:
        print("\n❌ Functionality tests failed.")
        return False
    
    print("\n✅ ALL TESTS PASSED!")
    print("🎯 Career Assistant is ready to use!")
    print("\nRun the main application with:")
    print("   python career_assistant.py")
    print("   python career_assistant.py --batch \"data scientist\"")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)