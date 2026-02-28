import pytesseract
from PIL import Image
import os

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

cert_files = [
    'coursera.png',
    'nptel.png',
    'simplilearn.webp',
    'udemy.jpg',
    'upgrad.webp'
]

with open('all_cert_texts.txt', 'w', encoding='utf-8') as f:
    for cert in cert_files:
        if os.path.exists(cert):
            try:
                img = Image.open(cert)
                text = pytesseract.image_to_string(img)
                f.write(f"--- {cert} ---\n{text}\n\n")
                print(f"Extracted text from {cert}")
            except Exception as e:
                f.write(f"--- {cert} ---\nError: {e}\n\n")
                print(f"Error reading {cert}: {e}")
        else:
            f.write(f"--- {cert} ---\nFile not found\n\n")
            print(f"File not found: {cert}")
print("\n✅ All certificate texts saved to all_cert_texts.txt")