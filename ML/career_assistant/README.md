# 🚀 Career Assistant

An intelligent career assistant that helps users find the most relevant job opportunities based on their skills, experience level, and preferred job roles. The system searches through job postings from multiple sources, analyzes skill compatibility, and provides personalized recommendations with detailed explanations.

## ✨ Features

- **Smart Job Matching**: Advanced algorithm that calculates skill overlap between user profile and job requirements
- **Multi-Source Search**: Scrapes job postings from LinkedIn and Indeed (with sample data fallback)
- **Intelligent Ranking**: Ranks jobs by skill overlap, role relevance, experience match, and growth opportunities
- **Detailed Analysis**: Provides comprehensive explanations for why each job is a good fit
- **Skill Gap Identification**: Identifies missing skills and suggests learning paths
- **Company & Industry Insights**: Analyzes company reputation and industry growth trends
- **Comprehensive Reports**: Generates detailed PDF-ready reports with recommendations

## 🏗️ Project Structure

```
career_assistant/
├── career_assistant.py          # Main application entry point
├── src/                         # Source code modules
│   ├── user_profile.py         # User profile management and input handling
│   ├── job_scraper.py          # Web scraping for job postings
│   ├── skill_matcher.py        # Advanced skill matching engine
│   ├── recommendation_engine.py # Job ranking and recommendation logic
│   └── job_analyzer.py         # Company/industry analysis and reporting
├── data/                       # Data storage (generated at runtime)
├── tests/                      # Unit tests (future enhancement)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download the project
cd career_assistant

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Interactive Mode

```bash
python career_assistant.py
```

This will guide you through:
1. Creating your professional profile (skills, experience, preferences)
2. Specifying job search parameters
3. Analyzing available positions
4. Viewing personalized recommendations

### 3. Run Batch Mode

```bash
# Quick analysis with default settings
python career_assistant.py --batch "data scientist"

# Advanced batch mode with location and limit
python career_assistant.py --batch "python developer" --location "San Francisco" --limit 30

# Batch mode without saving results
python career_assistant.py --batch "machine learning engineer" --no-save
```

## 📊 How It Works

### 1. User Profile Creation
- Collects skills, experience level, preferred roles
- Optional: location, salary expectations, work type preferences
- Interactive input with validation and suggestions

### 2. Job Search & Scraping
- Searches multiple job boards (Indeed, LinkedIn)
- Extracts: title, company, location, description, requirements
- Falls back to curated sample data when scraping is limited

### 3. Skill Matching Engine
- **Exact Matching**: Direct skill name matches
- **Fuzzy Matching**: Similar skill names (e.g., "JS" → "JavaScript")
- **Synonym Detection**: Related terms (e.g., "ML" → "Machine Learning")
- **Category Matching**: Skills from same domain (e.g., React and Angular)

### 4. Multi-Factor Ranking
Jobs are scored based on:
- **Skill Overlap (35%)**: How well your skills match requirements
- **Role Relevance (25%)**: How closely the role matches your preferences
- **Experience Match (15%)**: Compatibility with your experience level
- **Growth Potential (15%)**: Industry and technology growth prospects
- **Location Match (5%)**: Geographic compatibility
- **Salary Match (5%)**: Compensation alignment

### 5. Detailed Analysis
- Company reputation and culture insights
- Industry growth trends and future outlook
- Skill gap identification with learning suggestions
- Career progression opportunities

## 🎯 Example Output

```
🎯 TOP 5 JOB RECOMMENDATIONS
================================================================================

1. Senior Data Scientist
   Company: TechCorp Inc
   Location: San Francisco, CA
   Salary: $130,000 - $180,000
   Overall Score: 87.3/100

   📊 Score Breakdown:
      • Skill Match: 92.1/100
      • Role Relevance: 95.0/100
      • Experience Fit: 88.5/100
      • Growth Potential: 85.0/100

   📝 Why this job fits:
      This Senior Data Scientist position at TechCorp Inc is an excellent match 
      for your profile. Your skills align excellently with the requirements, 
      covering 85% of the needed skills. The role closely matches your career 
      preferences and represents perfect career progression.

   ✅ Strengths:
      • Strong skill match (85% coverage)
      • Perfect experience level match
      • High-growth industry/technology

   📚 Skills to develop:
      tensorflow, aws, docker

   💡 How to learn tensorflow:
      • Take Deep Learning Specialization on Coursera
      • Practice with TensorFlow tutorials
```

## 🛠️ Configuration

### Customizing Skill Matching
Edit `src/skill_matcher.py` to:
- Add new skill synonyms
- Modify skill categories
- Adjust fuzzy matching thresholds

### Adjusting Ranking Weights
Modify weights in `src/recommendation_engine.py`:
```python
self.weights = {
    "skill_match": 0.35,        # Adjust importance of skill overlap
    "role_relevance": 0.25,     # Adjust importance of role match
    "experience_match": 0.15,   # Adjust importance of experience fit
    # ... etc
}
```

### Adding Company Data
Extend the company database in `src/job_analyzer.py` to include more companies with reputation scores, culture insights, and benefits information.

## 📁 Output Files

The system generates two types of output files in the `data/` directory:

### 1. Detailed Report (`*_report.txt`)
- Executive summary of findings
- Detailed analysis of each recommendation
- Growth opportunities and learning paths
- Comprehensive career guidance

### 2. Structured Data (`*_data.json`)
- Complete user profile
- All recommendation scores and metadata
- Machine-readable format for further analysis

## 🧪 Testing

Run individual components:

```bash
# Test user profile creation
python src/user_profile.py

# Test skill matching
python src/skill_matcher.py

# Test job recommendations
python src/recommendation_engine.py

# Test job analysis
python src/job_analyzer.py
```

## 🔧 Troubleshooting

### Web Scraping Issues
- **LinkedIn blocking**: LinkedIn has strong anti-scraping measures. The system falls back to sample data.
- **Indeed rate limiting**: Implemented random delays and user agent rotation.
- **No results found**: System automatically uses curated sample data for demonstration.

### Import Errors
If you see import errors, ensure you're running from the project root directory:
```bash
cd career_assistant
python career_assistant.py
```

### Missing Dependencies
Install all requirements:
```bash
pip install -r requirements.txt
```

## 🚀 Future Enhancements

### Planned Features
- [ ] LinkedIn API integration for legitimate job data access
- [ ] Machine learning model for improved skill matching
- [ ] Resume analysis and optimization suggestions
- [ ] Job application tracking
- [ ] Salary negotiation insights
- [ ] Interview preparation recommendations

### Technical Improvements
- [ ] Database backend for persistent storage
- [ ] Web interface using Flask/FastAPI
- [ ] Real-time job alerts
- [ ] Integration with more job boards
- [ ] Advanced NLP for job description analysis

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional job board integrations
- Enhanced skill matching algorithms
- Better company and industry data
- UI/UX improvements
- Performance optimizations

## 📞 Support

For questions, issues, or suggestions:
1. Check the troubleshooting section above
2. Review the code comments for implementation details
3. Create an issue for bugs or feature requests

---

**Happy job hunting! 🎯🚀**