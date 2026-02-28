const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { createCourseraChallenge, verifyCourseraProfile } = require("../controllers/platformsController");

const router = express.Router();

router.use(protect);

// Coursera verification (verify then store)
router.post("/coursera/challenge", createCourseraChallenge);
router.post("/coursera/verify", verifyCourseraProfile);

module.exports = router;
