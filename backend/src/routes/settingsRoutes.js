const express = require("express");
const {
  getSettings,
  updateProfile,
  updatePreferences,
  updateSecurity,
  toggle2FA,
  getActiveSessions,
  revokeSession,
  updatePrivacy,
  clearAllSessions,
  updatePlatformSync,
  disconnectPlatform,
} = require("../controllers/settingsController");
const { protect } = require("../middlewares/authMiddleware");
const { trackSession } = require("../middlewares/sessionMiddleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Only track sessions on settings access (not every API call)
router.get("/", trackSession, getSettings);

// Profile settings
router.put("/profile", updateProfile);

// Preferences
router.put("/preferences", updatePreferences);

// Security settings
router.put("/security", updateSecurity);
router.post("/security/2fa", toggle2FA);
router.get("/security/sessions", getActiveSessions);
router.delete("/security/sessions/:sessionId", revokeSession);
router.delete("/security/sessions", clearAllSessions);

// Privacy settings
router.put("/privacy", updatePrivacy);

// Platform sync settings
router.put("/platform-sync", updatePlatformSync);
router.delete("/platform-sync/:platform", disconnectPlatform);

module.exports = router;