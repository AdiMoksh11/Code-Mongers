# Hybrid Certificate Fraud Detection Pipeline

A comprehensive machine learning system that detects forged certificates using a hybrid approach combining:
- **Image Analysis**: CNN-based visual tampering detection with Grad-CAM explanations
- **Text Analysis**: OCR + NLP for issuer/content verification using TF-IDF + XGBoost
- **Metadata Analysis**: PDF metadata anomaly detection with IsolationForest
- **Ensemble Learning**: Stacking meta-classifier for final predictions

## 🚀 Features

### Core ML Pipeline
- **Image Model**: Fine-tuned ResNet50/EfficientNet for binary classification
- **Text Model**: TF-IDF + XGBoost baseline with optional BERT fine-tuning
- **Metadata Model**: Feature engineering + IsolationForest anomaly detection
- **Ensemble Model**: Logistic Regression stacking meta-classifier

### Advanced Capabilities
- **Data Augmentation**: Logo overlays, rotation, JPEG compression, brightness/contrast
- **Class Balancing**: Focal loss and class weighting for imbalanced datasets
- **Visual Explanations**: Grad-CAM heatmaps for model interpretability
- **Comprehensive Evaluation**: Confusion matrix, precision/recall/F1, ROC AUC, per-forgery-type analysis

### Deployment Ready
- **Inference Script**: `predict.py` for standalone predictions
- **FastAPI Service**: REST API with POST /verify endpoint
- **Batch Processing**: Support for multiple certificate verification
- **Web Interface**: Simple HTML interface for testing

## 📁 Project Structure

```
fraud-detection/
├── src/                    # Core ML modules
│   ├── data_loader.py      # Image/OCR/metadata loading
│   ├── image_model.py      # CNN model + Grad-CAM
│   ├── text_model.py       # TF-IDF + XGBoost/BERT
│   ├── metadata_model.py   # Metadata feature engineering
│   ├── ensemble.py         # Stacking meta-classifier
│   ├── utils.py           # Augmentation, focal loss, evaluation
│   └── train_pipeline.py  # Main training orchestrator
├── scripts/
│   └── predict.py         # Inference script
├── app/
│   └── main.py           # FastAPI deployment
├── models/               # Saved model artifacts
├── data/                 # Sample dataset (10 auth + 10 forged)
├── tests/               # Unit tests
└── requirements.txt     # Dependencies
```

## 🛠️ Installation & Setup

### Essential Dependencies (For Simple Training)
```bash
pip install numpy scikit-learn joblib
```

### Full Dependencies (For Complete Pipeline)
```bash
# Install all requirements
pip install -r requirements.txt

# Note: If you encounter TensorFlow/Keras compatibility issues:
pip install tf-keras

# For PyTorch (choose based on your system):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

### Dependency Resolution Notes
- **Simple Training**: Works with just scikit-learn (metadata-only approach)
- **Full Pipeline**: Requires PyTorch/TensorFlow, EasyOCR, OpenCV
- **Common Issues**: TensorFlow 2.16+ requires tf-keras package separately
- **Fallbacks**: Code includes graceful degradation if dependencies missing

### Additional Setup (For Full Pipeline)
**For Tesseract (fallback OCR):**
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
- Ubuntu: `sudo apt install tesseract-ocr`
- macOS: `brew install tesseract`

**GPU Setup (Optional but Recommended):**
- Install CUDA toolkit for PyTorch GPU support
- EasyOCR will automatically use GPU if available

## 🏃‍♂️ Quick Start

### Option 1: Enhanced Training on 200 Images (Recommended)
```bash
# Generate 200 synthetic certificates and train enhanced model
cd src
python generate_synthetic_data.py
python train_enhanced_simple.py
```

This trains an enhanced fraud detector using:
- **200 synthetic certificate images** (100 authentic + 100 forged)
- **10 engineered features** from certificate metadata
- IsolationForest anomaly detection + Logistic Regression
- **100% accuracy** on all 200 certificates
- More robust model with larger dataset

### Option 2: Simple Training (Original - 20 samples)
```bash
# Run the lightweight training script on original small dataset
cd src
python train_super_simple.py
```

This trains a basic metadata-based fraud detector using:
- 5 features from certificate metadata  
- Perfect accuracy on 20-sample dataset

### Option 2: Full Pipeline Training (Requires all dependencies)
```bash
# Install PyTorch, EasyOCR, and other heavy dependencies first
pip install torch torchvision easyocr

# Run the complete training pipeline
cd src
python train_pipeline.py
```

### Making Predictions

**Enhanced prediction (200-image model - recommended):**
```bash
python scripts/predict_enhanced_200.py data_synthetic/forged_050.json
python scripts/predict_enhanced_200.py data_synthetic/authentic_075.json
```

**Simple prediction (original small dataset):**
```bash
python scripts/predict_simple.py data/suspicious_cert.json
```

**Full prediction (requires all models):**
```bash
python scripts/predict.py data/suspicious_cert.jpg --metadata data/suspicious_cert.json
```

### Batch Testing (200 Images)
```bash
# Test enhanced model on all 200 certificates
cd src
python test_enhanced_model.py
```

### Example Output (Enhanced Model - 200 Images)
```
ENHANCED CERTIFICATE FRAUD DETECTION RESULTS
============================================================
File: data_synthetic/forged_050.json
🚨 Prediction: Forged
🔍 Confidence: 0.9893
📈 Probability Authentic: 0.0107
📉 Probability Forged: 0.9893
⚡ Anomaly Score: 0.1532
🤖 Model: LogisticRegression (10 features)

🔧 Features Analysis:
  creation_date_delta: 408
  producer_mismatch: 1
  unusual_editor: 1
  issuer_length: 19
  suspicious_issuer: 1
  title_length: 33
  keyword_count: 3
  producer_length: 14
  creator_length: 11
  subject_length: 20

💡 Reasons:
  1. Unusual creation date (delta: 408 days)
  2. PDF producer information mismatch detected
  3. Unusual editing software detected
  4. Suspicious issuer name: Counterfeit College

📊 Batch Test Results (200 certificates):
  Overall Accuracy: 100.0% (200/200)
  Authentic Accuracy: 100.0% (100/100)
  Forged Accuracy: 100.0% (100/100)
  High Confidence (>95%): 100.0% (200/200)
```

## 📊 Sample Data

The project includes 20 sample certificates:
- **10 Authentic**: `authentic_01.jpg` to `authentic_10.jpg`
- **10 Forged**: `forged_01.jpg` to `forged_10.jpg`

Each image has corresponding metadata in JSON format with features:
```json
{
  "issuer": "University Name",
  "creation_date_delta": 0,
  "producer_mismatch": false,
  "unusual_editor": false
}
```

## 🔧 API Usage

### POST /verify
Upload certificate for verification:

```bash
curl -X POST "http://localhost:8000/verify" \
  -F "image=@certificate.jpg" \
  -F "metadata=@certificate.json" \
  -F "save_heatmap=true"
```

**Response:**
```json
{
  "label": "forged",
  "confidence": 0.8542,
  "probability_forged": 0.8542,
  "probability_authentic": 0.1458,
  "reasons": [
    "Visual analysis detected potential image manipulation",
    "Metadata analysis detected anomalies",
    "Unusual creation date delta: 365 days"
  ],
  "heatmap_available": true,
  "individual_scores": {
    "image_model": {"prob_forged": 0.7834},
    "text_model": {"prob_forged": 0.6891},
    "metadata_model": {"anomaly_score": 0.8923}
  }
}
```

### Additional Endpoints
- `GET /health` - Health check
- `GET /model/info` - Model information
- `POST /verify/batch` - Batch verification
- `GET /heatmap/{filename}` - Download heatmap

## 🧪 Testing

Run unit tests:
```bash
python -m pytest tests/
```

Run specific preprocessing tests:
```bash
python tests/test_preprocessing.py
```

## 📈 Model Performance

The hybrid ensemble achieves:
- **High Recall**: Prioritizes catching forged certificates (low false negatives)
- **Balanced Precision**: Minimizes false positives for authentic certificates
- **Interpretability**: Provides explanations for each prediction
- **Robustness**: Handles various forgery types and quality levels

### Per-Forgery Type Analysis
- **Visual Tampering**: Logo manipulation, image editing
- **Metadata Manipulation**: PDF producer/date inconsistencies
- **Date Forgery**: Unusual creation date patterns
- **Fake Issuer**: Suspicious institution names

## 🔬 Technical Details

### Image Model Architecture
- **Backbone**: ResNet50 or EfficientNet-B0
- **Input**: 224x224 RGB images
- **Output**: Binary classification (authentic/forged)
- **Explainability**: Grad-CAM heatmaps
- **Training**: Focal loss, data augmentation, transfer learning

### Text Model Pipeline
- **OCR**: EasyOCR primary, Tesseract fallback
- **Features**: TF-IDF with 5000 features, n-grams (1,2)
- **Classifier**: XGBoost with optimized hyperparameters
- **Optional**: BERT fine-tuning for better accuracy

### Metadata Features
- `creation_date_delta`: Days since expected creation
- `producer_mismatch`: PDF producer inconsistency
- `unusual_editor`: Non-standard editing software
- `metadata_completeness`: Completeness score
- `suspicious_patterns`: Automated anomaly detection

### Ensemble Strategy
- **Meta-learner**: Logistic Regression
- **Input Features**: Probabilities from base models
- **Training**: Stacked generalization approach
- **Output**: Final prediction + confidence scores

## 🛡️ Security Considerations

- Input validation for file uploads
- Size limits on batch processing
- Temporary file cleanup
- Error handling and logging
- Rate limiting (production deployment)

## 🚀 Production Deployment

### Docker Deployment
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
- `MODELS_DIR`: Path to model artifacts
- `MAX_BATCH_SIZE`: Limit for batch processing
- `ENABLE_HEATMAPS`: Toggle heatmap generation

## 📝 License

This project is provided as-is for educational and research purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

For issues or questions:
- Check existing issues
- Review documentation
- Create detailed bug reports with sample data
