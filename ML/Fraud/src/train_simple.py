"""
Simplified training script that works with minimal dependencies.
Trains text and metadata models without requiring PyTorch/transformers.
"""
import os
import sys
import numpy as np
from sklearn.model_selection import train_test_split

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from data_loader import CertificateDataLoader
from text_model import CertificateTextModel, TextModelEvaluator
from metadata_model import CertificateMetadataModel, MetadataModelEvaluator
from ensemble import CertificateEnsembleModel, EnsembleEvaluator
from utils import calculate_class_weights, evaluate_model, create_data_splits

def main():
    print("Starting Simplified Fraud Detection Training")
    print("=" * 50)
    
    # Initialize data loader
    data_dir = '../data'
    models_dir = '../models'
    
    # Create models directory
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"Loading data from {data_dir}...")
    
    # Check if data directory exists
    if not os.path.exists(data_dir):
        print(f"Data directory {data_dir} not found!")
        return
        
    # List files in data directory for debugging
    data_files = os.listdir(data_dir)
    print(f"Files in data directory: {data_files}")
    
    data_loader = CertificateDataLoader(data_dir)
    images, texts, metadata, labels = data_loader.load_dataset()
    
    if len(images) == 0:
        print("No data found! Make sure sample data exists in the data/ directory.")
        return
    
    print(f"Loaded {len(images)} samples")
    print(f"Class distribution: {np.bincount(labels)}")
    
    # Create train/val/test splits
    data_splits = create_data_splits(images, texts, metadata, labels)
    train_data = data_splits['train']
    val_data = data_splits['val']
    test_data = data_splits['test']
    
    print(f"Train: {len(train_data[0])} samples")
    print(f"Validation: {len(val_data[0])} samples") 
    print(f"Test: {len(test_data[0])} samples")
    
    # Train text model
    print("\n" + "=" * 30)
    print("Training Text Model...")
    print("=" * 30)
    
    text_model = CertificateTextModel(use_bert=False)
    text_model.fit(train_data[1], train_data[3])
    
    # Evaluate text model
    val_results = TextModelEvaluator.evaluate_text_model(
        text_model, val_data[1], val_data[3]
    )
    
    # Save text model
    text_model.save(f'{models_dir}/text_model.joblib')
    print("Text model saved!")
    
    # Train metadata model
    print("\n" + "=" * 30)
    print("Training Metadata Model...")
    print("=" * 30)
    
    metadata_model = CertificateMetadataModel(use_isolation_forest=True)
    metadata_model.fit(train_data[2], train_data[3])
    
    # Evaluate metadata model
    metadata_results = MetadataModelEvaluator.evaluate_metadata_model(
        metadata_model, val_data[2], val_data[3]
    )
    
    # Save metadata model
    metadata_model.save(f'{models_dir}/metadata_model.joblib')
    print("Metadata model saved!")
    
    # Train ensemble model
    print("\n" + "=" * 30)
    print("Training Ensemble Model...")
    print("=" * 30)
    
    # Get predictions from base models
    print("Getting predictions from base models...")
    
    # Use dummy image predictions (50/50)
    n_train = len(train_data[0])
    n_val = len(val_data[0])
    n_test = len(test_data[0])
    
    image_probs_train = np.full((n_train, 2), 0.5)
    image_probs_val = np.full((n_val, 2), 0.5)
    image_probs_test = np.full((n_test, 2), 0.5)
    
    # Text model predictions
    text_probs_train = text_model.predict_proba(train_data[1])
    text_probs_val = text_model.predict_proba(val_data[1])
    text_probs_test = text_model.predict_proba(test_data[1])
    
    # Metadata model predictions
    meta_scores_train = metadata_model.anomaly_score(train_data[2])
    meta_scores_val = metadata_model.anomaly_score(val_data[2])
    meta_scores_test = metadata_model.anomaly_score(test_data[2])
    
    # Train ensemble
    ensemble_model = CertificateEnsembleModel(meta_classifier='logistic')
    ensemble_model.fit(
        image_probs_train, text_probs_train, meta_scores_train, train_data[3]
    )
    
    # Evaluate ensemble on validation set
    ensemble_results = EnsembleEvaluator.evaluate_ensemble(
        ensemble_model, image_probs_val, text_probs_val, meta_scores_val, val_data[3]
    )
    
    # Save ensemble model
    ensemble_model.save(f'{models_dir}/ensemble_model.joblib')
    print("Ensemble model saved!")
    
    # Final evaluation on test set
    print("\n" + "=" * 50)
    print("FINAL EVALUATION ON TEST SET")
    print("=" * 50)
    
    # Get ensemble predictions on test set
    test_preds = ensemble_model.predict(
        image_probs_test, text_probs_test, meta_scores_test
    )
    test_probs = ensemble_model.predict_proba(
        image_probs_test, text_probs_test, meta_scores_test
    )
    
    # Evaluate final performance
    final_results = evaluate_model(
        test_data[3], test_preds, test_probs[:, 1], "Hybrid Ensemble (Test Set)"
    )
    
    print("\n" + "=" * 50)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 50)
    print(f"Models saved in: {models_dir}/")
    print("- text_model.joblib")
    print("- metadata_model.joblib") 
    print("- ensemble_model.joblib")
    print("\nNote: Image model training was skipped (requires PyTorch)")
    print("The ensemble uses dummy image predictions for now.")
    print("\nTo use the trained models:")
    print("1. Run inference: python ../scripts/predict.py ../data/sample.jpg")
    print("2. Start API server: python ../app/main.py")

if __name__ == "__main__":
    main()