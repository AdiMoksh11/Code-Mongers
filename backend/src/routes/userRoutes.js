const express = require("express");
const router = express.Router();
const multer = require("multer");
const { 
  getUserProfile,
  updateUserProfile,
  verifyEmailUpdate,       
  resendEmailUpdateOtp,    
  generateLinkChallenge,
  linkWalletAddress,
  checkUsernameAvailability,
  uploadResumeFile,
  deleteResumeFile,
  searchLearners,
  getPublicProfile,
  getPublicProfileSecure,
  getUserCredentials,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/me", protect, getUserProfile);
router.put("/me", protect, upload.single('profilePic'), updateUserProfile);

router.post("/me/verify-email", protect, verifyEmailUpdate);
router.post("/me/resend-verify-email", protect, resendEmailUpdateOtp);

router.post("/me/generate-link-challenge", protect, generateLinkChallenge);
router.post("/me/link-wallet", protect, linkWalletAddress);

// Username and resume management
router.get("/check-username/:username", protect, checkUsernameAvailability);
router.post("/me/resume", protect, upload.single('resume'), uploadResumeFile);
router.delete("/me/resume", protect, deleteResumeFile);

// Employer/public endpoints
router.get("/search", searchLearners); // public search for learners by q/skills
router.get("/:id/public-profile", getPublicProfile); // public profile view for learner
router.get("/:id/public-profile-secure", protect, getPublicProfileSecure); // secure profile view for authenticated roles
router.get("/:id/credentials", protect, getUserCredentials); // get student credentials for institute dashboard

module.exports = router;

