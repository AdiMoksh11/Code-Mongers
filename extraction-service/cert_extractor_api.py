import os
import re
import json
import platform
from flask import Flask, request, jsonify, send_from_directory
from PIL import Image
import pytesseract
from datetime import datetime

app = Flask(__name__)

# Configure Tesseract path based on environment
def configure_tesseract():
    # Check if explicitly set in environment variable
    tesseract_cmd = os.environ.get('TESSERACT_CMD')
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        print(f"Using Tesseract from environment: {tesseract_cmd}")
        return
    
    # Auto-detect common installation paths
    import platform
    system = platform.system().lower()
    
    if system == 'windows':
        # Common Windows paths
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
    elif system == 'linux':
        # Common Linux paths
        possible_paths = [
            '/usr/bin/tesseract',
            '/usr/local/bin/tesseract',
        ]
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                print(f"Found Tesseract at: {path}")
                return
    elif system == 'darwin':  # macOS
        # Common macOS paths
        possible_paths = [
            '/usr/local/bin/tesseract',
            '/opt/homebrew/bin/tesseract',
        ]
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                print(f"Found Tesseract at: {path}")
                return
    
    # If nothing found, try PATH lookup
    try:
        # Test if tesseract is available in PATH
        result = pytesseract.image_to_string(Image.new('RGB', (1, 1), color='white'))
        print("Tesseract found in PATH")
    except Exception as e:
        print(f"Warning: Tesseract not found. Error: {e}")
        print("Please install tesseract and ensure it's in your PATH, or set TESSERACT_CMD environment variable")

# Configure Tesseract on startup
configure_tesseract()

# Load extraction rules
with open('extraction_rules.json', 'r', encoding='utf-8') as f:
    extraction_rules = json.load(f)

# Helper functions for extraction

def format_date(date_str):
    if not date_str:
        return ''
    # Try common formats
    for fmt in [
        '%d-%m-%Y', '%d/%m/%Y', '%d %b %Y', '%d %B %Y', '%b-%b %Y', '%b. %d, %Y', '%dth %B %Y', '%d %B, %Y', '%d %b, %Y'
    ]:
        try:
            # Convert to dd/mm/yy format for UI
            return datetime.strptime(date_str, fmt).strftime('%d/%m/%y')
        except Exception:
            continue
    # Try extracting year if nothing else
    year_match = re.search(r'(\d{4})', date_str)
    if year_match:
        return year_match.group(1)
    return date_str

def extract_info(text, platform_hint=None):
    text_lower = text.lower()
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    platform = None
    
    # If platform hint is provided, try to use it first
    if platform_hint:
        platform_hint_lower = platform_hint.lower()
        # Check if the hint matches our extraction rules
        if platform_hint_lower in extraction_rules:
            platform = platform_hint_lower
        elif platform_hint_lower == 'coursera' and 'coursera' in extraction_rules:
            platform = 'coursera'
    
    # If no platform from hint, try extraction_rules keys in text
    if not platform:
        for key in extraction_rules:
            if key in text_lower:
                platform = key
                break
    
    # If not found, check for Udemy OCR errors
    if not platform:
        if 'udemy' in text_lower or 'vaemy' in text_lower or '#beable' in text_lower:
            platform = 'udemy'
        else:
            return {'issuer': 'Unknown', 'name': '', 'title': '', 'issueDate': ''}
    rule = extraction_rules.get(platform, {})
    name = ''
    title = ''  # course will be mapped to title
    issueDate = ''  # date will be mapped to issueDate
    if platform == 'coursera':
        # Find the line containing 'has sccesflly completed' (OCR typo tolerant)
        idx = next((i for i, l in enumerate(lines) if 'has' in l.lower() and 'completed' in l.lower()), None)
        if idx is not None:
            # Name is the line before
            name = lines[idx-1] if idx > 0 else ''
            # Course is the line after
            title = lines[idx+1] if idx+1 < len(lines) else ''
        # Platform is always 'Coursera'
        platform = 'Coursera'
        issueDate = ''  # No date in Coursera sample
    elif platform == 'nptel':
        # Find the line containing 'This certificate is awarded to'
        idx = next((i for i, l in enumerate(lines) if 'certificate is awarded to' in l.lower()), None)
        if idx is not None and idx+1 < len(lines):
            name = lines[idx+1]
        # Find the line containing 'for successfully completing the course'
        idx2 = next((i for i, l in enumerate(lines) if 'completing the course' in l.lower()), None)
        if idx2 is not None and idx2+1 < len(lines):
            title = lines[idx2+1]
        # Find the line containing the date pattern (e.g., Jan-Apr 2019)
        date_line = next((l for l in lines if re.search(r'[A-Za-z]{3}-[A-Za-z]{3} \d{4}', l)), '')
        date_match = re.search(r'([A-Za-z]{3})-([A-Za-z]{3}) (\d{4})', date_line)
        if date_match:
            # Use second month and year, day is null
            month_str = date_match.group(2)
            year_str = date_match.group(3)
            # Convert month abbreviation to number
            import calendar
            try:
                month_num = list(calendar.month_abbr).index(month_str[:3].title())
            except Exception:
                month_num = None
            if month_num:
                issueDate = f"null/{month_num:02d}/{str(year_str)[-2:]}"
            else:
                issueDate = f"null/{month_str}/{str(year_str)[-2:]}"
        platform = 'NPTEL Online Certification'
    elif platform == 'simplilearn':
        # Find the line after 'Congratulations!'
        idx = next((i for i, l in enumerate(lines) if 'congratulations' in l.lower()), None)
        if idx is not None and idx+1 < len(lines):
            name = lines[idx+1]
        # Find the line containing 'successfully completed our training program on'
        idx2 = next((i for i, l in enumerate(lines) if 'successfully completed our training program on' in l.lower()), None)
        if idx2 is not None and idx2+1 < len(lines):
            title = lines[idx2+1]
        # Find the line containing the date (e.g., 08" Nov 2019)
        date_line = next((l for l in lines if re.search(r'\d{1,2}["\s]*[A-Za-z]{3} \d{4}', l)), '')
        date_match = re.search(r'(\d{1,2})["\s]*([A-Za-z]{3}) (\d{4})', date_line)
        if date_match:
            day = date_match.group(1)
            month_str = date_match.group(2)
            year_str = date_match.group(3)
            import calendar
            try:
                month_num = list(calendar.month_abbr).index(month_str[:3].title())
            except Exception:
                month_num = None
            if month_num:
                issueDate = f"{int(day):02d}/{month_num:02d}/{str(year_str)[-2:]}"
            else:
                issueDate = f"{int(day):02d}/{month_str}/{str(year_str)[-2:]}"
        platform = 'simplilearn'
    elif platform == 'udemy':
        # Find the line containing 'This is to certify that' and extract name
        idx = next((i for i, l in enumerate(lines) if 'this is to certify that' in l.lower()), None)
        if idx is not None and idx+1 < len(lines):
            name_line = lines[idx+1]
            name_match = re.search(r'this is to certify that\s*(.*)', lines[idx].lower())
            if name_match:
                name = name_match.group(1).strip()
            else:
                name = name_line.strip()
        # Find the line containing 'successfully completed' and extract course
        idx2 = next((i for i, l in enumerate(lines) if 'hours of' in l.lower()), None)
        if idx2 is not None:
            # Collect all lines after 'hours of' up to 'online course', including multi-line course names
            course_lines = []
            for i in range(idx2+1, len(lines)):
                if 'online course' in lines[i].lower():
                    break
                course_lines.append(lines[i].strip())
            # Join lines with a space to form the full course name
            title = ' '.join(course_lines).replace('course :', '').strip()
        # Find the line containing 'online course on' and extract date
        date_line = next((l for l in lines if 'online course on' in l.lower()), '')
        date_match = re.search(r'on\s*([A-Za-z]{3,}\.\s*\d{1,2},\s*\d{4})', date_line)
        if date_match:
            issueDate = date_match.group(1)
        platform = 'udemy'
    elif platform == 'upgrad':
        # Find the line after 'This is to certify that'
        idx = next((i for i, l in enumerate(lines) if 'this is to certify that' in l.lower()), None)
        if idx is not None and idx+1 < len(lines):
            name = lines[idx+1]
        # Find the line after 'has successfully completed the course on'
        idx2 = next((i for i, l in enumerate(lines) if 'successfully completed the course on' in l.lower()), None)
        if idx2 is not None and idx2+1 < len(lines):
            title = lines[idx2+1]
        # Find the line after 'Issued on:' for date
        idx3 = next((i for i, l in enumerate(lines) if 'issued on' in l.lower()), None)
        if idx3 is not None and idx3+1 < len(lines):
            date_line = lines[idx3+1]
            date_match = re.search(r'(\d{2})-(\d{2})-(\d{4})', date_line)
            if date_match:
                day = date_match.group(1)
                month = date_match.group(2)
                year = date_match.group(3)[-2:]
                issueDate = f"{day}/{month}/{year}"
        platform = 'upGrad'
    if issueDate:
        issueDate = format_date(issueDate)
    
    # Clean up "null" dates from NPTEL extraction
    if issueDate and issueDate.startswith('null/'):
        issueDate = issueDate.replace('null/', '01/')  # Default to 1st day of month
    
    return {
        'issuer': platform, 
        'name': name, 
        'title': title, 
        'issueDate': issueDate,
        'type': 'certificate',  # Default type
        'status': 'pending'     # Default status
    }

@app.route('/extract', methods=['POST'])
def extract():
    if 'certificateFile' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    
    file = request.files['certificateFile']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    # Get platform hint if provided
    platform_hint = request.form.get('platform', None)
    
    try:
        img = Image.open(file.stream)
        text = pytesseract.image_to_string(img)
        info = extract_info(text, platform_hint)
        
        return jsonify({
            'success': True,
            'extracted': info,
            'message': 'Certificate information extracted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'Error processing image: {str(e)}'
        }), 500

@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Certificate Extraction Service',
        'version': '1.0.0'
    })

@app.route('/cert_extractor.html')
def serve_html():
    return send_from_directory('.', 'cert_extractor.html')

if __name__ == '__main__':
    # Get configuration from environment variables
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"Starting Certificate Extraction Service on port {port}")
    print(f"Debug mode: {debug}")
    print(f"Tesseract command: {pytesseract.pytesseract.tesseract_cmd}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
