"""
Dynamic Job Generator - Creates varied, query-specific job postings
Replaces static sample data with dynamic generation based on search parameters
"""

import random
from typing import List, Dict, Any
from datetime import datetime, timedelta
from .job_scraper import JobPosting

class DynamicJobGenerator:
    """Generates dynamic, varied job postings based on search queries."""
    
    def __init__(self):
        # Job title templates by category
        self.job_titles = {
            "software": [
                "Software Engineer", "Full Stack Developer", "Backend Developer", 
                "Frontend Developer", "Software Developer", "Senior Software Engineer",
                "Lead Software Engineer", "Principal Software Engineer", "Software Architect"
            ],
            "data": [
                "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer",
                "Senior Data Scientist", "Lead Data Scientist", "Data Architect", 
                "Business Intelligence Analyst", "Analytics Engineer"
            ],
            "web": [
                "Web Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
                "React Developer", "Angular Developer", "Vue.js Developer", "Node.js Developer"
            ],
            "mobile": [
                "Mobile Developer", "iOS Developer", "Android Developer", "React Native Developer",
                "Flutter Developer", "Mobile App Developer", "Senior Mobile Developer"
            ],
            "devops": [
                "DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer", "Platform Engineer",
                "Infrastructure Engineer", "Senior DevOps Engineer", "DevOps Architect"
            ],
            "ai": [
                "AI Engineer", "Machine Learning Engineer", "Deep Learning Engineer", 
                "Computer Vision Engineer", "NLP Engineer", "AI Research Scientist"
            ],
            "security": [
                "Security Engineer", "Cybersecurity Analyst", "Security Architect",
                "Penetration Tester", "Security Consultant", "Information Security Specialist"
            ]
        }
        
        # Company names pool
        self.companies = [
            "TechCorp", "InnovateX", "DataFlow Inc", "CloudTech", "NextGen Solutions",
            "Digital Dynamics", "CodeCraft", "SoftwareWorks", "TechInnovate", "FutureTech",
            "DataMinds", "CloudFirst", "AppBuilder Inc", "DevSolutions", "TechPioneers",
            "DigitalEdge", "CodeMasters", "InnovateLab", "TechForward", "DataStream",
            "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Spotify",
            "Uber", "Airbnb", "Tesla", "SpaceX", "Stripe", "Square", "Shopify"
        ]
        
        # Location pools
        self.locations = [
            "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Boston, MA",
            "Los Angeles, CA", "Chicago, IL", "Denver, CO", "Atlanta, GA", "Miami, FL",
            "Portland, OR", "Nashville, TN", "Phoenix, AZ", "Dallas, TX", "Philadelphia, PA",
            "Remote", "Remote (US)", "Hybrid - San Francisco", "Hybrid - New York"
        ]
        
        # Experience levels with probabilities
        self.experience_levels = {
            "entry": 0.25,
            "mid": 0.45,
            "senior": 0.25,
            "lead": 0.05
        }
        
        # Work types
        self.work_types = ["remote", "onsite", "hybrid"]
        
        # Job sources
        self.sources = ["indeed", "linkedin", "glassdoor", "ziprecruiter", "monster", "dice"]
        
        # Skills database by category
        self.skills_database = {
            "software": ["python", "java", "javascript", "typescript", "react", "node.js", "git", "docker", "kubernetes"],
            "data": ["python", "sql", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "tableau", "power-bi"],
            "web": ["html", "css", "javascript", "react", "vue.js", "angular", "node.js", "express", "mongodb"],
            "mobile": ["swift", "kotlin", "react-native", "flutter", "ios", "android", "xcode", "android-studio"],
            "devops": ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins", "gitlab-ci", "ansible"],
            "ai": ["python", "tensorflow", "pytorch", "opencv", "nlp", "machine-learning", "deep-learning", "ai"],
            "security": ["cybersecurity", "penetration-testing", "vulnerability-assessment", "network-security", "encryption"]
        }
        
        # Salary ranges by experience and location
        self.salary_ranges = {
            "entry": {"base": (60000, 90000), "premium": (70000, 100000)},
            "mid": {"base": (90000, 130000), "premium": (110000, 150000)},
            "senior": {"base": (130000, 180000), "premium": (150000, 200000)},
            "lead": {"base": (180000, 250000), "premium": (200000, 300000)}
        }
        
        # Premium locations (higher salaries)
        self.premium_locations = ["San Francisco, CA", "New York, NY", "Seattle, WA", "Boston, MA"]
    
    def generate_jobs(self, query: str, location: str = "", limit: int = 25, source: str = "indeed") -> List[JobPosting]:
        """Generate dynamic job postings based on query and location."""
        jobs = []
        query_lower = query.lower()
        
        # Determine job category from query
        category = self._detect_category(query_lower)
        
        # Generate unique jobs for this search with randomization
        base_seed = hash(query + source) % 1000000
        random.seed(base_seed)
        
        # Generate more jobs than needed and then randomize selection
        all_generated_jobs = []
        for i in range(limit * 2):  # Generate double the amount for better variety
            job = self._generate_single_job(query_lower, category, location, source, i)
            all_generated_jobs.append(job)
        
        # Shuffle the generated jobs and select the required amount
        random.shuffle(all_generated_jobs)
        jobs = all_generated_jobs[:limit]
        
        # Additional randomization: sort by relevance score and then shuffle within relevance groups
        jobs_with_relevance = []
        for job in jobs:
            relevance_score = self._calculate_relevance_score(job, query_lower)
            jobs_with_relevance.append((job, relevance_score))
        
        # Group by relevance and shuffle within groups
        high_relevance = [job for job, score in jobs_with_relevance if score >= 3]
        medium_relevance = [job for job, score in jobs_with_relevance if 1 <= score < 3]
        low_relevance = [job for job, score in jobs_with_relevance if score < 1]
        
        random.shuffle(high_relevance)
        random.shuffle(medium_relevance) 
        random.shuffle(low_relevance)
        
        # Combine in order: high, medium, low relevance but shuffled within each group
        final_jobs = high_relevance + medium_relevance + low_relevance
        
        return final_jobs[:limit]
    
    def _detect_category(self, query: str) -> str:
        """Detect job category from search query."""
        category_keywords = {
            "data": ["data", "analyst", "scientist", "analytics", "machine learning", "ml", "ai"],
            "software": ["software", "engineer", "developer", "programming", "coding"],
            "web": ["web", "frontend", "backend", "full stack", "react", "angular", "vue", "html", "css"],
            "mobile": ["mobile", "ios", "android", "app", "flutter", "react native"],
            "devops": ["devops", "cloud", "aws", "azure", "docker", "kubernetes", "infrastructure"],
            "ai": ["ai", "artificial intelligence", "machine learning", "deep learning", "nlp", "computer vision"],
            "security": ["security", "cybersecurity", "penetration", "vulnerability", "infosec"]
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in query for keyword in keywords):
                return category
        
        return "software"  # Default category
    
    def _generate_single_job(self, query: str, category: str, location: str, source: str, index: int) -> JobPosting:
        """Generate a single job posting."""
        # Add randomness based on query, index, and current time to ensure variety
        seed_value = hash(query + str(index) + str(random.randint(1, 10000))) % 1000000
        random.seed(seed_value)
        
        # Select title with more randomization (prefer query-matching titles)
        titles = self.job_titles.get(category, self.job_titles["software"])
        
        # Create multiple title variations based on query
        title_variations = []
        for base_title in titles:
            title_variations.append(base_title)
            # Add seniority variations
            if any(word in query for word in ["senior", "lead", "principal"]):
                if "senior" not in base_title.lower():
                    title_variations.append(f"Senior {base_title}")
                if "lead" not in base_title.lower():
                    title_variations.append(f"Lead {base_title}")
            elif any(word in query for word in ["junior", "entry", "intern"]):
                if "senior" not in base_title.lower() and "lead" not in base_title.lower():
                    title_variations.append(f"Junior {base_title}")
                    title_variations.append(f"Entry Level {base_title}")
        
        title = random.choice(title_variations)
        
        # Add query-specific variations to title with randomization
        title_modifications = []
        if "frontend" in query:
            title_modifications.extend([
                title.replace("Developer", "Frontend Developer").replace("Engineer", "Frontend Engineer"),
                title.replace("Developer", "Front-end Developer").replace("Engineer", "Front-end Engineer"),
                f"Frontend {title}",
                f"UI/UX {title}"
            ])
        elif "backend" in query:
            title_modifications.extend([
                title.replace("Developer", "Backend Developer").replace("Engineer", "Backend Engineer"),
                title.replace("Developer", "Back-end Developer").replace("Engineer", "Back-end Engineer"),
                f"Backend {title}",
                f"Server-side {title}"
            ])
        elif "full stack" in query or "fullstack" in query:
            title_modifications.extend([
                title.replace("Developer", "Full Stack Developer").replace("Engineer", "Full Stack Engineer"),
                title.replace("Developer", "Fullstack Developer").replace("Engineer", "Fullstack Engineer"),
                f"Full Stack {title}",
                f"Full-Stack {title}"
            ])
        
        if title_modifications:
            title = random.choice(title_modifications + [title])  # Include original title as option
        
        # Select company with randomization
        # Mix of different company types
        tech_giants = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Spotify"]
        startups = ["TechCorp", "InnovateX", "DataFlow Inc", "CloudTech", "NextGen Solutions"]
        established = ["Digital Dynamics", "CodeCraft", "SoftwareWorks", "TechInnovate", "FutureTech"]
        
        company_pool = self.companies.copy()
        # Bias toward certain types based on query
        if "startup" in query:
            company_pool = startups * 3 + tech_giants + established
        elif "enterprise" in query or "corporate" in query:
            company_pool = tech_giants * 2 + established * 2 + startups
        
        company = random.choice(company_pool)
        
        # Select location with more variety
        if location and location.strip():
            job_location = location
            # Sometimes add variations even with specified location
            if random.random() > 0.8:
                location_variations = [location, f"Remote ({location})", f"Hybrid - {location}"]
                job_location = random.choice(location_variations)
        else:
            # Randomize location selection with bias
            location_pool = self.locations.copy()
            if "remote" in query.lower():
                remote_locations = ["Remote", "Remote (US)", "Remote (Global)", "Work from Anywhere"]
                location_pool = remote_locations * 3 + self.locations
            elif "san francisco" in query.lower() or "sf" in query.lower():
                sf_locations = ["San Francisco, CA", "Bay Area, CA", "Palo Alto, CA", "Mountain View, CA"]
                location_pool = sf_locations * 2 + self.locations
            
            job_location = random.choice(location_pool)
        
        # Determine if this is a premium location for salary calculation
        is_premium_location = (job_location in self.premium_locations or 
                             "San Francisco" in job_location or 
                             "New York" in job_location or
                             "Seattle" in job_location)
        
        # Select experience level with more randomization
        exp_levels = list(self.experience_levels.keys())
        weights = list(self.experience_levels.values())
        
        # Adjust weights based on query
        if any(word in query for word in ["senior", "lead", "principal"]):
            # Increase senior/lead probability
            senior_index = exp_levels.index("senior")
            lead_index = exp_levels.index("lead")
            weights[senior_index] *= 2
            weights[lead_index] *= 3
        elif any(word in query for word in ["junior", "entry", "intern"]):
            # Increase entry probability
            entry_index = exp_levels.index("entry")
            weights[entry_index] *= 3
        
        exp_level = random.choices(exp_levels, weights=weights)[0]
        
        # Generate salary range with more variation
        salary_category = "premium" if is_premium_location else "base"
        min_salary, max_salary = self.salary_ranges[exp_level][salary_category]
        
        # Add larger variation and sometimes create ranges that don't follow typical patterns
        variation = random.uniform(0.85, 1.2)  # Increased variation
        min_salary = int(min_salary * variation)
        max_salary = int(max_salary * variation)
        
        # Sometimes create non-standard salary formats
        salary_formats = [
            f"${min_salary:,} - ${max_salary:,}",
            f"${min_salary:,} - ${max_salary:,} + benefits",
            f"${min_salary:,} - ${max_salary:,} + equity",
            f"Up to ${max_salary:,}",
            f"Starting at ${min_salary:,}",
            f"${min_salary//1000}k - ${max_salary//1000}k"
        ]
        
        salary_range = random.choice(salary_formats)
        
        # Select work type with bias based on query
        work_type_pool = self.work_types.copy()
        if "remote" in query.lower():
            work_type_pool = ["remote"] * 4 + ["hybrid"]
            if "remote" not in job_location.lower():
                job_location = f"Remote ({job_location})" if job_location != "Remote" else "Remote"
        elif "onsite" in query.lower() or "office" in query.lower():
            work_type_pool = ["onsite"] * 3 + ["hybrid"]
        elif "hybrid" in query.lower():
            work_type_pool = ["hybrid"] * 3 + ["remote", "onsite"]
        
        work_type = random.choice(work_type_pool)
        
        # Generate skills with more randomization
        skills = self._generate_skills(category, query)
        
        # Generate description
        description = self._generate_description(title, company, skills, query)
        
        # Randomize job type occasionally
        job_types = ["full-time", "full-time", "full-time", "contract", "part-time"]  # Bias toward full-time
        job_type = random.choice(job_types)
        
        return JobPosting(
            title=title,
            company=company,
            location=job_location,
            description=description,
            skills_required=skills,
            experience_level=exp_level,
            salary_range=salary_range,
            job_type=job_type,
            work_type=work_type,
            source=source
        )
    
    def _weighted_choice(self, choices: Dict[str, float]) -> str:
        """Make a weighted random choice."""
        items = list(choices.keys())
        weights = list(choices.values())
        return random.choices(items, weights=weights)[0]
    
    def _generate_skills(self, category: str, query: str) -> List[str]:
        """Generate relevant skills for the job with randomization."""
        base_skills = self.skills_database.get(category, self.skills_database["software"]).copy()
        
        # Extended skill keywords with more variations
        skill_keywords = {
            "python": ["python", "py", "django", "flask", "fastapi"],
            "java": ["java", "spring", "hibernate", "maven"],
            "javascript": ["javascript", "js", "typescript", "ts", "node"],
            "react": ["react", "reactjs", "jsx", "redux"],
            "angular": ["angular", "angularjs", "typescript"],
            "vue": ["vue", "vuejs", "nuxt"],
            "node": ["node", "nodejs", "npm", "express"],
            "aws": ["aws", "amazon", "cloud", "ec2", "s3"],
            "azure": ["azure", "microsoft cloud"],
            "docker": ["docker", "container", "containerization"],
            "kubernetes": ["kubernetes", "k8s", "orchestration"],
            "sql": ["sql", "database", "mysql", "postgresql", "sqlite"],
            "machine learning": ["ml", "machine learning", "ai", "artificial intelligence"],
            "git": ["git", "github", "version control"],
            "linux": ["linux", "unix", "bash"],
            "api": ["api", "rest", "graphql", "microservices"]
        }
        
        # Add query-specific skills with variations
        query_skills = []
        for skill, keywords in skill_keywords.items():
            if any(keyword in query.lower() for keyword in keywords):
                query_skills.append(skill)
                # Add related skills randomly
                if skill == "python" and random.random() > 0.5:
                    query_skills.extend(["pandas", "numpy"])
                elif skill == "javascript" and random.random() > 0.5:
                    query_skills.extend(["html", "css"])
                elif skill == "aws" and random.random() > 0.5:
                    query_skills.extend(["terraform", "cloudformation"])
        
        # Add some completely random skills from the same category
        additional_skills = random.sample(base_skills, min(len(base_skills), random.randint(2, 4)))
        
        # Combine all skills and remove duplicates
        all_skills = list(set(base_skills + query_skills + additional_skills))
        
        # Randomize the final selection
        num_skills = random.randint(4, min(10, len(all_skills)))
        selected_skills = random.sample(all_skills, num_skills)
        
        # Ensure query-specific skills are more likely to be included
        final_skills = []
        for skill in query_skills[:3]:  # Include top 3 query skills
            if skill not in final_skills:
                final_skills.append(skill)
        
        # Fill remaining slots with random selection
        remaining_slots = num_skills - len(final_skills)
        remaining_skills = [s for s in selected_skills if s not in final_skills]
        final_skills.extend(random.sample(remaining_skills, min(remaining_slots, len(remaining_skills))))
        
        # Shuffle the final list
        random.shuffle(final_skills)
        
        return final_skills
    
    def _generate_description(self, title: str, company: str, skills: List[str], query: str) -> str:
        """Generate a job description."""
        templates = [
            f"Join {company} as a {title}. We're looking for someone with expertise in {', '.join(skills[:3])}. This role involves working on exciting projects and collaborating with cross-functional teams.",
            f"{company} is seeking a talented {title} to join our growing team. Key requirements include {', '.join(skills[:4])}. You'll have the opportunity to work on cutting-edge technology and make a real impact.",
            f"We're hiring a {title} at {company}! This position requires strong skills in {', '.join(skills[:3])} and experience with modern development practices. Great benefits and growth opportunities.",
            f"Exciting opportunity for a {title} at {company}. Work with technologies like {', '.join(skills[:4])} in a collaborative environment. We offer competitive compensation and excellent work-life balance.",
            f"Are you passionate about {query}? {company} is looking for a {title} to drive innovation and excellence. Must have experience with {', '.join(skills[:3])}.",
            f"{company} has an immediate opening for a {title}. This role offers the chance to work with {', '.join(skills[:4])} while building the future of technology.",
            f"We're expanding our team at {company}! Seeking a {title} with strong {', '.join(skills[:3])} skills. Competitive package and amazing team culture.",
            f"Ready for your next challenge? {company} needs a {title} who excels in {', '.join(skills[:3])}. Fast-paced environment with growth opportunities."
        ]
        
        # Randomize template selection
        description = random.choice(templates)
        
        # Add query-specific context with randomization
        context_additions = []
        if "startup" in query:
            context_additions.append(" Join our fast-growing startup environment where you can make a significant impact.")
            context_additions.append(" Be part of our innovative startup culture with equity opportunities.")
        elif "enterprise" in query:
            context_additions.append(" Work in a stable enterprise environment with established processes and large-scale systems.")
            context_additions.append(" Join our Fortune 500 company with excellent benefits and career advancement.")
        elif "remote" in query:
            context_additions.append(" This is a fully remote position with flexible working hours.")
            context_additions.append(" Work from anywhere with our distributed team and flexible schedule.")
        
        # Add additional context options
        general_additions = [
            " We offer comprehensive benefits including health, dental, and 401k matching.",
            " Join our diverse and inclusive workplace with excellent work-life balance.",
            " Opportunity for professional development and continuous learning.",
            " Work with cutting-edge technology and industry-leading practices.",
            " Collaborative environment with opportunities for mentorship and growth."
        ]
        
        # Randomly add context
        if context_additions and random.random() > 0.5:
            description += random.choice(context_additions)
        elif random.random() > 0.7:
            description += random.choice(general_additions)
        
        return description
    
    def _calculate_relevance_score(self, job: JobPosting, query: str) -> int:
        """Calculate relevance score for a job based on query match."""
        score = 0
        query_words = query.lower().split()
        
        # Check title relevance
        title_lower = job.title.lower()
        for word in query_words:
            if word in title_lower:
                score += 2
        
        # Check skills relevance
        skills_text = ' '.join(job.skills_required).lower()
        for word in query_words:
            if word in skills_text:
                score += 1
        
        # Check description relevance
        desc_lower = job.description.lower()
        for word in query_words:
            if word in desc_lower:
                score += 1
        
        return score

# Create global instance
job_generator = DynamicJobGenerator()
