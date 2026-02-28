const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const User = require("../models/userModel");

const BACKEND_URL = process.env.RENDER_BACKEND_URL || "http://localhost:4000";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const mode = req.query.state || "login";
        let user = await User.findOne({ googleId: profile.id });

        if (mode === "login") {
          if (!user) return done(null, false);
        } else if (mode === "signup") {
          if (!user) {
            user = await User.create({
              googleId: profile.id,
              email: profile.emails?.[0]?.value || null,
              fullName: {
                firstName: profile.name.givenName || "",
                lastName: profile.name.familyName || "",
              },
              provider: "google",
              isVerified: true,
              profilePic: profile.photos?.[0]?.value || "",
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const mode = req.query.state || "login";
        let user = await User.findOne({ githubId: profile.id });

        if (mode === "login") {
          if (!user) return done(null, false);
        } else if (mode === "signup") {
          if (!user) {
            user = await User.create({
              githubId: profile.id,
              email: profile.emails?.[0]?.value || null,
              fullName: {
                firstName: profile.displayName?.split(" ")[0] || "",
                lastName: profile.displayName?.split(" ").slice(1).join(" ") || "",
              },
              provider: "github",
              isVerified: true,
              profilePic: profile.photos?.[0]?.value || "",
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/discord/callback`,
      scope: ["identify", "email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const mode = req.query.state || "login";
        let user = await User.findOne({ discordId: profile.id });

        if (mode === "login") {
          if (!user) return done(null, false);
        } else if (mode === "signup") {
          if (!user) {
            const displayName = profile.global_name || profile.displayName || profile.username || "";
            const nameParts = displayName.split(" ");
            
            user = await User.create({
              discordId: profile.id,
              email: profile.email || null,
              fullName: {
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
              },
              provider: "discord",
              isVerified: true,
              profilePic: profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : "",
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/linkedin/callback`,
      scope: ["openid", "profile", "email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const mode = req.query.state || "login";
        
        let user = await User.findOne({ linkedinId: profile.id });

        if (mode === "login") {
          if (!user) {
            return done(null, false);
          }
        } else if (mode === "signup") {
          if (!user) {
            user = await User.create({
              linkedinId: profile.id,
              email: profile.email || null,
              fullName: {
                firstName: profile.givenName || "",
                lastName: profile.familyName || "",
              },
              provider: "linkedin",
              isVerified: true,
              profilePic: profile.picture || "",
            });
          }
        }
        return done(null, user);
      } catch (err) {
            return done(err, null);
        }
    }
  )
);

module.exports = passport;
