# Certificate Extraction Integration - Testing Guide

## Setup Instructions

### 1. Start the Flask Extraction API
```bash
cd "e:\credexa latest"
python cert_extractor_api.py
```
The Flask API will run on `http://localhost:5000`

### 2. Start the Backend Node.js Server
```bash
cd "e:\credexa latest\backend"
npm run dev
```
The backend will run on `http://localhost:3001` (or your configured port)

### 3. Start the Frontend
```bash
cd "e:\credexa latest\frontend"
npm run dev
```
The frontend will run on `http://localhost:3000`

## Testing the Integration

### Method 1: Upload & Extract (Recommended)
1. Navigate to Dashboard → My Credentials
2. Click "Add Credential"
3. Select "Upload" method
4. In the details form, look for "Certificate File" section
5. Click "Upload & Extract Info" button
6. Upload a certificate image from supported platforms:
   - Coursera certificates
   - NPTEL certificates  
   - Simplilearn certificates
   - Udemy certificates
   - upGrad certificates
7. Watch as the form fields auto-populate with extracted information:
   - **Title** field = course name
   - **Issuer** field = platform name
   - **Issue Date** field = certificate date
   - **Type** = "certificate" (default)
   - **Status** = "pending" (default)

### Method 2: Sync from Platform
1. Choose "Sync" method
2. Select a platform (Coursera, Udemy, etc.)
3. Upload certificate file
4. The system will extract info and auto-populate basic fields

## Field Mapping
- `course` (from OCR) → `title` (in form)
- `platform` (from OCR) → `issuer` (in form)  
- `date` (from OCR) → `issueDate` (in form)
- `name` → stored as reference (student name)

## Supported Platforms & Formats
- **Coursera**: PNG/JPG images
- **NPTEL**: PNG/JPG images
- **Simplilearn**: WebP/PNG/JPG images
- **Udemy**: JPG/PNG images
- **upGrad**: WebP/PNG/JPG images

## Expected Behavior
1. **Successful Extraction**: 
   - Green success message appears
   - Form fields auto-populate
   - User can review/edit before saving

2. **Failed Extraction**:
   - Warning message appears
   - User can fill form manually
   - Process continues normally

3. **Service Unavailable**:
   - Error message about extraction service
   - User can still upload file and fill manually

## Environment Variables
Make sure your backend has these environment variables:
```env
EXTRACTION_API_URL=http://localhost:5000
```

## API Endpoints
- `POST /api/credentials/extract` - Extract info from certificate
- `POST /api/credentials` - Create credential (existing)
- `GET /api/credentials` - List credentials (existing)

## Troubleshooting
1. **Flask API not responding**: Check if Tesseract OCR is installed and Flask is running
2. **No extraction happening**: Check browser network tab for errors
3. **Wrong field mapping**: Verify the extraction API response format

## Future Enhancements
- Support for more platforms
- PDF text extraction
- Multiple language support
- Confidence scoring for extracted data
- Manual correction workflows