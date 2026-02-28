const multer = require("multer");

// Configure multer for file uploads
const storage = multer.memoryStorage();

const projectImageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for project images
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'projectImage') {
      // Check if file is an image
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for project images.'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

module.exports = {
  uploadProjectImage: projectImageUpload.single('projectImage')
};