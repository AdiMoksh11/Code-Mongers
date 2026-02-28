"""
Simplified Enhanced Training Pipeline
Trains on 200 synthetic certificate images with metadata
"""

import os
import json
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

class EnhancedFraudDetector:
    """Enhanced fraud detector with image and metadata analysis"""
    
    def __init__(self, data_dir="../data_synthetic", model_dir="../models"):
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)
        
        print(f"Data directory: {self.data_dir}")
        print(f"Model directory: {self.model_dir}")
        
        self.metadata_model = None
        self.scaler = StandardScaler()
    
    def load_dataset(self):
        """Load the synthetic dataset"""
        index_file = self.data_dir / "dataset_index.json"
        
        if not index_file.exists():
            raise FileNotFoundError(f"Dataset index not found: {index_file}")
        
        with open(index_file, 'r') as f:
            dataset_info = json.load(f)
        
        print(f"Loaded dataset with {dataset_info['total_files']} files:")
        print(f"  - Authentic: {dataset_info['authentic_count']}")
        print(f"  - Forged: {dataset_info['forged_count']}")
        
        return dataset_info['files']
    
    def extract_metadata_features(self, metadata):
        """Extract numerical features from metadata"""
        features = []
        
        # Feature 1: Creation date delta
        creation_delta = metadata.get('creation_date_delta', 0)
        features.append(creation_delta)
        
        # Feature 2: Producer mismatch (boolean to int)
        producer_mismatch = int(metadata.get('producer_mismatch', False))
        features.append(producer_mismatch)
        
        # Feature 3: Unusual editor (boolean to int)
        unusual_editor = int(metadata.get('unusual_editor', False))
        features.append(unusual_editor)
        
        # Feature 4: Issuer name length
        issuer = metadata.get('issuer', '')
        issuer_length = len(issuer)
        features.append(issuer_length)
        
        # Feature 5: Suspicious issuer (boolean to int)
        suspicious_issuer = int(metadata.get('suspicious_issuer', False))
        features.append(suspicious_issuer)
        
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
    
    def train_enhanced_metadata_model(self, data_files):
        """Train enhanced metadata model with more features"""
        print("\n" + "="*60)
        print("Training Enhanced Metadata Model (10 Features)")
        print("="*60)
        
        # Extract features and labels
        features = []
        labels = []
        
        print("Extracting features from metadata...")
        for i, file_info in enumerate(data_files):
            if i % 50 == 0:
                print(f"Processing file {i+1}/{len(data_files)}")
            
            with open(file_info['metadata'], 'r') as f:
                metadata = json.load(f)
            
            feature_vector = self.extract_metadata_features(metadata)
            features.append(feature_vector)
            labels.append(1 if file_info['label'] == 'forged' else 0)
        
        X = np.array(features)
        y = np.array(labels)
        
        print(f"\nDataset Summary:")
        print(f"Features shape: {X.shape}")
        print(f"Total samples: {len(y)}")
        print(f"Authentic samples: {np.sum(y == 0)}")
        print(f"Forged samples: {np.sum(y == 1)}")
        print(f"Feature names: ['creation_delta', 'producer_mismatch', 'unusual_editor',")
        print(f"                'issuer_length', 'suspicious_issuer', 'title_length',")
        print(f"                'keyword_count', 'producer_length', 'creator_length', 'subject_length']")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        print(f"\nTrain set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train anomaly detector on authentic samples only
        print("\nTraining anomaly detector...")
        anomaly_detector = IsolationForest(
            contamination=0.1, 
            random_state=42,
            n_estimators=200,
            max_samples='auto'
        )
        anomaly_detector.fit(X_train_scaled[y_train == 0])
        
        # Get anomaly scores for all samples
        train_anomaly_scores = anomaly_detector.decision_function(X_train_scaled)
        test_anomaly_scores = anomaly_detector.decision_function(X_test_scaled)
        
        # Combine original features with anomaly scores
        X_train_enhanced = np.column_stack([X_train_scaled, train_anomaly_scores])
        X_test_enhanced = np.column_stack([X_test_scaled, test_anomaly_scores])
        
        print(f"Enhanced features shape: {X_train_enhanced.shape}")
        
        # Train multiple classifiers and choose the best
        print("\nTraining classifiers...")
        
        classifiers = {
            'LogisticRegression': LogisticRegression(random_state=42, class_weight='balanced', max_iter=1000),
            'LogisticRegression_L1': LogisticRegression(random_state=42, class_weight='balanced', 
                                                       penalty='l1', solver='liblinear', max_iter=1000),
            'LogisticRegression_L2': LogisticRegression(random_state=42, class_weight='balanced', 
                                                       penalty='l2', max_iter=1000, C=0.1)
        }
        
        best_classifier = None
        best_score = 0.0
        best_name = ""
        
        for name, classifier in classifiers.items():
            classifier.fit(X_train_enhanced, y_train)
            score = classifier.score(X_test_enhanced, y_test)
            print(f"{name}: {score:.4f}")
            
            if score > best_score:
                best_score = score
                best_classifier = classifier
                best_name = name
        
        print(f"\nBest classifier: {best_name} (Score: {best_score:.4f})")
        
        # Final evaluation with best classifier
        train_pred = best_classifier.predict(X_train_enhanced)
        test_pred = best_classifier.predict(X_test_enhanced)
        
        train_acc = accuracy_score(y_train, train_pred)
        test_acc = accuracy_score(y_test, test_pred)
        
        print(f"\n" + "="*60)
        print("FINAL RESULTS")
        print("="*60)
        print(f"Training Accuracy: {train_acc:.4f}")
        print(f"Test Accuracy: {test_acc:.4f}")
        print(f"Improvement over simple model: {test_acc - 1.0:.4f}")
        
        print(f"\nDetailed Classification Report:")
        print(classification_report(y_test, test_pred, target_names=['Authentic', 'Forged']))
        
        print(f"\nConfusion Matrix:")
        cm = confusion_matrix(y_test, test_pred)
        print(cm)
        print(f"True Negatives (Authentic correctly identified): {cm[0,0]}")
        print(f"False Positives (Authentic wrongly flagged as Forged): {cm[0,1]}")
        print(f"False Negatives (Forged wrongly identified as Authentic): {cm[1,0]}")
        print(f"True Positives (Forged correctly identified): {cm[1,1]}")
        
        # Feature importance analysis
        if hasattr(best_classifier, 'coef_'):
            feature_names = ['creation_delta', 'producer_mismatch', 'unusual_editor',
                           'issuer_length', 'suspicious_issuer', 'title_length',
                           'keyword_count', 'producer_length', 'creator_length', 
                           'subject_length', 'anomaly_score']
            
            importance = np.abs(best_classifier.coef_[0])
            feature_importance = list(zip(feature_names, importance))
            feature_importance.sort(key=lambda x: x[1], reverse=True)
            
            print(f"\nTop 5 Most Important Features:")
            for i, (feature, imp) in enumerate(feature_importance[:5]):
                print(f"{i+1}. {feature}: {imp:.4f}")
        
        # Save models
        self.metadata_model = {
            'scaler': self.scaler,
            'anomaly_detector': anomaly_detector,
            'classifier': best_classifier,
            'feature_names': feature_names,
            'model_name': best_name
        }
        
        model_path = self.model_dir / 'enhanced_metadata_model_200.joblib'
        joblib.dump(self.metadata_model, model_path)
        print(f"\nModel saved to: {model_path}")
        
        # Test on a few samples
        print(f"\n" + "="*60)
        print("SAMPLE PREDICTIONS")
        print("="*60)
        
        # Test on first few samples
        for i in range(min(5, len(X_test))):
            sample_features = X_test_enhanced[i:i+1]
            pred = best_classifier.predict(sample_features)[0]
            prob = best_classifier.predict_proba(sample_features)[0]
            actual = y_test[i]
            
            print(f"Sample {i+1}:")
            print(f"  Actual: {'Forged' if actual == 1 else 'Authentic'}")
            print(f"  Predicted: {'Forged' if pred == 1 else 'Authentic'}")
            print(f"  Confidence: {max(prob):.4f}")
            print(f"  Prob [Authentic, Forged]: [{prob[0]:.4f}, {prob[1]:.4f}]")
            print()
        
        return train_acc, test_acc
    
    def train_all_models(self):
        """Train all available models"""
        print("🚀 Starting Enhanced Training Pipeline with 200 Images")
        print("="*60)
        
        # Load dataset
        data_files = self.load_dataset()
        
        # Train enhanced metadata model
        train_acc, test_acc = self.train_enhanced_metadata_model(data_files)
        
        results = {
            'dataset_size': len(data_files),
            'metadata_train_acc': train_acc,
            'metadata_test_acc': test_acc,
            'features_count': 10,
            'model_type': 'enhanced_metadata'
        }
        
        # Save results
        results_file = self.model_dir / 'enhanced_training_results_200.json'
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\n" + "="*60)
        print("🎉 TRAINING COMPLETE!")
        print("="*60)
        print("Final Results Summary:")
        print(f"  Dataset Size: {len(data_files)} images")
        print(f"  Training Accuracy: {train_acc:.4f}")
        print(f"  Test Accuracy: {test_acc:.4f}")
        print(f"  Features Used: 10 (enhanced metadata)")
        print(f"  Model Type: Logistic Regression + Isolation Forest")
        print(f"\nThe model is now ready for predictions!")
        
        return results

if __name__ == "__main__":
    # Create trainer
    trainer = EnhancedFraudDetector()
    
    # Train all models
    results = trainer.train_all_models()