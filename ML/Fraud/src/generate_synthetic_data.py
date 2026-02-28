"""
Synthetic Certificate Data Generator
Generates realistic certificate images and metadata for training
"""

import os
import json
import random
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from pathlib import Path

class SyntheticCertificateGenerator:
    def __init__(self, output_dir="../data_synthetic"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Certificate templates
        self.authentic_templates = [
            "University Certificate",
            "Professional Certification",
            "Academic Achievement",
            "Course Completion",
            "Training Certificate"
        ]
        
        self.forged_templates = [
            "Fake University Diploma",
            "Counterfeit Certificate",
            "Altered Document",
            "Fraudulent Credential",
            "Modified Certificate"
        ]
        
        # University names
        self.authentic_universities = [
            "Stanford University", "Harvard University", "MIT",
            "University of California", "Yale University", "Princeton University",
            "Columbia University", "University of Chicago", "Northwestern University",
            "Duke University", "University of Pennsylvania", "Johns Hopkins University"
        ]
        
        self.fake_universities = [
            "Fake University", "Diploma Mill College", "Scam Institute",
            "Fraudulent Academy", "Bogus University", "Counterfeit College",
            "Phony Institute", "Deceptive University", "False Academy",
            "Sham College", "Hoax University", "Pretend Institute"
        ]
        
        # Colors for different certificate types
        self.authentic_colors = [
            (255, 255, 255),  # White
            (248, 248, 255),  # Ghost white
            (245, 245, 220),  # Beige
            (255, 250, 240),  # Floral white
        ]
        
        self.forged_colors = [
            (255, 255, 0),    # Bright yellow (suspicious)
            (255, 0, 255),    # Magenta (unusual)
            (0, 255, 255),    # Cyan (fake-looking)
            (255, 165, 0),    # Orange (unprofessional)
        ]

    def generate_certificate_image(self, is_authentic=True, width=800, height=600):
        """Generate a synthetic certificate image"""
        
        # Choose colors based on authenticity
        if is_authentic:
            bg_color = random.choice(self.authentic_colors)
            text_color = (0, 0, 0)  # Black text
            border_color = (0, 0, 139)  # Dark blue border
        else:
            bg_color = random.choice(self.forged_colors)
            text_color = random.choice([(255, 0, 0), (0, 255, 0), (0, 0, 255)])  # Unusual colors
            border_color = random.choice([(255, 0, 0), (255, 255, 0)])  # Suspicious borders
        
        # Create image
        img = Image.new('RGB', (width, height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Draw border
        border_width = 10 if is_authentic else random.randint(5, 20)
        draw.rectangle([border_width, border_width, width-border_width, height-border_width], 
                      outline=border_color, width=border_width)
        
        # Try to load a font, fallback to default
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            text_font = ImageFont.truetype("arial.ttf", 20)
            small_font = ImageFont.truetype("arial.ttf", 14)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Certificate title
        if is_authentic:
            title = random.choice(self.authentic_templates)
            university = random.choice(self.authentic_universities)
        else:
            title = random.choice(self.forged_templates)
            university = random.choice(self.fake_universities)
        
        # Draw title
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        draw.text(((width - title_width) // 2, 50), title, fill=text_color, font=title_font)
        
        # Draw university name
        uni_bbox = draw.textbbox((0, 0), university, font=text_font)
        uni_width = uni_bbox[2] - uni_bbox[0]
        draw.text(((width - uni_width) // 2, 120), university, fill=text_color, font=text_font)
        
        # Certificate text
        student_name = f"Student {random.randint(1000, 9999)}"
        course_name = f"Course in {random.choice(['Computer Science', 'Engineering', 'Business', 'Medicine'])}"
        
        draw.text((100, 200), "This is to certify that", fill=text_color, font=text_font)
        draw.text((100, 240), student_name, fill=text_color, font=title_font)
        draw.text((100, 300), "has successfully completed", fill=text_color, font=text_font)
        draw.text((100, 340), course_name, fill=text_color, font=text_font)
        
        # Date
        if is_authentic:
            date_str = datetime.now().strftime("%B %d, %Y")
        else:
            # Forged certificates might have suspicious dates
            fake_date = datetime.now() + timedelta(days=random.randint(-3650, 365))
            date_str = fake_date.strftime("%B %d, %Y")
        
        draw.text((100, 450), f"Date: {date_str}", fill=text_color, font=text_font)
        
        # Signature area
        draw.text((400, 450), "Dean's Signature", fill=text_color, font=small_font)
        draw.line([400, 480, 600, 480], fill=text_color, width=2)
        
        # Add some noise for forged certificates
        if not is_authentic:
            # Add random artifacts
            for _ in range(random.randint(5, 15)):
                x = random.randint(0, width)
                y = random.randint(0, height)
                draw.ellipse([x, y, x+3, y+3], fill=random.choice([(255, 0, 0), (0, 255, 0), (0, 0, 255)]))
        
        return img, university, date_str

    def generate_metadata(self, is_authentic=True, university_name="", date_str=""):
        """Generate certificate metadata"""
        
        base_date = datetime.now()
        
        if is_authentic:
            metadata = {
                "issuer": university_name,
                "creation_date": base_date.isoformat(),
                "modification_date": base_date.isoformat(),
                "producer": "Adobe PDF Library",
                "creator": "Microsoft Word",
                "title": f"Certificate - {university_name}",
                "subject": "Official Certificate",
                "keywords": "certificate, diploma, education",
                "creation_date_delta": 0,
                "producer_mismatch": False,
                "unusual_editor": False,
                "suspicious_issuer": False
            }
        else:
            # Forged certificates have suspicious metadata
            suspicious_producers = ["Unknown", "PDFCreator", "Fake PDF Maker", "Suspicious Tool"]
            suspicious_creators = ["Notepad", "Paint", "Unknown Application", "Hacker Tool"]
            
            creation_delta = random.randint(30, 1095)  # 1 month to 3 years ago
            creation_date = base_date - timedelta(days=creation_delta)
            mod_date = base_date - timedelta(days=random.randint(0, 30))
            
            metadata = {
                "issuer": university_name,
                "creation_date": creation_date.isoformat(),
                "modification_date": mod_date.isoformat(),
                "producer": random.choice(suspicious_producers),
                "creator": random.choice(suspicious_creators),
                "title": f"Certificate - {university_name}",
                "subject": "Certificate Document",
                "keywords": "certificate, fake, diploma",
                "creation_date_delta": creation_delta,
                "producer_mismatch": True,
                "unusual_editor": True,
                "suspicious_issuer": True
            }
        
        return metadata

    def generate_dataset(self, num_images=200):
        """Generate a complete dataset of images and metadata"""
        
        print(f"Generating {num_images} synthetic certificates...")
        
        # Split 50/50 between authentic and forged
        num_authentic = num_images // 2
        num_forged = num_images - num_authentic
        
        generated_files = []
        
        # Generate authentic certificates
        for i in range(num_authentic):
            print(f"Generating authentic certificate {i+1}/{num_authentic}")
            
            img, university, date_str = self.generate_certificate_image(is_authentic=True)
            metadata = self.generate_metadata(is_authentic=True, university_name=university, date_str=date_str)
            
            # Save image
            img_filename = f"authentic_{i+1:03d}.png"
            img_path = self.output_dir / img_filename
            img.save(img_path)
            
            # Save metadata
            json_filename = f"authentic_{i+1:03d}.json"
            json_path = self.output_dir / json_filename
            with open(json_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            generated_files.append({
                "image": str(img_path),
                "metadata": str(json_path),
                "label": "authentic"
            })
        
        # Generate forged certificates
        for i in range(num_forged):
            print(f"Generating forged certificate {i+1}/{num_forged}")
            
            img, university, date_str = self.generate_certificate_image(is_authentic=False)
            metadata = self.generate_metadata(is_authentic=False, university_name=university, date_str=date_str)
            
            # Save image
            img_filename = f"forged_{i+1:03d}.png"
            img_path = self.output_dir / img_filename
            img.save(img_path)
            
            # Save metadata
            json_filename = f"forged_{i+1:03d}.json"
            json_path = self.output_dir / json_filename
            with open(json_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            generated_files.append({
                "image": str(img_path),
                "metadata": str(json_path),
                "label": "forged"
            })
        
        # Save dataset index
        index_path = self.output_dir / "dataset_index.json"
        with open(index_path, 'w') as f:
            json.dump({
                "total_files": len(generated_files),
                "authentic_count": num_authentic,
                "forged_count": num_forged,
                "files": generated_files
            }, f, indent=2)
        
        print(f"\nDataset generation complete!")
        print(f"Generated {len(generated_files)} files:")
        print(f"  - {num_authentic} authentic certificates")
        print(f"  - {num_forged} forged certificates")
        print(f"  - Files saved to: {self.output_dir}")
        
        return generated_files

if __name__ == "__main__":
    generator = SyntheticCertificateGenerator()
    dataset = generator.generate_dataset(num_images=200)