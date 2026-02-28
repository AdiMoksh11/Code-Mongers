from flask import Flask, render_template, request, jsonify, send_file
import torch
import torch.nn as nn
import cv2
import numpy as np
import base64
import io
from PIL import Image
from torchvision import transforms
from models.scse import SCSEUnet
import os
import fitz  # PyMuPDF
try:
    import pdf2image
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

app = Flask(__name__)

# Set device to CPU
device = torch.device('cpu')

# Define the Detector class
class Detector(nn.Module):
    def __init__(self):
        super(Detector, self).__init__()
        self.name = 'detector'
        self.det_net = SCSEUnet(seg_classes=1, num_channels=3, backbone_arch='senet154')

    def forward(self, Ii):
        Mo = self.det_net(Ii)
        return Mo

# Define the Model class
class Model(nn.Module):
    def __init__(self):
        super(Model, self).__init__()
        self.save_dir = 'weights/'
        self.networks = Detector()
        self.gen = nn.DataParallel(self.networks).to(device)

    def forward(self, Ii):
        return self.gen(Ii)

    def load(self, path=''):
        try:
            self.gen.load_state_dict(torch.load(self.save_dir + path + '%s_weights.pth' % self.networks.name, map_location=device))
            return True
        except FileNotFoundError:
            return False

# Load model once at startup
model = None
model_loaded = False

def load_model():
    global model, model_loaded
    model = Model().to(device)
    if model.load():
        model.eval()
        model_loaded = True
        return True
    return False

def convert_pdf_to_image(pdf_file):
    """Convert PDF to image for analysis using PyMuPDF (more reliable)"""
    try:
        # Read PDF file content
        pdf_content = pdf_file.read()
        
        # Try PyMuPDF first (more reliable, no external dependencies)
        try:
            # Open PDF with PyMuPDF
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            
            # Get first page
            if len(pdf_document) == 0:
                raise Exception("PDF has no pages")
            
            page = pdf_document[0]  # First page
            
            # Convert to image with high resolution
            mat = fitz.Matrix(3.0, 3.0)  # 3x zoom for better quality
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("ppm")
            image = Image.open(io.BytesIO(img_data))
            
            pdf_document.close()
            return image
            
        except Exception as fitz_error:
            # Fallback to pdf2image if available
            if PDF2IMAGE_AVAILABLE:
                try:
                    pdf_file.seek(0)  # Reset file pointer
                    images = pdf2image.convert_from_bytes(pdf_content, first_page=1, last_page=1, dpi=300)
                    if images:
                        return images[0]
                    else:
                        raise Exception("Could not convert PDF to image with pdf2image")
                except Exception as pdf2img_error:
                    raise Exception(f"Both PDF conversion methods failed. PyMuPDF: {str(fitz_error)}, pdf2image: {str(pdf2img_error)}")
            else:
                raise Exception(f"PDF conversion failed with PyMuPDF: {str(fitz_error)}. pdf2image not available.")
                
    except Exception as e:
        raise Exception(f"PDF conversion failed: {str(e)}")

def is_pdf_file(filename):
    """Check if the uploaded file is a PDF"""
    return filename.lower().endswith('.pdf')

def preprocess_image(image):
    """Preprocess image for the model"""
    # Convert PIL to OpenCV format
    image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Resize to model requirements
    image_cv = cv2.resize(image_cv, (896, 896))
    
    # Convert to RGB and normalize
    image_rgb = cv2.cvtColor(image_cv, cv2.COLOR_BGR2RGB)
    
    # Apply transforms
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
    ])
    
    # Convert to PIL for transforms
    image_pil = Image.fromarray(image_rgb)
    tensor = transform(image_pil).unsqueeze(0).to(device)
    
    return tensor, image_rgb

def analyze_certificate(heatmap):
    """Analyze certificate with 25% threshold for fake/real determination"""
    # Convert heatmap to numpy if it's a tensor
    if torch.is_tensor(heatmap):
        heatmap_np = heatmap.squeeze().cpu().detach().numpy()
    else:
        heatmap_np = heatmap
    
    # Calculate key metrics
    mean_val = np.mean(heatmap_np)
    max_val = np.max(heatmap_np)
    
    # Calculate percentage of suspicious pixels
    threshold = 0.4
    suspicious_pixels = np.sum(heatmap_np > threshold) / heatmap_np.size
    suspicious_percentage = suspicious_pixels * 100
    
    # 25% threshold rule: More than 25% suspicious = FAKE, Less than 25% = REAL
    if suspicious_percentage >= 25.0:
        is_fake = True
        confidence = min(95, max(75, suspicious_percentage * 2))  # Higher confidence for high manipulation
    else:
        is_fake = False
        confidence = min(95, max(70, (100 - suspicious_percentage * 2)))  # Higher confidence for low manipulation
    
    return {
        'is_fake': is_fake,
        'confidence': confidence,
        'suspicious_percentage': suspicious_percentage,
        'heatmap': heatmap_np,
        'threshold_used': 25.0
    }

def image_to_base64(image_array):
    """Convert numpy array to base64 string for display"""
    # Normalize to 0-255 range
    if image_array.max() <= 1.0:
        image_array = (image_array * 255).astype(np.uint8)
    
    # Convert to PIL Image
    pil_img = Image.fromarray(image_array)
    
    # Convert to base64
    buffer = io.BytesIO()
    pil_img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

@app.route('/')
def index():
    return render_template('index.html', model_loaded=model_loaded)

@app.route('/analyze', methods=['POST'])
def analyze():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded. Please ensure pretrained weights are in weights/ folder.'})
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    try:
        # Check if it's a PDF file
        if is_pdf_file(file.filename):
            # Convert PDF to image
            image = convert_pdf_to_image(file)
            file_type = "PDF Certificate (converted to image)"
        else:
            # Load regular image file
            image = Image.open(file.stream)
            file_type = "Image Certificate"
        
        # Ensure image is in RGB mode
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        input_tensor, processed_image = preprocess_image(image)
        
        # Run analysis
        with torch.no_grad():
            output = model(input_tensor)
        
        # Get results
        analysis = analyze_certificate(output)
        
        # Convert images to base64 for web display
        original_b64 = image_to_base64(np.array(image))
        heatmap_b64 = image_to_base64(analysis['heatmap'])
        
        return jsonify({
            'success': True,
            'is_fake': analysis['is_fake'],
            'confidence': round(analysis['confidence'], 1),
            'suspicious_percentage': round(analysis['suspicious_percentage'], 1),
            'original_image': original_b64,
            'heatmap_image': heatmap_b64,
            'file_type': file_type
        })
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'})

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Load model at startup
    print("Loading forensics model...")
    if load_model():
        print("✅ Model loaded successfully!")
    else:
        print("❌ Failed to load model. Please ensure pretrained weights are in weights/ folder.")
        print("Download from: https://drive.google.com/file/d/1scOAVxvqYSfRi4s7s0crk2Ieqn5Cm6r6/view?usp=sharing")
    
    print("Starting Certificate Authenticity Checker...")
    print("Open your browser and go to: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)