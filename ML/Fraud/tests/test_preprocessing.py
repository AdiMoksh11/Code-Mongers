"""
Unit tests for preprocessing functions in utils.py and data_loader.py
"""
import unittest
import numpy as np
import cv2
from src.utils import augment_image
from src.data_loader import CertificateDataLoader

class TestPreprocessing(unittest.TestCase):
    def test_augment_image(self):
        img = np.ones((100, 100, 3), dtype=np.uint8) * 255
        aug = augment_image(img)
        self.assertEqual(aug.shape, img.shape)

    def test_ocr_fallback(self):
        loader = CertificateDataLoader('.', '.')
        img = np.ones((100, 100, 3), dtype=np.uint8) * 255
        text = loader.extract_ocr(img)
        self.assertIsInstance(text, str)

if __name__ == '__main__':
    unittest.main()
