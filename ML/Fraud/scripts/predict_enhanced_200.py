"""
Enhanced Prediction Script for 200-Image Dataset
Works with the enhanced metadata model trained on 200 synthetic certificates
"""

import os
import json
import numpy as np
import argparse
from pathlib import Path
import joblib

class EnhancedFraudPredictor:
    """Enhanced fraud prediction with 10-feature metadata model"""
    
    def __init__(self, model_dir="../models"):
        self.model_dir = Path(model_dir)
        
        # Load models
        self.metadata_model = None
        self.load_models()
    
    def load_models(self):
        """Load all available trained models"""
        
        # Try to load enhanced model first
        enhanced_path = self.model_dir / 'enhanced_metadata_model_200.joblib'
        if enhanced_path.exists():
            self.metadata_model = joblib.load(enhanced_path)
            print("✅ Loaded enhanced metadata model (200 images, 10 features)")
            return
        
        # Fallback to simple enhanced model
        simple_enhanced_path = self.model_dir / 'enhanced_metadata_model.joblib'
        if simple_enhanced_path.exists():
            self.metadata_model = joblib.load(simple_enhanced_path)
            print("✅ Loaded simple enhanced metadata model")
            return
        
        # Fallback to original simple model
        simple_path = self.model_dir / 'simple_fraud_model.joblib'
        if simple_path.exists():
            self.metadata_model = joblib.load(simple_path)
            print("✅ Loaded simple metadata model")
            return
        
        print("❌ No metadata model found")
    
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
        
        # Enhanced features (if model supports them)
        if isinstance(self.metadata_model, dict) and 'feature_names' in self.metadata_model:
            if len(self.metadata_model['feature_names']) > 5:
                # Feature 6: Title length
                title = metadata.get('title', '')
                title_length = len(title)
                features.append(title_length)
                
                # Feature 7: Keywords count
                keywords = metadata.get('keywords', '')
                keyword_count = len(keywords.split(',')) if keywords else 0
                features.append(keyword_count)
                
                # Feature 8: Producer length
                producer = metadata.get('producer', '')
                producer_length = len(producer)
                features.append(producer_length)
                
                # Feature 9: Creator length
                creator = metadata.get('creator', '')
                creator_length = len(creator)
                features.append(creator_length)
                
                # Feature 10: Subject length
                subject = metadata.get('subject', '')
                subject_length = len(subject)
                features.append(subject_length)
        
        return features
    
    def predict_metadata(self, metadata):
        """Predict using metadata model"""
        if not self.metadata_model:
            return None, "No metadata model available"
        
        features = self.extract_metadata_features(metadata)
        
        # Handle different model types
        if isinstance(self.metadata_model, dict):
            # Enhanced model with scaler and anomaly detector
            scaler = self.metadata_model['scaler']
            anomaly_detector = self.metadata_model['anomaly_detector']
            classifier = self.metadata_model['classifier']
            model_name = self.metadata_model.get('model_name', 'Unknown')
            
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
            model_name = "Simple"
        
        confidence = max(probabilities)
        
        result = {
            'prediction': 'Forged' if prediction == 1 else 'Authentic',
            'confidence': confidence,
            'probability_authentic': probabilities[0],
            'probability_forged': probabilities[1],
            'anomaly_score': anomaly_score,
            'features': features,
            'model_name': model_name,
            'feature_count': len(features)
        }
        
        return result, None
    
    def get_feature_analysis(self, metadata, features):
        """Provide detailed feature analysis"""
        feature_names = [
            'creation_date_delta', 'producer_mismatch', 'unusual_editor',
            'issuer_length', 'suspicious_issuer'
        ]
        
        # Add enhanced feature names if available
        if len(features) > 5:
            feature_names.extend([
                'title_length', 'keyword_count', 'producer_length', 
                'creator_length', 'subject_length'
            ])
        
        analysis = {}
        reasons = []
        
        for i, (name, value) in enumerate(zip(feature_names, features)):
            analysis[name] = value
            
            # Generate reasons based on suspicious values
            if name == 'creation_date_delta' and value > 30:
                reasons.append(f"Unusual creation date (delta: {value} days)")
            elif name == 'producer_mismatch' and value == 1:
                reasons.append("PDF producer information mismatch detected")
            elif name == 'unusual_editor' and value == 1:
                reasons.append("Unusual editing software detected")
            elif name == 'suspicious_issuer' and value == 1:
                issuer = metadata.get('issuer', 'Unknown')
                reasons.append(f"Suspicious issuer name: {issuer}")
            elif name == 'producer_length' and value > 20:
                reasons.append("Unusually long producer name")
            elif name == 'creator_length' and value > 20:
                reasons.append("Unusually long creator name")
        
        if not reasons:
            reasons.append("Metadata pattern appears normal")
        
        return analysis, reasons
    
    def print_results(self, result, metadata, filename=""):
        """Print prediction results in a formatted way"""
        
        print("\n" + "="*60)
        print("ENHANCED CERTIFICATE FRAUD DETECTION RESULTS")
        print("="*60)
        if filename:
            print(f"File: {filename}")
        
        prediction = result['prediction']
        confidence = result['confidence']
        
        # Status with emoji
        if prediction == 'Forged':
            status_emoji = "🚨"
        else:
            status_emoji = "✅"
        
        print(f"{status_emoji} Prediction: {prediction}")
        print(f"🔍 Confidence: {confidence:.4f}")
        print(f"📈 Probability Authentic: {result['probability_authentic']:.4f}")
        print(f"📉 Probability Forged: {result['probability_forged']:.4f}")
        
        if 'anomaly_score' in result:
            print(f"⚡ Anomaly Score: {result['anomaly_score']:.4f}")
        
        print(f"🤖 Model: {result.get('model_name', 'Unknown')} ({result['feature_count']} features)")
        
        # Feature analysis
        analysis, reasons = self.get_feature_analysis(metadata, result['features'])
        
        print(f"\n🔧 Features Analysis:")
        for name, value in analysis.items():
            print(f"  {name}: {value}")
        
        print(f"\n💡 Reasons:")
        for i, reason in enumerate(reasons, 1):
            print(f"  {i}. {reason}")
        
        # Original metadata
        print(f"\n📋 Original Metadata:")
        key_fields = ['issuer', 'creation_date_delta', 'producer_mismatch', 'unusual_editor']
        for field in key_fields:
            if field in metadata:
                print(f"  {field}: {metadata[field]}")

def main():
    parser = argparse.ArgumentParser(description='Enhanced Certificate Fraud Detection (200 Images)')
    parser.add_argument('metadata_path', help='Path to metadata JSON file')
    parser.add_argument('--model-dir', default='../models', help='Directory containing trained models')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = EnhancedFraudPredictor(model_dir=args.model_dir)
    
    if not predictor.metadata_model:
        print("❌ No model available for predictions")
        return
    
    # Load metadata
    metadata_path = Path(args.metadata_path)
    if not metadata_path.exists():
        print(f"❌ Metadata file not found: {metadata_path}")
        return
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # Run prediction
    result, error = predictor.predict_metadata(metadata)
    
    if error:
        print(f"❌ Error: {error}")
        return
    
    # Print results
    predictor.print_results(result, metadata, filename=str(metadata_path))

if __name__ == "__main__":
    main()