"""
Data loader for images, JSON metadata, and OCR text extraction.
OCR uses EasyOCR with Tesseract fallback.
"""
import os
import json
import cv2
import numpy as np
from sklearn.model_selection import train_test_split

# OCR dependencies
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    print("Warning: EasyOCR not available, will use Tesseract only")
    EASYOCR_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    print("Warning: Tesseract not available")
    TESSERACT_AVAILABLE = False

try:
    from pdfminer.high_level import extract_text
    PDFMINER_AVAILABLE = True
except ImportError:
    print("Warning: PDFMiner not available")
    PDFMINER_AVAILABLE = False

# PyTorch dependencies for dataset
try:
    import torch
    from torch.utils.data import Dataset, DataLoader
    import torchvision.transforms as transforms
    TORCH_AVAILABLE = True
except ImportError:
    print("Warning: PyTorch not available, CertificateDataset will not be functional")
    TORCH_AVAILABLE = False

class CertificateDataLoader:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.ocr_reader = None
        self._init_ocr()

    def _init_ocr(self):
        try:
            if EASYOCR_AVAILABLE:
                # Check if CUDA is available if torch is installed
                use_gpu = TORCH_AVAILABLE and torch.cuda.is_available()
                self.ocr_reader = easyocr.Reader(['en'], gpu=use_gpu)
            else:
                self.ocr_reader = None
        except Exception as e:
            print(f"EasyOCR initialization failed: {e}, will use Tesseract fallback")
            self.ocr_reader = None

    def load_dataset(self):
        """Load all images and metadata from data directory"""
        images, texts, metadata, labels = [], [], [], []
        
        for filename in os.listdir(self.data_dir):
            if filename.endswith('.jpg'):
                base_name = filename.replace('.jpg', '')
                json_file = base_name + '.json'
                
                # Load image
                img_path = os.path.join(self.data_dir, filename)
                image = cv2.imread(img_path)
                if image is None:
                    continue
                
                # Load metadata
                meta_path = os.path.join(self.data_dir, json_file)
                if os.path.exists(meta_path):
                    with open(meta_path, 'r') as f:
                        meta = json.load(f)
                else:
                    continue
                
                # Extract text via OCR
                text = self.extract_ocr(image)
                
                # Determine label (0=authentic, 1=forged)
                label = 1 if 'forged' in filename else 0
                
                images.append(image)
                texts.append(text)
                metadata.append(meta)
                labels.append(label)
        
        return images, texts, metadata, labels

    def extract_ocr(self, image):
        try:
            if self.ocr_reader and EASYOCR_AVAILABLE:
                result = self.ocr_reader.readtext(image)
                text = ' '.join([r[1] for r in result])
            elif TESSERACT_AVAILABLE:
                text = pytesseract.image_to_string(image)
            else:
                print("Warning: No OCR library available")
                text = ""
        except Exception as e:
            print(f"OCR failed: {e}")
            if TESSERACT_AVAILABLE:
                try:
                    text = pytesseract.image_to_string(image)
                except Exception:
                    text = ""
            else:
                text = ""
        return text

    def extract_pdf_text(self, pdf_path):
        if PDFMINER_AVAILABLE:
            return extract_text(pdf_path)
        else:
            print("Warning: PDFMiner not available, cannot extract PDF text")
            return ""

if TORCH_AVAILABLE:
    class CertificateDataset(Dataset):
        def __init__(self, images, labels, transform=None):
            self.images = images
            self.labels = labels
            self.transform = transform

        def __len__(self):
            return len(self.images)

        def __getitem__(self, idx):
            image = self.images[idx]
            label = self.labels[idx]
            
            if self.transform:
                image = self.transform(image)
            else:
                # Default transform
                image = cv2.resize(image, (224, 224))
                image = image.astype(np.float32) / 255.0
                image = torch.from_numpy(image).permute(2, 0, 1)
            
            return image, torch.tensor(label, dtype=torch.long)
else:
    # Dummy class when PyTorch is not available
    class CertificateDataset:
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch not available - CertificateDataset cannot be used")
