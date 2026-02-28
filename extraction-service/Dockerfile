FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variables
ENV FLASK_APP=cert_extractor_api.py
ENV FLASK_ENV=production
ENV TESSERACT_CMD=/usr/bin/tesseract
ENV PORT=10000

# Expose port
EXPOSE 10000

# Run the application
CMD ["python", "cert_extractor_api.py"]