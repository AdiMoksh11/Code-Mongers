"""
Enhanced Training Pipeline for Synthetic Certificate Data
Trains on both images and metadata with deep learning models
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

# Try to import deep learning libraries with graceful fallback
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    from torchvision import transforms, models
    from PIL import Image
    PYTORCH_AVAILABLE = True
    print("✅ PyTorch available - will use CNN for image analysis")
except ImportError:
    PYTORCH_AVAILABLE = False
    print("⚠️  PyTorch not available - using metadata-only approach")

try:
    import cv2
    OPENCV_AVAILABLE = True
    print("✅ OpenCV available - will use advanced image preprocessing")
except ImportError:
    OPENCV_AVAILABLE = False
    print("⚠️  OpenCV not available - using basic image processing")

class CertificateDataset(Dataset):
    """Dataset class for certificate images and metadata"""
    
    def __init__(self, data_files, transform=None):
        self.data_files = data_files
        self.transform = transform
        
    def __len__(self):
        return len(self.data_files)
    
    def __getitem__(self, idx):
        file_info = self.data_files[idx]
        
        # Load image
        if PYTORCH_AVAILABLE:
            try:
                image = Image.open(file_info['image']).convert('RGB')
                if self.transform:
                    image = self.transform(image)
            except Exception as e:
                print(f"Error loading image {file_info['image']}: {e}")
                # Create dummy image if loading fails
                image = torch.zeros(3, 224, 224)
        else:
            image = np.zeros((224, 224, 3))  # Dummy image
        
        # Load metadata
        with open(file_info['metadata'], 'r') as f:
            metadata = json.load(f)
        
        # Extract features from metadata
        features = self.extract_metadata_features(metadata)
        
        # Label
        label = 1 if file_info['label'] == 'forged' else 0
        
        return {
            'image': image,
            'metadata_features': torch.FloatTensor(features) if PYTORCH_AVAILABLE else features,
            'label': label,
            'filename': file_info['image']
        }
    
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
        
        return features

class SimpleCNN(nn.Module):
    """Simple CNN for certificate image classification"""
    
    def __init__(self, num_classes=2):
        super(SimpleCNN, self).__init__()
        
        # Use pre-trained ResNet18 as backbone
        self.backbone = models.resnet18(pretrained=True)
        
        # Freeze early layers
        for param in list(self.backbone.parameters())[:-10]:
            param.requires_grad = False
        
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
        self.cnn = SimpleCNN(num_classes=256)  # Output 256 features
        
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
            nn.Linear(256 + 16, 128),  # CNN features + metadata features
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes)
        )
    
    def forward(self, image, metadata):
        # Get image features
        img_features = self.cnn.backbone(image)
        img_features = self.cnn.classifier[:-1](img_features)  # Remove final layer
        
        # Get metadata features
        meta_features = self.metadata_net(metadata)
        
        # Combine features
        combined = torch.cat([img_features, meta_features], dim=1)
        
        # Final classification
        return self.final_classifier(combined)

class EnhancedFraudDetector:
    """Enhanced fraud detector with image and metadata analysis"""
    
    def __init__(self, data_dir="../data_synthetic", model_dir="../models"):
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)
        
        self.device = torch.device('cuda' if torch.cuda.is_available() and PYTORCH_AVAILABLE else 'cpu')
        print(f"Using device: {self.device}")
        
        # Initialize models
        if PYTORCH_AVAILABLE:
            self.cnn_model = None
            self.hybrid_model = None
        
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
    
    def create_data_loaders(self, data_files, batch_size=16):
        """Create PyTorch data loaders"""
        
        # Define transforms
        train_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomRotation(10),
            transforms.RandomHorizontalFlip(0.3),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        val_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Split data
        train_files, val_files = train_test_split(data_files, test_size=0.2, 
                                                 random_state=42, stratify=[f['label'] for f in data_files])
        
        # Create datasets
        train_dataset = CertificateDataset(train_files, transform=train_transform)
        val_dataset = CertificateDataset(val_files, transform=val_transform)
        
        # Create data loaders
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, val_loader, train_files, val_files
    
    def train_metadata_model(self, data_files):
        """Train metadata-only model (always works)"""
        print("\n" + "="*60)
        print("Training Metadata-Only Model")
        print("="*60)
        
        # Extract features and labels
        features = []
        labels = []
        
        for file_info in data_files:
            with open(file_info['metadata'], 'r') as f:
                metadata = json.load(f)
            
            # Use the same feature extraction as the dataset
            dataset = CertificateDataset([file_info])
            feature_vector = dataset.extract_metadata_features(metadata)
            features.append(feature_vector)
            labels.append(1 if file_info['label'] == 'forged' else 0)
        
        X = np.array(features)
        y = np.array(labels)
        
        print(f"Features shape: {X.shape}")
        print(f"Labels distribution: {np.bincount(y)}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train anomaly detector
        anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        anomaly_detector.fit(X_train_scaled[y_train == 0])  # Fit only on authentic data
        
        # Get anomaly scores
        train_anomaly_scores = anomaly_detector.decision_function(X_train_scaled)
        test_anomaly_scores = anomaly_detector.decision_function(X_test_scaled)
        
        # Combine original features with anomaly scores
        X_train_enhanced = np.column_stack([X_train_scaled, train_anomaly_scores])
        X_test_enhanced = np.column_stack([X_test_scaled, test_anomaly_scores])
        
        # Train classifier
        classifier = LogisticRegression(random_state=42, class_weight='balanced')
        classifier.fit(X_train_enhanced, y_train)
        
        # Evaluate
        train_pred = classifier.predict(X_train_enhanced)
        test_pred = classifier.predict(X_test_enhanced)
        
        train_acc = accuracy_score(y_train, train_pred)
        test_acc = accuracy_score(y_test, test_pred)
        
        print(f"\nMetadata Model Results:")
        print(f"Training Accuracy: {train_acc:.4f}")
        print(f"Test Accuracy: {test_acc:.4f}")
        print(f"\nClassification Report:")
        print(classification_report(y_test, test_pred, target_names=['Authentic', 'Forged']))
        
        # Save models
        self.metadata_model = {
            'scaler': self.scaler,
            'anomaly_detector': anomaly_detector,
            'classifier': classifier
        }
        
        joblib.dump(self.metadata_model, self.model_dir / 'enhanced_metadata_model.joblib')
        print(f"Metadata model saved to: {self.model_dir / 'enhanced_metadata_model.joblib'}")
        
        return train_acc, test_acc
    
    def train_cnn_model(self, train_loader, val_loader, epochs=10):
        """Train CNN model if PyTorch is available"""
        if not PYTORCH_AVAILABLE:
            print("Skipping CNN training - PyTorch not available")
            return None, None
        
        print("\n" + "="*60)
        print("Training CNN Model")
        print("="*60)
        
        model = SimpleCNN().to(self.device)
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)
        
        best_val_acc = 0.0
        train_accuracies = []
        val_accuracies = []
        
        for epoch in range(epochs):
            # Training phase
            model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0
            
            for batch in train_loader:
                images = batch['image'].to(self.device)
                labels = batch['label'].to(self.device)
                
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                train_total += labels.size(0)
                train_correct += (predicted == labels).sum().item()
            
            train_acc = train_correct / train_total
            train_accuracies.append(train_acc)
            
            # Validation phase
            model.eval()
            val_correct = 0
            val_total = 0
            
            with torch.no_grad():
                for batch in val_loader:
                    images = batch['image'].to(self.device)
                    labels = batch['label'].to(self.device)
                    
                    outputs = model(images)
                    _, predicted = torch.max(outputs.data, 1)
                    val_total += labels.size(0)
                    val_correct += (predicted == labels).sum().item()
            
            val_acc = val_correct / val_total
            val_accuracies.append(val_acc)
            
            print(f'Epoch [{epoch+1}/{epochs}] - Train Acc: {train_acc:.4f}, Val Acc: {val_acc:.4f}')
            
            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                torch.save(model.state_dict(), self.model_dir / 'best_cnn_model.pth')
            
            scheduler.step()
        
        self.cnn_model = model
        print(f"Best CNN validation accuracy: {best_val_acc:.4f}")
        return train_accuracies, val_accuracies
    
    def train_hybrid_model(self, train_loader, val_loader, epochs=15):
        """Train hybrid model combining CNN and metadata"""
        if not PYTORCH_AVAILABLE:
            print("Skipping hybrid training - PyTorch not available")
            return None, None
        
        print("\n" + "="*60)
        print("Training Hybrid Model (CNN + Metadata)")
        print("="*60)
        
        model = HybridModel().to(self.device)
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.0005, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.3)
        
        best_val_acc = 0.0
        
        for epoch in range(epochs):
            # Training phase
            model.train()
            train_correct = 0
            train_total = 0
            
            for batch in train_loader:
                images = batch['image'].to(self.device)
                metadata = batch['metadata_features'].to(self.device)
                labels = batch['label'].to(self.device)
                
                optimizer.zero_grad()
                outputs = model(images, metadata)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                _, predicted = torch.max(outputs.data, 1)
                train_total += labels.size(0)
                train_correct += (predicted == labels).sum().item()
            
            train_acc = train_correct / train_total
            
            # Validation phase
            model.eval()
            val_correct = 0
            val_total = 0
            
            with torch.no_grad():
                for batch in val_loader:
                    images = batch['image'].to(self.device)
                    metadata = batch['metadata_features'].to(self.device)
                    labels = batch['label'].to(self.device)
                    
                    outputs = model(images, metadata)
                    _, predicted = torch.max(outputs.data, 1)
                    val_total += labels.size(0)
                    val_correct += (predicted == labels).sum().item()
            
            val_acc = val_correct / val_total
            
            print(f'Epoch [{epoch+1}/{epochs}] - Train Acc: {train_acc:.4f}, Val Acc: {val_acc:.4f}')
            
            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                torch.save(model.state_dict(), self.model_dir / 'best_hybrid_model.pth')
            
            scheduler.step()
        
        self.hybrid_model = model
        print(f"Best hybrid validation accuracy: {best_val_acc:.4f}")
        return best_val_acc
    
    def train_all_models(self):
        """Train all available models"""
        print("🚀 Starting Enhanced Training Pipeline")
        print("="*60)
        
        # Load dataset
        data_files = self.load_dataset()
        
        # Train metadata model (always works)
        metadata_train_acc, metadata_test_acc = self.train_metadata_model(data_files)
        
        results = {
            'metadata_train_acc': metadata_train_acc,
            'metadata_test_acc': metadata_test_acc
        }
        
        # Train deep learning models if available
        if PYTORCH_AVAILABLE and len(data_files) > 20:  # Need sufficient data
            try:
                train_loader, val_loader, train_files, val_files = self.create_data_loaders(data_files)
                
                # Train CNN model
                cnn_train_acc, cnn_val_acc = self.train_cnn_model(train_loader, val_loader)
                if cnn_train_acc:
                    results['cnn_train_acc'] = cnn_train_acc[-1]
                    results['cnn_val_acc'] = cnn_val_acc[-1]
                
                # Train hybrid model
                hybrid_val_acc = self.train_hybrid_model(train_loader, val_loader)
                if hybrid_val_acc:
                    results['hybrid_val_acc'] = hybrid_val_acc
                
            except Exception as e:
                print(f"Error in deep learning training: {e}")
                print("Continuing with metadata-only model...")
        
        # Save results
        results_file = self.model_dir / 'training_results.json'
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\n" + "="*60)
        print("🎉 Training Complete!")
        print("="*60)
        print("Final Results:")
        for model_name, accuracy in results.items():
            print(f"  {model_name}: {accuracy:.4f}")
        
        return results

if __name__ == "__main__":
    # Create trainer
    trainer = EnhancedFraudDetector()
    
    # Train all models
    results = trainer.train_all_models()