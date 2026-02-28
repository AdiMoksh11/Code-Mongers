const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ActivityTracker = require('../utils/activityTracker');

// Download a remote image to a local temp path
async function downloadImage(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios.get(url, { responseType: 'stream', timeout: 30000 });
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    let error = null;
    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) resolve(destPath);
    });
  });
}

// Check if forensics environment is ready
exports.checkForensicsHealth = async (req, res) => {
  try {
    const fraudCwd = path.resolve(process.cwd(), '..', 'fraudCertificate');
    const checkScript = path.join(fraudCwd, 'check_environment.py');
    
    if (!fs.existsSync(checkScript)) {
      return res.json({
        ready: false,
        message: 'Forensics check script not found',
        details: 'The ML environment check is not available'
      });
    }
    
    execFile('python3', [checkScript], { cwd: fraudCwd }, (err, stdout, stderr) => {
      if (err) {
        return res.json({
          ready: false,
          message: 'Environment check failed',
          details: stderr || err.message
        });
      }
      
      try {
        const result = JSON.parse(stdout);
        return res.json(result);
      } catch (parseErr) {
        return res.json({
          ready: false,
          message: 'Unable to parse environment check',
          details: stdout
        });
      }
    });
  } catch (error) {
    res.json({
      ready: false,
      message: 'Health check error',
      details: error.message
    });
  }
};

exports.runForensicsOnCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const Credential = require('../models/credentialModel');
    // First try to find the credential by id
    const cred = await Credential.findById(id);
    if (!cred) {
      console.log(`Forensics: credential ${id} not found in DB`);
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check authorization: allow credential owner OR institute users to run forensics
    const ownerId = cred.user ? String(cred.user) : null;
    const requesterId = req.user ? String(req.user._id) : null;
    const requesterRole = req.user ? req.user.role : null;
    
    console.log(`Forensics: credential owner=${ownerId}, requester=${requesterId}, requester role=${requesterRole}`);
    
    const isOwner = requesterId && ownerId === requesterId;
    const isInstitute = requesterRole === 'institute';
    
    if (!requesterId || (!isOwner && !isInstitute)) {
      // Return 403 to indicate the credential exists but user is not authorized
      const message = requesterRole ? 
        `Only credential owners and institutes can run forensics. Your role: ${requesterRole}` :
        'Not authorized to access this credential';
      return res.status(403).json({ message });
    }
    
    console.log(`Forensics: Access granted - isOwner: ${isOwner}, isInstitute: ${isInstitute}`);

    const imageUrl = cred.imageUrl || cred.credentialUrl;
    if (!imageUrl) return res.status(400).json({ message: 'No image or URL available for this credential' });

    const tmpDir = path.join(process.cwd(), 'fraud_temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    // Extract extension from URL, handling query parameters
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath) || '.jpg'; // Default to .jpg if no extension
    const localImage = path.join(tmpDir, `cred_${id}${ext}`);

    // Download image
    await downloadImage(imageUrl, localImage);

    // Run the enhanced Python wrapper that returns metrics
    // Try multiple possible paths for the fraudCertificate directory
    let fraudScript, fraudCwd;
    
    // Path 1: Same level as backend (for production deployment)
    const productionPath = path.resolve(process.cwd(), '..', 'fraudCertificate', 'run_predict_with_metrics.py');
    const productionCwd = path.resolve(process.cwd(), '..', 'fraudCertificate');
    
    // Path 2: Original development path
    const devPath = path.resolve(process.cwd(), '..', '..', 'fraudCertificate', 'run_predict_with_metrics.py');
    const devCwd = path.resolve(process.cwd(), '..', '..', 'fraudCertificate');
    
    if (fs.existsSync(productionPath)) {
      fraudScript = productionPath;
      fraudCwd = productionCwd;
      console.log('Forensics: Using production path');
    } else if (fs.existsSync(devPath)) {
      fraudScript = devPath;
      fraudCwd = devCwd;
      console.log('Forensics: Using development path');
    } else {
      console.error('Forensics: Python script not found in any expected location');
      return res.status(500).json({ 
        message: 'Forensics service unavailable', 
        details: 'ML model files not found. This feature requires proper deployment setup.' 
      });
    }

    console.log('Forensics: Running enhanced Python script at:', fraudScript);
    console.log('Forensics: Working directory:', fraudCwd);
    console.log('Forensics: Input image:', localImage);

    // Try different Python commands (python3, python, py)
    const pythonCommands = ['python3', 'python', 'py'];
    let pythonCmd = 'python3'; // Default to python3 for production
    
    // Check if model file exists
    const modelFile = path.join(fraudCwd, 'weights', 'detector_weights.pth');
    if (!fs.existsSync(modelFile)) {
      console.error('Forensics: Model file not found at:', modelFile);
      return res.status(500).json({ 
        message: 'ML model not available', 
        details: 'The fraud detection model files are missing. Please ensure Git LFS files are downloaded.' 
      });
    }

    execFile(pythonCmd, [fraudScript, '--image', localImage], { 
      cwd: fraudCwd,
      timeout: 120000, // 2 minute timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    }, (err, stdout, stderr) => {
      if (err) {
        console.error('Forensics script error:', err);
        console.error('Forensics stderr:', stderr);
        
        // Try to provide more helpful error messages
        let errorMessage = 'Forensics analysis failed';
        let errorDetails = stderr || err.message;
        
        if (stderr && stderr.includes('ModuleNotFoundError')) {
          errorMessage = 'Missing Python dependencies';
          errorDetails = 'The ML environment is not properly set up. Please ensure the build command includes: pip3 install torch torchvision opencv-python-headless pillow numpy';
        } else if (stderr && stderr.includes('No such file')) {
          errorMessage = 'ML model files missing';
          errorDetails = 'The fraud detection model files are not available. Please ensure Git LFS files are downloaded.';
        } else if (err.code === 'ENOENT') {
          errorMessage = 'Python not found';
          errorDetails = 'Python is not installed or not in PATH. The forensics feature requires Python 3.8+';
        }
        
        return res.status(500).json({ 
          message: errorMessage, 
          details: errorDetails,
          error_code: err.code || 'FORENSICS_ERROR'
        });
      }
      // Parse JSON response from enhanced Python script
      const lines = stdout.trim().split('\n');
      const jsonLine = lines[lines.length - 1].trim();
      console.log('Forensics: Python script output:', jsonLine);
      
      let resultData;
      try {
        resultData = JSON.parse(jsonLine);
      } catch (parseErr) {
        console.error('Forensics: Failed to parse JSON output:', parseErr);
        return res.status(500).json({ message: 'Invalid forensics output format' });
      }
      
      const outPath = resultData.output_image;
      if (!fs.existsSync(outPath)) {
        console.log('Forensics: Output file not found at:', outPath);
        return res.status(500).json({ message: 'Forensics output missing' });
      }
      
      // Read output image and return base64 along with metrics
      const outData = fs.readFileSync(outPath);
      const base64 = outData.toString('base64');
      
      // Log forensics activity (async but don't await to avoid blocking response)
      Promise.resolve().then(async () => {
        try {
          const activityDescription = `Performed forensics analysis on credential: ${cred.title || 'Untitled'}`;
          const metadata = {
            credentialId: id,
            credentialTitle: cred.title,
            fraudPercentage: resultData.metrics?.fraud_percentage || 0,
            authenticityScore: resultData.metrics?.authenticity_score || 100,
            classification: resultData.metrics?.classification || 'AUTHENTIC'
          };

          if (requesterRole === 'institute') {
            await ActivityTracker.logInstituteActivity(
              requesterId,
              'forensics_analysis_performed',
              activityDescription,
              metadata,
              req
            );
          } else {
            await ActivityTracker.logLearnerActivity(
              requesterId,
              'credential_shared', // Learner viewing their own credential forensics
              `Viewed forensics analysis for: ${cred.title || 'Untitled'}`,
              metadata,
              req
            );
          }
        } catch (activityError) {
          console.warn('Failed to log forensics activity:', activityError.message);
        }
      });

      // Clean up temp files
      try { fs.unlinkSync(localImage); } catch(e){}
      try { fs.unlinkSync(outPath); } catch(e){}
      if (resultData.results_file && fs.existsSync(resultData.results_file)) {
        try { fs.unlinkSync(resultData.results_file); } catch(e){}
      }
      
      return res.json({ 
        imageBase64: base64,
        metrics: resultData.metrics || null,
        analysis: {
          fraudPercentage: resultData.metrics?.fraud_percentage || 0,
          authenticityScore: resultData.metrics?.authenticity_score || 100,
          confidence: resultData.metrics?.confidence || 95,
          classification: resultData.metrics?.classification || 'AUTHENTIC',
          tamperedPixels: resultData.metrics?.tampered_pixels || 0,
          totalPixels: resultData.metrics?.total_pixels || 0
        }
      });
    });
  } catch (error) {
    console.error('runForensicsOnCredential error:', error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
};
