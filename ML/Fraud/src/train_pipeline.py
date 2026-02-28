"""
Main training pipeline for the hybrid fraud detection system.
Combines image CNN, text analysis, and metadata checks in an ensemble.
"""
import os
import numpy as np
from sklearn.model_selection import train_test_split

# Try importing torch components
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    import torchvision.transforms as transforms
    TORCH_AVAILABLE = True
except ImportError:
    print("Warning: PyTorch not available. Image model training will be skipped.")
    TORCH_AVAILABLE = False

from data_loader import CertificateDataLoader

# Conditional imports based on availability
IMAGE_MODEL_AVAILABLE = False
if TORCH_AVAILABLE:
    try:
        from image_model import CertificateImageModel, ImageModelTrainer
        from data_loader import CertificateDataset
        IMAGE_MODEL_AVAILABLE = True
    except ImportError as e:
        print(f"Warning: Image model not available: {e}")
        IMAGE_MODEL_AVAILABLE = False

from text_model import CertificateTextModel, TextModelEvaluator
from metadata_model import CertificateMetadataModel, MetadataModelEvaluator
from ensemble import CertificateEnsembleModel, EnsembleEvaluator
from utils import (
    calculate_class_weights, evaluate_model, 
    create_data_splits, analyze_per_forgery_type
)

from data_loader import CertificateDataLoader, CertificateDataset
from image_model import CertificateImageModel, ImageModelTrainer
from text_model import CertificateTextModel, TextModelEvaluator
from metadata_model import CertificateMetadataModel, MetadataModelEvaluator
from ensemble import CertificateEnsembleModel, EnsembleEvaluator
from utils import (
    augment_image, calculate_class_weights, evaluate_model, 
    create_data_splits, analyze_per_forgery_type, plot_confusion_matrix
)

class HybridFraudDetectionPipeline:
    def __init__(self, data_dir='data', models_dir='models'):
        self.data_dir = data_dir
        self.models_dir = models_dir
        
        # Check device availability
        if TORCH_AVAILABLE:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = None
        
        # Initialize models
        self.image_model = None
        self.text_model = None
        self.metadata_model = None
        self.ensemble_model = None
        
        # Data storage
        self.data_splits = None
        
        if TORCH_AVAILABLE:
            print(f"Using device: {self.device}")
        else:
            print("PyTorch not available - image model training will be skipped")

    def load_and_prepare_data(self):
        """Load and prepare all data for training"""
        print("Loading data...")
        
        # Load data using data loader
        data_loader = CertificateDataLoader(self.data_dir)
        images, texts, metadata, labels = data_loader.load_dataset()
        
        print(f"Loaded {len(images)} samples")
        print(f"Class distribution: {np.bincount(labels)}")
        
        # Create train/val/test splits
        self.data_splits = create_data_splits(images, texts, metadata, labels)
        
        return self.data_splits

    def train_image_model(self, epochs=50, batch_size=8):
        """Train the image CNN model"""
        if not TORCH_AVAILABLE or not IMAGE_MODEL_AVAILABLE:
            print("Skipping image model training - PyTorch or image model not available")
            return None, None
            
        print("\nTraining Image Model...")
        
        # Get data splits
        train_data = self.data_splits['train']
        val_data = self.data_splits['val']
        
        # Create datasets with augmentation for training
        train_transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        val_transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        train_dataset = CertificateDataset(train_data[0], train_data[3], transform=train_transform)
        val_dataset = CertificateDataset(val_data[0], val_data[3], transform=val_transform)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # Initialize model
        self.image_model = CertificateImageModel(backbone='resnet50', pretrained=True)
        trainer = ImageModelTrainer(self.image_model, self.device)
        
        # Calculate class weights
        class_weights = calculate_class_weights(train_data[3])
        weights = [class_weights[0], class_weights[1]]
        
        # Train model
        train_losses, val_losses = trainer.train(
            train_loader, val_loader, epochs=epochs, 
            focal_loss=True, class_weights=weights
        )
        
        # Save model
        os.makedirs(self.models_dir, exist_ok=True)
        torch.save(self.image_model.state_dict(), f'{self.models_dir}/image_model.pth')
        
        print("Image model training completed!")
        return train_losses, val_losses

    def train_text_model(self, use_bert=False):
        """Train the text analysis model"""
        print("\nTraining Text Model...")
        
        train_data = self.data_splits['train']
        val_data = self.data_splits['val']
        
        # Initialize and train text model
        self.text_model = CertificateTextModel(use_bert=use_bert)
        self.text_model.fit(train_data[1], train_data[3])
        
        # Evaluate on validation set
        val_results = TextModelEvaluator.evaluate_text_model(
            self.text_model, val_data[1], val_data[3]
        )
        
        # Save model
        self.text_model.save(f'{self.models_dir}/text_model.joblib')
        
        print("Text model training completed!")
        return val_results

    def train_metadata_model(self, use_isolation_forest=True):
        """Train the metadata analysis model"""
        print("\nTraining Metadata Model...")
        
        train_data = self.data_splits['train']
        val_data = self.data_splits['val']
        
        # Initialize and train metadata model
        self.metadata_model = CertificateMetadataModel(use_isolation_forest=use_isolation_forest)
        
        if use_isolation_forest:
            self.metadata_model.fit(train_data[2])
        else:
            self.metadata_model.fit(train_data[2], train_data[3])
        
        # Evaluate on validation set
        val_results = MetadataModelEvaluator.evaluate_metadata_model(
            self.metadata_model, val_data[2], val_data[3]
        )
        
        # Save model
        self.metadata_model.save(f'{self.models_dir}/metadata_model.joblib')
        
        print("Metadata model training completed!")
        return val_results

    def train_ensemble_model(self):
        """Train the ensemble meta-classifier"""
        print("\nTraining Ensemble Model...")
        
        train_data = self.data_splits['train']
        val_data = self.data_splits['val']
        
        # Get predictions from base models on training data
        print("Getting base model predictions...")
        
        # Image model predictions (if available)
        if self.image_model is not None and TORCH_AVAILABLE and IMAGE_MODEL_AVAILABLE:
            trainer = ImageModelTrainer(self.image_model, self.device)
            image_probs_train = trainer.predict(train_data[0])
            image_probs_val = trainer.predict(val_data[0])
        else:
            print("Image model not available - using dummy predictions")
            # Create dummy predictions (50/50 probability)
            n_train = len(train_data[0])
            n_val = len(val_data[0])
            image_probs_train = np.full((n_train, 2), 0.5)
            image_probs_val = np.full((n_val, 2), 0.5)
        
        # Text model predictions
        text_probs_train = self.text_model.predict_proba(train_data[1])
        text_probs_val = self.text_model.predict_proba(val_data[1])
        
        # Metadata model predictions
        meta_scores_train = self.metadata_model.anomaly_score(train_data[2])
        meta_scores_val = self.metadata_model.anomaly_score(val_data[2])
        
        # Train ensemble
        self.ensemble_model = CertificateEnsembleModel(meta_classifier='logistic')
        self.ensemble_model.fit(
            image_probs_train, text_probs_train, meta_scores_train, train_data[3]
        )
        
        # Evaluate ensemble on validation set
        val_results = EnsembleEvaluator.evaluate_ensemble(
            self.ensemble_model, image_probs_val, text_probs_val, meta_scores_val, val_data[3]
        )
        
        # Save ensemble model
        self.ensemble_model.save(f'{self.models_dir}/ensemble_model.joblib')
        
        print("Ensemble model training completed!")
        return val_results

    def evaluate_final_model(self):
        """Comprehensive evaluation on test set"""
        print("\n" + "="*50)
        print("FINAL MODEL EVALUATION ON TEST SET")
        print("="*50)
        
        test_data = self.data_splits['test']
        
        # Get predictions from all models
        trainer = ImageModelTrainer(self.image_model, self.device)
        image_probs_test = trainer.predict(test_data[0])
        text_probs_test = self.text_model.predict_proba(test_data[1])
        meta_scores_test = self.metadata_model.anomaly_score(test_data[2])
        
        # Ensemble predictions
        ensemble_preds = self.ensemble_model.predict(
            image_probs_test, text_probs_test, meta_scores_test
        )
        ensemble_probs = self.ensemble_model.predict_proba(
            image_probs_test, text_probs_test, meta_scores_test
        )
        
        # Comprehensive evaluation
        results = evaluate_model(
            test_data[3], ensemble_preds, ensemble_probs[:, 1], "Hybrid Ensemble"
        )
        
        # Per-forgery type analysis
        forgery_analysis = analyze_per_forgery_type(
            test_data[3], ensemble_preds, test_data[2]
        )
        
        # Plot confusion matrix
        plot_confusion_matrix(results['confusion_matrix'], title='Hybrid Model - Test Set')
        
        return results, forgery_analysis

    def run_full_pipeline(self, image_epochs=50, use_bert=False, use_isolation_forest=True):
        """Run the complete training pipeline"""
        print("Starting Hybrid Fraud Detection Training Pipeline")
        print("="*60)
        
        # Step 1: Load and prepare data
        self.load_and_prepare_data()
        
        # Step 2: Train individual models
        image_results = self.train_image_model(epochs=image_epochs)
        text_results = self.train_text_model(use_bert=use_bert)
        metadata_results = self.train_metadata_model(use_isolation_forest=use_isolation_forest)
        
        # Step 3: Train ensemble
        ensemble_results = self.train_ensemble_model()
        
        # Step 4: Final evaluation
        final_results, forgery_analysis = self.evaluate_final_model()
        
        print("\n" + "="*60)
        print("TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        return {
            'image_results': image_results,
            'text_results': text_results,
            'metadata_results': metadata_results,
            'ensemble_results': ensemble_results,
            'final_results': final_results,
            'forgery_analysis': forgery_analysis
        }

if __name__ == "__main__":
    # Run the training pipeline
    pipeline = HybridFraudDetectionPipeline()
    results = pipeline.run_full_pipeline(
        image_epochs=20,  # Reduced for demo
        use_bert=False,   # Use TF-IDF + XGBoost
        use_isolation_forest=True
    )
    
    print("\nTraining completed! Model artifacts saved in 'models/' directory.")