"""
Simplified inference script for the trained fraud detection model
"""
import os
import sys
import json
import argparse
import joblib
import numpy as np

def extract_features_from_metadata(metadata):
    """Extract numerical features from metadata"""
    feature_vector = [
        metadata.get('creation_date_delta', 0),
        int(metadata.get('producer_mismatch', False)),
        int(metadata.get('unusual_editor', False)),
        len(metadata.get('issuer', '')),  # Issuer name length
        1 if any(word in metadata.get('issuer', '').lower() 
                for word in ['fake', 'counterfeit', 'bogus', 'spurious']) else 0
    ]
    return np.array(feature_vector).reshape(1, -1)

def predict_fraud(metadata_path, model_path='../models/simple_fraud_model.joblib'):
    """Predict if a certificate is fraudulent based on metadata"""
    
    # Load the trained model
    try:
        model_data = joblib.load(model_path)
        anomaly_detector = model_data['anomaly_detector']
        classifier = model_data['classifier']
        feature_names = model_data['feature_names']
    except FileNotFoundError:
        print(f"Model file not found: {model_path}")
        print("Please run training first: python train_super_simple.py")
        return None
    
    # Load metadata
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    except FileNotFoundError:
        print(f"Metadata file not found: {metadata_path}")
        return None
    except json.JSONDecodeError:
        print(f"Invalid JSON in metadata file: {metadata_path}")
        return None
    
    # Extract features
    features = extract_features_from_metadata(metadata)
    
    # Get anomaly score
    anomaly_score = anomaly_detector.decision_function(features)
    
    # Combine features with anomaly score
    features_extended = np.column_stack([features, anomaly_score])
    
    # Make prediction
    prediction = classifier.predict(features_extended)[0]
    probabilities = classifier.predict_proba(features_extended)[0]
    confidence = max(probabilities)
    
    # Generate explanation
    reasons = generate_explanation(metadata, features[0], anomaly_score[0])
    
    result = {
        'file': metadata_path,
        'prediction': 'Forged' if prediction == 1 else 'Authentic',
        'confidence': float(confidence),
        'probability_authentic': float(probabilities[0]),
        'probability_forged': float(probabilities[1]),
        'anomaly_score': float(anomaly_score[0]),
        'features': {
            'creation_date_delta': int(features[0][0]),
            'producer_mismatch': bool(features[0][1]),
            'unusual_editor': bool(features[0][2]),
            'issuer_length': int(features[0][3]),
            'suspicious_issuer': bool(features[0][4])
        },
        'reasons': reasons,
        'metadata': metadata
    }
    
    return result

def generate_explanation(metadata, features, anomaly_score):
    """Generate human-readable explanation"""
    reasons = []
    
    # Check individual features
    creation_delta = int(features[0])
    producer_mismatch = bool(features[1])
    unusual_editor = bool(features[2])
    issuer_length = int(features[3])
    suspicious_issuer = bool(features[4])
    
    if creation_delta > 90:
        reasons.append(f"Unusual creation date (delta: {creation_delta} days)")
    
    if producer_mismatch:
        reasons.append("PDF producer information mismatch detected")
    
    if unusual_editor:
        reasons.append("Unusual editing software detected")
    
    if suspicious_issuer:
        reasons.append(f"Suspicious issuer name: {metadata.get('issuer', 'Unknown')}")
    
    if issuer_length < 5:
        reasons.append("Issuer name too short")
    elif issuer_length > 50:
        reasons.append("Issuer name unusually long")
    
    # Anomaly score interpretation
    if anomaly_score < -0.2:
        reasons.append("Strong anomaly detected in metadata pattern")
    elif anomaly_score < 0:
        reasons.append("Mild anomaly detected in metadata pattern")
    else:
        reasons.append("Metadata pattern appears normal")
    
    if not reasons:
        reasons.append("No significant anomalies detected")
    
    return reasons

def main():
    parser = argparse.ArgumentParser(description='Simple Certificate Fraud Detection')
    parser.add_argument('metadata_file', help='Path to metadata JSON file')
    parser.add_argument('--model', default='../models/simple_fraud_model.joblib', 
                       help='Path to trained model file')
    parser.add_argument('--output', help='Output JSON file for results')
    
    args = parser.parse_args()
    
    # Make prediction
    result = predict_fraud(args.metadata_file, args.model)
    
    if result is None:
        return
    
    # Print results
    print("\n" + "="*60)
    print("CERTIFICATE FRAUD DETECTION RESULTS")
    print("="*60)
    print(f"File: {result['file']}")
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"Probability Authentic: {result['probability_authentic']:.4f}")
    print(f"Probability Forged: {result['probability_forged']:.4f}")
    print(f"Anomaly Score: {result['anomaly_score']:.4f}")
    
    print(f"\nFeatures Analysis:")
    for feature, value in result['features'].items():
        print(f"  {feature}: {value}")
    
    print(f"\nReasons:")
    for i, reason in enumerate(result['reasons'], 1):
        print(f"  {i}. {reason}")
    
    print(f"\nOriginal Metadata:")
    for key, value in result['metadata'].items():
        print(f"  {key}: {value}")
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to: {args.output}")

if __name__ == "__main__":
    main()