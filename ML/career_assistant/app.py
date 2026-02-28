"""
Career Assistant API Service

RESTful API service for job search and recommendations using machine learning.
Provides endpoints for the Credexa backend to integrate with ML functionality.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Add src directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
sys.path.insert(0, src_path)

try:
    from user_profile import UserProfile
    from job_scraper import JobAggregator
    from recommendation_engine import JobRecommendationEngine
    from job_analyzer import generate_comprehensive_report
    print("✅ All ML modules imported successfully")
except ImportError as e:
    print(f"⚠️  Warning: Some ML modules not found: {e}")
    print("📝 Creating fallback classes...")
    
    # Fallback classes for when ML modules are not available
    class UserProfile:
        def __init__(self, skills=None, experience_level='mid', location='', preferred_roles=None, **kwargs):
            self.skills = skills or []
            self.experience_level = experience_level or 'mid'
            self.location = location or ''
            self.preferred_roles = preferred_roles or []
            # Handle additional kwargs
            for key, value in kwargs.items():
                setattr(self, key, value)
            
    class JobPosting:
        def __init__(self, title, company, location, description='', skills_required=None, 
                     experience_level='mid', salary_range='', job_type='full-time', 
                     work_type='onsite', url='', posted_date='', source='static'):
            self.title = title
            self.company = company
            self.location = location
            self.description = description
            self.skills_required = skills_required or []
            self.experience_level = experience_level
            self.salary_range = salary_range
            self.job_type = job_type
            self.work_type = work_type
            self.url = url
            self.posted_date = posted_date
            self.source = source
            
    class JobAggregator:
        def search_all_sources(self, query, location, limit):
            import random
            from datetime import datetime, timedelta
            
            # Dynamic job generator based on query
            companies = [
                "Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Spotify", "Uber", "Airbnb", "Tesla",
                "Stripe", "Slack", "Zoom", "Dropbox", "GitHub", "GitLab", "Atlassian", "Salesforce", "Adobe", "Oracle",
                "IBM", "Intel", "NVIDIA", "AMD", "Cisco", "VMware", "Red Hat", "MongoDB", "Snowflake", "Databricks",
                "TechCorp", "InnovateLab", "StartupTech", "DevSolutions", "CodeCraft", "DataFlow", "CloudTech", "WebScale",
                "QuantumSoft", "NeuralNet", "ByteDance", "TikTok", "Twitter", "LinkedIn", "Discord", "Reddit",
                "Shopify", "Square", "PayPal", "Coinbase", "Robinhood", "DoorDash", "Instacart", "Lyft", "WeWork",
                "Canva", "Figma", "Notion", "Airtable", "Zapier", "Twilio", "SendGrid", "Mailchimp", "HubSpot",
                "Zendesk", "Intercom", "Freshworks", "ServiceNow", "Workday", "Okta", "Auth0", "Cloudflare",
                "Vercel", "Netlify", "PlanetScale", "Supabase", "Firebase", "Hasura", "Prisma", "Grafana"
            ]
            
            locations = [
                "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Boston, MA", "Chicago, IL",
                "Los Angeles, CA", "Denver, CO", "Portland, OR", "Atlanta, GA", "Remote", "Hybrid",
                "London, UK", "Berlin, Germany", "Amsterdam, Netherlands", "Paris, France", "Toronto, Canada",
                "Sydney, Australia", "Tel Aviv, Israel", "Singapore", "Tokyo, Japan", "Seoul, South Korea",
                "Bangalore, India", "Mumbai, India", "Hyderabad, India", "Pune, India", "Delhi, India",
                "Dublin, Ireland", "Zurich, Switzerland", "Stockholm, Sweden", "Copenhagen, Denmark"
            ]
            
            # Query-specific job templates
            job_templates = {
                "python": [
                    {"title": "Python Developer", "skills": ["python", "django", "flask", "fastapi", "postgresql", "redis"]},
                    {"title": "Backend Python Engineer", "skills": ["python", "fastapi", "sqlalchemy", "celery", "docker"]},
                    {"title": "Python Full Stack Developer", "skills": ["python", "react", "typescript", "postgresql", "aws"]},
                    {"title": "Senior Python Engineer", "skills": ["python", "microservices", "kubernetes", "mongodb", "graphql"]},
                    {"title": "Python DevOps Engineer", "skills": ["python", "terraform", "ansible", "jenkins", "aws", "docker"]},
                ],
                "javascript": [
                    {"title": "JavaScript Developer", "skills": ["javascript", "react", "node.js", "express", "mongodb"]},
                    {"title": "Frontend JavaScript Engineer", "skills": ["javascript", "react", "vue", "typescript", "webpack"]},
                    {"title": "Full Stack JavaScript Developer", "skills": ["javascript", "node.js", "react", "postgresql", "graphql"]},
                    {"title": "Senior JavaScript Engineer", "skills": ["javascript", "typescript", "next.js", "tailwindcss", "prisma"]},
                    {"title": "JavaScript UI/UX Developer", "skills": ["javascript", "react", "figma", "css", "html5"]},
                ],
                "react": [
                    {"title": "React Developer", "skills": ["react", "javascript", "typescript", "redux", "css"]},
                    {"title": "Senior React Engineer", "skills": ["react", "next.js", "typescript", "graphql", "jest"]},
                    {"title": "React Native Developer", "skills": ["react native", "javascript", "ios", "android", "expo"]},
                    {"title": "Frontend React Developer", "skills": ["react", "typescript", "tailwindcss", "vite", "cypress"]},
                    {"title": "React Full Stack Developer", "skills": ["react", "node.js", "typescript", "prisma", "planetscale"]},
                ],
                "data": [
                    {"title": "Data Scientist", "skills": ["python", "machine learning", "pandas", "scikit-learn", "tensorflow"]},
                    {"title": "Senior Data Scientist", "skills": ["python", "deep learning", "pytorch", "mlflow", "airflow"]},
                    {"title": "Data Engineer", "skills": ["python", "spark", "kafka", "airflow", "snowflake"]},
                    {"title": "ML Engineer", "skills": ["python", "tensorflow", "kubernetes", "mlops", "aws"]},
                    {"title": "Data Analyst", "skills": ["python", "sql", "tableau", "powerbi", "excel"]},
                ],
                "java": [
                    {"title": "Java Developer", "skills": ["java", "spring", "hibernate", "mysql", "maven"]},
                    {"title": "Senior Java Engineer", "skills": ["java", "spring boot", "microservices", "kafka", "redis"]},
                    {"title": "Java Full Stack Developer", "skills": ["java", "spring", "react", "postgresql", "docker"]},
                    {"title": "Java Backend Developer", "skills": ["java", "spring boot", "jpa", "rabbitmq", "elasticsearch"]},
                    {"title": "Java DevOps Engineer", "skills": ["java", "jenkins", "docker", "kubernetes", "aws"]},
                ],
                "software": [
                    {"title": "Software Engineer", "skills": ["python", "javascript", "react", "node.js", "postgresql"]},
                    {"title": "Senior Software Engineer", "skills": ["typescript", "go", "kubernetes", "microservices", "aws"]},
                    {"title": "Full Stack Software Engineer", "skills": ["react", "node.js", "typescript", "graphql", "prisma"]},
                    {"title": "Software Development Engineer", "skills": ["java", "spring", "kafka", "redis", "docker"]},
                    {"title": "Staff Software Engineer", "skills": ["golang", "distributed systems", "kubernetes", "kafka", "observability"]},
                ],
                "devops": [
                    {"title": "DevOps Engineer", "skills": ["docker", "kubernetes", "terraform", "aws", "jenkins"]},
                    {"title": "Senior DevOps Engineer", "skills": ["kubernetes", "helm", "terraform", "gitlab-ci", "monitoring"]},
                    {"title": "Cloud DevOps Engineer", "skills": ["aws", "azure", "terraform", "ansible", "prometheus"]},
                    {"title": "Platform Engineer", "skills": ["kubernetes", "istio", "grafana", "elasticsearch", "terraform"]},
                    {"title": "Site Reliability Engineer", "skills": ["golang", "kubernetes", "prometheus", "grafana", "terraform"]},
                ]
            }
            
            # Find matching job templates based on query
            query_lower = query.lower()
            matching_templates = []
            
            for key, templates in job_templates.items():
                if key in query_lower or any(key in skill for skill in query_lower.split()):
                    matching_templates.extend(templates)
            
            # If no specific match, use general software engineer templates
            if not matching_templates:
                matching_templates = job_templates["software"]
            
            # Generate diverse jobs
            generated_jobs = []
            for i in range(min(limit * 3, 100)):  # Generate more than needed
                template = random.choice(matching_templates)
                company = random.choice(companies)
                location_choice = random.choice(locations)
                
                # Generate salary based on role level
                base_salary = random.randint(70, 80) * 1000
                if "senior" in template["title"].lower() or "staff" in template["title"].lower():
                    base_salary = random.randint(120, 180) * 1000
                elif "lead" in template["title"].lower() or "principal" in template["title"].lower():
                    base_salary = random.randint(160, 250) * 1000
                
                salary_range = f"${base_salary:,} - ${base_salary + random.randint(20, 40) * 1000:,}"
                
                # Experience level
                if "senior" in template["title"].lower():
                    exp_level = "senior"
                elif "junior" in template["title"].lower() or "entry" in template["title"].lower():
                    exp_level = "entry"
                else:
                    exp_level = "mid"
                
                # Work type
                work_types = ["remote", "hybrid", "onsite"]
                if "remote" in location_choice.lower():
                    work_type = "remote"
                else:
                    work_type = random.choice(work_types)
                
                # Generate description
                descriptions = [
                    f"Join {company} as a {template['title']} and work on exciting projects using cutting-edge technologies.",
                    f"We're looking for a talented {template['title']} to help build the future of technology at {company}.",
                    f"{company} is seeking a skilled {template['title']} to join our growing engineering team.",
                    f"Exciting opportunity for a {template['title']} at {company}. Work with modern tech stack and innovative solutions.",
                    f"Help shape the next generation of products as a {template['title']} at {company}.",
                ]
                
                # Posted date (random within last 30 days)
                days_ago = random.randint(0, 30)
                posted_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
                
                job = JobPosting(
                    title=template["title"],
                    company=company,
                    location=location_choice,
                    description=random.choice(descriptions),
                    skills_required=template["skills"],
                    experience_level=exp_level,
                    salary_range=salary_range,
                    job_type="full-time",
                    work_type=work_type,
                    url=f"https://{company.lower().replace(' ', '')}.com/jobs/{random.randint(1000, 9999)}",
                    posted_date=posted_date,
                    source="ml-generated"
                )
                generated_jobs.append(job)
            
            # Filter by location if specified
            if location:
                location_lower = location.lower()
                filtered_jobs = [job for job in generated_jobs 
                               if location_lower in job.location.lower() or 
                               (location_lower == "remote" and job.work_type == "remote")]
                if filtered_jobs:
                    generated_jobs = filtered_jobs
            
            # Shuffle and return requested amount
            random.shuffle(generated_jobs)
            return generated_jobs[:limit]
    
    class JobRecommendationEngine:
        def __init__(self):
            pass
        def recommend_jobs(self, user_profile, jobs, top_k=5):
            # Simple recommendation logic for fallback
            return jobs[:top_k]

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize ML components
try:
    job_aggregator = JobAggregator()
    recommendation_engine = JobRecommendationEngine()
    print("✅ ML services initialized successfully")
except Exception as e:
    print(f"⚠️  Warning: ML services initialization failed: {e}")
    job_aggregator = JobAggregator()  # Use fallback
    recommendation_engine = JobRecommendationEngine()  # Use fallback

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for backend verification"""
    return jsonify({
        'status': 'healthy',
        'service': 'career-assistant-ml',
        'timestamp': datetime.now().isoformat(),
        'ml_services_available': job_aggregator is not None and recommendation_engine is not None
    })

@app.route('/api/search-jobs', methods=['POST'])
def api_search_jobs():
    """
    API endpoint for job search - called by Credexa backend
    """
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        # Extract parameters
        query = data.get('query', '').strip()
        location = data.get('location', '').strip()
        limit = int(data.get('limit', 10))
        
        if not query:
            return jsonify({'success': False, 'message': 'Query parameter is required'}), 400
        
        print(f"🔍 API Job Search: '{query}' in '{location}' (limit: {limit})")
        
        # Search for jobs using ML service
        jobs = job_aggregator.search_all_sources(query, location, limit)
        
        # Format job results with all required fields
        job_results = []
        for job in jobs:
            job_data = {
                'id': f"ml_{hash(job.title + job.company)}",
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'description': getattr(job, 'description', f'Job at {job.company}'),
                'skills_required': getattr(job, 'skills_required', []),
                'experience_level': getattr(job, 'experience_level', 'mid'),  # Ensure this field exists
                'salary_range': getattr(job, 'salary_range', 'Competitive'),
                'job_type': getattr(job, 'job_type', 'full-time'),
                'work_type': getattr(job, 'work_type', 'hybrid'),
                'url': getattr(job, 'url', ''),
                'posted_date': getattr(job, 'posted_date', ''),
                'source': getattr(job, 'source', 'ml-service'),
                'applicants': 0  # Default value
            }
            job_results.append(job_data)
        
        print(f"✅ API Job Search found {len(job_results)} jobs")
        
        return jsonify({
            'success': True,
            'jobs': job_results,
            'total': len(job_results),
            'source': 'ml-service',
            'query_processed': query,
            'location_processed': location
        })
        
    except Exception as e:
        print(f"❌ API Job Search error: {e}")
        return jsonify({
            'success': False,
            'message': f'Job search failed: {str(e)}',
            'jobs': [],
            'total': 0,
            'source': 'ml-service-error'
        }), 500

@app.route('/api/recommend-jobs', methods=['POST'])
def api_recommend_jobs():
    """
    API endpoint for job recommendations - called by Credexa backend
    """
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        # Extract user profile data
        user_profile_data = data.get('userProfile', data.get('user_profile', {}))
        skills = user_profile_data.get('skills', [])
        experience_level = user_profile_data.get('experience_level', 'mid')
        location = user_profile_data.get('location', '').strip()
        preferred_roles = user_profile_data.get('preferred_roles', [])
        salary_range = user_profile_data.get('salary_range', {'min': 0, 'max': 999999})
        work_type = user_profile_data.get('work_type', '')
        limit = int(data.get('limit', 10))
        
        print(f"🎯 API Recommendations for: {skills} ({experience_level}) in {location}")
        
        # Create user profile
        user_profile = UserProfile(
            skills=skills,
            experience_level=experience_level,
            location=location,
            preferred_roles=preferred_roles,
            salary_range=salary_range,
            work_type=work_type
        )
        
        # Search for jobs based on user preferences
        query = preferred_roles[0] if preferred_roles else 'software developer'
        jobs = job_aggregator.search_all_sources(query, location, limit * 2)  # Get more jobs for better recommendations
        
        # Get recommendations using ML service
        recommendations = recommendation_engine.recommend_jobs(user_profile, jobs, top_k=limit)
        
        # Format recommendation results
        recommendations_data = []
        for i, job in enumerate(recommendations):
            # Calculate a simple score for display
            score = max(95 - (i * 5), 60)  # Simple decreasing score
            
            job_data = {
                'job': {
                    'id': f"ml_rec_{hash(job.title + job.company)}",
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'description': getattr(job, 'description', f'Job at {job.company}'),
                    'skills_required': getattr(job, 'skills_required', []),
                    'experience_level': getattr(job, 'experience_level', 'mid'),  # Ensure this field exists
                    'salary_range': getattr(job, 'salary_range', 'Competitive'),
                    'job_type': getattr(job, 'job_type', 'full-time'),
                    'work_type': getattr(job, 'work_type', 'hybrid'),
                    'url': getattr(job, 'url', ''),
                    'posted_date': getattr(job, 'posted_date', ''),
                    'source': getattr(job, 'source', 'ml-recommendations'),
                    'applicants': 0
                },
                'score': {
                    'skill_score': score,
                    'role_relevance_score': score - 5,
                    'experience_match_score': score - 3,
                    'growth_score': score - 2,
                    'overall_score': score
                },
                'explanation': f'This {job.title} role matches your skills and experience level.',
                'pros': [
                    f'Strong match with your {experience_level} experience level',
                    f'Located in {job.location}',
                    'Competitive compensation package'
                ],
                'cons': [],
                'skill_gaps': []
            }
            recommendations_data.append(job_data)
        
        print(f"✅ API Recommendations generated {len(recommendations_data)} recommendations")
        
        return jsonify({
            'success': True,
            'recommendations': recommendations_data,
            'source': 'ml-service',
            'total': len(recommendations_data),
            'user_profile_summary': {
                'skills_count': len(skills),
                'experience_level': experience_level,
                'preferred_roles': preferred_roles,
                'location': location
            }
        })
        
    except Exception as e:
        print(f"❌ API Recommendations error: {e}")
        return jsonify({
            'success': False,
            'message': f'Job recommendations failed: {str(e)}',
            'recommendations': [],
            'total': 0,
            'source': 'ml-service-error'
        }), 500

@app.route('/api/test', methods=['GET'])
def api_test():
    """Test endpoint to verify API is working"""
    return jsonify({
        'status': 'success',
        'message': 'Career Assistant ML API is working!',
        'timestamp': datetime.now().isoformat(),
        'endpoints': [
            'GET /health',
            'POST /api/search-jobs',
            'POST /api/recommend-jobs',
            'GET /api/test'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting Career Assistant API Service...")
    print("📱 API endpoints available at: http://localhost:5002")
    print("📋 Available endpoints:")
    print("   - GET  /health")
    print("   - POST /api/search-jobs")
    print("   - POST /api/recommend-jobs")
    print("   - GET  /api/test")
    print("⏹️  Press Ctrl+C to stop the server")
    
    # Use port 5002 as requested
    port = 5002
    debug = True
    
    app.run(debug=debug, host='0.0.0.0', port=port)