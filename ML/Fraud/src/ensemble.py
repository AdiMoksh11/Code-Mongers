"""
Stacking meta-classifier: combines image, text, and metadata scores.
"""
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import numpy as np

class CertificateEnsembleModel:
    def __init__(self, meta_classifier='logistic'):
        """
        Initialize ensemble model
        Args:
            meta_classifier: 'logistic' or 'random_forest'
        """
        if meta_classifier == 'logistic':
            self.stacker = LogisticRegression(random_state=42)
        elif meta_classifier == 'random_forest':
            self.stacker = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            raise ValueError("meta_classifier must be 'logistic' or 'random_forest'")
        
        self.meta_classifier = meta_classifier

    def prepare_features(self, image_probs, text_probs, metadata_scores):
        """
        Prepare features for meta-classifier
        Args:
            image_probs: probabilities from image model (N, 2)
            text_probs: probabilities from text model (N, 2)
            metadata_scores: anomaly scores from metadata model (N,)
        """
        # Extract probability of being forged (class 1) from each model
        image_forged_prob = image_probs[:, 1] if image_probs.shape[1] == 2 else image_probs.flatten()
        text_forged_prob = text_probs[:, 1] if text_probs.shape[1] == 2 else text_probs.flatten()
        
        # Ensure metadata_scores is 1D
        if len(metadata_scores.shape) > 1:
            metadata_scores = metadata_scores.flatten()
        
        # Stack features
        features = np.column_stack([
            image_forged_prob,
            text_forged_prob, 
            metadata_scores
        ])
        
        return features

    def fit(self, image_probs, text_probs, metadata_scores, y):
        """Train the ensemble model"""
        X = self.prepare_features(image_probs, text_probs, metadata_scores)
        self.stacker.fit(X, y)
        
        # Store feature importance if available
        if hasattr(self.stacker, 'feature_importances_'):
            self.feature_importance = {
                'image': self.stacker.feature_importances_[0],
                'text': self.stacker.feature_importances_[1],
                'metadata': self.stacker.feature_importances_[2]
            }
        elif hasattr(self.stacker, 'coef_'):
            coef = self.stacker.coef_[0]
            self.feature_importance = {
                'image': abs(coef[0]),
                'text': abs(coef[1]),
                'metadata': abs(coef[2])
            }

    def predict_proba(self, image_probs, text_probs, metadata_scores):
        """Predict probabilities using ensemble"""
        X = self.prepare_features(image_probs, text_probs, metadata_scores)
        return self.stacker.predict_proba(X)

    def predict(self, image_probs, text_probs, metadata_scores):
        """Predict labels using ensemble"""
        X = self.prepare_features(image_probs, text_probs, metadata_scores)
        return self.stacker.predict(X)

    def get_confidence_score(self, image_probs, text_probs, metadata_scores):
        """Get confidence scores for predictions"""
        probs = self.predict_proba(image_probs, text_probs, metadata_scores)
        # Confidence is the maximum probability
        return np.max(probs, axis=1)

    def get_feature_importance(self):
        """Get feature importance from meta-classifier"""
        if hasattr(self, 'feature_importance'):
            return self.feature_importance
        return None

    def cross_validate(self, image_probs, text_probs, metadata_scores, y, cv=5):
        """Perform cross-validation"""
        X = self.prepare_features(image_probs, text_probs, metadata_scores)
        scores = cross_val_score(self.stacker, X, y, cv=cv, scoring='accuracy')
        return scores.mean(), scores.std()

    def save(self, path):
        """Save the ensemble model"""
        model_data = {
            'stacker': self.stacker,
            'meta_classifier': self.meta_classifier,
            'feature_importance': getattr(self, 'feature_importance', None)
        }
        joblib.dump(model_data, path)

    def load(self, path):
        """Load the ensemble model"""
        model_data = joblib.load(path)
        self.stacker = model_data['stacker']
        self.meta_classifier = model_data['meta_classifier']
        if 'feature_importance' in model_data:
            self.feature_importance = model_data['feature_importance']

class EnsembleEvaluator:
    @staticmethod
    def evaluate_ensemble(model, image_probs, text_probs, metadata_scores, y_test):
        """Comprehensive evaluation of ensemble model"""
        predictions = model.predict(image_probs, text_probs, metadata_scores)
        probabilities = model.predict_proba(image_probs, text_probs, metadata_scores)
        confidence_scores = model.get_confidence_score(image_probs, text_probs, metadata_scores)
        
        # Calculate metrics
        accuracy = (predictions == y_test).mean()
        roc_auc = roc_auc_score(y_test, probabilities[:, 1])
        cm = confusion_matrix(y_test, predictions)
        
        print("Ensemble Model Evaluation:")
        print(f"Accuracy: {accuracy:.4f}")
        print(f"ROC AUC: {roc_auc:.4f}")
        print("\nConfusion Matrix:")
        print(cm)
        print("\nClassification Report:")
        print(classification_report(y_test, predictions, target_names=['Authentic', 'Forged']))
        
        # Feature importance
        importance = model.get_feature_importance()
        if importance:
            print("\nFeature Importance:")
            for feature, score in importance.items():
                print(f"{feature}: {score:.4f}")
        
        return {
            'predictions': predictions,
            'probabilities': probabilities,
            'confidence_scores': confidence_scores,
            'accuracy': accuracy,
            'roc_auc': roc_auc,
            'confusion_matrix': cm,
            'feature_importance': importance
        }
