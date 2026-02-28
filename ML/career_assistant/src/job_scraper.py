"""
Job Scraper Module for Career Assistant

This module handles scraping job postings from LinkedIn and Indeed.
Uses requests-html for web scraping and includes rate limiting and error handling.
"""

import time
import re
import os
from typing import List, Dict, Optional
from dataclasses import dataclass
import json
from urllib.parse import urlencode, urlparse
import random

# Optional imports for web scraping
try:
    import requests
    from requests_html import HTMLSession
    SCRAPING_AVAILABLE = True
except ImportError:
    print("⚠️  Web scraping libraries not available. Using sample data only.")
    SCRAPING_AVAILABLE = False

# Import dynamic job generator
try:
    from .dynamic_job_generator import job_generator
    DYNAMIC_GENERATOR_AVAILABLE = True
except ImportError:
    print("⚠️  Dynamic job generator not available. Using basic fallback.")
    DYNAMIC_GENERATOR_AVAILABLE = False


@dataclass
class JobPosting:
    """Represents a job posting with all relevant information."""
    
    title: str
    company: str
    location: str
    description: str
    skills_required: List[str]
    experience_level: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None  # "full-time", "part-time", "contract"
    work_type: Optional[str] = None  # "remote", "hybrid", "onsite"
    url: Optional[str] = None
    posted_date: Optional[str] = None
    source: Optional[str] = None  # "linkedin", "indeed"
    
    def to_dict(self) -> Dict:
        """Convert job posting to dictionary."""
        return {
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "description": self.description,
            "skills_required": self.skills_required,
            "experience_level": self.experience_level,
            "salary_range": self.salary_range,
            "job_type": self.job_type,
            "work_type": self.work_type,
            "url": self.url,
            "posted_date": self.posted_date,
            "source": self.source
        }


def get_dynamic_sample_jobs(query: str, location: str, limit: int, source: str) -> List[JobPosting]:
    """Get dynamic job postings for any source using the dynamic job generator."""
    if DYNAMIC_GENERATOR_AVAILABLE:
        return job_generator.generate_jobs(query, location, limit, source=source)
    else:
        # Basic fallback if dynamic generator is not available
        return [
            JobPosting(
                title=f"{query.title()} Specialist",
                company=f"{source.title()} Company",
                location=location or "Remote",
                description=f"Looking for a {query} professional with relevant experience.",
                skills_required=[query.lower(), "communication", "problem-solving"],
                experience_level="mid",
                salary_range="$80,000 - $120,000",
                job_type="full-time",
                work_type="remote" if not location else "hybrid",
                source=source
            )
        ]


class JobScraper:
    """Base class for job scrapers with common functionality."""
    
    def __init__(self, delay_range=(1, 3)):
        """Initialize scraper with rate limiting."""
        if SCRAPING_AVAILABLE:
            self.session = HTMLSession()
        else:
            self.session = None
        self.delay_range = delay_range
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0'
        ]
    
    def _random_delay(self):
        """Add random delay to avoid being blocked."""
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)
    
    def _get_random_headers(self) -> Dict[str, str]:
        """Get random headers to avoid detection."""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'DNT': '1',
            'Cache-Control': 'max-age=0'
        }
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """Extract technical skills from job description text."""
        # Common technical skills and keywords
        skill_patterns = [
            # Programming languages
            r'\b(?:python|java|javascript|typescript|c\+\+|c#|ruby|php|go|rust|swift|kotlin|scala)\b',
            # Web technologies
            r'\b(?:react|angular|vue|node\.js|express|django|flask|spring|laravel)\b',
            # Databases
            r'\b(?:sql|mysql|postgresql|mongodb|redis|elasticsearch|cassandra)\b',
            # Cloud platforms
            r'\b(?:aws|azure|gcp|google cloud|docker|kubernetes|terraform)\b',
            # Data science
            r'\b(?:pandas|numpy|scikit-learn|tensorflow|pytorch|spark|hadoop)\b',
            # Tools and methodologies
            r'\b(?:git|jenkins|jira|agile|scrum|devops|ci/cd|microservices)\b'
        ]
        
        skills = []
        text_lower = text.lower()
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            skills.extend(matches)
        
        # Remove duplicates and return
        return list(set(skills))


class IndeedScraper(JobScraper):
    """Scraper for Indeed job postings."""
    
    BASE_URL = "https://www.indeed.com/jobs"
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for jobs on Indeed using simple HTTP requests."""
        if not SCRAPING_AVAILABLE:
            print("⚠️  Web scraping not available. Using sample data.")
            return self._get_sample_indeed_jobs(query, location, limit)
            
        jobs = []
        
        try:
            # Use a simpler approach with requests to avoid asyncio issues
            import requests
            import time
            
            # Add a longer delay to seem more human-like
            time.sleep(random.uniform(2, 4))
            
            params = {
                'q': query,
                'l': location,
                'limit': min(limit, 50)
            }
            
            url = f"{self.BASE_URL}?{urlencode(params)}"
            headers = self._get_random_headers()
            
            print(f"Searching Indeed for: {query} in {location}")
            
            # Create a session to maintain cookies
            session = requests.Session()
            session.headers.update(headers)
            
            # Try to get the main page first to establish session
            main_response = session.get("https://www.indeed.com/", timeout=10)
            time.sleep(random.uniform(1, 2))
            
            # Now try the job search
            response = session.get(url, timeout=15)
            
            if response.status_code == 403:
                print("Indeed blocked the request (403 Forbidden)")
                print("  Falling back to sample data")
                return self._get_sample_indeed_jobs(query, location, limit)
            
            response.raise_for_status()
            
            # Parse with BeautifulSoup
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try multiple selectors for job cards
            job_cards = (soup.find_all(['div'], class_=['jobsearch-SerpJobCard']) or
                        soup.find_all(['div'], class_=['job_seen_beacon']) or 
                        soup.find_all(['div'], class_=['slider_container']) or
                        soup.find_all(['div'], attrs={'data-jk': True}))
            
            print(f"Found {len(job_cards)} job cards to parse")
            
            if len(job_cards) == 0:
                print("No job cards found - page structure may have changed")
                print("  Falling back to sample data")
                return self._get_sample_indeed_jobs(query, location, limit)
            
            for card in job_cards[:limit]:
                try:
                    job = self._parse_indeed_job_card_bs4(card)
                    if job:
                        jobs.append(job)
                        print(f"  Found: {job.title} at {job.company}")
                except Exception as e:
                    print(f"  Error parsing job card: {e}")
                    continue
                
                self._random_delay()
                
        except requests.exceptions.RequestException as e:
            print(f"Network error scraping Indeed: {e}")
            print("  Falling back to sample data")
            return self._get_sample_indeed_jobs(query, location, limit)
        
        if not jobs:
            print("  No jobs found, using sample data")
            return self._get_sample_indeed_jobs(query, location, limit)
        
        return jobs
    
    def _parse_indeed_job_card(self, card) -> Optional[JobPosting]:
        """Parse individual Indeed job card."""
        try:
            # Extract basic information
            title_element = card.find('h2 a, .jobTitle a', first=True)
            title = title_element.text.strip() if title_element else "Unknown Title"
            
            company_element = card.find('.companyName a, .companyName', first=True)
            company = company_element.text.strip() if company_element else "Unknown Company"
            
            location_element = card.find('.companyLocation', first=True)
            location = location_element.text.strip() if location_element else "Unknown Location"
            
            # Extract job URL
            url = None
            if title_element and title_element.attrs.get('href'):
                url = "https://www.indeed.com" + title_element.attrs['href']
            
            # Extract salary if available
            salary_element = card.find('.salary-snippet', first=True)
            salary = salary_element.text.strip() if salary_element else None
            
            # Get job description snippet
            description_element = card.find('.summary, .job-snippet', first=True)
            description = description_element.text.strip() if description_element else ""
            
            # Extract skills from description
            skills = self.extract_skills_from_text(description)
            
            return JobPosting(
                title=title,
                company=company,
                location=location,
                description=description,
                skills_required=skills,
                salary_range=salary,
                url=url,
                source="indeed"
            )
            
        except Exception as e:
            print(f"Error parsing Indeed job card: {e}")
            return None
    
    def _parse_indeed_job_card_bs4(self, card) -> Optional[JobPosting]:
        """Parse individual Indeed job card using BeautifulSoup."""
        try:
            # Extract basic information using BeautifulSoup
            title_element = card.find(['h2'], class_=['jobTitle']) or card.find(['span'], {'title': True})
            if title_element:
                title_link = title_element.find('a')
                title = title_link.get_text(strip=True) if title_link else title_element.get_text(strip=True)
            else:
                title = "Unknown Title"
            
            company_element = card.find(['span', 'div'], class_=['companyName'])
            company = company_element.get_text(strip=True) if company_element else "Unknown Company"
            
            location_element = card.find(['div'], class_=['companyLocation'])
            location = location_element.get_text(strip=True) if location_element else "Unknown Location"
            
            # Extract job URL
            url = None
            if title_element:
                title_link = title_element.find('a')
                if title_link and title_link.get('href'):
                    url = "https://www.indeed.com" + title_link.get('href')
            
            # Extract salary if available
            salary_element = card.find(['span'], class_=['salary-snippet'])
            salary = salary_element.get_text(strip=True) if salary_element else None
            
            # Get job description snippet
            description_element = card.find(['div'], class_=['summary']) or card.find(['div'], class_=['job-snippet'])
            description = description_element.get_text(strip=True) if description_element else f"Job posting for {title} at {company}"
            
            # Extract skills from description
            skills = self.extract_skills_from_text(description)
            
            return JobPosting(
                title=title,
                company=company,
                location=location,
                description=description,
                skills_required=skills,
                salary_range=salary,
                url=url,
                source="indeed"
            )
            
        except Exception as e:
            print(f"Error parsing Indeed job card with BeautifulSoup: {e}")
            return None

    def _get_sample_indeed_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Get dynamic Indeed jobs using the dynamic job generator."""
        return get_dynamic_sample_jobs(query, location, limit, "indeed")


class LinkedInScraper(JobScraper):
    """Scraper for LinkedIn job postings (simplified version)."""
    
    BASE_URL = "https://www.linkedin.com/jobs/search"
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for jobs on LinkedIn."""
        # Note: LinkedIn has strong anti-scraping measures
        # This is a simplified implementation for demonstration
        # In practice, you might need to use LinkedIn's API or consider alternative approaches
        
        print("⚠️  LinkedIn scraping is limited due to anti-bot measures.")
        print("Consider using LinkedIn's API or job boards that allow scraping.")
        
        # Return sample LinkedIn-style jobs for demonstration
        return self._get_sample_linkedin_jobs(query, location, limit)
    
    def _get_sample_linkedin_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Generate dynamic LinkedIn job postings using the dynamic job generator."""
        return get_dynamic_sample_jobs(query, location, limit, "linkedin")


class GlassdoorScraper(JobScraper):
    """Scraper for Glassdoor job postings."""
    
    BASE_URL = "https://www.glassdoor.com/Job/jobs.htm"
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for jobs on Glassdoor."""
        if not SCRAPING_AVAILABLE:
            return self._get_sample_glassdoor_jobs(query, location, limit)
            
        jobs = []
        
        try:
            import requests
            from bs4 import BeautifulSoup
            import time
            
            # Add delay to seem more human-like
            time.sleep(random.uniform(2, 4))
            
            params = {
                'q': query,
                'l': location,
                'fromAge': 7,  # Jobs from last 7 days
                'limit': min(limit, 30)
            }
            
            url = f"{self.BASE_URL}?{urlencode(params)}"
            headers = self._get_random_headers()
            headers.update({
                'Referer': 'https://www.glassdoor.com/',
                'X-Requested-With': 'XMLHttpRequest'
            })
            
            print(f"Searching Glassdoor for: {query} in {location}")
            
            session = requests.Session()
            session.headers.update(headers)
            
            # Get main page first
            main_response = session.get("https://www.glassdoor.com/", timeout=10)
            time.sleep(random.uniform(1, 2))
            
            response = session.get(url, timeout=15)
            
            if response.status_code in [403, 429]:
                print("Glassdoor blocked the request")
                return self._get_sample_glassdoor_jobs(query, location, limit)
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Glassdoor job card selectors
            job_cards = soup.find_all(['div'], attrs={'data-test': 'job-card'}) or \
                       soup.find_all(['div'], class_=['react-job-listing']) or \
                       soup.find_all(['li'], class_=['react-job-listing'])
            
            print(f"Found {len(job_cards)} Glassdoor job cards")
            
            for card in job_cards[:limit]:
                try:
                    job = self._parse_glassdoor_job_card(card)
                    if job:
                        jobs.append(job)
                        print(f"  Found: {job.title} at {job.company}")
                except Exception as e:
                    continue
                
                self._random_delay()
                
        except Exception as e:
            print(f"Error scraping Glassdoor: {e}")
            return self._get_sample_glassdoor_jobs(query, location, limit)
        
        if not jobs:
            return self._get_sample_glassdoor_jobs(query, location, limit)
        
        return jobs
    
    def _parse_glassdoor_job_card(self, card) -> Optional[JobPosting]:
        """Parse Glassdoor job card."""
        try:
            title_element = card.find(['a'], attrs={'data-test': 'job-title'}) or \
                           card.find(['span'], class_=['jobTitle'])
            title = title_element.get_text(strip=True) if title_element else "Unknown Title"
            
            company_element = card.find(['span'], attrs={'data-test': 'employer-name'}) or \
                             card.find(['div'], class_=['employerName'])
            company = company_element.get_text(strip=True) if company_element else "Unknown Company"
            
            location_element = card.find(['span'], attrs={'data-test': 'job-location'}) or \
                              card.find(['div'], class_=['companyLocation'])
            location = location_element.get_text(strip=True) if location_element else "Unknown Location"
            
            # Extract salary if available
            salary_element = card.find(['span'], attrs={'data-test': 'detailSalary'}) or \
                            card.find(['div'], class_=['salary'])
            salary = salary_element.get_text(strip=True) if salary_element else None
            
            # Description
            description = f"Job posting for {title} at {company} in {location}"
            skills = self.extract_skills_from_text(description)
            
            return JobPosting(
                title=title,
                company=company,
                location=location,
                description=description,
                skills_required=skills,
                salary_range=salary,
                source="glassdoor"
            )
            
        except Exception as e:
            return None
    
    def _get_sample_glassdoor_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Sample Glassdoor jobs with company ratings focus."""
        glassdoor_jobs = [
            JobPosting(
                title="Senior Software Engineer",
                company="Adobe",
                location="San Jose, CA",
                description="Build creative software tools used by millions. Strong background in C++ and graphics programming required.",
                skills_required=["c++", "graphics", "opengl", "python", "git"],
                experience_level="senior",
                salary_range="$140,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                source="glassdoor"
            ),
            JobPosting(
                title="Product Manager",
                company="Slack",
                location="San Francisco, CA",
                description="Lead product strategy for communication platform. Experience with B2B SaaS and agile development.",
                skills_required=["product management", "agile", "sql", "analytics", "jira"],
                experience_level="mid",
                salary_range="$120,000 - $160,000",
                job_type="full-time",
                work_type="remote",
                source="glassdoor"
            ),
            JobPosting(
                title="Data Engineer",
                company="Airbnb",
                location="San Francisco, CA",
                description="Build data pipelines for travel platform. Spark, Kafka, and AWS experience preferred.",
                skills_required=["spark", "kafka", "aws", "python", "sql", "airflow"],
                experience_level="mid",
                salary_range="$130,000 - $170,000",
                job_type="full-time",
                work_type="hybrid",
                source="glassdoor"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in glassdoor_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else glassdoor_jobs[:limit]


class ZipRecruiterScraper(JobScraper):
    """Scraper for ZipRecruiter job postings."""
    
    BASE_URL = "https://www.ziprecruiter.com/jobs-search"
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for jobs on ZipRecruiter."""
        if not SCRAPING_AVAILABLE:
            return self._get_sample_ziprecruiter_jobs(query, location, limit)
            
        jobs = []
        
        try:
            import requests
            from bs4 import BeautifulSoup
            import time
            
            time.sleep(random.uniform(1, 3))
            
            params = {
                'search': query,
                'location': location,
                'days': 7,
                'radius': 25
            }
            
            url = f"{self.BASE_URL}?{urlencode(params)}"
            headers = self._get_random_headers()
            
            print(f"Searching ZipRecruiter for: {query} in {location}")
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code in [403, 429]:
                print("ZipRecruiter blocked the request")
                return self._get_sample_ziprecruiter_jobs(query, location, limit)
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # ZipRecruiter selectors
            job_cards = soup.find_all(['div'], class_=['job_result']) or \
                       soup.find_all(['article'], class_=['job']) or \
                       soup.find_all(['div'], attrs={'data-testid': 'job-card'})
            
            print(f"Found {len(job_cards)} ZipRecruiter job cards")
            
            for card in job_cards[:limit]:
                try:
                    job = self._parse_ziprecruiter_job_card(card)
                    if job:
                        jobs.append(job)
                        print(f"  Found: {job.title} at {job.company}")
                except Exception as e:
                    continue
                
                self._random_delay()
                
        except Exception as e:
            print(f"Error scraping ZipRecruiter: {e}")
            return self._get_sample_ziprecruiter_jobs(query, location, limit)
        
        if not jobs:
            return self._get_sample_ziprecruiter_jobs(query, location, limit)
        
        return jobs
    
    def _parse_ziprecruiter_job_card(self, card) -> Optional[JobPosting]:
        """Parse ZipRecruiter job card."""
        try:
            title_element = card.find(['h2']) or card.find(['a'], class_=['job_link'])
            title = title_element.get_text(strip=True) if title_element else "Unknown Title"
            
            company_element = card.find(['a'], class_=['company']) or \
                             card.find(['span'], class_=['companyName'])
            company = company_element.get_text(strip=True) if company_element else "Unknown Company"
            
            location_element = card.find(['span'], class_=['location']) or \
                              card.find(['div'], class_=['location'])
            location = location_element.get_text(strip=True) if location_element else "Unknown Location"
            
            salary_element = card.find(['span'], class_=['salary']) or \
                            card.find(['div'], class_=['pay'])
            salary = salary_element.get_text(strip=True) if salary_element else None
            
            description = f"Job opportunity for {title} at {company}"
            skills = self.extract_skills_from_text(description)
            
            return JobPosting(
                title=title,
                company=company,
                location=location,
                description=description,
                skills_required=skills,
                salary_range=salary,
                source="ziprecruiter"
            )
            
        except Exception as e:
            return None
    
    def _get_sample_ziprecruiter_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Sample ZipRecruiter jobs."""
        ziprecruiter_jobs = [
            JobPosting(
                title="Full Stack Developer",
                company="Microsoft",
                location="Redmond, WA",
                description="Develop cloud applications using .NET, React, and Azure. Join our collaborative team building the future of productivity.",
                skills_required=["c#", "react", "azure", "sql server", "typescript"],
                experience_level="mid",
                salary_range="$100,000 - $140,000",
                job_type="full-time",
                work_type="hybrid",
                source="ziprecruiter"
            ),
            JobPosting(
                title="DevOps Engineer",
                company="Tesla",
                location="Austin, TX",
                description="Automate deployment pipelines for electric vehicle software. Kubernetes, Terraform, and CI/CD expertise required.",
                skills_required=["kubernetes", "terraform", "jenkins", "docker", "aws", "python"],
                experience_level="senior",
                salary_range="$120,000 - $160,000",
                job_type="full-time",
                work_type="onsite",
                source="ziprecruiter"
            ),
            JobPosting(
                title="Machine Learning Engineer",
                company="OpenAI",
                location="San Francisco, CA",
                description="Research and deploy large language models. Strong background in deep learning and distributed systems.",
                skills_required=["pytorch", "transformers", "cuda", "python", "distributed systems"],
                experience_level="senior",
                salary_range="$180,000 - $250,000",
                job_type="full-time",
                work_type="hybrid",
                source="ziprecruiter"
            )
        ]
        
        query_lower = query.lower()
        relevant_jobs = [job for job in ziprecruiter_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else ziprecruiter_jobs[:limit]


class EnhancedLinkedInScraper(JobScraper):
    """Enhanced LinkedIn scraper with better anti-detection."""
    
    BASE_URL = "https://www.linkedin.com/jobs/search"
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for jobs on LinkedIn with enhanced techniques."""
        if not SCRAPING_AVAILABLE:
            return self._get_sample_enhanced_linkedin_jobs(query, location, limit)
            
        jobs = []
        
        try:
            import requests
            from bs4 import BeautifulSoup
            import time
            
            # Longer delays for LinkedIn
            time.sleep(random.uniform(3, 6))
            
            params = {
                'keywords': query,
                'location': location,
                'trk': 'public_jobs_jobs-search-bar_search-submit',
                'position': 1,
                'pageNum': 0,
                'f_TPR': 'r86400'  # Last 24 hours
            }
            
            url = f"{self.BASE_URL}?{urlencode(params)}"
            
            # Enhanced headers for LinkedIn
            headers = self._get_random_headers()
            headers.update({
                'Referer': 'https://www.linkedin.com/',
                'X-Requested-With': 'XMLHttpRequest',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Authority': 'www.linkedin.com'
            })
            
            print(f"Searching LinkedIn for: {query} in {location}")
            
            session = requests.Session()
            session.headers.update(headers)
            
            # Visit LinkedIn homepage first to establish session
            homepage = session.get("https://www.linkedin.com/", timeout=10)
            time.sleep(random.uniform(2, 4))
            
            # Get jobs page
            response = session.get(url, timeout=15)
            
            if response.status_code in [403, 429]:
                print("LinkedIn blocked the request")
                return self._get_sample_enhanced_linkedin_jobs(query, location, limit)
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # LinkedIn job card selectors
            job_cards = soup.find_all(['div'], class_=['base-card']) or \
                       soup.find_all(['li'], class_=['result-card']) or \
                       soup.find_all(['div'], attrs={'data-entity-urn': True})
            
            print(f"Found {len(job_cards)} LinkedIn job cards")
            
            for card in job_cards[:limit]:
                try:
                    job = self._parse_enhanced_linkedin_job_card(card)
                    if job:
                        jobs.append(job)
                        print(f"  Found: {job.title} at {job.company}")
                except Exception as e:
                    continue
                
                # Longer delays for LinkedIn
                time.sleep(random.uniform(2, 4))
                
        except Exception as e:
            print(f"Error scraping LinkedIn: {e}")
            return self._get_sample_enhanced_linkedin_jobs(query, location, limit)
        
        if not jobs:
            return self._get_sample_enhanced_linkedin_jobs(query, location, limit)
        
        return jobs
    
    def _parse_enhanced_linkedin_job_card(self, card) -> Optional[JobPosting]:
        """Parse LinkedIn job card with enhanced selectors."""
        try:
            title_element = card.find(['h3']) or card.find(['h4']) or \
                           card.find(['a'], class_=['result-card__full-card-link'])
            title = title_element.get_text(strip=True) if title_element else "Unknown Title"
            
            company_element = card.find(['h4']) or card.find(['span'], class_=['result-card__subtitle']) or \
                             card.find(['a'], class_=['result-card__subtitle-link'])
            company = company_element.get_text(strip=True) if company_element else "Unknown Company"
            
            location_element = card.find(['span'], class_=['job-result-card__location']) or \
                              card.find(['span'], class_=['result-card__location'])
            location = location_element.get_text(strip=True) if location_element else "Unknown Location"
            
            description_element = card.find(['div'], class_=['job-result-card__snippet']) or \
                                 card.find(['p'], class_=['result-card__snippet'])
            description = description_element.get_text(strip=True) if description_element else f"Job at {company}"
            
            skills = self.extract_skills_from_text(description)
            
            return JobPosting(
                title=title,
                company=company,
                location=location,
                description=description,
                skills_required=skills,
                source="linkedin"
            )
            
        except Exception as e:
            return None
    
    def _get_sample_enhanced_linkedin_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced LinkedIn sample jobs with professional focus."""
        linkedin_jobs = [
            JobPosting(
                title="Senior Software Engineer",
                company="Apple",
                location="Cupertino, CA",
                description="Design and develop next-generation iOS applications. Swift, Objective-C, and iOS SDK expertise required.",
                skills_required=["swift", "objective-c", "ios", "xcode", "git", "agile"],
                experience_level="senior",
                salary_range="$150,000 - $200,000",
                job_type="full-time",
                work_type="hybrid",
                source="linkedin"
            ),
            JobPosting(
                title="Product Designer",
                company="Figma",
                location="San Francisco, CA",
                description="Create beautiful and intuitive user experiences for design collaboration tools. Strong UX/UI background needed.",
                skills_required=["figma", "sketch", "prototyping", "user research", "design systems"],
                experience_level="mid",
                salary_range="$110,000 - $150,000",
                job_type="full-time",
                work_type="remote",
                source="linkedin"
            ),
            JobPosting(
                title="Data Scientist",
                company="Uber",
                location="San Francisco, CA",
                description="Analyze rider and driver behavior patterns. Build ML models for pricing and demand forecasting.",
                skills_required=["python", "sql", "machine learning", "spark", "kafka", "a/b testing"],
                experience_level="senior",
                salary_range="$140,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                source="linkedin"
            ),
            JobPosting(
                title="Cloud Architect",
                company="Amazon Web Services",
                location="Seattle, WA",
                description="Design scalable cloud infrastructure solutions for enterprise customers. AWS expertise essential.",
                skills_required=["aws", "terraform", "kubernetes", "docker", "python", "cloud architecture"],
                experience_level="senior",
                salary_range="$160,000 - $220,000",
                job_type="full-time",
                work_type="hybrid",
                source="linkedin"
            )
        ]
        
        query_lower = query.lower()
        relevant_jobs = [job for job in linkedin_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else linkedin_jobs[:limit]


class RemoteOKScraper(JobScraper):
    """Scraper for RemoteOK remote jobs API."""
    
    BASE_URL = "https://remoteok.io/api"
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search for remote jobs using RemoteOK API."""
        if not SCRAPING_AVAILABLE:
            return self._get_sample_remote_jobs(query, location, limit)
            
        jobs = []
        
        try:
            import requests
            import time
            
            time.sleep(random.uniform(1, 2))
            
            headers = self._get_random_headers()
            headers['User-Agent'] = 'Career Assistant Bot (contact@example.com)'
            
            print(f"Searching RemoteOK for: {query} (remote jobs)")
            
            response = requests.get(self.BASE_URL, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                for job_data in data[:limit]:
                    if not isinstance(job_data, dict):
                        continue
                        
                    try:
                        # Filter by query
                        title = job_data.get('position', '')
                        description = job_data.get('description', '')
                        company = job_data.get('company', '')
                        
                        if not any(word.lower() in f"{title} {description} {company}".lower() 
                                 for word in query.lower().split()):
                            continue
                        
                        # Extract skills from tags
                        tags = job_data.get('tags', [])
                        skills = [tag.lower() for tag in tags if isinstance(tag, str)]
                        
                        # Build salary range
                        salary_min = job_data.get('salary_min')
                        salary_max = job_data.get('salary_max')
                        salary_range = None
                        if salary_min and salary_max:
                            salary_range = f"${salary_min:,} - ${salary_max:,}"
                        
                        job = JobPosting(
                            title=title,
                            company=company,
                            location="Remote",
                            description=description or f"Remote {title} position at {company}",
                            skills_required=skills,
                            salary_range=salary_range,
                            job_type="full-time",
                            work_type="remote",
                            url=job_data.get('url', ''),
                            source="remoteok"
                        )
                        
                        jobs.append(job)
                        print(f"  Found: {job.title} at {job.company}")
                        
                    except Exception as e:
                        continue
                        
            else:
                print(f"RemoteOK API returned status: {response.status_code}")
                return self._get_sample_remote_jobs(query, location, limit)
                
        except Exception as e:
            print(f"Error accessing RemoteOK API: {e}")
            return self._get_sample_remote_jobs(query, location, limit)
        
        if not jobs:
            return self._get_sample_remote_jobs(query, location, limit)
        
        return jobs
    
    def _get_sample_remote_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Sample remote jobs."""
        remote_jobs = [
            JobPosting(
                title="Remote Python Developer",
                company="GitLab",
                location="Remote",
                description="Work on the world's largest all-remote team. Build features for millions of developers using Ruby and Vue.js.",
                skills_required=["ruby", "vue.js", "python", "postgresql", "redis", "git"],
                experience_level="mid",
                salary_range="$90,000 - $140,000",
                job_type="full-time",
                work_type="remote",
                source="remoteok"
            ),
            JobPosting(
                title="Remote Data Scientist",
                company="Automattic",
                location="Remote",
                description="Analyze user behavior for WordPress.com and WooCommerce. Work from anywhere in the world.",
                skills_required=["python", "r", "sql", "machine learning", "statistics", "tableau"],
                experience_level="senior",
                salary_range="$120,000 - $160,000",
                job_type="full-time",
                work_type="remote",
                source="remoteok"
            ),
            JobPosting(
                title="Remote Frontend Engineer",
                company="Buffer",
                location="Remote",
                description="Build social media management tools used by 160,000+ customers. React and TypeScript focus.",
                skills_required=["react", "typescript", "javascript", "css", "node.js", "graphql"],
                experience_level="mid",
                salary_range="$95,000 - $130,000",
                job_type="full-time",
                work_type="remote",
                source="remoteok"
            )
        ]
        
        query_lower = query.lower()
        relevant_jobs = [job for job in remote_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else remote_jobs[:limit]


class JobsAPIProvider(JobScraper):
    """Provider for free job APIs that don't require scraping."""
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search using various free job APIs."""
        jobs = []
        
        # Try multiple API sources
        jobs.extend(self._search_usajobs_api(query, location, limit//3))
        jobs.extend(self._search_github_jobs_api(query, location, limit//3))
        jobs.extend(self._get_curated_startup_jobs(query, location, limit//3))
        
        return jobs[:limit]
    
    def _search_usajobs_api(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Search government jobs via USAJobs API."""
        try:
            import requests
            
            headers = {
                'Host': 'data.usajobs.gov',
                'User-Agent': 'Career-Assistant-Bot/1.0 (contact@example.com)',
                'Authorization-Key': 'dummy-key'  # USAJobs requires registration
            }
            
            params = {
                'Keyword': query,
                'LocationName': location,
                'ResultsPerPage': min(limit, 25)
            }
            
            # Note: This would require actual API registration
            # For now, return sample government jobs
            return self._get_sample_government_jobs(query, location, limit)
            
        except Exception:
            return self._get_sample_government_jobs(query, location, limit)
    
    def _search_github_jobs_api(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Search tech jobs (GitHub Jobs API was discontinued, using sample)."""
        return self._get_sample_tech_startup_jobs(query, location, limit)
    
    def _get_curated_startup_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Curated startup jobs from various sources."""
        startup_jobs = [
            JobPosting(
                title="Full Stack Engineer",
                company="Notion",
                location="San Francisco, CA",
                description="Help build the future of productivity tools. Work with React, Node.js, and cutting-edge technologies.",
                skills_required=["react", "node.js", "typescript", "postgresql", "redis"],
                experience_level="mid",
                salary_range="$130,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                source="startup-jobs"
            ),
            JobPosting(
                title="AI/ML Engineer",
                company="Anthropic",
                location="San Francisco, CA",
                description="Research and develop large language models. Work on the frontier of AI safety and capabilities.",
                skills_required=["pytorch", "transformers", "python", "cuda", "distributed systems"],
                experience_level="senior",
                salary_range="$200,000 - $300,000",
                job_type="full-time",
                work_type="hybrid",
                source="startup-jobs"
            ),
            JobPosting(
                title="DevOps Engineer",
                company="Vercel",
                location="Remote",
                description="Scale the platform that powers the modern web. Work with Next.js, Kubernetes, and global edge infrastructure.",
                skills_required=["kubernetes", "docker", "aws", "terraform", "next.js", "typescript"],
                experience_level="senior",
                salary_range="$140,000 - $200,000",
                job_type="full-time",
                work_type="remote",
                source="startup-jobs"
            )
        ]
        
        query_lower = query.lower()
        relevant_jobs = [job for job in startup_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else startup_jobs[:limit]
    
    def _get_sample_government_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Sample government/public sector jobs."""
        gov_jobs = [
            JobPosting(
                title="Software Developer",
                company="U.S. Digital Service",
                location="Washington, DC",
                description="Modernize government technology to better serve the American people. Work on high-impact projects.",
                skills_required=["javascript", "python", "aws", "agile", "user research"],
                experience_level="mid",
                salary_range="$102,000 - $172,000",
                job_type="full-time",
                work_type="hybrid",
                source="government"
            ),
            JobPosting(
                title="Data Scientist",
                company="NASA",
                location="Houston, TX",
                description="Analyze space mission data and support human spaceflight operations. Security clearance required.",
                skills_required=["python", "r", "machine learning", "matlab", "sql"],
                experience_level="senior",
                salary_range="$95,000 - $145,000",
                job_type="full-time",
                work_type="onsite",
                source="government"
            )
        ]
        
        query_lower = query.lower()
        relevant_jobs = [job for job in gov_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else gov_jobs[:limit]
    
    def _get_sample_tech_startup_jobs(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Sample tech startup jobs."""
        startup_jobs = [
            JobPosting(
                title="Senior React Developer",
                company="Discord",
                location="San Francisco, CA",
                description="Build features for millions of gamers and communities. Real-time communication at scale.",
                skills_required=["react", "typescript", "websockets", "node.js", "redis"],
                experience_level="senior",
                salary_range="$150,000 - $200,000",
                job_type="full-time",
                work_type="hybrid",
                source="tech-startups"
            ),
            JobPosting(
                title="Platform Engineer",
                company="Cloudflare",
                location="Austin, TX",
                description="Build the infrastructure that powers 20% of the web. Work with global edge computing.",
                skills_required=["go", "rust", "kubernetes", "linux", "networking"],
                experience_level="senior",
                salary_range="$140,000 - $190,000",
                job_type="full-time",
                work_type="remote",
                source="tech-startups"
            )
        ]
        
        query_lower = query.lower()
        relevant_jobs = [job for job in startup_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else startup_jobs[:limit]


class LinkedInAPIClient:
    """Official LinkedIn API client for job data extraction."""
    
    def __init__(self, client_id: str = None, client_secret: str = None):
        """Initialize LinkedIn API client with credentials."""
        self.client_id = client_id or "your_linkedin_client_id"
        self.client_secret = client_secret or "your_linkedin_client_secret"
        self.access_token = None
        self.base_url = "https://api.linkedin.com/v2"
        
    def authenticate(self) -> bool:
        """Authenticate with LinkedIn API using OAuth 2.0."""
        try:
            import requests
            
            # For now, we'll use a placeholder authentication
            # In production, you'd need to implement full OAuth flow
            print("LinkedIn API: Authentication would be implemented here")
            print("Note: LinkedIn API requires business partnership for job data")
            return False
            
        except Exception as e:
            print(f"LinkedIn API authentication failed: {e}")
            return False
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using LinkedIn API."""
        if not self.access_token:
            print("LinkedIn API: No valid access token, using dynamic sample data")
            return get_dynamic_sample_jobs(query, location, limit, "linkedin-api")
        
        try:
            import requests
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            
            params = {
                'keywords': query,
                'locationFacet': location,
                'count': min(limit, 200),  # LinkedIn API limit
                'start': 0
            }
            
            url = f"{self.base_url}/jobSearch"
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_linkedin_api_response(data)
            else:
                print(f"LinkedIn API error: {response.status_code}")
                return self._get_linkedin_api_sample_data(query, location, limit)
                
        except Exception as e:
            print(f"LinkedIn API request failed: {e}")
            return self._get_linkedin_api_sample_data(query, location, limit)
    
    def _parse_linkedin_api_response(self, data: dict) -> List[JobPosting]:
        """Parse LinkedIn API response into JobPosting objects."""
        jobs = []
        
        elements = data.get('elements', [])
        for job_data in elements:
            try:
                # Extract job information from LinkedIn API response structure
                title = job_data.get('title', 'Unknown Title')
                company = job_data.get('companyDetails', {}).get('company', {}).get('name', 'Unknown Company')
                location = job_data.get('formattedLocation', 'Unknown Location')
                description = job_data.get('description', {}).get('text', '')
                
                # Extract skills from job requirements
                skills = []
                if 'skillMatchStatuses' in job_data:
                    skills = [skill.get('skill', {}).get('name', '') 
                             for skill in job_data['skillMatchStatuses']]
                
                job = JobPosting(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    skills_required=skills,
                    url=job_data.get('jobPostingUrl', ''),
                    posted_date=job_data.get('listedAt', ''),
                    source="linkedin-api"
                )
                
                jobs.append(job)
                
            except Exception as e:
                continue
        
        return jobs
    
    def _get_linkedin_api_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced LinkedIn sample data that simulates API responses."""
        linkedin_api_jobs = [
            JobPosting(
                title="Senior Software Engineer - Platform",
                company="LinkedIn",
                location="Sunnyvale, CA",
                description="Build the platform that connects professionals worldwide. Work with large-scale distributed systems, microservices, and real-time data processing.",
                skills_required=["java", "scala", "kafka", "hadoop", "spark", "kubernetes"],
                experience_level="senior",
                salary_range="$160,000 - $220,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://linkedin.com/jobs/12345",
                source="linkedin-api"
            ),
            JobPosting(
                title="Data Scientist - ML Infrastructure",
                company="Salesforce",
                location="San Francisco, CA",
                description="Develop machine learning infrastructure for CRM platform. Build ML pipelines, feature stores, and model deployment systems.",
                skills_required=["python", "tensorflow", "pytorch", "mlflow", "airflow", "aws"],
                experience_level="senior",
                salary_range="$145,000 - $195,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://linkedin.com/jobs/12346",
                source="linkedin-api"
            ),
            JobPosting(
                title="Product Manager - AI",
                company="NVIDIA",
                location="Santa Clara, CA",
                description="Lead AI product strategy for GPU computing platforms. Work with engineering teams on AI chip development and software ecosystems.",
                skills_required=["product management", "ai/ml", "gpu computing", "cuda", "product strategy"],
                experience_level="senior",
                salary_range="$150,000 - $200,000",
                job_type="full-time",
                work_type="onsite",
                url="https://linkedin.com/jobs/12347",
                source="linkedin-api"
            ),
            JobPosting(
                title="Full Stack Engineer",
                company="Zoom",
                location="San Jose, CA",
                description="Build video conferencing features used by millions. Work with React, Node.js, and real-time communication protocols.",
                skills_required=["react", "node.js", "webrtc", "typescript", "redis", "postgresql"],
                experience_level="mid",
                salary_range="$120,000 - $160,000",
                job_type="full-time",
                work_type="remote",
                url="https://linkedin.com/jobs/12348",
                source="linkedin-api"
            ),
            JobPosting(
                title="DevOps Engineer - Cloud Infrastructure",
                company="Snowflake",
                location="San Mateo, CA",
                description="Manage cloud infrastructure for data warehouse platform. Work with AWS, Kubernetes, and infrastructure as code.",
                skills_required=["aws", "kubernetes", "terraform", "docker", "python", "monitoring"],
                experience_level="mid",
                salary_range="$130,000 - $170,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://linkedin.com/jobs/12349",
                source="linkedin-api"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in linkedin_api_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else linkedin_api_jobs[:limit]


class NaukriAPIClient:
    """Naukri.com API client for Indian job market data."""
    
    def __init__(self, api_key: str = None):
        """Initialize Naukri API client."""
        self.api_key = api_key or "your_naukri_api_key"
        self.base_url = "https://www.naukri.com/jobapi/v3"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using Naukri API."""
        try:
            import requests
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'CareerAssistant/1.0'
            }
            
            params = {
                'keywords': query,
                'location': location,
                'limit': min(limit, 100),
                'industry': 'IT-Software,IT-Hardware',
                'experience': '0-15',
                'api_key': self.api_key
            }
            
            print(f"Searching Naukri API for: {query} in {location}")
            
            # Note: Naukri API requires business partnership
            # For now, we'll use enhanced sample data
            return self._get_naukri_sample_data(query, location, limit)
            
        except Exception as e:
            print(f"Naukri API request failed: {e}")
            return self._get_naukri_sample_data(query, location, limit)
    
    def _get_naukri_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced Naukri sample data for Indian job market."""
        naukri_jobs = [
            JobPosting(
                title="Senior Python Developer",
                company="Infosys",
                location="Bangalore, India",
                description="Develop enterprise applications using Python, Django, and cloud technologies. Work with global clients on digital transformation projects.",
                skills_required=["python", "django", "aws", "mysql", "rest api", "microservices"],
                experience_level="senior",
                salary_range="₹12,00,000 - ₹18,00,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://naukri.com/jobs/12345",
                source="naukri"
            ),
            JobPosting(
                title="Data Scientist",
                company="Tata Consultancy Services",
                location="Mumbai, India",
                description="Build ML models for banking and financial services clients. Work with large datasets and advanced analytics.",
                skills_required=["python", "machine learning", "pandas", "scikit-learn", "sql", "tableau"],
                experience_level="mid",
                salary_range="₹8,00,000 - ₹14,00,000",
                job_type="full-time",
                work_type="onsite",
                url="https://naukri.com/jobs/12346",
                source="naukri"
            ),
            JobPosting(
                title="Full Stack Developer",
                company="Wipro",
                location="Hyderabad, India",
                description="Develop web applications using MEAN/MERN stack. Work on client projects in healthcare and retail domains.",
                skills_required=["javascript", "react", "node.js", "mongodb", "express", "angular"],
                experience_level="mid",
                salary_range="₹6,00,000 - ₹12,00,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://naukri.com/jobs/12347",
                source="naukri"
            ),
            JobPosting(
                title="DevOps Engineer",
                company="Tech Mahindra",
                location="Pune, India",
                description="Manage CI/CD pipelines and cloud infrastructure. Work with Docker, Kubernetes, and AWS services.",
                skills_required=["docker", "kubernetes", "aws", "jenkins", "terraform", "linux"],
                experience_level="mid",
                salary_range="₹7,00,000 - ₹13,00,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://naukri.com/jobs/12348",
                source="naukri"
            ),
            JobPosting(
                title="Software Engineer - Java",
                company="HCL Technologies",
                location="Chennai, India",
                description="Develop enterprise Java applications for global clients. Work with Spring Boot, microservices, and cloud platforms.",
                skills_required=["java", "spring boot", "microservices", "mysql", "rest api", "junit"],
                experience_level="entry",
                salary_range="₹4,00,000 - ₹8,00,000",
                job_type="full-time",
                work_type="onsite",
                url="https://naukri.com/jobs/12349",
                source="naukri"
            ),
            JobPosting(
                title="React Developer",
                company="Accenture",
                location="Gurgaon, India",
                description="Build modern web applications using React.js and related technologies. Work on digital transformation projects.",
                skills_required=["react", "javascript", "typescript", "redux", "webpack", "jest"],
                experience_level="mid",
                salary_range="₹5,00,000 - ₹10,00,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://naukri.com/jobs/12350",
                source="naukri"
            ),
            JobPosting(
                title="Senior Data Engineer",
                company="Cognizant",
                location="Bangalore, India",
                description="Design and implement data pipelines for big data analytics. Work with Spark, Hadoop, and cloud data platforms.",
                skills_required=["spark", "hadoop", "python", "sql", "airflow", "aws"],
                experience_level="senior",
                salary_range="₹10,00,000 - ₹16,00,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://naukri.com/jobs/12351",
                source="naukri"
            ),
            JobPosting(
                title="Machine Learning Engineer",
                company="Flipkart",
                location="Bangalore, India",
                description="Build recommendation systems and ML models for e-commerce platform. Work with TensorFlow, PyTorch, and big data.",
                skills_required=["machine learning", "python", "tensorflow", "pytorch", "spark", "kafka"],
                experience_level="senior",
                salary_range="₹15,00,000 - ₹25,00,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://naukri.com/jobs/12352",
                source="naukri"
            )
        ]
        
        # Filter based on query and location
        query_lower = query.lower()
        relevant_jobs = [job for job in naukri_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        # Filter by location if specified
        if location and location.strip():
            location_filtered = [job for job in relevant_jobs 
                               if location.lower() in job.location.lower()]
            if location_filtered:
                relevant_jobs = location_filtered
        
        return relevant_jobs[:limit] if relevant_jobs else naukri_jobs[:limit]


class LinkedInNaukriScraper(JobScraper):
    """Combined scraper for LinkedIn and Naukri using their APIs."""
    
    def __init__(self):
        super().__init__()
        self.linkedin_client = LinkedInAPIClient()
        self.naukri_client = NaukriAPIClient()
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs from both LinkedIn and Naukri APIs."""
        all_jobs = []
        
        try:
            # Search LinkedIn API
            linkedin_jobs = self.linkedin_client.search_jobs(query, location, limit//2)
            all_jobs.extend(linkedin_jobs)
            print(f"Found {len(linkedin_jobs)} jobs from LinkedIn API")
            
            # Search Naukri API
            naukri_jobs = self.naukri_client.search_jobs(query, location, limit//2)
            all_jobs.extend(naukri_jobs)
            print(f"Found {len(naukri_jobs)} jobs from Naukri API")
            
        except Exception as e:
            print(f"API search failed: {e}")
        
        return all_jobs[:limit]


class MonsterAPIClient:
    """Monster.com API client for general job market coverage."""
    
    def __init__(self, api_key: str = None):
        """Initialize Monster API client."""
        self.api_key = api_key or "your_monster_api_key"
        self.base_url = "https://api.monster.com/v2"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using Monster API."""
        try:
            import requests
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'User-Agent': 'CareerAssistant/1.0'
            }
            
            params = {
                'q': query,
                'where': location,
                'page': 1,
                'page_size': min(limit, 100)
            }
            
            print(f"Searching Monster API for: {query} in {location}")
            
            # Note: Monster API requires business partnership
            print("Note: Monster API requires business partnership, using enhanced sample data")
            return self._get_monster_sample_data(query, location, limit)
            
        except Exception as e:
            print(f"Monster API request failed: {e}")
            return self._get_monster_sample_data(query, location, limit)
    
    def _get_monster_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced Monster sample data for general job market."""
        monster_jobs = [
            JobPosting(
                title="Senior Software Engineer",
                company="Accenture",
                location="New York, NY",
                description="Lead software development projects for Fortune 500 clients. Work with cloud technologies and modern development practices.",
                skills_required=["java", "spring", "aws", "docker", "kubernetes", "microservices"],
                experience_level="senior",
                salary_range="$120,000 - $150,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://monster.com/jobs/12345",
                source="monster"
            ),
            JobPosting(
                title="Data Analyst",
                company="IBM",
                location="Austin, TX",
                description="Analyze business data to drive strategic decisions. Create dashboards and reports for executive leadership.",
                skills_required=["sql", "python", "tableau", "excel", "data visualization", "statistics"],
                experience_level="mid",
                salary_range="$75,000 - $95,000",
                job_type="full-time",
                work_type="remote",
                url="https://monster.com/jobs/12346",
                source="monster"
            ),
            JobPosting(
                title="Project Manager - IT",
                company="Deloitte",
                location="Chicago, IL",
                description="Manage large-scale IT transformation projects. Lead cross-functional teams and ensure project delivery.",
                skills_required=["project management", "agile", "scrum", "stakeholder management", "pmp"],
                experience_level="senior",
                salary_range="$110,000 - $135,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://monster.com/jobs/12347",
                source="monster"
            ),
            JobPosting(
                title="Frontend Developer",
                company="Capital One",
                location="McLean, VA",
                description="Build responsive web applications for banking platform. Work with React, TypeScript, and modern frontend tools.",
                skills_required=["react", "typescript", "javascript", "css", "html", "redux"],
                experience_level="mid",
                salary_range="$90,000 - $120,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://monster.com/jobs/12348",
                source="monster"
            ),
            JobPosting(
                title="Cybersecurity Analyst",
                company="Lockheed Martin",
                location="Denver, CO",
                description="Monitor and protect critical infrastructure systems. Implement security policies and incident response procedures.",
                skills_required=["cybersecurity", "incident response", "siem", "network security", "risk assessment"],
                experience_level="mid",
                salary_range="$85,000 - $110,000",
                job_type="full-time",
                work_type="onsite",
                url="https://monster.com/jobs/12349",
                source="monster"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in monster_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else monster_jobs[:limit]


class CareerBuilderAPIClient:
    """CareerBuilder API client for professional job listings."""
    
    def __init__(self, api_key: str = None):
        """Initialize CareerBuilder API client."""
        self.api_key = api_key or "your_careerbuilder_api_key"
        self.base_url = "https://api.careerbuilder.com/v2"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using CareerBuilder API."""
        try:
            import requests
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'CareerAssistant/1.0'
            }
            
            params = {
                'keywords': query,
                'location': location,
                'perpage': min(limit, 100),
                'developerkey': self.api_key
            }
            
            print(f"Searching CareerBuilder API for: {query} in {location}")
            
            # Note: CareerBuilder API requires business partnership
            print("Note: CareerBuilder API requires business partnership, using enhanced sample data")
            return self._get_careerbuilder_sample_data(query, location, limit)
            
        except Exception as e:
            print(f"CareerBuilder API request failed: {e}")
            return self._get_careerbuilder_sample_data(query, location, limit)
    
    def _get_careerbuilder_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced CareerBuilder sample data for professional roles."""
        careerbuilder_jobs = [
            JobPosting(
                title="Solutions Architect",
                company="Microsoft",
                location="Redmond, WA",
                description="Design and implement enterprise cloud solutions. Work with Azure services and help customers migrate to cloud.",
                skills_required=["azure", "cloud architecture", "solution design", "enterprise integration"],
                experience_level="senior",
                salary_range="$140,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://careerbuilder.com/jobs/12345",
                source="careerbuilder"
            ),
            JobPosting(
                title="Business Analyst",
                company="JPMorgan Chase",
                location="Jersey City, NJ",
                description="Analyze business requirements and translate them into technical specifications. Work with development teams on financial applications.",
                skills_required=["business analysis", "requirements gathering", "sql", "financial services"],
                experience_level="mid",
                salary_range="$95,000 - $125,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://careerbuilder.com/jobs/12346",
                source="careerbuilder"
            ),
            JobPosting(
                title="Marketing Manager - Digital",
                company="Coca-Cola",
                location="Atlanta, GA",
                description="Lead digital marketing campaigns and brand strategy. Manage social media presence and online advertising initiatives.",
                skills_required=["digital marketing", "social media", "brand management", "analytics", "seo"],
                experience_level="senior",
                salary_range="$105,000 - $135,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://careerbuilder.com/jobs/12347",
                source="careerbuilder"
            ),
            JobPosting(
                title="Quality Assurance Engineer",
                company="Tesla",
                location="Fremont, CA",
                description="Ensure software quality for automotive systems. Design and execute test plans for vehicle software components.",
                skills_required=["test automation", "selenium", "python", "automotive testing", "ci/cd"],
                experience_level="mid",
                salary_range="$100,000 - $130,000",
                job_type="full-time",
                work_type="onsite",
                url="https://careerbuilder.com/jobs/12348",
                source="careerbuilder"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in careerbuilder_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else careerbuilder_jobs[:limit]


class SimplyHiredAPIClient:
    """SimplyHired API client for aggregated job search results."""
    
    def __init__(self, api_key: str = None):
        """Initialize SimplyHired API client."""
        self.api_key = api_key or "your_simplyhired_api_key"
        self.base_url = "https://api.simplyhired.com/v2"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using SimplyHired API."""
        try:
            import requests
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'CareerAssistant/1.0'
            }
            
            params = {
                'q': query,
                'l': location,
                'pn': 1,
                'ws': min(limit, 100),
                'pshid': self.api_key
            }
            
            print(f"Searching SimplyHired API for: {query} in {location}")
            
            # Note: SimplyHired API requires partnership
            print("Note: SimplyHired API requires partnership, using enhanced sample data")
            return self._get_simplyhired_sample_data(query, location, limit)
            
        except Exception as e:
            print(f"SimplyHired API request failed: {e}")
            return self._get_simplyhired_sample_data(query, location, limit)
    
    def _get_simplyhired_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced SimplyHired sample data for aggregated results."""
        simplyhired_jobs = [
            JobPosting(
                title="Full Stack Developer",
                company="Airbnb",
                location="San Francisco, CA",
                description="Build end-to-end features for travel platform. Work with React, Node.js, and distributed systems.",
                skills_required=["react", "node.js", "javascript", "mongodb", "redis", "microservices"],
                experience_level="mid",
                salary_range="$130,000 - $170,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://simplyhired.com/jobs/12345",
                source="simplyhired"
            ),
            JobPosting(
                title="DevOps Engineer",
                company="Netflix",
                location="Los Gatos, CA",
                description="Manage streaming infrastructure at global scale. Work with AWS, Kubernetes, and monitoring systems.",
                skills_required=["aws", "kubernetes", "docker", "terraform", "monitoring", "ci/cd"],
                experience_level="senior",
                salary_range="$150,000 - $200,000",
                job_type="full-time",
                work_type="remote",
                url="https://simplyhired.com/jobs/12346",
                source="simplyhired"
            ),
            JobPosting(
                title="Product Designer",
                company="Spotify",
                location="New York, NY",
                description="Design user experiences for music streaming platform. Create wireframes, prototypes, and design systems.",
                skills_required=["ui/ux design", "figma", "prototyping", "user research", "design systems"],
                experience_level="mid",
                salary_range="$115,000 - $145,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://simplyhired.com/jobs/12347",
                source="simplyhired"
            ),
            JobPosting(
                title="Machine Learning Engineer",
                company="Uber",
                location="Palo Alto, CA",
                description="Build ML models for ride-sharing optimization. Work with real-time data processing and recommendation systems.",
                skills_required=["machine learning", "python", "tensorflow", "spark", "kafka", "real-time systems"],
                experience_level="senior",
                salary_range="$160,000 - $220,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://simplyhired.com/jobs/12348",
                source="simplyhired"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in simplyhired_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else simplyhired_jobs[:limit]


class AngelListAPIClient:
    """AngelList (Wellfound) API client for startup and tech company jobs."""
    
    def __init__(self, api_key: str = None):
        """Initialize AngelList API client."""
        self.api_key = api_key or "your_angellist_api_key"
        self.base_url = "https://api.angellist.co/1"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using AngelList API."""
        try:
            import requests
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'CareerAssistant/1.0'
            }
            
            params = {
                'role': query,
                'location_slug': location.lower().replace(' ', '-').replace(',', ''),
                'page': 1,
                'per_page': min(limit, 50)
            }
            
            print(f"Searching AngelList API for: {query} in {location}")
            
            # Note: AngelList API has been discontinued for public use
            print("Note: AngelList API discontinued for public use, using enhanced sample data")
            return self._get_angellist_sample_data(query, location, limit)
            
        except Exception as e:
            print(f"AngelList API request failed: {e}")
            return self._get_angellist_sample_data(query, location, limit)
    
    def _get_angellist_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced AngelList sample data for startup and tech jobs."""
        angellist_jobs = [
            JobPosting(
                title="Senior Frontend Engineer",
                company="Stripe",
                location="San Francisco, CA",
                description="Build payment infrastructure UI used by millions of businesses. Work with React, TypeScript, and design systems.",
                skills_required=["react", "typescript", "javascript", "design systems", "payments"],
                experience_level="senior",
                salary_range="$150,000 - $220,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://wellfound.com/jobs/12345",
                source="angellist"
            ),
            JobPosting(
                title="Growth Engineer",
                company="Notion",
                location="San Francisco, CA",
                description="Drive user acquisition and engagement through data-driven experiments and product optimizations.",
                skills_required=["python", "sql", "a/b testing", "analytics", "growth hacking"],
                experience_level="mid",
                salary_range="$130,000 - $180,000",
                job_type="full-time",
                work_type="remote",
                url="https://wellfound.com/jobs/12346",
                source="angellist"
            ),
            JobPosting(
                title="Founding Engineer",
                company="Acme Startup",
                location="Austin, TX",
                description="Join as first engineering hire to build revolutionary fintech platform. Equity-heavy compensation package.",
                skills_required=["full stack", "node.js", "react", "postgresql", "startup experience"],
                experience_level="senior",
                salary_range="$120,000 - $160,000 + equity",
                job_type="full-time",
                work_type="hybrid",
                url="https://wellfound.com/jobs/12347",
                source="angellist"
            ),
            JobPosting(
                title="Product Manager",
                company="Discord",
                location="San Francisco, CA",
                description="Own product strategy for gaming and community features. Work directly with engineering and design teams.",
                skills_required=["product management", "gaming", "community building", "analytics"],
                experience_level="mid",
                salary_range="$140,000 - $190,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://wellfound.com/jobs/12348",
                source="angellist"
            ),
            JobPosting(
                title="Data Scientist",
                company="Instacart",
                location="San Francisco, CA",
                description="Build ML models for grocery delivery optimization. Work with recommendation systems and demand forecasting.",
                skills_required=["machine learning", "python", "sql", "recommendation systems", "forecasting"],
                experience_level="senior",
                salary_range="$145,000 - $195,000",
                job_type="full-time",
                work_type="remote",
                url="https://wellfound.com/jobs/12349",
                source="angellist"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in angellist_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else angellist_jobs[:limit]


class DiceAPIClient:
    """Dice API client for technology and IT jobs."""
    
    def __init__(self, api_key: str = None):
        """Initialize Dice API client."""
        self.api_key = api_key or "your_dice_api_key"
        self.base_url = "https://api.dice.com/v1"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using Dice API."""
        try:
            import requests
            
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'CareerAssistant/1.0',
                'Authorization': f'Bearer {self.api_key}'
            }
            
            params = {
                'q': query,
                'countryCode2': 'US',
                'radius': '30',
                'radiusUnit': 'mi',
                'page': 1,
                'pageSize': min(limit, 100),
                'facets': 'employmentType|postedDate|workFromHomeAvailability',
                'fields': 'id|jobTitle|summary|employerName|location'
            }
            
            if location:
                params['city'] = location
            
            print(f"Searching Dice API for: {query} in {location}")
            
            # Note: Dice API requires business partnership
            print("Note: Dice API requires business partnership, using enhanced sample data")
            return self._get_dice_sample_data(query, location, limit)
            
        except Exception as e:
            print(f"Dice API request failed: {e}")
            return self._get_dice_sample_data(query, location, limit)
    
    def _get_dice_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced Dice sample data for technology and IT jobs."""
        dice_jobs = [
            JobPosting(
                title="Senior Java Developer",
                company="Oracle",
                location="Austin, TX",
                description="Develop enterprise Java applications for database management systems. Work with Spring, Hibernate, and microservices.",
                skills_required=["java", "spring", "hibernate", "microservices", "oracle database", "rest api"],
                experience_level="senior",
                salary_range="$125,000 - $160,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://dice.com/jobs/12345",
                source="dice"
            ),
            JobPosting(
                title="Cloud Infrastructure Engineer",
                company="VMware",
                location="Palo Alto, CA",
                description="Design and implement cloud infrastructure solutions. Work with vSphere, Kubernetes, and hybrid cloud environments.",
                skills_required=["vmware", "kubernetes", "cloud infrastructure", "terraform", "ansible"],
                experience_level="senior",
                salary_range="$140,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://dice.com/jobs/12346",
                source="dice"
            ),
            JobPosting(
                title="Python Developer",
                company="Red Hat",
                location="Raleigh, NC",
                description="Develop open-source Python applications and tools. Contribute to Linux distributions and container technologies.",
                skills_required=["python", "linux", "docker", "kubernetes", "open source", "git"],
                experience_level="mid",
                salary_range="$95,000 - $125,000",
                job_type="full-time",
                work_type="remote",
                url="https://dice.com/jobs/12347",
                source="dice"
            ),
            JobPosting(
                title="Database Administrator",
                company="SAP",
                location="Newtown Square, PA",
                description="Manage enterprise database systems and ensure high availability. Work with SAP HANA, PostgreSQL, and cloud databases.",
                skills_required=["database administration", "sap hana", "postgresql", "backup/recovery", "performance tuning"],
                experience_level="senior",
                salary_range="$115,000 - $145,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://dice.com/jobs/12348",
                source="dice"
            ),
            JobPosting(
                title="iOS Developer",
                company="Apple",
                location="Cupertino, CA",
                description="Develop iOS applications and frameworks. Work on core iOS features used by millions of users worldwide.",
                skills_required=["swift", "objective-c", "ios development", "xcode", "core data", "ui/ux"],
                experience_level="senior",
                salary_range="$155,000 - $210,000",
                job_type="full-time",
                work_type="onsite",
                url="https://dice.com/jobs/12349",
                source="dice"
            ),
            JobPosting(
                title="Network Security Engineer",
                company="Cisco",
                location="San Jose, CA",
                description="Design and implement network security solutions. Work with firewalls, VPNs, and intrusion detection systems.",
                skills_required=["network security", "cisco", "firewalls", "vpn", "intrusion detection", "ccna"],
                experience_level="mid",
                salary_range="$105,000 - $135,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://dice.com/jobs/12350",
                source="dice"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in dice_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else dice_jobs[:limit]


class AdditionalJobAPIScraper(JobScraper):
    """Combined scraper for additional job APIs: Monster, CareerBuilder, SimplyHired, AngelList, and Dice."""
    
    def __init__(self):
        super().__init__()
        self.monster_client = MonsterAPIClient()
        self.careerbuilder_client = CareerBuilderAPIClient()
        self.simplyhired_client = SimplyHiredAPIClient()
        self.angellist_client = AngelListAPIClient()
        self.dice_client = DiceAPIClient()
    
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs from all additional job API sources."""
        all_jobs = []
        jobs_per_source = max(1, limit // 5)  # Distribute across 5 sources
        
        try:
            # Search Monster
            monster_jobs = self.monster_client.search_jobs(query, location, jobs_per_source)
            all_jobs.extend(monster_jobs)
            print(f"Found {len(monster_jobs)} jobs from Monster")
            
            # Search CareerBuilder
            careerbuilder_jobs = self.careerbuilder_client.search_jobs(query, location, jobs_per_source)
            all_jobs.extend(careerbuilder_jobs)
            print(f"Found {len(careerbuilder_jobs)} jobs from CareerBuilder")
            
            # Search SimplyHired
            simplyhired_jobs = self.simplyhired_client.search_jobs(query, location, jobs_per_source)
            all_jobs.extend(simplyhired_jobs)
            print(f"Found {len(simplyhired_jobs)} jobs from SimplyHired")
            
            # Search AngelList
            angellist_jobs = self.angellist_client.search_jobs(query, location, jobs_per_source)
            all_jobs.extend(angellist_jobs)
            print(f"Found {len(angellist_jobs)} jobs from AngelList")
            
            # Search Dice
            dice_jobs = self.dice_client.search_jobs(query, location, jobs_per_source)
            all_jobs.extend(dice_jobs)
            print(f"Found {len(dice_jobs)} jobs from Dice")
            
        except Exception as e:
            print(f"Additional API search failed: {e}")
        
        return all_jobs[:limit]


class AdzunaAPIClient:
    """Adzuna API client for real job data (free tier available)."""
    
    def __init__(self, app_id: str = None, api_key: str = None):
        """Initialize Adzuna API client."""
        # These are demo credentials - users should get their own from adzuna.com
        self.app_id = app_id or "your_adzuna_app_id"
        self.api_key = api_key or "your_adzuna_api_key"
        self.base_url = "https://api.adzuna.com/v1/api"
        
    def search_jobs(self, query: str, location: str = "", limit: int = 50) -> List[JobPosting]:
        """Search jobs using Adzuna API (real data when credentials are provided)."""
        try:
            import requests
            import json
            
            # Determine country and location
            country = "us"  # Default to US
            where = location if location else ""
            
            headers = {
                'User-Agent': 'CareerAssistant/1.0'
            }
            
            params = {
                'app_id': self.app_id,
                'app_key': self.api_key,
                'results_per_page': min(limit, 50),
                'what': query,
                'where': where,
                'content-type': 'application/json'
            }
            
            url = f"{self.base_url}/jobs/{country}/search/1"
            
            print(f"Attempting Adzuna API search for: {query} in {location}")
            
            # Check if we have real credentials
            if self.app_id == "your_adzuna_app_id" or self.api_key == "your_adzuna_api_key":
                print("Note: Adzuna API requires free registration at adzuna.com, using enhanced sample data")
                return self._get_adzuna_sample_data(query, location, limit)
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                jobs = self._parse_adzuna_response(data)
                print(f"✅ Found {len(jobs)} REAL jobs from Adzuna API")
                return jobs[:limit]
            else:
                print(f"Adzuna API error: {response.status_code}")
                return self._get_adzuna_sample_data(query, location, limit)
                
        except Exception as e:
            print(f"Adzuna API request failed: {e}")
            return self._get_adzuna_sample_data(query, location, limit)
    
    def _parse_adzuna_response(self, data: dict) -> List[JobPosting]:
        """Parse Adzuna API response into JobPosting objects."""
        jobs = []
        
        results = data.get('results', [])
        for job_data in results:
            try:
                title = job_data.get('title', 'Unknown Title')
                company = job_data.get('company', {}).get('display_name', 'Unknown Company')
                location = job_data.get('location', {}).get('display_name', 'Unknown Location')
                description = job_data.get('description', '')
                
                # Extract salary info
                salary_min = job_data.get('salary_min')
                salary_max = job_data.get('salary_max')
                salary_range = ""
                if salary_min and salary_max:
                    salary_range = f"${salary_min:,.0f} - ${salary_max:,.0f}"
                elif salary_min:
                    salary_range = f"From ${salary_min:,.0f}"
                
                job = JobPosting(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    skills_required=[],  # Adzuna doesn't provide structured skills
                    salary_range=salary_range,
                    url=job_data.get('redirect_url', ''),
                    posted_date=job_data.get('created', ''),
                    source="adzuna-real"
                )
                
                jobs.append(job)
                
            except Exception as e:
                continue
        
        return jobs
    
    def _get_adzuna_sample_data(self, query: str, location: str, limit: int) -> List[JobPosting]:
        """Enhanced Adzuna sample data that mimics real API structure."""
        adzuna_sample_jobs = [
            JobPosting(
                title="Senior Software Engineer",
                company="Real Tech Corp",
                location="San Francisco, CA",
                description="We are seeking a Senior Software Engineer to join our team. You'll work on cutting-edge projects using modern technologies.",
                skills_required=["python", "javascript", "react", "node.js", "aws"],
                experience_level="senior",
                salary_range="$140,000 - $180,000",
                job_type="full-time",
                work_type="hybrid",
                url="https://example-real-job.com/apply/12345",
                source="adzuna-sample"
            ),
            JobPosting(
                title="Data Scientist",
                company="Analytics Pro Inc",
                location="New York, NY",
                description="Join our data science team to build ML models and derive insights from large datasets.",
                skills_required=["python", "machine learning", "sql", "pandas", "scikit-learn"],
                experience_level="mid",
                salary_range="$120,000 - $160,000",
                job_type="full-time",
                work_type="remote",
                url="https://example-real-job.com/apply/12346",
                source="adzuna-sample"
            )
        ]
        
        # Filter based on query
        query_lower = query.lower()
        relevant_jobs = [job for job in adzuna_sample_jobs 
                        if any(word in job.title.lower() or word in job.description.lower() 
                              for word in query_lower.split())]
        
        return relevant_jobs[:limit] if relevant_jobs else adzuna_sample_jobs[:limit]


class JobAggregator:
    """Aggregates jobs from multiple sources."""
    
    def __init__(self):
        self.indeed_scraper = IndeedScraper()
        self.linkedin_scraper = LinkedInScraper()
        self.enhanced_linkedin_scraper = EnhancedLinkedInScraper()
        self.glassdoor_scraper = GlassdoorScraper()
        self.ziprecruiter_scraper = ZipRecruiterScraper()
        self.remoteok_scraper = RemoteOKScraper()
        self.jobs_api_provider = JobsAPIProvider()
        self.linkedin_naukri_scraper = LinkedInNaukriScraper()  # API-based scraper
        self.additional_apis_scraper = AdditionalJobAPIScraper()  # Additional APIs scraper
        self.adzuna_client = AdzunaAPIClient()  # Real job data API
        # Initialize Apify clients with environment variables
        apify_token = os.getenv('APIFY_API_TOKEN')
        linkedin_dataset_id = os.getenv('APIFY_LINKEDIN_DATASET_ID', '1bgPCIvQOdVi4gYbh')
        
        self.apify_linkedin_client = ApifyJobClient(
            dataset_id=linkedin_dataset_id,
            api_token=apify_token
        )
        self.apify_indeed_client = ApifyIndeedClient(
            api_token=apify_token
        )
    
    def search_all_sources(self, query: str, location: str = "", limit_per_source: int = 25) -> List[JobPosting]:
        """Search for jobs across all sources."""
        all_jobs = []
        
        print(f"Starting comprehensive job search for: '{query}' in '{location}'")
        print("Searching across Apify LinkedIn (real data), Apify Indeed (real data), Adzuna, Indeed, LinkedIn, Glassdoor, ZipRecruiter, RemoteOK, LinkedIn/Naukri APIs, Monster, CareerBuilder, SimplyHired, AngelList, Dice, and specialized APIs...")
        
        # Search Apify LinkedIn dataset (real data - highest priority)
        try:
            apify_linkedin_jobs = self.apify_linkedin_client.search_jobs(query, location)
            all_jobs.extend(apify_linkedin_jobs)
            print(f"Found {len(apify_linkedin_jobs)} jobs from Apify LinkedIn dataset (real data)")
        except Exception as e:
            print(f"Apify LinkedIn search failed: {e}")
        
        # Search Apify Indeed Actor (real data - high priority)
        try:
            apify_indeed_jobs = self.apify_indeed_client.search_jobs(query, location, limit_per_source)
            all_jobs.extend(apify_indeed_jobs)
            print(f"Found {len(apify_indeed_jobs)} jobs from Apify Indeed Actor (real data)")
        except Exception as e:
            print(f"Apify Indeed search failed: {e}")
        
        # Search Adzuna API (real data priority)
        try:
            adzuna_jobs = self.adzuna_client.search_jobs(query, location, limit_per_source)
            all_jobs.extend(adzuna_jobs)
            print(f"Found {len(adzuna_jobs)} jobs from Adzuna (real data API)")
        except Exception as e:
            print(f"Adzuna API search failed: {e}")
        
        # Search LinkedIn and Naukri APIs (priority)
        try:
            api_jobs = self.linkedin_naukri_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(api_jobs)
            print(f"Found {len(api_jobs)} jobs from LinkedIn/Naukri APIs")
        except Exception as e:
            print(f"LinkedIn/Naukri API search failed: {e}")
        
        # Search Indeed
        try:
            indeed_jobs = self.indeed_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(indeed_jobs)
            print(f"Found {len(indeed_jobs)} jobs from Indeed")
        except Exception as e:
            print(f"Indeed search failed: {e}")
        
        # Search Enhanced LinkedIn
        try:
            enhanced_linkedin_jobs = self.enhanced_linkedin_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(enhanced_linkedin_jobs)
            print(f"Found {len(enhanced_linkedin_jobs)} jobs from LinkedIn")
        except Exception as e:
            print(f"LinkedIn search failed: {e}")
        
        # Search Glassdoor
        try:
            glassdoor_jobs = self.glassdoor_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(glassdoor_jobs)
            print(f"Found {len(glassdoor_jobs)} jobs from Glassdoor")
        except Exception as e:
            print(f"Glassdoor search failed: {e}")
        
        # Search ZipRecruiter
        try:
            ziprecruiter_jobs = self.ziprecruiter_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(ziprecruiter_jobs)
            print(f"Found {len(ziprecruiter_jobs)} jobs from ZipRecruiter")
        except Exception as e:
            print(f"ZipRecruiter search failed: {e}")
        
        # Search RemoteOK for remote jobs
        try:
            remote_jobs = self.remoteok_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(remote_jobs)
            print(f"Found {len(remote_jobs)} remote jobs from RemoteOK")
        except Exception as e:
            print(f"RemoteOK search failed: {e}")
        
        # Search API providers (startups, government, tech)
        try:
            api_jobs = self.jobs_api_provider.search_jobs(query, location, limit_per_source)
            all_jobs.extend(api_jobs)
            print(f"Found {len(api_jobs)} jobs from API providers")
        except Exception as e:
            print(f"API provider search failed: {e}")
        
        # Search Additional Job APIs (Monster, CareerBuilder, SimplyHired, AngelList, Dice)
        try:
            additional_jobs = self.additional_apis_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(additional_jobs)
            print(f"Found {len(additional_jobs)} jobs from additional APIs (Monster, CareerBuilder, SimplyHired, AngelList, Dice)")
        except Exception as e:
            print(f"Additional APIs search failed: {e}")
        
        # Search Original LinkedIn (backup)
        try:
            linkedin_jobs = self.linkedin_scraper.search_jobs(query, location, limit_per_source)
            all_jobs.extend(linkedin_jobs)
            print(f"Found {len(linkedin_jobs)} jobs from LinkedIn (backup)")
        except Exception as e:
            print(f"LinkedIn backup search failed: {e}")
        
        print(f"Total jobs found across all sources: {len(all_jobs)}")
        return all_jobs
    
    def save_jobs_to_file(self, jobs: List[JobPosting], filename: str):
        """Save jobs to JSON file."""
        jobs_dict = [job.to_dict() for job in jobs]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(jobs_dict, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Saved {len(jobs)} jobs to {filename}")
    
    def load_jobs_from_file(self, filename: str) -> List[JobPosting]:
        """Load jobs from JSON file."""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                jobs_data = json.load(f)
            
            jobs = []
            for job_dict in jobs_data:
                job = JobPosting(**job_dict)
                jobs.append(job)
            
            print(f"📂 Loaded {len(jobs)} jobs from {filename}")
            return jobs
            
        except FileNotFoundError:
            print(f"❌ File {filename} not found")
            return []
        except Exception as e:
            print(f"❌ Error loading jobs: {e}")
            return []


class ApifyIndeedClient:
    """Client for Apify Indeed Actor - provides real Indeed job data"""
    
    def __init__(self, api_token):
        self.api_token = api_token
        self.actor_id = "qA8rz8tR61HdkfTBL"  # Indeed scraper actor
        self.base_url = "https://api.apify.com/v2/acts"
    
    def search_jobs(self, query, location="", limit=25):
        """Search for jobs using Apify Indeed Actor"""
        try:
            import requests
            
            # Prepare the input for Indeed Actor
            if location:
                search_url = f"https://www.indeed.com/jobs?q={query}&l={location}"
            else:
                search_url = f"https://www.indeed.com/jobs?q={query}"
            
            input_data = {
                "scrapeJobs.searchUrl": search_url,
                "scrapeJobs.scrapeCompany": False,
                "count": min(limit, 50),  # Limit to avoid long runs
                "outputSchema": "raw",
                "findContacts": False
            }
            
            # Start the actor run
            run_url = f"{self.base_url}/{self.actor_id}/runs"
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            
            print(f"🚀 Starting Indeed scraper for: {query} in {location}")
            response = requests.post(run_url, json=input_data, headers=headers, timeout=30)
            
            if response.status_code in [200, 201]:
                run_data = response.json()
                run_id = run_data.get('id')
                
                if run_id:
                    # Wait for run completion and get results
                    return self._wait_for_results(run_id, query, location)
                else:
                    print(f"Failed to get run ID from Indeed Actor")
                    return []
            else:
                print(f"Indeed Actor start failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Indeed Actor exception: {e}")
            return []
    
    def _wait_for_results(self, run_id, query, location, max_wait=60):
        """Wait for actor run to complete and fetch results"""
        try:
            import requests
            import time
            
            headers = {"Authorization": f"Bearer {self.api_token}"}
            run_url = f"{self.base_url}/{self.actor_id}/runs/{run_id}"
            
            # Wait for completion (with timeout)
            start_time = time.time()
            while time.time() - start_time < max_wait:
                response = requests.get(run_url, headers=headers, timeout=10)
                if response.status_code == 200:
                    run_data = response.json()
                    status = run_data.get('status')
                    
                    if status == 'SUCCEEDED':
                        # Get dataset items
                        dataset_id = run_data.get('defaultDatasetId')
                        if dataset_id:
                            return self._fetch_dataset_items(dataset_id, query, location)
                        break
                    elif status in ['FAILED', 'ABORTED', 'TIMED-OUT']:
                        print(f"Indeed Actor run {status}")
                        break
                
                time.sleep(5)  # Wait 5 seconds before checking again
            
            print(f"Indeed Actor timeout after {max_wait} seconds")
            return []
            
        except Exception as e:
            print(f"Error waiting for Indeed results: {e}")
            return []
    
    def _fetch_dataset_items(self, dataset_id, query, location):
        """Fetch and format job data from dataset"""
        try:
            import requests
            
            headers = {"Authorization": f"Bearer {self.api_token}"}
            dataset_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
            
            response = requests.get(dataset_url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                jobs = []
                
                print(f"SUCCESS: Indeed Actor found {len(data)} jobs")
                
                for item in data:
                    # Format Indeed job data
                    job_title = item.get('title', 'Unknown Title')
                    company = item.get('company', 'Unknown Company')
                    job_location = item.get('location', location or 'Unknown Location')
                    description = item.get('description', '')
                    
                    # Clean and truncate description
                    if len(description) > 300:
                        description = description[:300] + "..."
                    
                    # Format salary
                    salary = item.get('salary', 'Not specified')
                    if not salary or salary.strip() == '':
                        salary = 'Not specified'
                    
                    # Create JobPosting object
                    job = JobPosting(
                        title=job_title,
                        company=company,
                        location=job_location,
                        description=description,
                        url=item.get('link', item.get('url', '#')),
                        salary_range=salary,
                        posted_date=item.get('datePosted', 'Unknown'),
                        source='apify-indeed',
                        job_type=item.get('jobType', 'Full-time'),
                        work_type='unknown',
                        skills_required=[]
                    )
                    jobs.append(job)
                
                return jobs[:20]  # Return top 20 matches
            else:
                print(f"Failed to fetch Indeed dataset: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error fetching Indeed dataset: {e}")
            return []


class ApifyJobClient:
    """Client for Apify job dataset API - provides real LinkedIn job data"""
    
    def __init__(self, dataset_id, api_token):
        self.dataset_id = dataset_id
        self.api_token = api_token
        self.base_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
    
    def search_jobs(self, query, location="", page=1):
        """Search for jobs from Apify dataset"""
        try:
            import requests
            
            params = {
                'token': self.api_token,
                'format': 'json'
            }
            
            response = requests.get(self.base_url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                jobs = []
                
                # Filter jobs based on query and location if provided
                for item in data:
                    title = item.get('title', '').lower()
                    job_location = item.get('location', '').lower()
                    company = item.get('companyName', '')
                    
                    # More lenient filtering logic - if no query, include all jobs
                    query_match = True  # Default to include all
                    if query and query.strip():  # Only filter if query is provided and not empty
                        query_match = query.lower() in title or query.lower() in company.lower()
                    
                    location_match = True  # Default to include all
                    if location and location.strip():  # Only filter if location is provided and not empty
                        location_match = location.lower() in job_location
                    
                    if query_match and location_match:
                        # Format salary
                        salary = item.get('salary', 'Not specified')
                        if not salary or salary.strip() == '':
                            salary = 'Not specified'
                        
                        # Format description
                        description = item.get('description', '')
                        if len(description) > 300:
                            description = description[:300] + "..."
                        
                        # Create JobPosting object
                        job = JobPosting(
                            title=item.get('title', 'Unknown Title'),
                            company=company,
                            location=item.get('location', 'Unknown Location'),
                            description=description,
                            url=item.get('jobUrl', item.get('applyUrl', '#')),
                            salary_range=salary,
                            posted_date=item.get('postedTime', 'Unknown'),
                            source='apify-linkedin',
                            job_type=item.get('contractType', 'Full-time'),
                            work_type='unknown',
                            skills_required=[]
                        )
                        jobs.append(job)
                
                # Sort by relevance (exact title matches first) if query provided
                if query and query.strip():
                    jobs.sort(key=lambda x: 0 if query.lower() in x.title.lower() else 1)
                
                return jobs[:20]  # Return top 20 matches
            else:
                print(f"Apify API error: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Apify API exception: {e}")
            return []


if __name__ == "__main__":
    # Example usage
    aggregator = JobAggregator()
    
    # Search for data science jobs
    jobs = aggregator.search_all_sources("data scientist", "San Francisco", 10)
    
    # Save results
    aggregator.save_jobs_to_file(jobs, "sample_jobs.json")
    
    # Display results
    for i, job in enumerate(jobs, 1):
        print(f"\n{i}. {job.title} at {job.company}")
        print(f"   Location: {job.location}")
        print(f"   Skills: {', '.join(job.skills_required)}")
        print(f"   Source: {job.source}")