# Career Assistant - Setup and Usage Guide

## Quick Setup

1. **Install Python 3.8 or higher**
2. **Install dependencies:**
   ```cmd
   cd C:\Users\User\Desktop\Search_engine\career_assistant
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```cmd
   python career_assistant.py
   ```

## Usage Examples

### Interactive Mode (Recommended for first-time users)
```cmd
python career_assistant.py
```
Follow the prompts to create your profile and get personalized recommendations.

### Batch Mode (Quick analysis)
```cmd
python career_assistant.py --batch "data scientist"
python career_assistant.py --batch "python developer" --location "Remote" --limit 20
```

## Sample Run

When you run the application, you'll see output like this:

```
🚀 CAREER ASSISTANT
==================================================
Find the perfect job match based on your skills and preferences!

👋 Welcome to the Career Assistant!
Let's create your professional profile.

=== SKILLS INPUT ===
Enter your skills (separated by commas):
Examples: Python, Machine Learning, Project Management, SQL, React
Skills: Python, Machine Learning, SQL, Data Analysis, Pandas

=== EXPERIENCE LEVEL ===
Select your experience level:
1. Entry
2. Mid
3. Senior
4. Executive
Enter choice (1-4): 2

=== PREFERRED ROLES ===
Enter your preferred job roles (separated by commas):
Examples: Software Engineer, Data Scientist, Product Manager, DevOps Engineer
Preferred roles: Data Scientist, Machine Learning Engineer

✅ Profile created successfully!
Skills: python, machine learning, sql, data analysis, pandas
Experience: mid
Preferred roles: data scientist, machine learning engineer

🔍 JOB SEARCH PARAMETERS
------------------------------
Job search keywords (default: data scientist): 
Location (default: Any): San Francisco
Number of jobs to search (default: 25): 

🚀 Starting job search for: 'data scientist' in 'San Francisco'
🤖 Analyzing 6 jobs to find your best matches...
✅ Generated 6 recommendations

🎯 TOP 5 JOB RECOMMENDATIONS
================================================================================

1. Senior Data Scientist
   Company: TechCorp Inc
   Location: San Francisco, CA
   Salary: $130,000 - $180,000
   Work Type: hybrid
   Overall Score: 84.2/100

   📊 Score Breakdown:
      • Skill Match: 89.3/100
      • Role Relevance: 100.0/100
      • Experience Fit: 85.0/100
      • Growth Potential: 95.0/100

   📝 Why this job fits:
      This Senior Data Scientist position at TechCorp Inc is a very good match for your profile...

   ✅ Strengths:
      • Strong skill match (85% coverage)
      • Perfect role match for career preferences
      • High-growth industry/technology

   ⚠️  Considerations:
      • Experience level stretch opportunity

   📚 Skills to develop:
      statistics

   💡 How to learn statistics:
      • Take an online course in statistics
      • Practice statistics through projects

💾 Save results to files? (y/N): y

💾 Results saved:
   📄 Detailed report: C:\Users\User\Desktop\Search_engine\career_assistant\data\career_recommendations_20241201_143022_report.txt
   📊 Data file: C:\Users\User\Desktop\Search_engine\career_assistant\data\career_recommendations_20241201_143022_data.json

✨ Thank you for using Career Assistant! Good luck with your job search! 🍀
```

This system will help you find the most relevant job opportunities and provide actionable insights for your career development!