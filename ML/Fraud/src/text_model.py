"""
Text model: TF-IDF + XGBoost baseline, optional BERT fine-tuning.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import numpy as np

# Optional BERT imports (wrapped in try-except)
BERT_AVAILABLE = False
try:
    from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
    BERT_AVAILABLE = True
except ImportError:
    # BERT not available, will use TF-IDF + XGBoost only
    print("Note: BERT not available, using TF-IDF + XGBoost only")
    pass
except ValueError as e:
    # Handle Keras compatibility issues
    if "tf-keras" in str(e):
        print("Note: BERT not available due to TensorFlow/Keras compatibility issues")
        print("Using TF-IDF + XGBoost only. To enable BERT, install: pip install tf-keras")
    else:
        print(f"Note: BERT not available: {e}")
    pass

class CertificateTextModel:
    def __init__(self, use_bert=False):
        self.use_bert = use_bert and BERT_AVAILABLE
        
        if not self.use_bert:
            self.pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))),
                ('clf', XGBClassifier(
                    use_label_encoder=False, 
                    eval_metric='logloss',
                    n_estimators=100,
                    max_depth=6,
                    learning_rate=0.1,
                    subsample=0.8,
                    colsample_bytree=0.8
                ))
            ])
        else:
            self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
            self.model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)

    def fit(self, X, y):
        """Train the text model"""
        if not self.use_bert:
            # TF-IDF + XGBoost pipeline
            self.pipeline.fit(X, y)
            
            # Get feature importance from XGBoost
            tfidf = self.pipeline.named_steps['tfidf']
            clf = self.pipeline.named_steps['clf']
            feature_names = tfidf.get_feature_names_out()
            importance = clf.feature_importances_
            
            # Store top important features
            top_indices = np.argsort(importance)[-20:]
            self.top_features = [(feature_names[i], importance[i]) for i in top_indices]
            
        else:
            # BERT fine-tuning (placeholder implementation)
            print("BERT fine-tuning not fully implemented in this version")
            pass

    def predict_proba(self, X):
        """Predict probabilities for text samples"""
        if not self.use_bert:
            return self.pipeline.predict_proba(X)
        else:
            # BERT prediction (placeholder)
            return np.random.rand(len(X), 2)  # Placeholder

    def predict(self, X):
        """Predict labels for text samples"""
        if not self.use_bert:
            return self.pipeline.predict(X)
        else:
            # BERT prediction (placeholder)
            return np.random.randint(0, 2, len(X))  # Placeholder

    def get_feature_importance(self):
        """Get top important features"""
        if hasattr(self, 'top_features'):
            return self.top_features
        return []

    def save(self, path):
        """Save the trained model"""
        if not self.use_bert:
            joblib.dump(self.pipeline, path)
        else:
            self.model.save_pretrained(path)
            self.tokenizer.save_pretrained(path)

    def load(self, path):
        """Load a trained model"""
        if not self.use_bert:
            self.pipeline = joblib.load(path)
        else:
            self.model = BertForSequenceClassification.from_pretrained(path)
            self.tokenizer = BertTokenizer.from_pretrained(path)

class TextModelEvaluator:
    @staticmethod
    def evaluate_text_model(model, X_test, y_test):
        """Evaluate text model performance"""
        predictions = model.predict(X_test)
        probabilities = model.predict_proba(X_test)
        
        print("Text Model Classification Report:")
        print(classification_report(y_test, predictions, target_names=['Authentic', 'Forged']))
        
        return {
            'predictions': predictions,
            'probabilities': probabilities,
            'accuracy': (predictions == y_test).mean()
        }
