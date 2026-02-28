const User = require("../models/userModel");
const { nanoid } = require("nanoid");

// Session tracking middleware
const trackSession = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        // Initialize session tracking if it doesn't exist
        if (!user.settings) {
          user.settings = {};
        }
        if (!user.settings.security) {
          user.settings.security = {};
        }
        if (!user.settings.security.activeSessions) {
          user.settings.security.activeSessions = [];
        }

        // Get session info from headers and request
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown IP';
        
        // Create a more unique session identifier based on IP + User Agent
        const sessionIdentifier = `${ipAddress}-${userAgent}`;
        
        // Check if session already exists based on IP and User Agent
        const existingSessionIndex = user.settings.security.activeSessions.findIndex(
          session => session.deviceInfo === userAgent && session.ipAddress === ipAddress
        );

        if (existingSessionIndex !== -1) {
          // Update existing session's last active time
          user.settings.security.activeSessions[existingSessionIndex].lastActive = new Date();
        } else {
          // Add new session only if it doesn't exist
          const newSession = {
            sessionId: nanoid(),
            deviceInfo: userAgent,
            ipAddress: ipAddress,
            lastActive: new Date(),
            createdAt: new Date(),
          };

          user.settings.security.activeSessions.unshift(newSession);
          
          // Keep only the last 5 sessions to avoid clutter
          if (user.settings.security.activeSessions.length > 5) {
            user.settings.security.activeSessions = user.settings.security.activeSessions.slice(0, 5);
          }
        }

        // Clean up old sessions (older than 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        user.settings.security.activeSessions = user.settings.security.activeSessions.filter(
          session => new Date(session.lastActive) > sevenDaysAgo
        );

        await user.save();
      }
    } catch (error) {
      console.error("Session tracking error:", error);
      // Don't fail the request if session tracking fails
    }
  }
  next();
};

module.exports = { trackSession };