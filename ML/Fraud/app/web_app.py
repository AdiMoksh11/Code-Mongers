"""
FastAPI Web Application for Certificate Fraud Detection
Upload certificates (image/PDF) and get real-time fraud predictions
"""

from fastapi import FastAPI, File, UploadFile, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
import joblib
import numpy as np
import json
import os
from pathlib import Path
from datetime import datetime
import tempfile
import shutil

# Try to import image and PDF processing libraries
try:
    from PIL import Image, ImageEnhance, ImageFilter
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import PyPDF2
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

# Initialize FastAPI app
app = FastAPI(title="Certificate Fraud Detection System", version="2.0")

# Setup templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

class CertificateFraudDetector:
    """Main fraud detection class for web application"""
    
    def __init__(self, model_dir="../models"):
        self.model_dir = Path(model_dir)
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the trained fraud detection model"""
        # Try to load enhanced model first
        enhanced_model_path = self.model_dir / 'enhanced_metadata_model_200.joblib'
        simple_model_path = self.model_dir / 'simple_fraud_model.joblib'
        
        if enhanced_model_path.exists():
            self.model = joblib.load(enhanced_model_path)
            self.model_type = "enhanced"
            print("✅ Loaded enhanced fraud detection model (200 samples, 10 features)")
        elif simple_model_path.exists():
            self.model = joblib.load(simple_model_path)
            self.model_type = "simple"
            print("✅ Loaded simple fraud detection model")
        else:
            print("❌ No trained model found. Please train a model first.")
            self.model = None
    
    def extract_pdf_metadata(self, pdf_path):
        """Extract metadata from PDF file"""
        if not PDF_AVAILABLE:
            return self.generate_fake_metadata()
        
        try:
            metadata = {}
            
            # Try PyPDF2 first
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    pdf_info = pdf_reader.metadata
                    
                    if pdf_info:
                        metadata['title'] = str(pdf_info.get('/Title', ''))
                        metadata['subject'] = str(pdf_info.get('/Subject', ''))
                        metadata['creator'] = str(pdf_info.get('/Creator', ''))
                        metadata['producer'] = str(pdf_info.get('/Producer', ''))
                        metadata['keywords'] = str(pdf_info.get('/Keywords', ''))
                        
                        # Creation date
                        creation_date = pdf_info.get('/CreationDate')
                        if creation_date:
                            try:
                                # Parse PDF date format
                                date_str = str(creation_date).replace('D:', '').split('+')[0].split('-')[0]
                                creation_datetime = datetime.strptime(date_str[:14], '%Y%m%d%H%M%S')
                                metadata['creation_date'] = creation_datetime.isoformat()
                                
                                # Calculate date delta
                                delta = (datetime.now() - creation_datetime).days
                                metadata['creation_date_delta'] = delta
                            except:
                                metadata['creation_date_delta'] = 0
                        else:
                            metadata['creation_date_delta'] = 0
            except:
                pass
            
            # Try pdfplumber for text extraction
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    text = ""
                    for page in pdf.pages[:3]:  # First 3 pages only
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + " "
                    
                    # Extract issuer from text
                    text_lower = text.lower()
                    if 'university' in text_lower or 'college' in text_lower or 'institute' in text_lower:
                        lines = text.split('\n')
                        for line in lines:
                            if any(word in line.lower() for word in ['university', 'college', 'institute']):
                                metadata['issuer'] = line.strip()[:50]  # First 50 chars
                                break
                    
                    if 'issuer' not in metadata:
                        metadata['issuer'] = 'Unknown Institution'
            except:
                metadata['issuer'] = 'Unknown Institution'
            
            # Analyze metadata for fraud indicators
            metadata.update(self.analyze_metadata_for_fraud(metadata))
            
            return metadata
            
        except Exception as e:
            print(f"Error extracting PDF metadata: {e}")
            return self.generate_fake_metadata()
    
    def extract_image_metadata(self, image_path):
        """Extract metadata from image file"""
        if not PIL_AVAILABLE:
            return self.generate_fake_metadata()
        
        try:
            metadata = {}
            
            # Load image
            with Image.open(image_path) as img:
                # Basic image info
                metadata['image_format'] = img.format
                metadata['image_size'] = f"{img.width}x{img.height}"
                metadata['image_mode'] = img.mode
                
                # EXIF data if available
                exif_data = img._getexif() if hasattr(img, '_getexif') else None
                if exif_data:
                    # Extract relevant EXIF tags
                    software = exif_data.get(305)  # Software tag
                    if software:
                        metadata['creator'] = str(software)
                    
                    datetime_tag = exif_data.get(306)  # DateTime tag
                    if datetime_tag:
                        try:
                            creation_datetime = datetime.strptime(datetime_tag, '%Y:%m:%d %H:%M:%S')
                            metadata['creation_date'] = creation_datetime.isoformat()
                            delta = (datetime.now() - creation_datetime).days
                            metadata['creation_date_delta'] = delta
                        except:
                            metadata['creation_date_delta'] = 0
                
                # Analyze image for fraud indicators
                fraud_score = self.analyze_image_for_fraud(img)
                metadata['image_fraud_score'] = fraud_score
            
            # Set default values if not found
            if 'creator' not in metadata:
                metadata['creator'] = 'Unknown'
            if 'creation_date_delta' not in metadata:
                metadata['creation_date_delta'] = 0
            
            # Generate issuer from image analysis (simplified)
            metadata['issuer'] = 'Image-based Certificate'
            metadata['title'] = 'Certificate Document'
            metadata['subject'] = 'Certificate'
            metadata['producer'] = metadata.get('creator', 'Unknown')
            metadata['keywords'] = 'certificate, document'
            
            # Analyze metadata for fraud indicators
            metadata.update(self.analyze_metadata_for_fraud(metadata))
            
            return metadata
            
        except Exception as e:
            print(f"Error extracting image metadata: {e}")
            return self.generate_fake_metadata()
    
    def analyze_image_for_fraud(self, img):
        """Analyze image for visual fraud indicators"""
        try:
            # Convert to array for analysis
            img_array = np.array(img.convert('RGB'))
            
            # Simple fraud indicators
            fraud_score = 0.0
            
            # Check for unusual colors (too bright, too saturated)
            mean_colors = np.mean(img_array, axis=(0, 1))
            if np.any(mean_colors > 240) or np.any(mean_colors < 15):
                fraud_score += 0.3
            
            # Check color variance (too uniform might be suspicious)
            color_variance = np.var(img_array)
            if color_variance < 100:  # Very low variance
                fraud_score += 0.2
            
            # Check for suspicious aspect ratio
            width, height = img.size
            aspect_ratio = width / height
            if aspect_ratio > 3 or aspect_ratio < 0.3:  # Unusual aspect ratios
                fraud_score += 0.2
            
            return min(fraud_score, 1.0)
            
        except:
            return 0.5  # Default moderate suspicion
    
    def analyze_metadata_for_fraud(self, metadata):
        """Analyze metadata for fraud indicators"""
        fraud_indicators = {}
        
        # Check producer mismatch
        producer = metadata.get('producer', '').lower()
        creator = metadata.get('creator', '').lower()
        
        suspicious_producers = ['unknown', 'fake', 'counterfeit', 'suspicious', 'hacker', 'scam']
        suspicious_creators = ['notepad', 'paint', 'unknown', 'fake', 'hack']
        
        fraud_indicators['producer_mismatch'] = any(word in producer for word in suspicious_producers)
        fraud_indicators['unusual_editor'] = any(word in creator for word in suspicious_creators)
        
        # Check suspicious issuer
        issuer = metadata.get('issuer', '').lower()
        suspicious_issuers = ['fake', 'counterfeit', 'bogus', 'scam', 'diploma mill', 'phony']
        fraud_indicators['suspicious_issuer'] = any(word in issuer for word in suspicious_issuers)
        
        return fraud_indicators
    
    def generate_fake_metadata(self):
        """Generate fake metadata when extraction fails"""
        return {
            'issuer': 'Unknown Institution',
            'title': 'Certificate Document',
            'subject': 'Certificate',
            'creator': 'Unknown',
            'producer': 'Unknown',
            'keywords': 'certificate',
            'creation_date_delta': 0,
            'producer_mismatch': False,
            'unusual_editor': False,
            'suspicious_issuer': False
        }
    
    def extract_features(self, metadata):
        """Extract features for prediction"""
        if self.model_type == "enhanced":
            # 10 features for enhanced model
            features = [
                metadata.get('creation_date_delta', 0),
                int(metadata.get('producer_mismatch', False)),
                int(metadata.get('unusual_editor', False)),
                len(metadata.get('issuer', '')),
                int(metadata.get('suspicious_issuer', False)),
                len(metadata.get('title', '')),
                len(metadata.get('keywords', '').split(',')) if metadata.get('keywords') else 0,
                len(metadata.get('producer', '')),
                len(metadata.get('creator', '')),
                len(metadata.get('subject', ''))
            ]
        else:
            # 5 features for simple model
            features = [
                metadata.get('creation_date_delta', 0),
                int(metadata.get('producer_mismatch', False)),
                int(metadata.get('unusual_editor', False)),
                len(metadata.get('issuer', '')),
                int(metadata.get('suspicious_issuer', False))
            ]
        
        return features
    
    def predict_fraud(self, file_path, file_type):
        """Main prediction function"""
        if not self.model:
            return {
                'error': 'No trained model available',
                'prediction': 'Unknown',
                'confidence': 0.0
            }
        
        try:
            # Extract metadata based on file type
            if file_type.lower() == 'pdf':
                metadata = self.extract_pdf_metadata(file_path)
            else:
                metadata = self.extract_image_metadata(file_path)
            
            # Extract features
            features = self.extract_features(metadata)
            
            # Make prediction
            if isinstance(self.model, dict):
                # Enhanced model with scaler and anomaly detector
                scaler = self.model['scaler']
                anomaly_detector = self.model['anomaly_detector']
                classifier = self.model['classifier']
                
                # Scale features
                X = np.array(features).reshape(1, -1)
                X_scaled = scaler.transform(X)
                
                # Get anomaly score
                anomaly_score = anomaly_detector.decision_function(X_scaled)[0]
                
                # Combine with anomaly score
                X_enhanced = np.column_stack([X_scaled, [[anomaly_score]]])
                
                # Predict
                prediction = classifier.predict(X_enhanced)[0]
                probabilities = classifier.predict_proba(X_enhanced)[0]
                
            else:
                # Simple model
                X = np.array(features).reshape(1, -1)
                prediction = self.model.predict(X)[0]
                probabilities = self.model.predict_proba(X)[0]
                anomaly_score = 0.0
            
            # Format results
            is_forged = prediction == 1
            confidence = max(probabilities)
            
            result = {
                'prediction': 'FORGED' if is_forged else 'AUTHENTIC',
                'confidence': float(confidence),
                'probability_authentic': float(probabilities[0]),
                'probability_forged': float(probabilities[1]),
                'anomaly_score': float(anomaly_score) if 'anomaly_score' in locals() else 0.0,
                'metadata': metadata,
                'features': features,
                'model_type': self.model_type,
                'file_type': file_type
            }
            
            return result
            
        except Exception as e:
            return {
                'error': f'Prediction failed: {str(e)}',
                'prediction': 'Unknown',
                'confidence': 0.0
            }

# Initialize detector
detector = CertificateFraudDetector()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Main page with upload form"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict")
async def predict_certificate(file: UploadFile = File(...)):
    """Predict if uploaded certificate is authentic or forged"""
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file type
    allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_file_path = tmp_file.name
    
    try:
        # Determine file type
        file_type = 'pdf' if file_extension == '.pdf' else 'image'
        
        # Make prediction
        result = detector.predict_fraud(tmp_file_path, file_type)
        
        # Add file info to result
        result['filename'] = file.filename
        result['file_size'] = f"{len(await file.read()) / 1024:.1f} KB"
        
        return JSONResponse(content=result)
        
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": detector.model is not None,
        "model_type": detector.model_type if detector.model else None,
        "supported_formats": ["PDF", "PNG", "JPG", "JPEG", "TIFF", "BMP"]
    }

@app.get("/api/info")
async def api_info():
    """API information endpoint"""
    return {
        "name": "Certificate Fraud Detection API",
        "version": "2.0",
        "description": "Upload certificates and get fraud predictions",
        "model_status": "loaded" if detector.model else "not_loaded",
        "model_type": detector.model_type if detector.model else None,
        "supported_formats": ["PDF", "PNG", "JPG", "JPEG", "TIFF", "BMP"],
        "features": {
            "enhanced_model": detector.model_type == "enhanced" if detector.model else False,
            "pdf_support": PDF_AVAILABLE,
            "image_support": PIL_AVAILABLE,
            "advanced_image_analysis": CV2_AVAILABLE
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)