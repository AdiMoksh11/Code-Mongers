#!/bin/bash
# Render.com build script for Credexa with ML forensics

echo "🚀 Starting Credexa build with ML forensics support..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd backend && npm install

# Install Python dependencies for ML forensics
echo "🐍 Installing Python dependencies for forensics..."
cd ../fraudCertificate

# Install Python packages (try production requirements first)
pip3 install --no-cache-dir -r requirements-prod.txt || pip3 install --no-cache-dir -r requirements.txt

echo "✅ Build completed successfully!"

# Verify installation
echo "🔍 Verifying installation..."
python3 -c "import cv2, torch, numpy; print('✅ All Python packages installed successfully')"

echo "🎉 Build ready for deployment!"