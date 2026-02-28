"""
Skill Matching Engine for Career Assistant

This module calculates skill overlap and compatibility between user profiles and job requirements.
Uses advanced text processing and fuzzy matching for accurate skill comparison.
"""

import re
from typing import List, Dict, Set, Tuple
from dataclasses import dataclass
from collections import Counter
import difflib
import math


@dataclass
class SkillMatch:
    """Represents a skill match between user and job requirements."""
    
    user_skill: str
    job_skill: str
    match_score: float  # 0.0 to 1.0
    match_type: str     # "exact", "fuzzy", "synonym", "related"


@dataclass
class SkillAnalysis:
    """Comprehensive analysis of skill compatibility."""
    
    matched_skills: List[SkillMatch]
    missing_skills: List[str]
    additional_skills: List[str]  # User skills not required by job
    overall_match_score: float    # 0.0 to 1.0
    coverage_percentage: float    # Percentage of job requirements covered
    total_job_skills: int
    total_user_skills: int


class SkillMatcher:
    """Advanced skill matching engine with fuzzy matching and synonym detection."""
    
    def __init__(self):
        self.skill_synonyms = self._load_skill_synonyms()
        self.skill_categories = self._load_skill_categories()
        self.fuzzy_threshold = 0.8  # Minimum similarity for fuzzy matching
    
    def _load_skill_synonyms(self) -> Dict[str, Set[str]]:
        """Load skill synonyms for better matching."""
        synonyms = {
            # Programming languages
            "javascript": {"js", "ecmascript", "node.js", "nodejs"},
            "python": {"py", "python3", "python2"},
            "c++": {"cpp", "c plus plus", "cplusplus"},
            "c#": {"csharp", "c sharp", ".net", "dotnet"},
            
            # Databases
            "postgresql": {"postgres", "psql"},
            "mysql": {"my sql"},
            "mongodb": {"mongo", "nosql"},
            "sql": {"structured query language", "database"},
            
            # Web technologies
            "react": {"reactjs", "react.js"},
            "angular": {"angularjs", "angular.js"},
            "vue": {"vuejs", "vue.js"},
            "node.js": {"nodejs", "node", "javascript"},
            
            # Cloud platforms
            "aws": {"amazon web services", "amazon aws"},
            "gcp": {"google cloud platform", "google cloud"},
            "azure": {"microsoft azure"},
            
            # Data science
            "machine learning": {"ml", "artificial intelligence", "ai"},
            "data science": {"data analysis", "analytics"},
            "pandas": {"python pandas"},
            "scikit-learn": {"sklearn", "scikit learn"},
            "tensorflow": {"tf"},
            "pytorch": {"torch"},
            
            # Tools
            "git": {"version control", "github", "gitlab"},
            "docker": {"containerization", "containers"},
            "kubernetes": {"k8s", "container orchestration"},
            
            # Methodologies
            "agile": {"scrum", "kanban"},
            "devops": {"ci/cd", "continuous integration"},
        }
        
        # Create bidirectional mapping
        expanded_synonyms = {}
        for main_skill, synonyms_set in synonyms.items():
            expanded_synonyms[main_skill] = synonyms_set.copy()
            for synonym in synonyms_set:
                if synonym not in expanded_synonyms:
                    expanded_synonyms[synonym] = set()
                expanded_synonyms[synonym].add(main_skill)
                expanded_synonyms[synonym].update(synonyms_set - {synonym})
        
        return expanded_synonyms
    
    def _load_skill_categories(self) -> Dict[str, Set[str]]:
        """Load skill categories for related skill matching."""
        categories = {
            "programming": {
                "python", "java", "javascript", "typescript", "c++", "c#", "ruby", 
                "php", "go", "rust", "swift", "kotlin", "scala", "r"
            },
            "web_frontend": {
                "html", "css", "javascript", "react", "angular", "vue", "jquery",
                "bootstrap", "sass", "less", "webpack", "babel"
            },
            "web_backend": {
                "node.js", "express", "django", "flask", "spring", "laravel",
                "ruby on rails", "asp.net", "php", "python", "java"
            },
            "databases": {
                "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
                "cassandra", "oracle", "sqlite", "dynamodb"
            },
            "cloud": {
                "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
                "ansible", "jenkins", "ci/cd"
            },
            "data_science": {
                "python", "r", "sql", "pandas", "numpy", "scikit-learn",
                "tensorflow", "pytorch", "jupyter", "matplotlib", "seaborn"
            },
            "machine_learning": {
                "machine learning", "deep learning", "neural networks", "tensorflow",
                "pytorch", "scikit-learn", "keras", "opencv", "nlp"
            },
            "mobile": {
                "ios", "android", "swift", "kotlin", "react native", "flutter",
                "xamarin", "cordova", "ionic"
            }
        }
        
        return categories
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill name for better matching."""
        # Convert to lowercase and remove special characters
        normalized = re.sub(r'[^\w\s+#.]', '', skill.lower().strip())
        
        # Handle common variations
        normalized = re.sub(r'\bjs\b', 'javascript', normalized)
        normalized = re.sub(r'\bml\b', 'machine learning', normalized)
        normalized = re.sub(r'\bai\b', 'artificial intelligence', normalized)
        
        return normalized
    
    def find_fuzzy_matches(self, skill: str, skill_list: List[str]) -> List[Tuple[str, float]]:
        """Find fuzzy matches for a skill in a list."""
        matches = []
        normalized_skill = self.normalize_skill(skill)
        
        for candidate in skill_list:
            normalized_candidate = self.normalize_skill(candidate)
            
            # Calculate similarity ratio
            similarity = difflib.SequenceMatcher(None, normalized_skill, normalized_candidate).ratio()
            
            if similarity >= self.fuzzy_threshold:
                matches.append((candidate, similarity))
        
        # Sort by similarity descending
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches
    
    def find_synonym_matches(self, skill: str) -> Set[str]:
        """Find synonym matches for a skill."""
        normalized_skill = self.normalize_skill(skill)
        return self.skill_synonyms.get(normalized_skill, set())
    
    def find_category_matches(self, skill: str, job_skills: List[str]) -> List[str]:
        """Find skills in the same category."""
        normalized_skill = self.normalize_skill(skill)
        related_skills = []
        
        # Find which category the skill belongs to
        for category, skills in self.skill_categories.items():
            if normalized_skill in skills:
                # Find other skills from the same category in job requirements
                for job_skill in job_skills:
                    normalized_job_skill = self.normalize_skill(job_skill)
                    if normalized_job_skill in skills and normalized_job_skill != normalized_skill:
                        related_skills.append(job_skill)
        
        return related_skills
    
    def match_single_skill(self, user_skill: str, job_skills: List[str]) -> List[SkillMatch]:
        """Match a single user skill against job requirements."""
        matches = []
        normalized_user_skill = self.normalize_skill(user_skill)
        
        for job_skill in job_skills:
            normalized_job_skill = self.normalize_skill(job_skill)
            
            # Exact match
            if normalized_user_skill == normalized_job_skill:
                matches.append(SkillMatch(
                    user_skill=user_skill,
                    job_skill=job_skill,
                    match_score=1.0,
                    match_type="exact"
                ))
                continue
            
            # Synonym match
            synonyms = self.find_synonym_matches(user_skill)
            if normalized_job_skill in synonyms:
                matches.append(SkillMatch(
                    user_skill=user_skill,
                    job_skill=job_skill,
                    match_score=0.95,
                    match_type="synonym"
                ))
                continue
            
            # Fuzzy match
            similarity = difflib.SequenceMatcher(None, normalized_user_skill, normalized_job_skill).ratio()
            if similarity >= self.fuzzy_threshold:
                matches.append(SkillMatch(
                    user_skill=user_skill,
                    job_skill=job_skill,
                    match_score=similarity,
                    match_type="fuzzy"
                ))
        
        return matches
    
    def analyze_skill_compatibility(self, user_skills: List[str], job_skills: List[str]) -> SkillAnalysis:
        """Perform comprehensive skill compatibility analysis."""
        all_matches = []
        matched_job_skills = set()
        matched_user_skills = set()
        
        # Find all matches
        for user_skill in user_skills:
            skill_matches = self.match_single_skill(user_skill, job_skills)
            for match in skill_matches:
                all_matches.append(match)
                matched_job_skills.add(self.normalize_skill(match.job_skill))
                matched_user_skills.add(self.normalize_skill(match.user_skill))
        
        # Remove duplicate matches (keep highest scoring)
        unique_matches = {}
        for match in all_matches:
            key = (self.normalize_skill(match.user_skill), self.normalize_skill(match.job_skill))
            if key not in unique_matches or match.match_score > unique_matches[key].match_score:
                unique_matches[key] = match
        
        final_matches = list(unique_matches.values())
        
        # Calculate missing skills
        normalized_job_skills = [self.normalize_skill(skill) for skill in job_skills]
        missing_skills = [
            skill for skill in job_skills 
            if self.normalize_skill(skill) not in matched_job_skills
        ]
        
        # Calculate additional skills
        normalized_user_skills = [self.normalize_skill(skill) for skill in user_skills]
        additional_skills = [
            skill for skill in user_skills
            if self.normalize_skill(skill) not in matched_user_skills
        ]
        
        # Calculate overall match score
        if not job_skills:
            overall_score = 1.0
        else:
            # Weight by match quality
            total_weighted_score = sum(match.match_score for match in final_matches)
            max_possible_score = len(job_skills)
            overall_score = min(total_weighted_score / max_possible_score, 1.0)
        
        # Calculate coverage percentage
        coverage = (len(matched_job_skills) / len(job_skills) * 100) if job_skills else 100.0
        
        return SkillAnalysis(
            matched_skills=final_matches,
            missing_skills=missing_skills,
            additional_skills=additional_skills,
            overall_match_score=overall_score,
            coverage_percentage=coverage,
            total_job_skills=len(job_skills),
            total_user_skills=len(user_skills)
        )
    
    def get_skill_improvement_suggestions(self, missing_skills: List[str]) -> Dict[str, List[str]]:
        """Suggest how to improve missing skills."""
        suggestions = {}
        
        skill_learning_paths = {
            "python": ["Complete Python course", "Practice on HackerRank", "Build Python projects"],
            "javascript": ["Learn ES6+ features", "Practice DOM manipulation", "Build web applications"],
            "react": ["Complete React tutorial", "Build a portfolio website", "Learn React hooks"],
            "sql": ["Practice on SQLBolt", "Learn database design", "Work with real datasets"],
            "machine learning": ["Take ML course", "Practice on Kaggle", "Implement ML algorithms"],
            "aws": ["Get AWS certification", "Practice with free tier", "Build cloud projects"],
            "docker": ["Learn containerization basics", "Practice with Docker Hub", "Deploy applications"],
            "git": ["Learn Git commands", "Practice with GitHub", "Contribute to open source"]
        }
        
        for skill in missing_skills:
            normalized_skill = self.normalize_skill(skill)
            if normalized_skill in skill_learning_paths:
                suggestions[skill] = skill_learning_paths[normalized_skill]
            else:
                suggestions[skill] = [
                    f"Take an online course in {skill}",
                    f"Practice {skill} through projects",
                    f"Read documentation and tutorials about {skill}"
                ]
        
        return suggestions


def demonstrate_skill_matching():
    """Demonstrate the skill matching functionality."""
    matcher = SkillMatcher()
    
    # Example user skills
    user_skills = [
        "Python", "Machine Learning", "SQL", "Data Analysis", 
        "Pandas", "Git", "JavaScript", "React"
    ]
    
    # Example job requirements
    job_skills = [
        "Python", "Machine Learning", "PyTorch", "SQL", "Statistics",
        "Data Science", "Jupyter", "AWS", "Docker"
    ]
    
    print("🔍 Skill Matching Analysis")
    print("=" * 50)
    print(f"User Skills: {', '.join(user_skills)}")
    print(f"Job Requirements: {', '.join(job_skills)}")
    print()
    
    # Perform analysis
    analysis = matcher.analyze_skill_compatibility(user_skills, job_skills)
    
    print(f"📊 Analysis Results:")
    print(f"Overall Match Score: {analysis.overall_match_score:.2f}")
    print(f"Coverage: {analysis.coverage_percentage:.1f}%")
    print()
    
    print("✅ Matched Skills:")
    for match in analysis.matched_skills:
        print(f"  {match.user_skill} → {match.job_skill} ({match.match_type}, {match.match_score:.2f})")
    print()
    
    print("❌ Missing Skills:")
    for skill in analysis.missing_skills:
        print(f"  - {skill}")
    print()
    
    print("➕ Additional Skills:")
    for skill in analysis.additional_skills:
        print(f"  + {skill}")
    print()
    
    # Get improvement suggestions
    suggestions = matcher.get_skill_improvement_suggestions(analysis.missing_skills)
    print("💡 Skill Improvement Suggestions:")
    for skill, tips in suggestions.items():
        print(f"  {skill}:")
        for tip in tips:
            print(f"    - {tip}")
        print()


if __name__ == "__main__":
    demonstrate_skill_matching()