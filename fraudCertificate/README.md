# Certificate Authenticity Checker

A web-based application that detects digital manipulation in certificate images and PDFs using deep learning forensics analysis.

## 🎯 Features

- **Image & PDF Support**: Analyze PNG, JPG, JPEG, TIFF, and PDF certificates
- **Real-time Analysis**: Get instant REAL/FAKE verdict with confidence scores
- **25% Threshold Rule**: Clear decision logic (≥25% suspicious = FAKE, <25% = REAL)
- **Visual Evidence**: Heatmap showing suspicious areas
- **Web Interface**: Easy-to-use drag & drop interface
- **CPU Compatible**: Runs without GPU requirements

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd <your-project-folder>
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Download Pretrained Weights
- Download from: [Google Drive](https://drive.google.com/file/d/1scOAVxvqYSfRi4s7s0crk2Ieqn5Cm6r6/view?usp=sharing)
- Place `detector_weights.pth` in the `weights/` folder

### 4. Run Application
```bash
python app.py
```

### 5. Open Browser
Go to: `http://localhost:5000`

## 🔍 How It Works

1. **Upload**: Drag & drop certificate (image or PDF)
2. **Analysis**: AI model detects digital manipulation
3. **Result**: Get clear REAL/FAKE verdict with percentage
4. **Evidence**: View heatmap of suspicious areas

## 📊 Decision Logic

- **≥25% suspicious areas** → ❌ **FAKE CERTIFICATE**
- **<25% suspicious areas** → ✅ **REAL CERTIFICATE**

## 📂 File Structure

```
project/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── models/            # Neural network models
│   ├── scse.py        # Main model architecture
│   └── senet.py       # Supporting components
├── templates/         # Web interface
│   └── index.html     # Main page
└── weights/           # Model weights (download separately)
    └── detector_weights.pth
```

## ⚠️ Important Notes

- **Detection Type**: Identifies digital image manipulation, not content authenticity
- **PDF Support**: Converts first page to image for analysis
- **Limitations**: Cannot verify document legitimacy or issuer authenticity
- **Verification**: Always confirm with issuing authority for complete validation

## 🛠️ Technical Details

- **Framework**: Flask web application
- **Model**: ImageForensicsOSN neural network
- **Input**: Images (PNG, JPG, TIFF) and PDF files
- **Output**: Binary classification (Real/Fake) with confidence score
- **Processing**: CPU-based inference (no GPU required)

## 📞 Support

For issues or questions, please create an issue in this repository.

## 📄 License

[Add your license information here]
