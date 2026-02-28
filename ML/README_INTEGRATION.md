# Credexa ML Job Search Integration

This integration connects your ML Career Assistant with the Credexa backend and frontend to provide real-time job search and recommendations powered by machine learning.

## Architecture Overview

```
Frontend (Next.js) 
    ↓ API calls
Backend (Node.js/Express) 
    ↓ HTTP requests
ML Service (Python/Flask) 
    ↓ uses
Career Assistant (Python ML)
    ↓ scrapes/searches
Job Sources (Indeed, LinkedIn, etc.)
```

## Features

- 🔍 **Real-time Job Search**: Searches multiple job sources using ML
- 🎯 **Smart Recommendations**: Personalized job recommendations based on user profile
- 🔄 **Fallback System**: Falls back to static data if ML service is unavailable
- 📊 **Intelligent Scoring**: Advanced scoring algorithm for job matching
- 🌐 **Multi-source**: Integrates with LinkedIn, Indeed, Glassdoor, and more

## Setup Instructions

### 1. Install Dependencies

```bash
cd ML
./setup_ml_service.sh
```

### 2. Start the ML Service

```bash
cd ML
source venv/bin/activate
python3 ml_api_server.py
```

The ML service will run on `http://localhost:5000`

### 3. Start the Backend

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:4000`

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### ML Service Endpoints

- `GET /health` - Health check
- `GET /api/test` - Test functionality
- `POST /api/search-jobs` - Search for jobs
- `POST /api/recommend-jobs` - Get job recommendations

### Backend Endpoints

- `POST /api/jobs/search` - Job search (proxies to ML service)
- `POST /api/jobs/recommendations` - Job recommendations (proxies to ML service)
- `GET /api/jobs/test-ml-service` - Test ML service connection

## Environment Variables

Add to `backend/.env`:

```
ML_CAREER_SERVICE_URL=http://localhost:5000
```

## Usage Examples

### Job Search

```javascript
const response = await fetch('/api/jobs/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'python developer',
    filters: {
      location: 'San Francisco',
      experience_level: 'mid',
      work_type: 'remote'
    },
    userProfile: {
      skills: ['python', 'django', 'react'],
      experience_level: 'mid',
      preferred_roles: ['Software Engineer', 'Full Stack Developer'],
      location: 'San Francisco, CA',
      salary_range: { min: 80000, max: 150000 },
      work_type: 'hybrid'
    }
  })
});
```

### Job Recommendations

```javascript
const response = await fetch('/api/jobs/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userProfile: {
      skills: ['python', 'machine learning', 'sql'],
      experience_level: 'senior',
      preferred_roles: ['Data Scientist', 'ML Engineer'],
      location: 'Remote',
      salary_range: { min: 120000, max: 200000 },
      work_type: 'remote'
    }
  })
});
```

## How It Works

1. **Frontend Request**: User searches for jobs or requests recommendations
2. **Backend Processing**: Backend receives request and forwards to ML service
3. **ML Service**: Python Flask service processes the request using Career Assistant
4. **Job Scraping**: Career Assistant scrapes real job data from multiple sources
5. **Fallback**: If scraping fails, uses static sample data
6. **Response**: Returns structured job data with scores and recommendations
7. **Frontend Display**: Frontend displays results with enhanced UI

## Fallback System

The system has multiple fallback layers:

1. **ML Service Available**: Uses real-time job scraping and ML recommendations
2. **ML Service Down**: Backend uses static data with basic scoring
3. **Backend Down**: Frontend uses local static data

## Data Sources

The ML service attempts to scrape from:

- Indeed
- LinkedIn (sample data due to anti-scraping)
- Glassdoor
- ZipRecruiter
- RemoteOK
- Monster
- CareerBuilder

## Scoring Algorithm

Jobs are scored based on:

- **Skill Match** (35%): How well user skills match job requirements
- **Role Relevance** (25%): How well the role matches user preferences
- **Experience Match** (15%): Experience level compatibility
- **Growth Potential** (15%): Industry and technology growth prospects
- **Location Match** (5%): Location preference compatibility
- **Salary Match** (5%): Salary range compatibility

## Troubleshooting

### ML Service Not Starting

1. Check Python installation: `python3 --version`
2. Check if port 5000 is available: `lsof -i :5000`
3. Install missing dependencies: `pip install -r requirements_api.txt`
4. Check logs for import errors

### Backend Can't Connect to ML Service

1. Verify ML service is running: `curl http://localhost:5000/health`
2. Check environment variable: `echo $ML_CAREER_SERVICE_URL`
3. Test backend connection: `curl http://localhost:4000/api/jobs/test-ml-service`

### No Jobs Returned

1. Check if ML service is scraping: Look for "Found X jobs" in ML service logs
2. Try with different search terms
3. The system will fall back to static data if scraping fails

## Customization

### Adding New Job Sources

1. Create a new scraper class in `career_assistant/src/job_scraper.py`
2. Inherit from `JobScraper` base class
3. Implement `search_jobs()` method
4. Add to `JobAggregator` in the same file

### Modifying Scoring Weights

Edit the weights in `backend/src/controllers/jobController.js` or `career_assistant/src/recommendation_engine.py`

### Adding New Filters

1. Update TypeScript types in `frontend/src/types/jobs.ts`
2. Add filter logic in `backend/src/controllers/jobController.js`
3. Update ML service in `ml_api_server.py`

## Performance Considerations

- ML service uses caching for repeated searches
- Implements rate limiting to avoid being blocked
- Uses async processing for multiple job sources
- Fallback data is pre-loaded for instant responses

## Security

- Input validation on all API endpoints
- Rate limiting on ML service endpoints
- CORS configuration for frontend access
- No sensitive data stored in job search responses

## Future Enhancements

- [ ] Redis caching for job search results
- [ ] Database storage for user search history
- [ ] Advanced filtering options
- [ ] Real-time job alerts
- [ ] Integration with more job boards
- [ ] Machine learning model training on user preferences
- [ ] A/B testing for recommendation algorithms

## Contributing

1. Add new features to the ML service first
2. Update backend to proxy new endpoints
3. Update frontend to use new functionality
4. Add tests for new features
5. Update documentation

## License

Part of the Credexa project. See main project LICENSE for details.
