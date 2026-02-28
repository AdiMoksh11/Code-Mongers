const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { importCertificateFromUrl, analyzeCertificateImage } = require('../controllers/certificateController');

const router = express.Router();

// Configure multer for memory storage (files stored in memory as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.use(protect);
router.post('/import-url', importCertificateFromUrl);
router.post('/analyze-image', upload.single('certificate'), analyzeCertificateImage);

module.exports = router;
