"""
FastAPI application for certificate fraud detection.
Provides POST /verify endpoint with multipart upload.
"""
import os
import sys
import tempfile
import shutil
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))
from predict import CertificateFraudPredictor

# Initialize FastAPI app
app = FastAPI(
    title="Certificate Fraud Detection API",
    description="Hybrid ML pipeline for detecting forged certificates using image analysis, OCR, and metadata checks",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global predictor instance
predictor = None

# Response models
class VerificationResult(BaseModel):
    label: str
    confidence: float
    probability_forged: float
    probability_authentic: float
    reasons: List[str]
    heatmap_available: bool
    individual_scores: dict
    extracted_text: str
    metadata_features: dict

class HealthResponse(BaseModel):
    status: str
    message: str
    models_loaded: bool

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the fraud detection models on startup"""
    global predictor
    try:
        print("Loading fraud detection models...")
        models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        predictor = CertificateFraudPredictor(models_dir=models_dir)
        print("✓ Models loaded successfully")
    except Exception as e:
        print(f"⚠ Warning: Could not load models: {e}")
        print("API will start but /verify endpoint may not work properly")

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="Certificate Fraud Detection API is running",
        models_loaded=predictor is not None
    )

# Main verification endpoint
@app.post("/verify", response_model=VerificationResult)
async def verify_certificate(
    image: UploadFile = File(..., description="Certificate image file"),
    metadata: Optional[UploadFile] = File(None, description="Optional metadata JSON file"),
    save_heatmap: bool = Form(True, description="Whether to generate Grad-CAM heatmap")
):
    """
    Verify if a certificate is authentic or forged
    
    Args:
        image: Certificate image file (JPG, PNG, etc.)
        metadata: Optional JSON file with certificate metadata
        save_heatmap: Whether to generate visual explanation heatmap
    
    Returns:
        Verification results with confidence scores and explanations
    """
    if predictor is None:
        raise HTTPException(
            status_code=503, 
            detail="Models not loaded. Please check server logs and ensure models are trained."
        )
    
    # Validate image file
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail=f"File must be an image. Received: {image.content_type}"
        )
    
    # Create temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded image
            image_path = os.path.join(temp_dir, f"certificate_{image.filename}")
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            # Save metadata if provided
            metadata_path = None
            if metadata:
                if not metadata.content_type.startswith('application/json'):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Metadata file must be JSON. Received: {metadata.content_type}"
                    )
                
                metadata_path = os.path.join(temp_dir, f"metadata_{metadata.filename}")
                with open(metadata_path, "wb") as buffer:
                    shutil.copyfileobj(metadata.file, buffer)
            
            # Run prediction
            results = predictor.predict(
                image_path=image_path,
                metadata_path=metadata_path,
                save_heatmap=save_heatmap
            )
            
            # Check for errors
            if 'error' in results:
                raise HTTPException(status_code=500, detail=results['error'])
            
            # Prepare response
            response = VerificationResult(
                label=results['label'],
                confidence=results['confidence'],
                probability_forged=results['probability_forged'],
                probability_authentic=results['probability_authentic'],
                reasons=results['reasons'],
                heatmap_available=results.get('heatmap_path') is not None,
                individual_scores=results['individual_scores'],
                extracted_text=results['extracted_text'],
                metadata_features=results['metadata_features']
            )
            
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

# Endpoint to get heatmap image
@app.get("/heatmap/{filename}")
async def get_heatmap(filename: str):
    """
    Retrieve generated heatmap image
    
    Args:
        filename: Name of the heatmap file
    
    Returns:
        Heatmap image file
    """
    heatmap_path = os.path.join(os.getcwd(), filename)
    
    if not os.path.exists(heatmap_path):
        raise HTTPException(status_code=404, detail="Heatmap file not found")
    
    return FileResponse(
        heatmap_path,
        media_type="image/jpeg",
        filename=filename
    )

# Batch verification endpoint
@app.post("/verify/batch")
async def verify_batch(
    images: List[UploadFile] = File(..., description="List of certificate images"),
    save_heatmaps: bool = Form(False, description="Whether to generate heatmaps for all images")
):
    """
    Verify multiple certificates in batch
    
    Args:
        images: List of certificate image files
        save_heatmaps: Whether to generate heatmaps for all images
    
    Returns:
        List of verification results
    """
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Please check server logs and ensure models are trained."
        )
    
    if len(images) > 10:  # Limit batch size
        raise HTTPException(
            status_code=400,
            detail="Batch size limited to 10 images"
        )
    
    results = []
    
    with tempfile.TemporaryDirectory() as temp_dir:
        for i, image in enumerate(images):
            try:
                # Validate image
                if not image.content_type.startswith('image/'):
                    results.append({
                        'filename': image.filename,
                        'error': f"Invalid file type: {image.content_type}"
                    })
                    continue
                
                # Save image
                image_path = os.path.join(temp_dir, f"batch_{i}_{image.filename}")
                with open(image_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                
                # Run prediction
                result = predictor.predict(
                    image_path=image_path,
                    metadata_path=None,
                    save_heatmap=save_heatmaps
                )
                
                result['filename'] = image.filename
                results.append(result)
                
            except Exception as e:
                results.append({
                    'filename': image.filename,
                    'error': str(e)
                })
    
    return {"results": results}

# Model information endpoint
@app.get("/model/info")
async def get_model_info():
    """Get information about loaded models"""
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded"
        )
    
    return {
        "models": {
            "image_model": "ResNet50-based CNN for visual tampering detection",
            "text_model": "TF-IDF + XGBoost for text analysis",
            "metadata_model": "IsolationForest for metadata anomaly detection",
            "ensemble_model": "Logistic Regression meta-classifier"
        },
        "capabilities": [
            "Visual tampering detection with Grad-CAM explanations",
            "OCR-based text analysis",
            "PDF metadata anomaly detection",
            "Ensemble prediction with confidence scores",
            "Per-forgery type analysis"
        ],
        "supported_formats": ["JPG", "PNG", "JPEG", "BMP"],
        "max_image_size": "No specific limit (automatically resized)",
        "batch_limit": 10
    }

# Simple web interface
@app.get("/")
async def root():
    """Simple HTML interface for testing"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Certificate Fraud Detection</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; }
            .result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>Certificate Fraud Detection API</h1>
        <p>Upload a certificate image to check if it's authentic or forged.</p>
        
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-area">
                <input type="file" id="imageFile" name="image" accept="image/*" required>
                <br><br>
                <input type="file" id="metadataFile" name="metadata" accept=".json">
                <br><small>Optional: Upload metadata JSON file</small>
                <br><br>
                <label>
                    <input type="checkbox" id="saveHeatmap" name="save_heatmap" checked>
                    Generate visual explanation heatmap
                </label>
            </div>
            <button type="submit">Verify Certificate</button>
        </form>
        
        <div id="result"></div>
        
        <script>
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                const imageFile = document.getElementById('imageFile').files[0];
                const metadataFile = document.getElementById('metadataFile').files[0];
                const saveHeatmap = document.getElementById('saveHeatmap').checked;
                
                if (!imageFile) {
                    alert('Please select an image file');
                    return;
                }
                
                formData.append('image', imageFile);
                if (metadataFile) formData.append('metadata', metadataFile);
                formData.append('save_heatmap', saveHeatmap);
                
                try {
                    const response = await fetch('/verify', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('result').innerHTML = `
                            <div class="result">
                                <h3>Result: ${result.label.toUpperCase()}</h3>
                                <p><strong>Confidence:</strong> ${(result.confidence * 100).toFixed(2)}%</p>
                                <p><strong>Probability Forged:</strong> ${(result.probability_forged * 100).toFixed(2)}%</p>
                                <p><strong>Reasons:</strong></p>
                                <ul>${result.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
                                ${result.heatmap_available ? '<p><em>Visual explanation heatmap generated</em></p>' : ''}
                            </div>
                        `;
                    } else {
                        document.getElementById('result').innerHTML = `
                            <div class="result" style="border-color: red;">
                                <h3>Error</h3>
                                <p>${result.detail || 'An error occurred'}</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = `
                        <div class="result" style="border-color: red;">
                            <h3>Error</h3>
                            <p>Failed to process request: ${error.message}</p>
                        </div>
                    `;
                }
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# Import HTMLResponse
from fastapi.responses import HTMLResponse

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )