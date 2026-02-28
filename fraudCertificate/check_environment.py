#!/usr/bin/env python3
"""
Production readiness check for ML fraud detection
"""
import sys
import os
import json

def check_environment():
    """Check if the ML environment is properly set up"""
    issues = []
    
    # Check Python version
    if sys.version_info < (3, 8):
        issues.append(f"Python version {sys.version} is too old. Need 3.8+")
    
    # Check required packages
    required_packages = [
        'torch', 'torchvision', 'PIL', 'numpy', 'cv2'
    ]
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            issues.append(f"Missing required package: {package}")
    
    # Check model file
    model_path = os.path.join(os.path.dirname(__file__), 'weights', 'detector_weights.pth')
    if not os.path.exists(model_path):
        issues.append(f"Model file not found: {model_path}")
    else:
        # Check file size (should be ~516MB)
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        if size_mb < 500:
            issues.append(f"Model file too small ({size_mb:.1f}MB). Expected ~516MB. Git LFS issue?")
    
    return issues

if __name__ == "__main__":
    issues = check_environment()
    
    result = {
        "ready": len(issues) == 0,
        "issues": issues,
        "python_version": sys.version,
        "working_directory": os.getcwd()
    }
    
    print(json.dumps(result, indent=2))
    
    if issues:
        sys.exit(1)
    else:
        print("\n✅ Environment is ready for ML fraud detection!")
        sys.exit(0)