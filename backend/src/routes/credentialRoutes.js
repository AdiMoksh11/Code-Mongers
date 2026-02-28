const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
  anchorCredentialController,
  verifyCredentialController,
  generateCredentialHashController,
  getCredentialDetails,
  extractCertificateInfo,
} = require('../controllers/credentialController');

// Configure multer for file uploads (in memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  },
});

const router = express.Router();

// --- NEW PUBLIC BLOCKCHAIN ROUTE ---
// This route is public so anyone (like an employer) can verify a credential hash
// It is placed BEFORE the protect middleware
router.get('/verify/:hash', verifyCredentialController);

// All routes below this line require user authentication
router.use(protect);

// Certificate extraction route
router.post('/extract', upload.single('certificateFile'), extractCertificateInfo);

// Forensics endpoints - fraud detection system
const { runForensicsOnCredential, checkForensicsHealth } = require('../controllers/fraudController');
router.get('/forensics/health', checkForensicsHealth); // Health check endpoint (no auth needed)
router.get('/:id/forensics', protect, runForensicsOnCredential); // Main forensics endpoint

// --- EXISTING DATABASE ROUTES (UNCHANGED) ---
router.get('/', listCredentials);
router.get('/:id', getCredentialDetails);

// Main credential creation route with multer middleware
router.post('/', upload.single('certificateFile'), createCredential);
router.put('/:id', updateCredential);
router.delete('/:id', deleteCredential);

router.post('/:id/anchor', anchorCredentialController);

router.post('/:id/generate-hash', generateCredentialHashController);

module.exports = router;