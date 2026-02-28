const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String, 
  otp: {
    code: String,
    expiresAt: Date,
  },
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
