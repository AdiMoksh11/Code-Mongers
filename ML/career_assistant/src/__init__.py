"""
Initialization file for the Career Assistant package.

This file makes the src directory a Python package and provides
convenient imports for the main components.
"""

# Version information
__version__ = "1.0.0"
__author__ = "Career Assistant Team"
__description__ = "Intelligent career assistant for personalized job recommendations"

# Main components
from .user_profile import UserProfile, UserProfileBuilder, create_sample_profile
from .job_scraper import JobPosting, JobAggregator
from .skill_matcher import SkillMatcher, SkillAnalysis
from .recommendation_engine import JobRecommendationEngine, JobRecommendation
from .job_analyzer import JobAnalyzer, generate_comprehensive_report

__all__ = [
    "UserProfile",
    "UserProfileBuilder", 
    "create_sample_profile",
    "JobPosting",
    "JobAggregator",
    "SkillMatcher",
    "SkillAnalysis", 
    "JobRecommendationEngine",
    "JobRecommendation",
    "JobAnalyzer",
    "generate_comprehensive_report"
]