#!/usr/bin/env python
import os
import sys
import shutil
import argparse
import time
import cv2
import numpy as np
import json

# Ensure repo root is in sys.path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

from test import Model, forensics_test, rm_and_make_dir, merge

def calculate_fraud_metrics(output_image_path):
    """
    Calculate fraud detection metrics from the forensics output image.
    Returns fraud percentage and confidence level.
    """
    try:
        # Read the forensics output image
        img = cv2.imread(output_image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return None
        
        # Calculate total pixels
        total_pixels = img.shape[0] * img.shape[1]
        
        # Count tampered pixels (bright regions in the forensics output)
        # The model outputs bright regions for tampered areas
        threshold = 127  # Threshold for detecting tampering
        tampered_mask = img > threshold
        tampered_pixels = np.sum(tampered_mask)
        
        # Calculate fraud percentage
        fraud_percentage = (tampered_pixels / total_pixels) * 100
        
        # Calculate confidence based on intensity distribution
        tampered_intensities = img[tampered_mask]
        if len(tampered_intensities) > 0:
            avg_intensity = np.mean(tampered_intensities)
            max_intensity = np.max(tampered_intensities)
            # Confidence based on how bright the tampered regions are
            confidence = min(100, (avg_intensity / 255.0) * 100)
        else:
            confidence = 95  # High confidence if no tampering detected
        
        # Determine classification
        if fraud_percentage < 1.0:
            classification = "AUTHENTIC"
            authenticity_score = 100 - fraud_percentage
        elif fraud_percentage < 5.0:
            classification = "POSSIBLY_TAMPERED"
            authenticity_score = 100 - fraud_percentage
        else:
            classification = "TAMPERED"
            authenticity_score = max(0, 100 - fraud_percentage)
        
        return {
            "fraud_percentage": round(fraud_percentage, 2),
            "authenticity_score": round(authenticity_score, 2),
            "confidence": round(confidence, 2),
            "classification": classification,
            "tampered_pixels": int(tampered_pixels),
            "total_pixels": int(total_pixels),
            "analysis": {
                "avg_tamper_intensity": round(float(np.mean(tampered_intensities)), 2) if len(tampered_intensities) > 0 else 0,
                "max_tamper_intensity": round(float(np.max(tampered_intensities)), 2) if len(tampered_intensities) > 0 else 0,
                "tampered_regions": int(len(tampered_intensities))
            }
        }
    except Exception as e:
        print(f"Error calculating fraud metrics: {e}", file=sys.stderr)
        return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to input image')
    args = parser.parse_args()

    src = args.image
    # Prepare input directory
    input_dir = os.path.join(ROOT, 'data', 'input')
    rm_and_make_dir(input_dir)

    # Copy the image into data/input
    base = os.path.basename(src)
    dst = os.path.join(input_dir, base)
    shutil.copyfile(src, dst)

    # Load model and run forensics_test
    model = Model()
    model.load()
    model.eval()

    # Run inference
    forensics_test(model)

    # Output image should be in data/output/<basename_without_ext>.png
    name_noext = os.path.splitext(base)[0]
    out_path = os.path.join(ROOT, 'data', 'output', name_noext + '.png')

    # Wait briefly for file to appear
    timeout = 10
    waited = 0
    while not os.path.exists(out_path) and waited < timeout:
        time.sleep(0.5)
        waited += 0.5

    if not os.path.exists(out_path):
        print('ERROR: output not found', file=sys.stderr)
        sys.exit(2)

    # Calculate fraud detection metrics
    metrics = calculate_fraud_metrics(out_path)
    
    # Create results JSON file
    results_path = os.path.join(ROOT, 'data', 'output', name_noext + '_results.json')
    if metrics:
        with open(results_path, 'w') as f:
            json.dump(metrics, f, indent=2)

    # Print results in JSON format for the backend to parse
    result_data = {
        "output_image": out_path,
        "results_file": results_path,
        "metrics": metrics
    }
    
    print(json.dumps(result_data))

if __name__ == '__main__':
    main()