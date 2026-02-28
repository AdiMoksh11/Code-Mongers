"""
Inference script for certificate fraud detection.
Accepts image (or PDF), runs OCR & metadata extraction, 
returns {label, confidence, reasons, heatmap_path}.
"""
import os
import sys
import json
import argparse
import cv2
import numpy as np
import torch
import joblib
from PIL import Image
import matplotlib.pyplot as plt

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from data_loader import CertificateDataLoader
from image_model import CertificateImageModel, ImageModelTrainer
from text_model import CertificateTextModel
from metadata_model import CertificateMetadataModel
from ensemble import CertificateEnsembleModel

class CertificateFraudPredictor:
    def __init__(self, models_dir='models'):
        self.models_dir = models_dir
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize models
        self.image_model = None
        self.text_model = None
        self.metadata_model = None
        self.ensemble_model = None
        
        # Data loader for OCR
        self.data_loader = CertificateDataLoader('.')
        
        self.load_models()

    def load_models(self):
        """Load all trained models"""
        print("Loading trained models...")
        
        try:
            # Load image model
            self.image_model = CertificateImageModel(backbone='resnet50', pretrained=False)
            self.image_model.load_state_dict(torch.load(
                f'{self.models_dir}/image_model.pth', map_location=self.device
            ))
            self.image_model.eval()
            print("✓ Image model loaded")
            
            # Load text model
            self.text_model = CertificateTextModel(use_bert=False)
            self.text_model.load(f'{self.models_dir}/text_model.joblib')
            print("✓ Text model loaded")
            
            # Load metadata model
            self.metadata_model = CertificateMetadataModel()
            self.metadata_model.load(f'{self.models_dir}/metadata_model.joblib')
            print("✓ Metadata model loaded")
            
            # Load ensemble model
            self.ensemble_model = CertificateEnsembleModel()
            self.ensemble_model.load(f'{self.models_dir}/ensemble_model.joblib')
            print("✓ Ensemble model loaded")
            
        except Exception as e:
            print(f"Error loading models: {e}")
            print("Make sure models have been trained and saved in the models/ directory")
            raise

    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        # Resize to model input size
        image_resized = cv2.resize(image, (224, 224))
        
        # Normalize
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Convert to tensor
        image_tensor = torch.from_numpy(image_normalized).permute(2, 0, 1).unsqueeze(0)
        
        return image, image_tensor

    def extract_text_and_metadata(self, image_path, metadata_path=None):
        """Extract text via OCR and metadata from JSON file"""
        # Load original image for OCR
        image = cv2.imread(image_path)
        
        # Extract text via OCR
        text = self.data_loader.extract_ocr(image)
        
        # Load metadata if provided
        if metadata_path and os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        else:
            # Create default metadata
            metadata = {
                'issuer': 'Unknown',
                'creation_date_delta': 0,
                'producer_mismatch': False,
                'unusual_editor': False
            }
        
        return text, metadata

    def generate_gradcam_heatmap(self, image_tensor, target_class=1, save_path=None):
        """Generate Grad-CAM heatmap for visual explanation"""
        try:
            # Generate heatmap
            heatmap = self.image_model.generate_gradcam(image_tensor, target_class)
            
            # Convert to 0-255 range
            heatmap = (heatmap * 255).astype(np.uint8)
            
            # Apply colormap
            heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
            
            if save_path:
                cv2.imwrite(save_path, heatmap_colored)
                print(f"Heatmap saved to: {save_path}")
            
            return save_path if save_path else heatmap_colored
            
        except Exception as e:
            print(f"Could not generate heatmap: {e}")
            return None

    def predict(self, image_path, metadata_path=None, save_heatmap=True):
        """
        Main prediction function
        Args:
            image_path: path to certificate image
            metadata_path: optional path to metadata JSON
            save_heatmap: whether to save Grad-CAM heatmap
        Returns:
            dict with prediction results
        """
        try:
            # Preprocess inputs
            original_image, image_tensor = self.preprocess_image(image_path)
            text, metadata = self.extract_text_and_metadata(image_path, metadata_path)
            
            # Get predictions from individual models
            with torch.no_grad():
                # Image model
                image_tensor = image_tensor.to(self.device)
                image_output = self.image_model(image_tensor)
                image_probs = torch.softmax(image_output, dim=1).cpu().numpy()
                
                # Text model
                text_probs = self.text_model.predict_proba([text])
                
                # Metadata model
                metadata_score = self.metadata_model.anomaly_score([metadata])
            
            # Ensemble prediction
            ensemble_probs = self.ensemble_model.predict_proba(
                image_probs, text_probs, metadata_score.reshape(-1, 1)
            )
            ensemble_pred = self.ensemble_model.predict(
                image_probs, text_probs, metadata_score.reshape(-1, 1)
            )
            
            # Calculate confidence
            confidence = float(np.max(ensemble_probs[0]))
            
            # Determine label
            label = 'forged' if ensemble_pred[0] == 1 else 'authentic'
            
            # Generate reasons
            reasons = self.generate_reasons(
                image_probs[0], text_probs[0], metadata_score[0], metadata
            )
            
            # Generate heatmap
            heatmap_path = None
            if save_heatmap:
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                heatmap_path = f"heatmap_{base_name}.jpg"
                self.generate_gradcam_heatmap(image_tensor, target_class=1, save_path=heatmap_path)
            
            # Prepare results
            results = {
                'label': label,
                'confidence': confidence,
                'probability_forged': float(ensemble_probs[0][1]),
                'probability_authentic': float(ensemble_probs[0][0]),
                'reasons': reasons,
                'heatmap_path': heatmap_path,
                'individual_scores': {
                    'image_model': {
                        'prob_authentic': float(image_probs[0][0]),
                        'prob_forged': float(image_probs[0][1])
                    },
                    'text_model': {
                        'prob_authentic': float(text_probs[0][0]),
                        'prob_forged': float(text_probs[0][1])
                    },
                    'metadata_model': {
                        'anomaly_score': float(metadata_score[0])
                    }
                },
                'extracted_text': text[:200] + '...' if len(text) > 200 else text,
                'metadata_features': metadata
            }
            
            return results
            
        except Exception as e:
            return {
                'error': str(e),
                'label': 'error',
                'confidence': 0.0
            }

    def generate_reasons(self, image_probs, text_probs, metadata_score, metadata):
        """Generate human-readable reasons for the prediction"""
        reasons = []
        
        # Image analysis reasons
        if image_probs[1] > 0.7:  # High probability of visual tampering
            reasons.append("Visual analysis detected potential image manipulation")
        elif image_probs[1] > 0.5:
            reasons.append("Visual analysis shows some suspicious patterns")
        
        # Text analysis reasons
        if text_probs[1] > 0.7:  # High probability of text anomalies
            reasons.append("Text analysis detected suspicious content or formatting")
        elif text_probs[1] > 0.5:
            reasons.append("Text analysis shows some irregular patterns")
        
        # Metadata reasons
        if metadata_score > 0.5:  # High anomaly score
            reasons.append("Metadata analysis detected anomalies")
            
            # Specific metadata issues
            if metadata.get('creation_date_delta', 0) > 90:
                reasons.append(f"Unusual creation date delta: {metadata['creation_date_delta']} days")
            
            if metadata.get('producer_mismatch', False):
                reasons.append("PDF producer information mismatch detected")
            
            if metadata.get('unusual_editor', False):
                reasons.append("Unusual editing software detected")
            
            # Check for suspicious issuer name
            issuer = metadata.get('issuer', '').lower()
            suspicious_keywords = ['fake', 'counterfeit', 'bogus', 'spurious', 'phony', 'fraudulent']
            if any(keyword in issuer for keyword in suspicious_keywords):
                reasons.append(f"Suspicious issuer name: {metadata.get('issuer', 'Unknown')}")
        
        # If no specific reasons found
        if not reasons:
            reasons.append("Analysis complete - no significant anomalies detected")
        
        return reasons

def main():
    parser = argparse.ArgumentParser(description='Certificate Fraud Detection Inference')
    parser.add_argument('image_path', help='Path to certificate image')
    parser.add_argument('--metadata', help='Path to metadata JSON file')
    parser.add_argument('--models-dir', default='models', help='Directory containing trained models')
    parser.add_argument('--output', help='Output JSON file for results')
    parser.add_argument('--no-heatmap', action='store_true', help='Skip heatmap generation')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = CertificateFraudPredictor(models_dir=args.models_dir)
    
    # Make prediction
    results = predictor.predict(
        image_path=args.image_path,
        metadata_path=args.metadata,
        save_heatmap=not args.no_heatmap
    )
    
    # Print results
    print("\n" + "="*50)
    print("CERTIFICATE FRAUD DETECTION RESULTS")
    print("="*50)
    print(f"File: {args.image_path}")
    print(f"Prediction: {results['label'].upper()}")
    print(f"Confidence: {results['confidence']:.4f}")
    print(f"Probability Forged: {results.get('probability_forged', 0):.4f}")
    print(f"Probability Authentic: {results.get('probability_authentic', 0):.4f}")
    
    if 'reasons' in results:
        print("\nReasons:")
        for i, reason in enumerate(results['reasons'], 1):
            print(f"  {i}. {reason}")
    
    if 'heatmap_path' in results and results['heatmap_path']:
        print(f"\nHeatmap saved: {results['heatmap_path']}")
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {args.output}")

if __name__ == "__main__":
    main()