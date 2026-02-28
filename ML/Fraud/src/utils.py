"""
Utility functions: data augmentation, focal loss, class weighting, evaluation metrics.
"""
import cv2
import numpy as np
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.utils.class_weight import compute_class_weight

# Optional imports
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    PLOTTING_AVAILABLE = True
except ImportError:
    print("Warning: Matplotlib/Seaborn not available - plotting functions disabled")
    PLOTTING_AVAILABLE = False

# Data augmentation functions

def augment_image(image, augmentation_type='random'):
    """
    Apply data augmentation to images
    Args:
        image: input image (numpy array)
        augmentation_type: 'rotation', 'brightness', 'logo_overlay', 'compression', 'random'
    """
    if augmentation_type == 'random':
        augmentation_type = np.random.choice(['rotation', 'brightness', 'compression'])
    
    if augmentation_type == 'rotation':
        return _apply_rotation(image)
    elif augmentation_type == 'brightness':
        return _apply_brightness(image)
    elif augmentation_type == 'logo_overlay':
        return _apply_logo_overlay(image)
    elif augmentation_type == 'compression':
        return _apply_jpeg_compression(image)
    else:
        return image

def _apply_rotation(image):
    """Apply random rotation (-15 to 15 degrees)"""
    rows, cols = image.shape[:2]
    angle = np.random.uniform(-15, 15)
    M = cv2.getRotationMatrix2D((cols/2, rows/2), angle, 1)
    return cv2.warpAffine(image, M, (cols, rows))

def _apply_brightness(image):
    """Apply random brightness and contrast adjustment"""
    alpha = np.random.uniform(0.8, 1.2)  # Contrast
    beta = np.random.uniform(-10, 10)    # Brightness
    return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

def _apply_logo_overlay(image):
    """Apply fake logo overlay (simple rectangle for demo)"""
    h, w = image.shape[:2]
    # Random position and size for fake logo
    x = np.random.randint(0, w//2)
    y = np.random.randint(0, h//2)
    logo_w = np.random.randint(20, w//4)
    logo_h = np.random.randint(10, h//4)
    
    # Add semi-transparent rectangle
    overlay = image.copy()
    cv2.rectangle(overlay, (x, y), (x + logo_w, y + logo_h), (0, 255, 255), -1)
    alpha = 0.3
    return cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0)

def _apply_jpeg_compression(image, quality=None):
    """Apply JPEG compression artifacts"""
    if quality is None:
        quality = np.random.randint(30, 80)
    
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, encoded = cv2.imencode('.jpg', image, encode_param)
    return cv2.imdecode(encoded, cv2.IMREAD_COLOR)

# Loss functions

if TORCH_AVAILABLE:
    class FocalLoss(nn.Module):
        def __init__(self, alpha=1, gamma=2, reduction='mean'):
            super().__init__()
            self.alpha = alpha
            self.gamma = gamma
            self.reduction = reduction
            
        def forward(self, inputs, targets):
            BCE_loss = nn.CrossEntropyLoss(reduction='none')(inputs, targets)
            pt = torch.exp(-BCE_loss)
            focal_loss = self.alpha * (1 - pt) ** self.gamma * BCE_loss
            
            if self.reduction == 'mean':
                return focal_loss.mean()
            elif self.reduction == 'sum':
                return focal_loss.sum()
            else:
                return focal_loss
else:
    # Dummy class when PyTorch is not available
    class FocalLoss:
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch not available - FocalLoss cannot be used")

# Class weight calculation

def calculate_class_weights(labels):
    """Calculate class weights for imbalanced datasets"""
    classes = np.unique(labels)
    weights = compute_class_weight('balanced', classes=classes, y=labels)
    return dict(zip(classes, weights))

# Evaluation functions

def evaluate_model(y_true, y_pred, y_prob=None, model_name="Model"):
    """Comprehensive model evaluation"""
    results = {}
    
    # Basic metrics
    results['accuracy'] = (y_pred == y_true).mean()
    results['precision'] = precision_score(y_true, y_pred)
    results['recall'] = recall_score(y_true, y_pred)
    results['f1'] = f1_score(y_true, y_pred)
    
    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    results['confusion_matrix'] = cm
    
    # ROC AUC if probabilities provided
    if y_prob is not None:
        results['roc_auc'] = roc_auc_score(y_true, y_prob)
    
    # Calculate false negative rate (important for fraud detection)
    tn, fp, fn, tp = cm.ravel()
    results['false_negative_rate'] = fn / (fn + tp) if (fn + tp) > 0 else 0
    results['false_positive_rate'] = fp / (fp + tn) if (fp + tn) > 0 else 0
    
    # Print results
    print(f"\n{model_name} Evaluation:")
    print(f"Accuracy: {results['accuracy']:.4f}")
    print(f"Precision: {results['precision']:.4f}")
    print(f"Recall: {results['recall']:.4f}")
    print(f"F1-Score: {results['f1']:.4f}")
    if y_prob is not None:
        print(f"ROC AUC: {results['roc_auc']:.4f}")
    print(f"False Negative Rate: {results['false_negative_rate']:.4f}")
    print(f"False Positive Rate: {results['false_positive_rate']:.4f}")
    
    return results

def plot_confusion_matrix(cm, class_names=['Authentic', 'Forged'], title='Confusion Matrix'):
    """Plot confusion matrix"""
    if not PLOTTING_AVAILABLE:
        print("Plotting not available - skipping confusion matrix plot")
        return
        
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=class_names, yticklabels=class_names)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.show()

def analyze_per_forgery_type(y_true, y_pred, metadata_list):
    """Analyze performance by forgery type based on metadata"""
    forgery_types = {}
    
    for i, (true_label, pred_label, metadata) in enumerate(zip(y_true, y_pred, metadata_list)):
        if true_label == 1:  # Only for forged certificates
            # Determine forgery type based on metadata
            forgery_type = "unknown"
            
            if metadata.get('producer_mismatch', False) and metadata.get('unusual_editor', False):
                forgery_type = "metadata_manipulation"
            elif metadata.get('creation_date_delta', 0) > 365:
                forgery_type = "date_forgery"
            elif any(keyword in metadata.get('issuer', '').lower() 
                    for keyword in ['fake', 'counterfeit', 'bogus']):
                forgery_type = "fake_issuer"
            else:
                forgery_type = "visual_tampering"
            
            if forgery_type not in forgery_types:
                forgery_types[forgery_type] = {'correct': 0, 'total': 0}
            
            forgery_types[forgery_type]['total'] += 1
            if pred_label == true_label:
                forgery_types[forgery_type]['correct'] += 1
    
    # Calculate accuracy per forgery type
    print("\nPer-Forgery Type Analysis:")
    for forgery_type, stats in forgery_types.items():
        accuracy = stats['correct'] / stats['total'] if stats['total'] > 0 else 0
        print(f"{forgery_type}: {accuracy:.4f} ({stats['correct']}/{stats['total']})")
    
    return forgery_types

# Training utilities

def create_data_splits(images, texts, metadata, labels, test_size=0.2, val_size=0.1):
    """Create train/validation/test splits"""
    from sklearn.model_selection import train_test_split
    
    # First split: train+val vs test
    X_temp = list(zip(images, texts, metadata))
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X_temp, labels, test_size=test_size, random_state=42, stratify=labels
    )
    
    # Second split: train vs val
    val_size_adjusted = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=val_size_adjusted, random_state=42, stratify=y_trainval
    )
    
    # Unzip the data
    images_train, texts_train, metadata_train = zip(*X_train)
    images_val, texts_val, metadata_val = zip(*X_val)
    images_test, texts_test, metadata_test = zip(*X_test)
    
    return {
        'train': (list(images_train), list(texts_train), list(metadata_train), y_train),
        'val': (list(images_val), list(texts_val), list(metadata_val), y_val),
        'test': (list(images_test), list(texts_test), list(metadata_test), y_test)
    }
