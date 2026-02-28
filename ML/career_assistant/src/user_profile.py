"""
User Profile Module for Career Assistant

This module handles user input collection, validation, and profile management.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
import re


@dataclass
class UserProfile:
    """Represents a user's career profile with skills, experience, and preferences."""
    
    skills: List[str]
    experience_level: str  # "entry", "mid", "senior", "executive"
    preferred_roles: List[str]
    location: Optional[str] = None
    salary_range: Optional[Dict[str, int]] = None  # {"min": 50000, "max": 100000}
    work_type: Optional[str] = None  # "remote", "hybrid", "onsite"
    
    def __post_init__(self):
        """Validate and clean user profile data."""
        self.skills = [skill.strip().lower() for skill in self.skills if skill.strip()]
        self.preferred_roles = [role.strip().lower() for role in self.preferred_roles if role.strip()]
        
        valid_experience_levels = ["entry", "mid", "senior", "executive"]
        if self.experience_level.lower() not in valid_experience_levels:
            raise ValueError(f"Experience level must be one of: {valid_experience_levels}")
        
        self.experience_level = self.experience_level.lower()


class UserProfileBuilder:
    """Interactive builder for creating user profiles."""
    
    EXPERIENCE_LEVELS = {
        "1": "entry",
        "2": "mid", 
        "3": "senior",
        "4": "executive"
    }
    
    WORK_TYPES = {
        "1": "remote",
        "2": "hybrid",
        "3": "onsite",
        "4": "any"
    }
    
    @staticmethod
    def collect_skills() -> List[str]:
        """Collect user skills interactively."""
        print("\n=== SKILLS INPUT ===")
        print("Enter your skills (separated by commas):")
        print("Examples: Python, Machine Learning, Project Management, SQL, React")
        
        skills_input = input("Skills: ").strip()
        if not skills_input:
            raise ValueError("At least one skill is required")
        
        skills = [skill.strip() for skill in skills_input.split(",")]
        return skills
    
    @staticmethod
    def collect_experience_level() -> str:
        """Collect user experience level interactively."""
        print("\n=== EXPERIENCE LEVEL ===")
        print("Select your experience level:")
        for key, value in UserProfileBuilder.EXPERIENCE_LEVELS.items():
            print(f"{key}. {value.title()}")
        
        while True:
            choice = input("Enter choice (1-4): ").strip()
            if choice in UserProfileBuilder.EXPERIENCE_LEVELS:
                return UserProfileBuilder.EXPERIENCE_LEVELS[choice]
            print("Invalid choice. Please enter 1-4.")
    
    @staticmethod
    def collect_preferred_roles() -> List[str]:
        """Collect user's preferred job roles."""
        print("\n=== PREFERRED ROLES ===")
        print("Enter your preferred job roles (separated by commas):")
        print("Examples: Software Engineer, Data Scientist, Product Manager, DevOps Engineer")
        
        roles_input = input("Preferred roles: ").strip()
        if not roles_input:
            raise ValueError("At least one preferred role is required")
        
        roles = [role.strip() for role in roles_input.split(",")]
        return roles
    
    @staticmethod
    def collect_location() -> Optional[str]:
        """Collect user's preferred location."""
        print("\n=== LOCATION (Optional) ===")
        location = input("Enter preferred location (or press Enter to skip): ").strip()
        return location if location else None
    
    @staticmethod
    def collect_salary_range() -> Optional[Dict[str, int]]:
        """Collect user's salary range preferences."""
        print("\n=== SALARY RANGE (Optional) ===")
        try:
            min_salary = input("Minimum salary (or press Enter to skip): ").strip()
            if not min_salary:
                return None
            
            max_salary = input("Maximum salary: ").strip()
            if not max_salary:
                return None
            
            return {
                "min": int(min_salary),
                "max": int(max_salary)
            }
        except ValueError:
            print("Invalid salary input. Skipping salary range.")
            return None
    
    @staticmethod
    def collect_work_type() -> Optional[str]:
        """Collect user's work type preference."""
        print("\n=== WORK TYPE (Optional) ===")
        print("Select your work type preference:")
        for key, value in UserProfileBuilder.WORK_TYPES.items():
            print(f"{key}. {value.title()}")
        
        choice = input("Enter choice (1-4, or press Enter to skip): ").strip()
        if choice in UserProfileBuilder.WORK_TYPES:
            return UserProfileBuilder.WORK_TYPES[choice]
        return None
    
    @classmethod
    def build_interactive_profile(cls) -> UserProfile:
        """Build a user profile through interactive input."""
        print("🚀 Welcome to the Career Assistant!")
        print("Let's build your profile to find the best job matches.\n")
        
        try:
            skills = cls.collect_skills()
            experience_level = cls.collect_experience_level()
            preferred_roles = cls.collect_preferred_roles()
            location = cls.collect_location()
            salary_range = cls.collect_salary_range()
            work_type = cls.collect_work_type()
            
            profile = UserProfile(
                skills=skills,
                experience_level=experience_level,
                preferred_roles=preferred_roles,
                location=location,
                salary_range=salary_range,
                work_type=work_type
            )
            
            print("\n✅ Profile created successfully!")
            print(f"Skills: {', '.join(profile.skills)}")
            print(f"Experience: {profile.experience_level}")
            print(f"Preferred roles: {', '.join(profile.preferred_roles)}")
            
            return profile
            
        except (ValueError, KeyboardInterrupt) as e:
            print(f"\n❌ Error creating profile: {e}")
            raise


def create_sample_profile() -> UserProfile:
    """Create a sample user profile for testing."""
    return UserProfile(
        skills=["python", "machine learning", "sql", "data analysis", "pandas", "scikit-learn"],
        experience_level="mid",
        preferred_roles=["data scientist", "machine learning engineer", "data analyst"],
        location="San Francisco, CA",
        salary_range={"min": 80000, "max": 120000},
        work_type="hybrid"
    )


if __name__ == "__main__":
    # Example usage
    try:
        profile = UserProfileBuilder.build_interactive_profile()
        print("\nYour profile:")
        print(profile)
    except Exception as e:
        print(f"Failed to create profile: {e}")