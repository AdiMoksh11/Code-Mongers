import os
import re
import json
from flask import Flask, request, jsonify, send_from_directory
from PIL import Image
import pytesseract
from datetime import datetime

app = Flask(__name__)

# Set Tesseract executable path
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\Aditya\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

# ------------------- Tesseract Configuration -------------------
def configure_tesseract():
    tesseract_cmd = os.environ.get('TESSERACT_CMD')
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        print(f"Using Tesseract from environment: {tesseract_cmd}")
        return

    system = os.name.lower()
    if system == 'nt':  # Windows
        possible_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME', '')),
        ]
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                print(f"Found Tesseract at: {path}")
                return

configure_tesseract()

# ------------------- Load Extraction Rules -------------------
with open('extraction_rules.json', 'r', encoding='utf-8') as f:
    extraction_rules = json.load(f)

# ------------------- Helper Functions -------------------
def format_date(date_str):
    if not date_str:
        return ''
    for fmt in [
        '%d-%m-%Y', '%d/%m/%Y', '%d %b %Y', '%d %B %Y', '%b-%b %Y', 
        '%b. %d, %Y', '%dth %B %Y', '%d %B, %Y', '%d %b, %Y'
    ]:
        try:
            return datetime.strptime(date_str, fmt).strftime('%d/%m/%y')
        except:
            continue
    year_match = re.search(r'(\d{4})', date_str)
    if year_match:
        return year_match.group(1)
    return date_str

def extract_info(text, platform_hint=None):
    text_lower = text.lower()
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    platform = None

    if platform_hint:
        platform_hint_lower = platform_hint.lower()
        if platform_hint_lower in extraction_rules:
            platform = platform_hint_lower

    if not platform:
        for key in extraction_rules:
            if key in text_lower:
                platform = key
                break

    if not platform:
        if 'udemy' in text_lower or 'vaemy' in text_lower or '#beable' in text_lower:
            platform = 'udemy'
        else:
            return {'issuer': 'Unknown', 'name': '', 'title': '', 'issueDate': ''}

    rule = extraction_rules.get(platform, {})
    name, title, issueDate = '', '', ''

    # Simplified logic for demonstration (can expand per platform)
    if platform == 'coursera':
        idx = next((i for i, l in enumerate(lines) if 'has' in l and 'completed' in l), None)
        if idx:
            name = lines[idx-1] if idx > 0 else ''
            title = lines[idx+1] if idx+1 < len(lines) else ''
        platform = 'Coursera'
    elif platform == 'udemy':
        idx = next((i for i, l in enumerate(lines) if 'this is to certify that' in l.lower()), None)
        if idx and idx+1 < len(lines):
            name = lines[idx+1]
        title = " ".join(lines[idx+2:idx+5]) if idx else ''
        platform = 'Udemy'
    else:
        platform = platform.capitalize()

    if issueDate:
        issueDate = format_date(issueDate)
    return {
        'issuer': platform,
        'name': name,
        'title': title,
        'issueDate': issueDate,
        'type': 'certificate',
        'status': 'pending'
    }

# ------------------- Routes -------------------
@app.route('/')
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Certificate Extraction Service', 'version': '1.0.0'})

@app.route('/cert_extractor.html')
def serve_html():
    return send_from_directory('.', 'cert_extractor.html')

# Original extract route
@app.route('/extract', methods=['POST'])
def extract():
    if 'certificateFile' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400

    file = request.files['certificateFile']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400

    platform_hint = request.form.get('platform', None)
    try:
        img = Image.open(file.stream)
        text = pytesseract.image_to_string(img)
        info = extract_info(text, platform_hint)
        return jsonify({'success': True, 'extracted': info, 'message': 'Certificate information extracted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error processing image: {str(e)}'}), 500

# Frontend-compatible route
@app.route('/api/certificates/analyze-image', methods=['POST'])
def analyze_image():
    # Match frontend FormData key
    if 'certificate' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400

    file = request.files['certificate']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400

    platform_hint = request.form.get('platform', None)
    try:
        img = Image.open(file.stream)
        text = pytesseract.image_to_string(img)
        info = extract_info(text, platform_hint)
        return jsonify({'success': True, 'data': info, 'message': 'Certificate information extracted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error processing image: {str(e)}'}), 500

# ------------------- Start Server -------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    print(f"Starting Certificate Extraction Service on port {port}")
    print(f"Debug mode: {debug}")
    print(f"Tesseract command: {pytesseract.pytesseract.tesseract_cmd}")
    app.run(host='0.0.0.0', port=port, debug=debug)