const { ethers } = require("ethers");
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const challenges = require("../utils/challengeStore");
const { uploadFile, uploadResume, deleteFile } = require("../services/storageService");
const sendEmail = require("../utils/emailService");
const User = require("../models/userModel");
const Credential = require("../models/credentialModel");
const { calculateUserPoints } = require("./leaderboardController");
const ActivityTracker = require("../utils/activityTracker");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_RESEND_INTERVAL = 30 * 1000;

const getUserProfile = async (req, res) => {
  const user = req.user;
  if (user) {
    res.status(200).json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        provider: user.provider,
        walletAddress: user.walletAddress,
        isVerified: user.isVerified,
        socialLinks: user.socialLinks,
        projects: user.projects || [],
        resume: user.resume,
        createdAt: user.createdAt,
        platformSync: user.platformSync,
        institute: user.institute,
        settings: user.settings,
      }
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = req.user;
    const { firstName, lastName, email, username, phone, socialLinks } = req.body;

        const isSocialProvider = !['email', 'web3'].includes(user.provider);

        if (isSocialProvider && user.fullName?.firstName && (firstName || lastName)) {
            return res.status(403).json({ message: `Your name is managed by ${user.provider} and cannot be updated here.` });
        }
        if (isSocialProvider && user.email && email) {
             return res.status(403).json({ message: `Your email is managed by ${user.provider} and cannot be updated here.` });
        }

        const isAttemptingEmailUpdate = email && email.toLowerCase() !== user.email;

        if (isAttemptingEmailUpdate) {
            const newEmail = email.toLowerCase();
            const existingUser = await User.findOne({ email: newEmail });
            if (existingUser) {
                return res.status(400).json({ message: "This email is already in use by another account." });
            }

            const otpCode = generateOtp();
            user.emailChangeOtp = {
                code: otpCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                pendingEmail: newEmail,
                lastSentAt: new Date()
            };

            await sendEmail(newEmail, `Your email verification OTP is: ${otpCode}`, "Verify Your New Email Address");
        }

        // Check username uniqueness if provided
        if (username) {
            const usernameRegex = /^[a-zA-Z0-9_-]+$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({ message: "Username can only contain letters, numbers, hyphens, and underscores." });
            }
            if (username.length < 3 || username.length > 30) {
                return res.status(400).json({ message: "Username must be between 3 and 30 characters." });
            }
            
            const existingUser = await User.findOne({ username: username.toLowerCase() });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "This username is already taken." });
            }
            user.username = username.toLowerCase();
        }

        if (firstName) user.fullName.firstName = firstName;
        if (lastName) user.fullName.lastName = lastName;
        if (phone) user.phone = phone;
        
        // Update social links
        if (socialLinks) {
            const parsedSocialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
            user.socialLinks = { ...user.socialLinks, ...parsedSocialLinks };
        }

        // Update settings (preferences/security/privacy)
        if (req.body.settings) {
            const incoming = typeof req.body.settings === 'string' ? JSON.parse(req.body.settings) : req.body.settings;
            user.settings = user.settings || {};
            // Shallow merge helpers
            const mergeObj = (target, source) => {
                if (!source) return target;
                Object.keys(source).forEach(k => {
                    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
                        target[k] = mergeObj(target[k] || {}, source[k]);
                    } else {
                        target[k] = source[k];
                    }
                });
                return target;
            };
            user.settings.preferences = mergeObj(user.settings.preferences || {}, incoming.preferences || {});
            user.settings.security = mergeObj(user.settings.security || {}, incoming.security || {});
            user.settings.privacy = mergeObj(user.settings.privacy || {}, incoming.privacy || {});

            // Keep duplicate privacy visibility in sync if provided under preferences.privacy
            const prefVis = user.settings?.preferences?.privacy?.profileVisibility;
            if (prefVis) {
                user.settings.privacy = user.settings.privacy || {};
                if (!user.settings.privacy.profileVisibility) {
                    user.settings.privacy.profileVisibility = prefVis;
                }
            }
        }
        
        if (req.file) {
            const uniqueFilename = `profile_${user._id}_${nanoid()}`;
            const uploadResponse = await uploadFile(req.file.buffer, uniqueFilename);
            user.profilePic = uploadResponse.url;
        }

        const updatedUser = await user.save();

        // Log profile update activity
        try {
          const changes = [];
          if (firstName || lastName) changes.push('name');
          if (username) changes.push('username');
          if (phone) changes.push('phone');
          if (socialLinks) changes.push('social links');
          if (req.file) changes.push('profile picture');
          if (req.body.settings) changes.push('settings');
          
          if (changes.length > 0) {
            await ActivityTracker.logLearnerActivity(
              user._id,
              'profile_updated',
              `Updated profile: ${changes.join(', ')}`,
              {
                changes: changes,
                hasProfilePic: !!req.file,
                updatedFields: {
                  firstName: !!firstName,
                  lastName: !!lastName,
                  username: !!username,
                  phone: !!phone,
                  socialLinks: !!socialLinks,
                  settings: !!req.body.settings
                }
              },
              req
            );
          }
        } catch (activityError) {
          console.warn('Failed to log profile update activity:', activityError.message);
        }

        if (isAttemptingEmailUpdate) {
             return res.status(200).json({
                message: "Profile details saved. A verification OTP has been sent to your new email address.",
                emailVerificationRequired: true,
             });
        }

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            username: updatedUser.username,
            email: updatedUser.email,
            phone: updatedUser.phone,
            profilePic: updatedUser.profilePic,
            provider: updatedUser.provider,
            walletAddress: updatedUser.walletAddress,
            socialLinks: updatedUser.socialLinks,
            resume: updatedUser.resume,
            createdAt: updatedUser.createdAt,
            settings: updatedUser.settings,
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        if (error.code === 11000) {
             return res.status(400).json({ message: "This email is already in use by another account." });
        }
        res.status(500).json({ message: "Server error while updating profile." });
    }
};

const verifyEmailUpdate = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = req.user;

        if (!otp) {
            return res.status(400).json({ message: "OTP is required." });
        }

        const otpData = user.emailChangeOtp;

        if (!otpData || otpData.code !== otp || otpData.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        user.email = otpData.pendingEmail;
        user.emailChangeOtp = undefined;
        
        const updatedUser = await user.save();
        
        res.status(200).json({
            message: "Email updated successfully.",
            user: {
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic,
                provider: updatedUser.provider,
                walletAddress: updatedUser.walletAddress,
                createdAt: updatedUser.createdAt,
            }
        });

    } catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({ message: "Server error during email verification." });
    }
};

const resendEmailUpdateOtp = async (req, res) => {
    try {
        const user = req.user;
        const otpData = user.emailChangeOtp;

        if (!otpData || !otpData.pendingEmail) {
            return res.status(400).json({ message: "No pending email change to verify." });
        }

        const now = new Date();
        if (otpData.lastSentAt && now - otpData.lastSentAt < OTP_RESEND_INTERVAL) {
            const waitTime = Math.ceil((OTP_RESEND_INTERVAL - (now - otpData.lastSentAt)) / 1000);
            return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
        }

        const newOtpCode = generateOtp();
        user.emailChangeOtp.code = newOtpCode;
        user.emailChangeOtp.expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        user.emailChangeOtp.lastSentAt = now;

        await user.save();
        await sendEmail(otpData.pendingEmail, `Your new email verification OTP is: ${newOtpCode}`, "Verify Your New Email Address");

        res.status(200).json({ message: "A new OTP has been sent to the pending email address." });

    } catch (error) {
        console.error("Resend Email OTP Error:", error);
        res.status(500).json({ message: "Server error while resending OTP." });
    }
};

const generateLinkChallenge = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ message: "A valid wallet address is required." });
    }
    const nonce = crypto.randomBytes(32).toString("hex");
    const message = `Please sign this message to link this wallet to your Credexa account.\n\nNonce: ${nonce}`;
    const lowerCaseAddress = address.toLowerCase();
    challenges.set(lowerCaseAddress, message);
    setTimeout(() => {
        if (challenges.get(lowerCaseAddress) === message) {
            challenges.delete(lowerCaseAddress);
        }
    }, 5 * 60 * 1000); 
    res.json({ message });
  } catch (error) {
    console.error("Link Wallet Challenge Error:", error);
    res.status(500).json({ message: "Server error during challenge generation." });
  }
};

const linkWalletAddress = async (req, res) => {
    try {
        const { address, signature } = req.body;
        if (!address || !signature) {
            return res.status(400).json({ message: "Wallet address and signature are required." });
        }
        const lowerCaseAddress = address.toLowerCase();
        const originalMessage = challenges.get(lowerCaseAddress);
        if (!originalMessage) {
            return res.status(400).json({ message: "Challenge not found or expired. Please try again." });
        }
        challenges.delete(lowerCaseAddress); 
        const recoveredAddress = ethers.verifyMessage(originalMessage, signature);
        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
            return res.status(401).json({ message: "Signature verification failed." });
        }
        const user = req.user;
        user.walletAddress = lowerCaseAddress;
        await user.save();
        res.status(200).json({
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          profilePic: user.profilePic,
          provider: user.provider,
          walletAddress: user.walletAddress,
          socialLinks: user.socialLinks,
          resume: user.resume,
          createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Link Wallet Error:", error);
        res.status(500).json({ message: "Server error during wallet linking." });
    }
};

const checkUsernameAvailability = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user._id;
        
        if (!username || username.length < 3 || username.length > 30) {
            return res.status(400).json({ 
                available: false, 
                message: "Username must be between 3 and 30 characters." 
            });
        }
        
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                available: false, 
                message: "Username can only contain letters, numbers, hyphens, and underscores." 
            });
        }
        
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        const isAvailable = !existingUser || existingUser._id.toString() === currentUserId.toString();
        
        res.status(200).json({
            available: isAvailable,
            message: isAvailable ? "Username is available" : "Username is already taken"
        });
    } catch (error) {
        console.error("Check Username Error:", error);
        res.status(500).json({ message: "Server error while checking username." });
    }
};

const uploadResumeFile = async (req, res) => {
    try {
        const user = req.user;
        
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required." });
        }
        
        // Check file type
        const allowedTypes = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 
            'image/png', 
            'image/gif'
        ];
        
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ 
                message: "Invalid file type. Please upload PDF, DOC, DOCX, or image files only." 
            });
        }
        
        // Check file size (max 10MB)
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ message: "File size too large. Maximum 10MB allowed." });
        }
        
        let oldResumeInfo = null;
        
        // Store old resume info for deletion after successful upload
        if (user.resume && user.resume.fileUrl) {
            oldResumeInfo = {
                fileName: user.resume.fileName,
                fileUrl: user.resume.fileUrl
            };
        }
        
        // Upload new resume first
        const uniqueFilename = `resume_${user._id}_${nanoid()}.${req.file.originalname.split('.').pop()}`;
        const uploadResponse = await uploadResume(req.file.buffer, uniqueFilename);
        
        // Update user with new resume info
        user.resume = {
            fileName: req.file.originalname,
            fileUrl: uploadResponse.url,
            fileType: req.file.mimetype,
            uploadedAt: new Date(),
            fileSize: req.file.size
        };
        
        await user.save();

        // Log resume upload activity
        try {
          const activityType = oldResumeInfo ? 'resume_updated' : 'resume_uploaded';
          const description = oldResumeInfo ? 'Updated resume file' : 'Uploaded new resume';
          
          await ActivityTracker.logLearnerActivity(
            user._id,
            activityType,
            description,
            {
              fileName: req.file.originalname,
              fileSize: req.file.size,
              fileType: req.file.mimetype,
              wasReplacement: !!oldResumeInfo,
              oldFileName: oldResumeInfo?.fileName
            },
            req
          );
        } catch (activityError) {
          console.warn('Failed to log resume upload activity:', activityError.message);
        }

        // Delete old resume from ImageKit after successful save
        if (oldResumeInfo) {
            try {
                await deleteFile(oldResumeInfo.fileUrl);
                console.log(`Successfully deleted old resume: ${oldResumeInfo.fileName}`);
            } catch (deleteError) {
                console.error("Failed to delete old resume file:", deleteError);
                // Don't fail the request if old file deletion fails
            }
        }
        
        const message = oldResumeInfo 
            ? `Resume replaced successfully. Old resume "${oldResumeInfo.fileName}" has been deleted.`
            : "Resume uploaded successfully";
        
        res.status(200).json({
            message: message,
            resume: user.resume
        });
    } catch (error) {
        console.error("Upload Resume Error:", error);
        res.status(500).json({ message: "Server error while uploading resume." });
    }
};

const deleteResumeFile = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user.resume || !user.resume.fileUrl) {
            return res.status(404).json({ message: "No resume found to delete." });
        }
        
        await deleteFile(user.resume.fileUrl);
        user.resume = undefined;
        await user.save();
        
        res.status(200).json({ message: "Resume deleted successfully" });
    } catch (error) {
        console.error("Delete Resume Error:", error);
        res.status(500).json({ message: "Server error while deleting resume." });
    }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  verifyEmailUpdate,
  resendEmailUpdateOtp,
  generateLinkChallenge,
  linkWalletAddress,
  checkUsernameAvailability,
  uploadResumeFile,
  deleteResumeFile,
};

// --- Public/Employer APIs ---

// Helper to get display name and avatar based on privacy settings
const buildPublicIdentity = (user) => {
    const isProfilePublic = user.settings?.preferences?.privacy?.profileVisibility !== 'private';
    let displayName = 'Anonymous User';
    let displayAvatar = `https://avatar.vercel.sh/${user._id}.png`;

    if (isProfilePublic) {
        if (user.fullName?.firstName || user.fullName?.lastName) {
            const first = user.fullName?.firstName || '';
            const last = user.fullName?.lastName || '';
            displayName = `${first} ${last}`.trim() || displayName;
        }
        displayAvatar = user.profileImage || user.profilePic || user.avatar || displayAvatar;
    }
    return { displayName, displayAvatar, isProfilePublic };
};

// GET /api/users/search?q=&skills=react,node&limit=&page=
// Returns a lightweight list of learner candidates for employer search
const searchLearners = async (req, res) => {
    try {
        let q = (req.query.q || '').toString().trim();
        if (q.startsWith('@')) q = q.slice(1);
        const skillsParam = (req.query.skills || '').toString().trim();
        const skills = skillsParam ? skillsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
        const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 100, 100));
        const page = Math.max(1, parseInt(req.query.page) || 1);

        // Base query for learners only
        const userQuery = { role: 'learner' };
        // If query provided, add name/username filters
        if (q) {
            const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedQ, 'i');
            
            userQuery.$or = [
                { 'username': regex },
                { 'fullName.firstName': regex },
                { 'fullName.lastName': regex },
                // Match full name (first + last)
                { $expr: { 
                    $regexMatch: { 
                        input: { $concat: ['$fullName.firstName', ' ', '$fullName.lastName'] }, 
                        regex: escapedQ, 
                        options: 'i' 
                    } 
                }}
            ];
        }

        const users = await User.find(userQuery)
            .select('fullName username email institute profileImage profilePic avatar settings role')
            .lean();

        if (!users.length) {
            return res.json({ success: true, total: 0, candidates: [] });
        }

        const userIds = users.map(u => u._id);

        // First, get all credentials to identify users who have credentials
        const allCredentialsQuery = { user: { $in: userIds } };
        const allCredentials = await Credential.find(allCredentialsQuery)
            .select('user skills type createdAt creditPoints nsqfLevel transactionHash title issuer')
            .lean();

        // Get unique user IDs who have at least one credential
        const usersWithCredentials = [...new Set(allCredentials.map(c => c.user.toString()))];
        
        if (usersWithCredentials.length === 0) {
            return res.json({ success: true, total: 0, candidates: [] });
        }

        // Filter users to only include those who have credentials
        const filteredUsers = users.filter(u => usersWithCredentials.includes(u._id.toString()));
        
        if (filteredUsers.length === 0) {
            return res.json({ success: true, total: 0, candidates: [] });
        }

        // Now apply skill filtering if needed
        const credQuery = { user: { $in: usersWithCredentials.map(id => id) } };
        if (skills.length) {
            credQuery.skills = { $in: skills };
        }

        const credentials = await Credential.find(credQuery)
            .select('user skills type createdAt creditPoints nsqfLevel transactionHash title issuer')
            .lean();

        // Group credentials by user
        const credsByUser = new Map();
        for (const c of credentials) {
            const key = c.user.toString();
            if (!credsByUser.has(key)) credsByUser.set(key, []);
            credsByUser.get(key).push(c);
        }

        // Compose candidate list - only process users who we know have credentials
        const rawCandidates = filteredUsers.map(u => {
            const { displayName, displayAvatar, isProfilePublic } = buildPublicIdentity(u);
            
            // Respect privacy settings
            const showInLeaderboard = u.settings?.preferences?.privacy?.showInLeaderboard !== false;
            if (!showInLeaderboard) return null;

            const uCreds = credsByUser.get(u._id.toString()) || [];
            
            // This should never happen now since we pre-filtered, but keep as safety check
            if (uCreds.length === 0) {
                return null;
            }

            // Unique skills and top skill
            const skillCounts = {};
            for (const c of uCreds) {
                (c.skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
            }
            const uniqueSkills = Object.keys(skillCounts);
            const topSkill = uniqueSkills.sort((a, b) => (skillCounts[b] - skillCounts[a]))[0] || 'General';

            // Points to derive simple scores
            const points = calculateUserPoints(uCreds);
            const credentialCount = uCreds.length;
            const perf = Math.min(100, Math.max(60, Math.floor(points / 50) + 60));
            const eff = Math.min(120, Math.max(70, credentialCount * 8 + 70));
            const soc = Math.min(120, Math.max(70, uniqueSkills.length * 3 + 70));

            // Prefer saved unique username; fallback to derived handle
            const first = u.fullName?.firstName || '';
            const last = u.fullName?.lastName || '';
            const fallbackHandle = (first + last).trim().toLowerCase() || (u.email ? u.email.split('@')[0] : `user_${u._id.toString().slice(-6)}`);
            
            // Check if username is meaningful (not auto-generated)
            const originalUsername = (u.username || '').toLowerCase();
            const nameCombined = (first + last).toLowerCase().replace(/\s+/g, '');
            const isUsernameAutoGenerated = !originalUsername || 
                                          originalUsername === nameCombined || 
                                          originalUsername === 'unknownuser' ||
                                          originalUsername.startsWith('user_') ||
                                          originalUsername === (u.email ? u.email.split('@')[0] : '');
            
            // Only use the username if it's not auto-generated, otherwise use fallback
            const handle = !isUsernameAutoGenerated ? originalUsername : fallbackHandle;

            return {
                id: u._id.toString(),
                name: displayName,
                username: handle,
                hasRealUsername: !isUsernameAutoGenerated,
                avatarUrl: displayAvatar,
                role: `${topSkill} Professional`,
                scores: { efficiency: eff, social: soc, performance: perf },
                topSkills: uniqueSkills.sort((a,b) => skillCounts[b]-skillCounts[a]).slice(0, 3),
                onChainVerified: uCreds.some(c => !!c.transactionHash),
            };
        }).filter(Boolean);

        // Simple pagination
        const start = (page - 1) * limit;
        const paged = rawCandidates.slice(start, start + limit);

        res.json({ success: true, total: rawCandidates.length, page, limit, candidates: paged });
    } catch (err) {
        console.error('Search learners error:', err);
        res.status(500).json({ success: false, message: 'Failed to search learners' });
    }
};

// GET /api/users/:id/public-profile
// Returns public profile summary with verified credentials and skills analytics
const getPublicProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId)
            .select('fullName username email phone institute profileImage profilePic avatar settings role projects resume')
            .lean();
        if (!user || user.role !== 'learner') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { displayName, displayAvatar, isProfilePublic } = buildPublicIdentity(user);
        if (!isProfilePublic) {
            return res.status(403).json({ success: false, message: 'This profile is private' });
        }

        // Fetch credentials (prefer verified for employer view)
        const creds = await Credential.find({ user: user._id })
            .select('title issuer issueDate skills status transactionHash')
            .lean();

        const verifiedCreds = creds.filter(c => c.status === 'verified');

        // Build skills analytics
        const skillCounts = {};
        creds.forEach(c => (c.skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
        const entries = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
        const topSkills = entries.slice(0, 6);
        const maxCount = topSkills[0]?.[1] || 1;
        const radar = topSkills.map(([skill, count]) => ({ subject: skill, A: Math.round((count / maxCount) * 100), fullMark: 100 }));

        // Derive simple scores
        const points = calculateUserPoints(creds);
        const credentialCount = creds.length;
        const perf = Math.min(100, Math.max(60, Math.floor(points / 50) + 60));
        const eff = Math.min(120, Math.max(70, credentialCount * 8 + 70));
        const soc = Math.min(120, Math.max(70, Object.keys(skillCounts).length * 3 + 70));

    // Privacy for email exposure
        const showEmail = user.settings?.privacy?.showEmail === true;

        res.json({
            success: true,
            candidate: {
                id: user._id.toString(),
                name: displayName,
                username: user.username || ((user.fullName?.firstName || '') + (user.fullName?.lastName || '')),
                avatarUrl: displayAvatar,
                role: `${(entries[0]?.[0] || 'General')} Professional`,
                scores: { efficiency: eff, social: soc, performance: perf },
                skills: radar,
                topSkills: entries.slice(0, 3).map(e => e[0]),
                email: showEmail ? user.email : null,
                phone: user.phone || null,
                resume: user.resume || null,
                projects: user.projects || [],
                verifiedCredentials: verifiedCreds.map(c => ({ id: `${c._id}`, issuer: c.issuer, name: c.title, date: c.issueDate })),
                onChainVerified: creds.some(c => !!c.transactionHash),
            }
        });
    } catch (err) {
        console.error('Get public profile error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch public profile' });
    }
};

// GET /api/users/:id/public-profile-secure (protected)
// For authenticated roles (employer/institute) we expose email regardless of user's showEmail flag
const getPublicProfileSecure = async (req, res) => {
    try {
        const requester = req.user; // set by protect middleware
        if (!requester) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.params.id;
        const user = await User.findById(userId)
            .select('fullName username email phone institute profileImage profilePic avatar settings role projects resume')
            .lean();
        if (!user || user.role !== 'learner') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { displayName, displayAvatar, isProfilePublic } = buildPublicIdentity(user);
        if (!isProfilePublic) {
            return res.status(403).json({ success: false, message: 'This profile is private' });
        }

        const creds = await Credential.find({ user: user._id })
            .select('title issuer issueDate skills status transactionHash')
            .lean();
        const verifiedCreds = creds.filter(c => c.status === 'verified');

        const skillCounts = {};
        creds.forEach(c => (c.skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
        const entries = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
        const topSkills = entries.slice(0, 6);
        const maxCount = topSkills[0]?.[1] || 1;
        const radar = topSkills.map(([skill, count]) => ({ subject: skill, A: Math.round((count / maxCount) * 100), fullMark: 100 }));

        const points = calculateUserPoints(creds);
        const credentialCount = creds.length;
        const perf = Math.min(100, Math.max(60, Math.floor(points / 50) + 60));
        const eff = Math.min(120, Math.max(70, credentialCount * 8 + 70));
        const soc = Math.min(120, Math.max(70, Object.keys(skillCounts).length * 3 + 70));

        // Expose email to employer/institute, otherwise fallback to showEmail
        const requesterRole = requester.role;
        const canSeeEmail = requesterRole === 'employer' || requesterRole === 'institute' || user.settings?.privacy?.showEmail === true;

        res.json({
            success: true,
            candidate: {
                id: user._id.toString(),
                name: displayName,
                username: user.username || ((user.fullName?.firstName || '') + (user.fullName?.lastName || '')),
                avatarUrl: displayAvatar,
                role: `${(entries[0]?.[0] || 'General')} Professional`,
                scores: { efficiency: eff, social: soc, performance: perf },
                skills: radar,
                topSkills: entries.slice(0, 3).map(e => e[0]),
                email: canSeeEmail ? user.email : null,
                phone: user.phone || null,
                resume: user.resume || null,
                projects: user.projects || [],
                verifiedCredentials: verifiedCreds.map(c => ({ id: `${c._id}`, issuer: c.issuer, name: c.title, date: c.issueDate })),
                onChainVerified: creds.some(c => !!c.transactionHash),
            }
        });
    } catch (err) {
        console.error('Get secure public profile error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch public profile' });
    }
};

module.exports.getPublicProfileSecure = getPublicProfileSecure;

// Get student credentials for institute dashboard
const getUserCredentials = async (req, res) => {
    try {
        const { id } = req.params; // Changed from userId to id

        // Find the user
        const user = await User.findById(id)
            .select('fullName email skills certifications experience location phone bio resume institute');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get the current logged-in institute's name
        const currentInstituteName = req.user?.institute?.name;
        
        if (!currentInstituteName) {
            return res.status(400).json({ success: false, message: 'Institute information not found' });
        }

        // Get user's credentials - filter by current institute and user
        const credentials = await Credential.find({ 
            $and: [
                {
                    $or: [
                        { user: user._id },
                        { userId: user._id }
                    ]
                },
                { issuer: { $regex: new RegExp(`^${currentInstituteName}$`, 'i') } } // Only show credentials issued by current institute
            ]
        })
            .select('title issuer issueDate description status verified transactionHash skills nsqfLevel type imageUrl credentialUrl issuerLogo credentialId issuerVerification')
            .sort({ issueDate: -1 });

        // Process skills data - generate from filtered credentials (only from current institute)
        const skillsData = [];
        const skillsMap = new Map();
        
        // Extract skills from filtered credentials
        credentials.forEach(credential => {
            if (credential.skills && credential.skills.length > 0) {
                credential.skills.forEach(skill => {
                    const count = skillsMap.get(skill) || 0;
                    skillsMap.set(skill, count + 1);
                });
            }
        });
        
        // Convert to radar chart format and limit to top 6 skills
        Array.from(skillsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .forEach(([skill, count]) => {
                skillsData.push({
                    skill: skill,
                    value: Math.min(count * 20, 100) // Scale to 100 max, each credential adds 20 points
                });
            });

        // Format the response
        const response = {
            success: true,
            student: {
                id: user._id.toString(),
                name: `${user.fullName?.firstName || ''} ${user.fullName?.lastName || ''}`.trim() || 'N/A',
                fullName: user.fullName || { firstName: '', lastName: '' },
                email: user.email,
                phone: user.phone,
                location: user.location || '',
                bio: user.bio || '',
                skills: user.skills || {},
                skillsData: skillsData, // Formatted for radar chart
                certifications: user.certifications || [],
                experience: user.experience || [],
                resumeUrl: user.resume?.fileUrl || null,
                resumeFileName: user.resume?.fileName || null,
                institute: user.institute || {
                    name: "Unknown Institute",
                    aishe_code: "UNK001"
                },
                credentials: credentials.map(cred => ({
                    _id: cred._id.toString(),
                    title: cred.title,
                    issuer: cred.issuer,
                    type: cred.type || 'certificate',
                    issueDate: cred.issueDate,
                    description: cred.description || '',
                    skills: cred.skills || [],
                    nsqfLevel: cred.nsqfLevel,
                    status: cred.status || (cred.verified ? 'verified' : 'pending'), // Handle both status field and verified field
                    issuerVerificationStatus: cred.issuerVerification?.status || 'pending', // Add issuer verification status
                    imageUrl: cred.imageUrl || null,
                    credentialUrl: cred.credentialUrl || null,
                    issuerLogo: cred.issuerLogo || null,
                    credentialId: cred.credentialId || null
                }))
            }
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Get user credentials error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user credentials' });
    }
};

// Extend exports
module.exports.searchLearners = searchLearners;
module.exports.getPublicProfile = getPublicProfile;
module.exports.getUserCredentials = getUserCredentials;
