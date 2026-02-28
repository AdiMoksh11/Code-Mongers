"""
Metadata module: PDF metadata parsing, feature engineering, IsolationForest/classifier.
"""
import json
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from datetime import datetime, timedelta

class CertificateMetadataModel:
    def __init__(self, use_isolation_forest=True):
        self.use_isolation_forest = use_isolation_forest
        self.scaler = StandardScaler()
        
        if use_isolation_forest:
            self.model = IsolationForest(contamination=0.1, random_state=42)
        else:
            self.model = LogisticRegression(random_state=42)
        
        self.feature_names = [
            'creation_date_delta', 
            'producer_mismatch', 
            'unusual_editor',
            'metadata_completeness',
            'suspicious_patterns'
        ]

    def extract_features(self, metadata_list):
        """Extract engineered features from metadata"""
        features = []
        
        for metadata in metadata_list:
            feature_vector = [
                metadata.get('creation_date_delta', 0),
                int(metadata.get('producer_mismatch', False)),
                int(metadata.get('unusual_editor', False)),
                self._calculate_completeness(metadata),
                self._detect_suspicious_patterns(metadata)
            ]
            features.append(feature_vector)
        
        return np.array(features)

    def _calculate_completeness(self, metadata):
        """Calculate metadata completeness score"""
        expected_fields = ['issuer', 'creation_date_delta', 'producer_mismatch', 'unusual_editor']
        present_fields = sum(1 for field in expected_fields if field in metadata and metadata[field] is not None)
        return present_fields / len(expected_fields)

    def _detect_suspicious_patterns(self, metadata):
        """Detect suspicious patterns in metadata"""
        suspicious_score = 0
        
        # High creation date delta is suspicious
        if metadata.get('creation_date_delta', 0) > 90:
            suspicious_score += 1
        
        # Combination of producer mismatch and unusual editor
        if metadata.get('producer_mismatch', False) and metadata.get('unusual_editor', False):
            suspicious_score += 2
        
        # Suspicious issuer names
        issuer = metadata.get('issuer', '').lower()
        suspicious_keywords = ['fake', 'counterfeit', 'bogus', 'spurious', 'phony', 'fraudulent']
        if any(keyword in issuer for keyword in suspicious_keywords):
            suspicious_score += 3
        
        return min(suspicious_score, 3)  # Cap at 3

    def fit(self, metadata_list, labels=None):
        """Train the metadata model"""
        X = self.extract_features(metadata_list)
        X_scaled = self.scaler.fit_transform(X)
        
        if self.use_isolation_forest:
            # Unsupervised anomaly detection
            self.model.fit(X_scaled)
        else:
            # Supervised classification
            if labels is None:
                raise ValueError("Labels required for supervised learning")
            self.model.fit(X_scaled, labels)

    def anomaly_score(self, metadata_list):
        """Calculate anomaly scores"""
        X = self.extract_features(metadata_list)
        X_scaled = self.scaler.transform(X)
        
        if self.use_isolation_forest:
            # Return decision function (higher = more normal)
            scores = self.model.decision_function(X_scaled)
            # Convert to probabilities (higher = more anomalous)
            return 1 / (1 + np.exp(scores))
        else:
            # Return probabilities of being forged
            return self.model.predict_proba(X_scaled)[:, 1]

    def predict(self, metadata_list):
        """Predict labels"""
        X = self.extract_features(metadata_list)
        X_scaled = self.scaler.transform(X)
        
        if self.use_isolation_forest:
            # -1 for anomaly, 1 for normal -> convert to 1 for forged, 0 for authentic
            predictions = self.model.predict(X_scaled)
            return (predictions == -1).astype(int)
        else:
            return self.model.predict(X_scaled)

    def get_feature_importance(self):
        """Get feature importance (for supervised models)"""
        if not self.use_isolation_forest and hasattr(self.model, 'coef_'):
            importance = np.abs(self.model.coef_[0])
            return list(zip(self.feature_names, importance))
        return []

    def save(self, path):
        """Save the trained model"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'use_isolation_forest': self.use_isolation_forest,
            'feature_names': self.feature_names
        }
        joblib.dump(model_data, path)

    def load(self, path):
        """Load a trained model"""
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.use_isolation_forest = model_data['use_isolation_forest']
        self.feature_names = model_data['feature_names']

class MetadataModelEvaluator:
    @staticmethod
    def evaluate_metadata_model(model, metadata_test, y_test):
        """Evaluate metadata model performance"""
        predictions = model.predict(metadata_test)
        scores = model.anomaly_score(metadata_test)
        
        print("Metadata Model Classification Report:")
        print(classification_report(y_test, predictions, target_names=['Authentic', 'Forged']))
        
        return {
            'predictions': predictions,
            'anomaly_scores': scores,
            'accuracy': (predictions == y_test).mean()
        }
