# Certificate Extraction Service

This directory contains the certificate information extraction service that uses OCR to automatically extract relevant information from uploaded certificate images.

## Files

- `cert_extractor_api.py` - Flask API server for certificate extraction
- `extraction_rules.json` - Platform-specific extraction rules and patterns
- `extract_all_texts.py` - Utility script for text extraction from images
- `EXTRACTION_TESTING_GUIDE.md` - Testing guide for the extraction functionality
- `Dockerfile` - Container configuration for deployment
- `requirements.txt` - Python dependencies
- `.env.example` - Environment configuration template

## Setup

### Local Development

1. Install Tesseract OCR:
   - **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - **Linux**: `sudo apt-get install tesseract-ocr`
   - **macOS**: `brew install tesseract`

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment configuration:
```bash
cp .env.example .env
# Edit .env if needed to set TESSERACT_CMD path
```

4. Start the extraction service:
```bash
python cert_extractor_api.py
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t credexa-extraction-service .
```

2. Run the container:
```bash
docker run -p 5000:5000 credexa-extraction-service
```

### Production Deployment

For production, use a WSGI server like Gunicorn:

```bash
# Install gunicorn (included in requirements.txt)
pip install gunicorn

# Run with gunicorn
gunicorn --bind 0.0.0.0:5000 --workers 4 cert_extractor_api:app
```

## Configuration

The service can be configured using environment variables:

- `TESSERACT_CMD` - Path to tesseract executable (auto-detected if not set)
- `FLASK_HOST` - Host to bind to (default: 127.0.0.1)
- `FLASK_PORT` - Port to listen on (default: 5000)
- `FLASK_DEBUG` - Enable debug mode (default: True for development)
- `FLASK_ENV` - Environment mode (development/production)

## API Endpoints

- `POST /extract` - Extract information from certificate image
  - Body: `multipart/form-data` with `certificateFile` field
  - Returns: JSON with extracted fields (title, issuer, issueDate, etc.)

## Supported Platforms

- Coursera
- NPTEL
- Udemy
- Simplilearn
- upGrad
- Generic certificates

## Integration

This service is integrated with the main Credexa backend through the `extractionService.js` in the backend directory.

## Platform Compatibility

The service now automatically detects Tesseract installation on:
- Windows (multiple common installation paths)
- Linux (standard package manager installations)
- macOS (Homebrew and system installations)
- Docker containers (standard Linux paths)

No hardcoded paths needed - it will work across different environments!