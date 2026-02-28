"""
Super simple training script that works without OCR dependencies
"""
import os
import json
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split
import joblib

def load_simple_data(data_dir):
    """Load metadata and create simple features"""
    metadata_list = []
    labels = []
    
    for filename in os.listdir(data_dir):
        if filename.endswith('.json'):
            file_path = os.path.join(data_dir, filename)
            with open(file_path, 'r') as f:
                metadata = json.load(f)
            
            # Determine label from filename
            label = 1 if 'forged' in filename else 0
            
            metadata_list.append(metadata)
            labels.append(label)
    
    return metadata_list, labels

def extract_features(metadata_list):
    """Extract numerical features from metadata"""
    features = []
    
    for metadata in metadata_list:
        feature_vector = [
            metadata.get('creation_date_delta', 0),
            int(metadata.get('producer_mismatch', False)),
            int(metadata.get('unusual_editor', False)),
            len(metadata.get('issuer', '')),  # Issuer name length
            1 if any(word in metadata.get('issuer', '').lower() 
                    for word in ['fake', 'counterfeit', 'bogus', 'spurious']) else 0
        ]
        features.append(feature_vector)
    
    return np.array(features)

def main():
    print("Super Simple Fraud Detection Training")
    print("=" * 50)
    
    data_dir = '../data'
    models_dir = '../models'
    
    os.makedirs(models_dir, exist_ok=True)
    
    # Load data
    print("Loading metadata...")
    metadata_list, labels = load_simple_data(data_dir)
    
    print(f"Loaded {len(metadata_list)} samples")
    print(f"Class distribution: Authentic: {labels.count(0)}, Forged: {labels.count(1)}")
    
    # Extract features
    X = extract_features(metadata_list)
    y = np.array(labels)
    
    print(f"Feature matrix shape: {X.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train metadata anomaly detector
    print("\nTraining anomaly detector...")
    anomaly_detector = IsolationForest(contamination=0.3, random_state=42)
    anomaly_detector.fit(X_train)
    
    # Get anomaly scores
    train_scores = anomaly_detector.decision_function(X_train)
    test_scores = anomaly_detector.decision_function(X_test)
    
    # Train classifier using anomaly scores as features
    print("Training classifier...")
    classifier = LogisticRegression(random_state=42)
    
    # Use original features + anomaly scores
    X_train_extended = np.column_stack([X_train, train_scores])
    X_test_extended = np.column_stack([X_test, test_scores])
    
    classifier.fit(X_train_extended, y_train)
    
    # Make predictions
    train_pred = classifier.predict(X_train_extended)
    test_pred = classifier.predict(X_test_extended)
    
    # Evaluate
    print("\nTraining Results:")
    print(f"Training Accuracy: {accuracy_score(y_train, train_pred):.4f}")
    print("\nTest Results:")
    print(f"Test Accuracy: {accuracy_score(y_test, test_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, test_pred, target_names=['Authentic', 'Forged']))
    
    # Save models
    print("\nSaving models...")
    
    model_data = {
        'anomaly_detector': anomaly_detector,
        'classifier': classifier,
        'feature_names': ['creation_date_delta', 'producer_mismatch', 'unusual_editor', 
                         'issuer_length', 'suspicious_issuer']
    }
    
    joblib.dump(model_data, f'{models_dir}/simple_fraud_model.joblib')
    
    print(f"Model saved to {models_dir}/simple_fraud_model.joblib")
    
    # Test the saved model
    print("\nTesting saved model...")
    loaded_model = joblib.load(f'{models_dir}/simple_fraud_model.joblib')
    
    # Test on first sample
    if len(X_test) > 0:
        test_sample = X_test[0:1]
        test_score = loaded_model['anomaly_detector'].decision_function(test_sample)
        test_extended = np.column_stack([test_sample, test_score])
        prediction = loaded_model['classifier'].predict(test_extended)[0]
        probability = loaded_model['classifier'].predict_proba(test_extended)[0]
        
        print(f"Test prediction: {'Forged' if prediction == 1 else 'Authentic'}")
        print(f"Confidence: {max(probability):.4f}")
        print(f"Probabilities: Authentic={probability[0]:.4f}, Forged={probability[1]:.4f}")
    
    print("\n" + "=" * 50)
    print("SIMPLE TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 50)
    print("You can now test the model or build upon this foundation.")

if __name__ == "__main__":
    main()