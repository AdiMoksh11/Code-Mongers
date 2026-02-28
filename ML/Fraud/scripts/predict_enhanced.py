"""
Enhanced Prediction Script for Hybrid Fraud Detection
Works with both synthetic and real certificate data
"""

import os
import json
import numpy as np
import argparse
from pathlib import Path
import joblib

# Try to import deep learning libraries
try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models
    from PIL import Image
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

class SimpleCNN(nn.Module):
    """Simple CNN for certificate image classification"""
    
    def __init__(self, num_classes=2):
        super(SimpleCNN, self).__init__()
        
        # Use pre-trained ResNet18 as backbone
        self.backbone = models.resnet18(pretrained=True)
        
        # Replace final layer
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Linear(num_features, 512)
        
        # Additional layers
        self.classifier = nn.Sequential(
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        features = self.backbone(x)
        return self.classifier(features)

class HybridModel(nn.Module):
    """Hybrid model combining CNN and metadata features"""
    
    def __init__(self, metadata_features=7, num_classes=2):
        super(HybridModel, self).__init__()
        
        # Image CNN
        self.cnn = SimpleCNN(num_classes=256)
        
        # Metadata network
        self.metadata_net = nn.Sequential(
            nn.Linear(metadata_features, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 16)
        )
        
        # Combined classifier
        self.final_classifier = nn.Sequential(
            nn.Linear(256 + 16, 128),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes)
        )
    
    def forward(self, image, metadata):
        # Get image features
        img_features = self.cnn.backbone(image)
        img_features = self.cnn.classifier[:-1](img_features)
        
        # Get metadata features
        meta_features = self.metadata_net(metadata)
        
        # Combine features
        combined = torch.cat([img_features, meta_features], dim=1)
        
        # Final classification
        return self.final_classifier(combined)

class EnhancedFraudPredictor:
    """Enhanced fraud prediction with multiple model types"""
    
    def __init__(self, model_dir="../models"):
        self.model_dir = Path(model_dir)
        self.device = torch.device('cuda' if torch.cuda.is_available() and PYTORCH_AVAILABLE else 'cpu')
        
        # Load models
        self.metadata_model = None
        self.cnn_model = None
        self.hybrid_model = None
        
        self.load_models()
        
        # Image preprocessing
        if PYTORCH_AVAILABLE:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
    
    def load_models(self):
        """Load all available trained models"""
        
        # Load metadata model (always available)
        metadata_path = self.model_dir / 'enhanced_metadata_model.joblib'
        if metadata_path.exists():
            self.metadata_model = joblib.load(metadata_path)
            print("✅ Loaded enhanced metadata model")
        else:
            # Fallback to simple model
            simple_path = self.model_dir / 'simple_fraud_model.joblib'
            if simple_path.exists():
                self.metadata_model = joblib.load(simple_path)
                print("✅ Loaded simple metadata model")
            else:
                print("❌ No metadata model found")
        
        # Load deep learning models if available
        if PYTORCH_AVAILABLE:
            # Load CNN model
            cnn_path = self.model_dir / 'best_cnn_model.pth'
            if cnn_path.exists():
                self.cnn_model = SimpleCNN()
                self.cnn_model.load_state_dict(torch.load(cnn_path, map_location=self.device))
                self.cnn_model.to(self.device)
                self.cnn_model.eval()
                print("✅ Loaded CNN model")
            
            # Load hybrid model
            hybrid_path = self.model_dir / 'best_hybrid_model.pth'
            if hybrid_path.exists():
                self.hybrid_model = HybridModel()
                self.hybrid_model.load_state_dict(torch.load(hybrid_path, map_location=self.device))
                self.hybrid_model.to(self.device)
                self.hybrid_model.eval()
                print("✅ Loaded hybrid model")
    
    def extract_metadata_features(self, metadata):
        """Extract numerical features from metadata"""
        features = []
        
        # Feature 1: Creation date delta
        creation_delta = metadata.get('creation_date_delta', 0)
        features.append(creation_delta)
        
        # Feature 2: Producer mismatch
        producer_mismatch = int(metadata.get('producer_mismatch', False))
        features.append(producer_mismatch)
        
        # Feature 3: Unusual editor
        unusual_editor = int(metadata.get('unusual_editor', False))
        features.append(unusual_editor)
        
        # Feature 4: Issuer name length
        issuer = metadata.get('issuer', '')
        issuer_length = len(issuer)
        features.append(issuer_length)
        
        # Feature 5: Suspicious issuer
        suspicious_issuer = int(metadata.get('suspicious_issuer', False))
        features.append(suspicious_issuer)
        
        # Enhanced features for the new model
        if len(features) == 5:  # Simple model
            return features
        
        # Feature 6: Title length
        title = metadata.get('title', '')
        title_length = len(title)
        features.append(title_length)
        
        # Feature 7: Keywords count
        keywords = metadata.get('keywords', '')
        keyword_count = len(keywords.split(',')) if keywords else 0
        features.append(keyword_count)
        
        return features
    
    def predict_metadata_only(self, metadata):
        """Predict using metadata-only model"""
        if not self.metadata_model:
            return None, None, "No metadata model available"
        
        features = self.extract_metadata_features(metadata)
        
        # Handle different model types
        if isinstance(self.metadata_model, dict):
            # Enhanced model with scaler and anomaly detector
            scaler = self.metadata_model['scaler']
            anomaly_detector = self.metadata_model['anomaly_detector']
            classifier = self.metadata_model['classifier']
            
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
            prediction = self.metadata_model.predict(X)[0]
            probabilities = self.metadata_model.predict_proba(X)[0]
            anomaly_score = 0.0
        
        confidence = max(probabilities)
        
        result = {
            'prediction': 'Forged' if prediction == 1 else 'Authentic',
            'confidence': confidence,
            'probability_authentic': probabilities[0],
            'probability_forged': probabilities[1],
            'anomaly_score': anomaly_score,
            'features': features
        }
        
        return result, None, None
    
    def predict_cnn_only(self, image_path):
        """Predict using CNN-only model"""
        if not self.cnn_model or not PYTORCH_AVAILABLE:
            return None, None, "CNN model not available"
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Predict
            with torch.no_grad():
                outputs = self.cnn_model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
                prediction = torch.argmax(outputs, dim=1)[0]
            
            result = {
                'prediction': 'Forged' if prediction == 1 else 'Authentic',
                'confidence': float(torch.max(probabilities)),
                'probability_authentic': float(probabilities[0]),
                'probability_forged': float(probabilities[1])
            }
            
            return result, None, None
            
        except Exception as e:
            return None, None, f"Error in CNN prediction: {e}"
    
    def predict_hybrid(self, image_path, metadata):
        """Predict using hybrid model"""
        if not self.hybrid_model or not PYTORCH_AVAILABLE:
            return None, None, "Hybrid model not available"
        
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Extract metadata features
            features = self.extract_metadata_features(metadata)
            metadata_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
            
            # Predict
            with torch.no_grad():
                outputs = self.hybrid_model(image_tensor, metadata_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
                prediction = torch.argmax(outputs, dim=1)[0]
            
            result = {
                'prediction': 'Forged' if prediction == 1 else 'Authentic',
                'confidence': float(torch.max(probabilities)),
                'probability_authentic': float(probabilities[0]),
                'probability_forged': float(probabilities[1]),
                'features': features
            }
            
            return result, None, None
            
        except Exception as e:
            return None, None, f"Error in hybrid prediction: {e}"
    
    def predict_all(self, image_path=None, metadata_path=None):
        """Run predictions with all available models"""
        
        # Load metadata if provided
        metadata = {}
        if metadata_path and Path(metadata_path).exists():
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        
        results = {}
        
        # Metadata-only prediction
        if metadata:
            result, _, error = self.predict_metadata_only(metadata)
            if result:
                results['metadata'] = result
            elif error:
                results['metadata'] = {'error': error}
        
        # CNN-only prediction
        if image_path and Path(image_path).exists():
            result, _, error = self.predict_cnn_only(image_path)
            if result:
                results['cnn'] = result
            elif error:
                results['cnn'] = {'error': error}
        
        # Hybrid prediction
        if image_path and metadata and Path(image_path).exists():
            result, _, error = self.predict_hybrid(image_path, metadata)
            if result:
                results['hybrid'] = result
            elif error:
                results['hybrid'] = {'error': error}
        
        return results
    
    def print_results(self, results, filename=""):
        """Print prediction results in a formatted way"""
        
        print("\n" + "="*60)
        print("ENHANCED CERTIFICATE FRAUD DETECTION RESULTS")
        print("="*60)
        if filename:
            print(f"File: {filename}")
        
        for model_name, result in results.items():
            print(f"\n📊 {model_name.upper()} MODEL:")
            print("-" * 40)
            
            if 'error' in result:
                print(f"❌ Error: {result['error']}")
                continue
            
            prediction = result['prediction']
            confidence = result['confidence']
            
            # Color coding for terminal output
            if prediction == 'Forged':
                status_emoji = "🚨"
                status_color = "RED"
            else:
                status_emoji = "✅"
                status_color = "GREEN"
            
            print(f"{status_emoji} Prediction: {prediction}")
            print(f"🔍 Confidence: {confidence:.4f}")
            print(f"📈 Probability Authentic: {result['probability_authentic']:.4f}")
            print(f"📉 Probability Forged: {result['probability_forged']:.4f}")
            
            if 'anomaly_score' in result:
                print(f"⚡ Anomaly Score: {result['anomaly_score']:.4f}")
            
            if 'features' in result:
                print(f"🔧 Features: {result['features']}")
        
        # Ensemble prediction (simple voting)
        if len(results) > 1:
            predictions = [r['prediction'] for r in results.values() if 'prediction' in r]
            if predictions:
                forged_votes = sum(1 for p in predictions if p == 'Forged')
                authentic_votes = sum(1 for p in predictions if p == 'Authentic')
                
                print(f"\n🗳️  ENSEMBLE RESULT:")
                print("-" * 40)
                ensemble_prediction = 'Forged' if forged_votes > authentic_votes else 'Authentic'
                vote_confidence = max(forged_votes, authentic_votes) / len(predictions)
                
                print(f"📊 Final Prediction: {ensemble_prediction}")
                print(f"🎯 Ensemble Confidence: {vote_confidence:.2f}")
                print(f"📋 Votes - Forged: {forged_votes}, Authentic: {authentic_votes}")

def main():
    parser = argparse.ArgumentParser(description='Enhanced Certificate Fraud Detection')
    parser.add_argument('input_path', help='Path to image or metadata file')
    parser.add_argument('--metadata', help='Path to metadata JSON file')
    parser.add_argument('--image', help='Path to certificate image')
    parser.add_argument('--model-dir', default='../models', help='Directory containing trained models')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = EnhancedFraudPredictor(model_dir=args.model_dir)
    
    # Determine input types
    input_path = Path(args.input_path)
    
    if input_path.suffix.lower() == '.json':
        # Input is metadata file
        metadata_path = str(input_path)
        image_path = args.image
    else:
        # Input is image file
        image_path = str(input_path)
        metadata_path = args.metadata
        
        # Try to find corresponding metadata file
        if not metadata_path:
            potential_metadata = input_path.with_suffix('.json')
            if potential_metadata.exists():
                metadata_path = str(potential_metadata)
    
    # Run predictions
    results = predictor.predict_all(image_path=image_path, metadata_path=metadata_path)
    
    if not results:
        print("❌ No predictions could be made. Check your input files and model availability.")
        return
    
    # Print results
    predictor.print_results(results, filename=args.input_path)

if __name__ == "__main__":
    main()