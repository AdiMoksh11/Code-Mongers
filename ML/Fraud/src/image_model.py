"""
Image model: EfficientNet/ResNet50 binary classifier with Grad-CAM visualization.
"""
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.models as models
import torchvision.transforms as T
import numpy as np
import cv2
from torch.utils.data import DataLoader

class CertificateImageModel(nn.Module):
    def __init__(self, backbone='resnet50', pretrained=True):
        super().__init__()
        self.backbone = backbone
        if backbone == 'resnet50':
            self.model = models.resnet50(pretrained=pretrained)
            self.model.fc = nn.Linear(self.model.fc.in_features, 2)
            self.feature_layer = self.model.layer4
        elif backbone == 'efficientnet_b0':
            self.model = models.efficientnet_b0(pretrained=pretrained)
            self.model.classifier[1] = nn.Linear(self.model.classifier[1].in_features, 2)
            self.feature_layer = self.model.features[-1]
        else:
            raise ValueError('Unsupported backbone')
        
        self.gradients = None
        self.activations = None

    def forward(self, x):
        return self.model(x)

    def register_hooks(self):
        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0]
        
        def forward_hook(module, input, output):
            self.activations = output

        self.feature_layer.register_forward_hook(forward_hook)
        self.feature_layer.register_backward_hook(backward_hook)

    def generate_gradcam(self, input_image, target_class):
        """Generate Grad-CAM heatmap"""
        self.register_hooks()
        
        # Forward pass
        output = self.forward(input_image)
        
        # Backward pass
        self.model.zero_grad()
        output[0, target_class].backward()
        
        # Generate heatmap
        gradients = self.gradients[0].cpu().data.numpy()
        activations = self.activations[0].cpu().data.numpy()
        
        weights = np.mean(gradients, axis=(1, 2))
        heatmap = np.zeros(activations.shape[1:], dtype=np.float32)
        
        for i, w in enumerate(weights):
            heatmap += w * activations[i]
        
        heatmap = np.maximum(heatmap, 0)
        heatmap = heatmap / heatmap.max()
        
        return heatmap

class ImageModelTrainer:
    def __init__(self, model, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.Adam(model.parameters(), lr=0.001)
        self.scheduler = optim.lr_scheduler.StepLR(self.optimizer, step_size=10, gamma=0.1)

    def train(self, train_loader, val_loader, epochs=50, focal_loss=True, class_weights=None):
        """Train the image model with focal loss and class weighting"""
        from src.utils import FocalLoss
        
        if focal_loss:
            criterion = FocalLoss(alpha=1, gamma=2)
        else:
            if class_weights:
                criterion = nn.CrossEntropyLoss(weight=torch.tensor(class_weights).to(self.device))
            else:
                criterion = nn.CrossEntropyLoss()

        best_val_acc = 0
        train_losses, val_losses = [], []

        for epoch in range(epochs):
            # Training phase
            self.model.train()
            running_loss = 0.0
            correct = 0
            total = 0

            for images, labels in train_loader:
                images, labels = images.to(self.device), labels.to(self.device)

                self.optimizer.zero_grad()
                outputs = self.model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                self.optimizer.step()

                running_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

            train_acc = 100 * correct / total
            train_loss = running_loss / len(train_loader)
            train_losses.append(train_loss)

            # Validation phase
            self.model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0

            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(self.device), labels.to(self.device)
                    outputs = self.model(images)
                    loss = criterion(outputs, labels)

                    val_loss += loss.item()
                    _, predicted = torch.max(outputs, 1)
                    val_total += labels.size(0)
                    val_correct += (predicted == labels).sum().item()

            val_acc = 100 * val_correct / val_total
            val_loss = val_loss / len(val_loader)
            val_losses.append(val_loss)

            if val_acc > best_val_acc:
                best_val_acc = val_acc
                torch.save(self.model.state_dict(), 'models/image_model.pth')

            self.scheduler.step()

            if epoch % 10 == 0:
                print(f'Epoch {epoch}/{epochs}: Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%')

        return train_losses, val_losses

    def predict(self, images):
        """Predict probabilities for images"""
        self.model.eval()
        probabilities = []
        
        with torch.no_grad():
            for image in images:
                if isinstance(image, np.ndarray):
                    image = torch.from_numpy(image).unsqueeze(0).to(self.device)
                
                output = self.model(image)
                prob = torch.softmax(output, dim=1)
                probabilities.append(prob.cpu().numpy())
        
        return np.vstack(probabilities)
