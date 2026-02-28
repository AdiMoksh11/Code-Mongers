const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;
  console.log('Auth middleware: Checking authorization...');
  console.log('Auth headers:', req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log('Auth middleware: Processing Bearer token');
      token = req.headers.authorization.split(" ")[1];
      console.log('Auth middleware: Token length:', token.length);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware: Token verified for user ID:', decoded.id);

      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        console.log('Auth middleware: User not found for ID:', decoded.id);
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      console.log('Auth middleware: User authenticated:', req.user.email);
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log('Auth middleware: No Bearer token found');
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
