const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const {
  register,
  login,
  logout,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  resendOtp,
  generateWeb3Challenge,
  verifyWeb3Signature,
  selectRole,
} = require("../controllers/authController");

const router = express.Router();

// Import auth middleware
const { protect } = require("../middlewares/authMiddleware");

const FRONTEND_URL = process.env.VERCEL_CLIENT_URL || process.env.CLIENT_URL;

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/verify-otp", verifyOtp);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOtp);

router.post("/web3/challenge", generateWeb3Challenge);
router.post("/web3/verify", verifyWeb3Signature);
router.post("/select-role", protect, selectRole);

const socialAuthCallback = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (err, user, info) => {
    if (err) {
      console.error(`[AUTH-ERROR] Authentication failed for ${strategy}.`);
      console.error("[AUTH-ERROR] Error Details:", err.stack);
      
      let errorMessage = "Authentication+failed";
      if (err.name === 'TokenError' && err.message) {
        errorMessage = encodeURIComponent(err.message);
      } else if (err.message) {
        errorMessage = encodeURIComponent(err.message);
      }
      
      console.error("[AUTH-ERROR] Redirection URL:", `${FRONTEND_URL}/login?error=${errorMessage}`);
      return res.redirect(`${FRONTEND_URL}/login?error=${errorMessage}`);
    }
    if (!user) {
      console.warn(`[AUTH-WARN] No user found for ${strategy}.`);
      if (info && info.message) {
        console.warn(`[AUTH-WARN] Authentication info message: "${info.message}".`);
        return res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(info.message)}`);
      }
      return res.redirect(`${FRONTEND_URL}/login?error=Authentication+failed`);
    }
    req.user = user;
    next();
  })(req, res, next);
};

const socialAuthSuccess = (req, res) => {
  if (!req.user) {
    console.error("[AUTH-ERROR] User object not present after successful authentication.");
    return res.redirect(`${FRONTEND_URL}/login?error=Authentication+failed`);
  }
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  
  // Check if user has a role
  if (req.user.role) {
    // User has role, redirect to dashboard
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}&hasRole=true`);
  } else {
    // User needs to select role
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}&hasRole=false`);
  }
};

router.get(
  "/google",
  (req, res, next) => {
    const mode = req.query.mode || "login";
    passport.authenticate("google", { scope: ["profile", "email"], state: mode })(req, res, next);
  }
);
router.get("/google/callback", socialAuthCallback("google"), socialAuthSuccess);

router.get(
  "/github",
  (req, res, next) => {
    const mode = req.query.mode || "login";
    passport.authenticate("github", { scope: ["user:email"], state: mode })(req, res, next);
  }
);
router.get("/github/callback", socialAuthCallback("github"), socialAuthSuccess);

router.get(
  "/facebook",
  (req, res, next) => {
    const mode = req.query.mode || "login";
    passport.authenticate("facebook", { scope: ["email"], state: mode })(req, res, next);
  }
);
router.get("/facebook/callback", socialAuthCallback("facebook"), socialAuthSuccess);

router.get(
  "/discord",
  (req, res, next) => {
    const mode = req.query.mode || "login";
    passport.authenticate("discord", { scope: ["identify", "email"], state: mode })(req, res, next);
  }
);
router.get("/discord/callback", socialAuthCallback("discord"), socialAuthSuccess);

router.get(
  "/linkedin",
  (req, res, next) => {
    const mode = req.query.mode || "login";
    passport.authenticate("linkedin", { scope: ["openid", "profile", "email"], state: mode })(req, res, next);
  }
);
router.get("/linkedin/callback", socialAuthCallback("linkedin"), socialAuthSuccess);

module.exports = router;
