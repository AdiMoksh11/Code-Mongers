const axios = require("axios");
const crypto = require("crypto");
const User = require("../models/userModel");

function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: (code) => code >= 200 && code < 400,
  });
  return res.data;
}

function randomAlphaWord(minLen = 5, maxLen = 7) {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const len = minLen + (crypto.randomBytes(1)[0] % (maxLen - minLen + 1));
  let s = "";
  for (let i = 0; i < len; i++) {
    s += letters[crypto.randomBytes(1)[0] % letters.length];
  }
  // Title Case: First letter uppercase, rest lowercase
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateNameToken() {
  // Two Title-Case alphabetic words separated by a space (no digits/symbols, not all uppercase)
  return `${randomAlphaWord()} ${randomAlphaWord()}`;
}

// Generate a token challenge that the user must place into the Coursera profile name temporarily
const createCourseraChallenge = async (req, res) => {
  try {
    const { profileUrl } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!profileUrl || !profileUrl.trim()) {
      return res.status(400).json({ message: "Profile URL is required" });
    }
    let urlObj;
    try {
      urlObj = new URL(profileUrl.trim());
    } catch (e) {
      return res.status(400).json({ message: "Invalid URL format" });
    }
    if (!/coursera\.org$/i.test(urlObj.hostname)) {
      return res.status(400).json({ message: "URL must be a Coursera profile" });
    }

  // Generate a name-like token that complies with Coursera name rules (letters only, Title Case, no digits/symbols)
  const token = generateNameToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.platformSync = user.platformSync || {};
    user.platformSync.coursera = user.platformSync.coursera || {};
    user.platformSync.coursera.pendingVerification = {
      token,
      expiresAt,
      profileUrl: urlObj.toString(),
    };
    // Mark as not verified yet
    user.platformSync.coursera.verified = false;
    await user.save();

    return res.json({
      success: true,
      message: "Challenge created. Update your Coursera display name to the token shown (letters only), then click Verify.",
      data: {
        token,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("createCourseraChallenge error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify Coursera profile ownership by checking whether the profile name contains the issued token
const verifyCourseraProfile = async (req, res) => {
  try {
    const { profileUrl } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!profileUrl || !profileUrl.trim()) {
      return res.status(400).json({ message: "Profile URL is required" });
    }

    let urlObj;
    try {
      urlObj = new URL(profileUrl.trim());
    } catch (e) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    if (!/coursera\.org$/i.test(urlObj.hostname)) {
      return res.status(400).json({ message: "URL must be a Coursera profile" });
    }

    // Fetch the profile page
    let html;
    try {
      html = await fetchHtml(urlObj.toString());
    } catch (err) {
      console.error("Coursera fetch error:", err.message);
      return res.status(400).json({
        message: "Unable to access the Coursera profile. Ensure it is public and try again.",
      });
    }

  // Parse HTML to find likely display name
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    const candidates = [];
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) candidates.push(ogTitle);
    const title = $('title').first().text();
    if (title) candidates.push(title);
    // Headings often contain the display name
    const h1 = $('h1').first().text();
    if (h1) candidates.push(h1);
    const h2 = $('h2').first().text();
    if (h2) candidates.push(h2);
    // JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).contents().text());
        const arr = Array.isArray(json) ? json : [json];
        arr.forEach((obj) => {
          if (obj && (obj.name || (obj.author && obj.author.name))) {
            candidates.push(obj.name || obj.author.name);
          }
        });
      } catch (_) {}
    });

    const uniqueCandidates = [...new Set(candidates.map((c) => c && c.toString()))].filter(Boolean);

    // Token-based check (preferred)
    const token = user.platformSync?.coursera?.pendingVerification?.token;
    const tokenExpires = user.platformSync?.coursera?.pendingVerification?.expiresAt
      ? new Date(user.platformSync.coursera.pendingVerification.expiresAt)
      : null;

    if (!token) {
      return res.status(400).json({ message: "No active verification challenge. Generate one first." });
    }
    if (tokenExpires && tokenExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification token expired. Generate a new challenge." });
    }

    const tokenLower = normalize(token);
    let matched = false;
    for (const cand of uniqueCandidates) {
      const n = normalize(cand);
      if (!n) continue;
      if (n.includes(tokenLower)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      return res.status(400).json({
        success: false,
        message: "Token not found in your Coursera profile name or headings. Update your display name to the token and try again.",
      });
    }

    // Save as verified connection
    user.platformSync = user.platformSync || {};
    user.platformSync.coursera = user.platformSync.coursera || {};
  user.platformSync.coursera.profileUrl = urlObj.toString();
    user.platformSync.coursera.isConnected = true;
    user.platformSync.coursera.verified = true;
    user.platformSync.coursera.verifiedAt = new Date();
    user.platformSync.coursera.lastSyncAt = new Date();
  // Clear pending verification
  user.platformSync.coursera.pendingVerification = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Coursera profile verified and connected",
      data: user.platformSync.coursera,
    });
  } catch (error) {
    console.error("verifyCourseraProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createCourseraChallenge, verifyCourseraProfile };
