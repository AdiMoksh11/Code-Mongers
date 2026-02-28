const User = require('../models/userModel');
const Credential = require('../models/credentialModel');
const ActivityTracker = require('../utils/activityTracker');
const fs = require('fs').promises;
const path = require('path');

// Load colleges data
let collegesData = [];

const loadCollegesData = async () => {
  try {
    if (collegesData.length === 0) {
      const filePath = path.join(__dirname, '../..', 'indian_colleges.json');
      const data = await fs.readFile(filePath, 'utf8');
      collegesData = JSON.parse(data);
    }
    return collegesData;
  } catch (error) {
    console.error('Error loading colleges data:', error);
    return [];
  }
};

// Search colleges with autocomplete
const searchColleges = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const colleges = await loadCollegesData();
    const searchTerm = query.toLowerCase();

    // Search in name field (case-insensitive) - includes both traditional institutions and EdTech platforms
    const filteredColleges = colleges
      .filter(college => 
        college.name && 
        college.name.toLowerCase().includes(searchTerm)
      )
      .slice(0, parseInt(limit))
      .map(college => {
        // Handle both traditional institutions and EdTech platforms
        if (college.platform_type) {
          // EdTech platform
          return {
            name: college.name,
            website: college.website,
            platform_type: college.platform_type,
            year_of_establishment: college.year_of_establishment,
            displayName: `${college.name} (${college.platform_type === 'edtech' ? 'EdTech Platform' : 'Platform'})` // For UI display
          };
        } else {
          // Traditional institution
          return {
            aishe_code: college.aishe_code,
            name: college.name,
            state: college.state,
            district: college.district,
            university_name: college.university_name,
            displayName: `${college.name}, ${college.district || college.state}` // For UI display
          };
        }
      });

    res.json(filteredColleges);
  } catch (error) {
    console.error('Error searching credential issuers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching credential issuers' 
    });
  }
};

// Validate college exists in database
const validateCollege = async (aishe_code) => {
  const colleges = await loadCollegesData();
  return colleges.find(college => college.aishe_code === aishe_code);
};

// Update user institute
const updateUserInstitute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      aishe_code, 
      name, 
      state, 
      district, 
      university_name,
      website,
      platform_type,
      year_of_establishment 
    } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const colleges = await loadCollegesData();
    let validCredentialIssuer = null;
    let instituteData = {};

    // Check if it's a traditional institution (has AISHE code)
    if (aishe_code) {
      // Traditional institution
      if (!state || !district) {
        return res.status(400).json({
          success: false,
          message: 'State and district are required for traditional institutions'
        });
      }

      // Validate against colleges database
      validCredentialIssuer = colleges.find(college => college.aishe_code === aishe_code);
      if (!validCredentialIssuer) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid institution from the dropdown'
        });
      }

      instituteData = {
        aishe_code,
        name,
        state,
        district,
        university_name: university_name || validCredentialIssuer.university_name,
        addedAt: new Date(),
        isVerified: true, // Verified because it's from our database
        issuerType: 'university'
      };
    } else {
      // EdTech platform
      if (!website) {
        return res.status(400).json({
          success: false,
          message: 'Website is required for EdTech platforms'
        });
      }

      // Validate against colleges database (platforms are also in the same file)
      validCredentialIssuer = colleges.find(college => 
        college.name === name && college.platform_type
      );
      if (!validCredentialIssuer) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid platform from the dropdown'
        });
      }

      instituteData = {
        name,
        website,
        platform_type: platform_type || validCredentialIssuer.platform_type,
        year_of_establishment: year_of_establishment || validCredentialIssuer.year_of_establishment,
        addedAt: new Date(),
        isVerified: true, // Verified because it's from our database
        issuerType: 'edtech'
      };
    }

    // Update user institute
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          institute: instituteData
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Institute updated successfully',
      institute: user.institute
    });

  } catch (error) {
    console.error('Error updating user institute:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating institute information'
    });
  }
};

// Get user institute
const getUserInstitute = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('institute');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      institute: user.institute || null
    });

  } catch (error) {
    console.error('Error fetching user institute:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching institute information'
    });
  }
};

// Add manual institute (pending admin approval)
const addManualInstitute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      state, 
      district, 
      university_name, 
      reason, 
      issuerType,
      website,
      year_of_establishment,
      platform_type 
    } = req.body;

    // Validation based on issuer type
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (issuerType === 'edtech') {
      // For EdTech platforms, website is required
      if (!website) {
        return res.status(400).json({
          success: false,
          message: 'Website is required for EdTech platforms'
        });
      }
    } else {
      // For traditional institutions, state and district are required
      if (!state || !district) {
        return res.status(400).json({
          success: false,
          message: 'State and district are required for traditional institutions'
        });
      }
    }

    // Generate temporary AISHE code for manual entries (only for traditional institutions)
    const tempAisheCode = issuerType === 'university' ? `MANUAL-${Date.now()}-${userId.toString().substring(0, 6)}` : undefined;

    // Build institute object based on type
    const instituteData = {
      name,
      addedAt: new Date(),
      isVerified: false, // Manual entry pending approval
      submissionReason: reason || 'Credential issuer not found in database',
      issuerType: issuerType || 'university'
    };

    // Add fields specific to traditional institutions
    if (issuerType === 'university') {
      instituteData.aishe_code = tempAisheCode;
      instituteData.state = state;
      instituteData.district = district;
      instituteData.university_name = university_name || 'Not specified';
    }

    // Add fields specific to EdTech platforms
    if (issuerType === 'edtech') {
      instituteData.website = website;
      instituteData.year_of_establishment = year_of_establishment;
      instituteData.platform_type = platform_type || 'edtech';
    }

    // Update user institute with manual entry (unverified)
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          institute: instituteData
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Send notification to admin for approval
    console.log(`Manual institute submission from user ${userId}:`, {
      name, state, district, university_name, reason
    });

    res.json({
      success: true,
      message: 'Institute submission received. It will be reviewed by our team within 2-3 business days.',
      institute: user.institute
    });

  } catch (error) {
    console.error('Error adding manual institute:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting institute information'
    });
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteName = user.institute.name;
    console.log('Fetching dashboard stats for institution:', instituteName);

    if (!instituteName) {
      return res.status(400).json({
        success: false,
        message: 'Institute name is required'
      });
    }

    // Get students count - only unique students who have credentials from this institution
    const studentsWithCredentials = await Credential.aggregate([
      { $match: { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } } },
      { $group: { _id: '$user' } }
    ]);
    const studentsCount = studentsWithCredentials.length;

    // Get credentials issued count
    const credentialsCount = await Credential.countDocuments({
      issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }
    });

    // Get current month stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const credentialsThisMonth = await Credential.countDocuments({
      issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') },
      createdAt: { $gte: currentMonth }
    });

    // Get students who received credentials this month
    const studentsThisMonthWithCredentials = await Credential.aggregate([
      { 
        $match: { 
          issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') },
          createdAt: { $gte: currentMonth }
        } 
      },
      { $group: { _id: '$user' } },
      { $count: 'studentsThisMonth' }
    ]);
    const studentsThisMonth = studentsThisMonthWithCredentials.length > 0 ? studentsThisMonthWithCredentials[0].studentsThisMonth : 0;

    // Get count of issuer-verified credentials
    const verifiedCredentialsCount = await Credential.countDocuments({
      issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') },
      'issuerVerification.status': 'verified'
    });

    console.log(`Dashboard stats: ${studentsCount} students, ${credentialsCount} credentials, ${verifiedCredentialsCount} verified`);

    res.json({
      success: true,
      stats: {
        totalStudents: studentsCount,
        studentsChange: `+${studentsThisMonth} this month`,
        credentialsIssued: credentialsCount,
        credentialsChange: `+${credentialsThisMonth} this month`,
        activeCourses: 12, // Mock data - implement course model if needed
        coursesChange: "+2 new courses",
        nsqfCompliance: "98.5%",
        complianceChange: "+2.3% improvement"
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// Get Students
const getStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteName = user.institute.name;
    console.log('Fetching students for institution:', instituteName);
    
    if (!instituteName) {
      return res.status(400).json({
        success: false,
        message: 'Institute name is required'
      });
    }

    // Get pagination and search parameters
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    console.log('Search parameters:', { page, limit, search });

    // Build aggregation pipeline to get only students who have credentials from this institution
    let matchStage = { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } };
    
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $group: {
          _id: '$user',
          userName: { $first: '$userData.username' },
          userEmail: { $first: '$userData.email' },
          userFullName: { $first: '$userData.fullName' },
          userProfilePic: { $first: '$userData.profilePic' },
          userVerified: { $first: '$userData.isVerified' },
          userCreatedAt: { $first: '$userData.createdAt' },
          credentialsFromThisInstitute: { $sum: 1 },
          latestCredential: { $max: '$createdAt' }
        }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $addFields: {
          fullNameCombined: {
            $concat: [
              { $ifNull: ['$userFullName.firstName', ''] },
              ' ',
              { $ifNull: ['$userFullName.lastName', ''] }
            ]
          }
        }
      });
      
      pipeline.push({
        $match: {
          $or: [
            { 'userFullName.firstName': { $regex: search, $options: 'i' } },
            { 'userFullName.lastName': { $regex: search, $options: 'i' } },
            { fullNameCombined: { $regex: search, $options: 'i' } },
            { userEmail: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { latestCredential: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    );

    // Debug: Let's see what credentials we're matching first
    const credentialsFromInstitute = await Credential.find({ issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } }).select('user issuer createdAt');
    console.log(`Found ${credentialsFromInstitute.length} credentials from ${instituteName}`);
    
    // Let's see unique user IDs
    const uniqueUserIds = [...new Set(credentialsFromInstitute.map(c => c.user.toString()))];
    console.log(`Unique user IDs: ${uniqueUserIds.length}`, uniqueUserIds);
    
    // Check which users actually exist in the database
    const existingUsers = await User.find({ _id: { $in: uniqueUserIds } }).select('_id email fullName');
    console.log(`Existing users: ${existingUsers.length}`);
    console.log('Existing user IDs:', existingUsers.map(u => u._id.toString()));
    
    const missingUserIds = uniqueUserIds.filter(id => !existingUsers.find(u => u._id.toString() === id));
    console.log(`Missing users: ${missingUserIds.length}`, missingUserIds);
    
    // Clean up orphaned credentials (remove credentials for non-existent users)
    if (missingUserIds.length > 0) {
      console.log('Cleaning up orphaned credentials...');
      const deleteResult = await Credential.deleteMany({
        user: { $in: missingUserIds },
        issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }
      });
      console.log(`Deleted ${deleteResult.deletedCount} orphaned credentials`);
      
      // Update the credentials list after cleanup
      const cleanedCredentials = await Credential.find({ issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } }).select('user issuer createdAt');
      console.log(`After cleanup: ${cleanedCredentials.length} credentials remaining`);
    }

    const studentsWithCredentials = await Credential.aggregate(pipeline);
    console.log(`Pipeline returned ${studentsWithCredentials.length} students`);
    console.log('Pipeline user IDs:', studentsWithCredentials.map(s => s._id.toString()));

    // Get total count for pagination
    const totalPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' }
    ];
    
    // Add search filter to total pipeline if provided
    if (search) {
      totalPipeline.push({
        $addFields: {
          fullNameCombined: {
            $concat: [
              { $ifNull: ['$userData.fullName.firstName', ''] },
              ' ',
              { $ifNull: ['$userData.fullName.lastName', ''] }
            ]
          }
        }
      });
      
      totalPipeline.push({
        $match: {
          $or: [
            { 'userData.fullName.firstName': { $regex: search, $options: 'i' } },
            { 'userData.fullName.lastName': { $regex: search, $options: 'i' } },
            { fullNameCombined: { $regex: search, $options: 'i' } },
            { 'userData.email': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }
    
    totalPipeline.push({ $group: { _id: '$user' } });

    const totalResult = await Credential.aggregate(totalPipeline);
    const total = totalResult.length; // Count the number of groups (unique students)
    const totalPages = Math.ceil(total / limitNum);

    // Transform the data for frontend consumption
    const studentsData = studentsWithCredentials.map(student => ({
      _id: student._id,
      fullName: student.userFullName || { firstName: 'N/A', lastName: 'N/A' },
      email: student.userEmail || 'N/A',
      profilePic: student.userProfilePic || '',
      isVerified: student.userVerified || false,
      createdAt: student.userCreatedAt,
      credentialsCount: student.credentialsFromThisInstitute
    }));

    console.log(`Found ${studentsData.length} students with credentials from ${instituteName}`);

    res.json({
      success: true,
      students: studentsData,
      totalPages,
      currentPage: pageNum,
      total
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
};

// Get Credentials
const getCredentials = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;

    // Build query for credentials issued by this institute
    const query = {
      issuer: { $regex: new RegExp(`^${user.institute.name}$`, 'i') }
    };

    // Handle search and status filtering with proper $and logic
    const conditions = [];
    
    if (search) {
      conditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (type) query.type = type;
    
    if (status) {
      if (status === 'pending') {
        // For pending, include both documents without issuerVerification and those with pending status
        conditions.push({
          $or: [
            { 'issuerVerification': { $exists: false } },
            { 'issuerVerification.status': 'pending' }
          ]
        });
      } else {
        query['issuerVerification.status'] = status;
      }
    }

    // Combine conditions with $and if there are multiple conditions
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    const credentials = await Credential.find(query)
      .populate('user', 'fullName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Credential.countDocuments(query);

    res.json({
      success: true,
      credentials,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credentials'
    });
  }
};

// Issue Credential (Manual form submission)
const issueCredential = async (req, res) => {
  try {
    const userId = req.user.id;
    const issuer = await User.findById(userId).select('institute fullName');
    
    if (!issuer || !issuer.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const {
      studentEmail,
      studentFirstName,
      studentLastName,
      credentialTitle,
      courseCode,
      description,
      nsqfLevel,
      completionDate,
      issueDate,
      certificateUrl,
      skills = [],
      credentialType = 'certificate',
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!studentEmail || !credentialTitle || !certificateUrl) {
      return res.status(400).json({
        success: false,
        message: 'Student email, credential title, and certificate URL are required'
      });
    }

    // Validate certificate URL
    const axios = require('axios');
    try {
      const response = await axios.head(certificateUrl, { 
        timeout: 15000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Credexa-Bot/1.0'
        },
        validateStatus: (status) => status < 500
      });

      const contentType = response.headers['content-type'] || '';
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      
      if (!contentType) {
        const urlLower = certificateUrl.toLowerCase();
        if (!urlLower.includes('.pdf') && !urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return res.status(400).json({
            success: false,
            message: 'Unable to determine file type. Please ensure URL points to a PDF or image file'
          });
        }
      } else if (!validTypes.some(type => contentType.includes(type))) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type: ${contentType}. Must be PDF, JPEG, PNG, GIF, or WebP`
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Certificate URL not accessible: ${error.message}`
      });
    }

    // Find or create user by email
    let user = await User.findOne({ email: studentEmail.toLowerCase() });
    
    if (!user) {
      // Create new user if not found
      user = new User({
        email: studentEmail.toLowerCase(),
        fullName: {
          firstName: studentFirstName || 'Unknown',
          lastName: studentLastName || 'User'
        },
        role: 'learner',
        isVerified: false
      });
      await user.save();
    }

    // Create credential
    const newCredential = new Credential({
      user: user._id,
      title: credentialTitle,
      issuer: issuer.institute.name,
      type: credentialType,
      description: description || '',
      skills: skills || [],
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      completionDate: completionDate ? new Date(completionDate) : null,
      nsqfLevel: nsqfLevel || 1,
      courseCode: courseCode || '',
      status: 'verified', // Institute-issued credentials are automatically verified
      issuerLogo: issuer.institute.logo || '',
      certificateUrl: certificateUrl,
      metadata: metadata,
      issuerVerification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: issuer._id
      }
    });

    await newCredential.save();

    // Log activity for issuer (different message than API)
    try {
      await ActivityTracker.logActivity({
        userId: issuer._id,
        userRole: 'institute',
        activityType: 'credential_issued',
        description: `Manually issued credential "${credentialTitle}" to ${studentEmail}`,
        metadata: {
          credentialTitle,
          studentEmail,
          studentName: user.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : 'N/A',
          credentialType,
          nsqfLevel,
          skills: skills || [],
          manualSubmission: true,
          certificateUrl
        },
        relatedEntityType: 'credential',
        relatedEntityId: newCredential._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
    }

    res.status(201).json({
      success: true,
      message: 'Credential issued successfully',
      credential: {
        _id: newCredential._id,
        title: newCredential.title,
        issuer: newCredential.issuer,
        type: newCredential.type,
        status: newCredential.status,
        issueDate: newCredential.issueDate,
        student: {
          email: user.email,
          name: user.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : 'N/A'
        }
      }
    });

  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({
      success: false,
      message: 'Error issuing credential'
    });
  }
};

// Get Courses (Mock implementation - implement Course model if needed)
const getCourses = async (req, res) => {
  try {
    // Mock data for now
    const courses = [
      {
        _id: '1',
        title: 'Data Science Fundamentals',
        code: 'DS101',
        description: 'Introduction to data science concepts',
        credits: 4,
        duration: '12 weeks',
        status: 'active',
        studentsEnrolled: 45,
        nsqfLevel: 5,
        createdAt: new Date('2024-01-15')
      },
      {
        _id: '2',
        title: 'Web Development Bootcamp',
        code: 'WD201',
        description: 'Full-stack web development course',
        credits: 6,
        duration: '16 weeks',
        status: 'active',
        studentsEnrolled: 32,
        nsqfLevel: 4,
        createdAt: new Date('2024-02-01')
      }
    ];

    res.json({
      success: true,
      courses,
      total: courses.length
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
};

// Add Course (Mock implementation)
const addCourse = async (req, res) => {
  try {
    const { title, code, description, credits, duration, nsqfLevel } = req.body;

    if (!title || !code) {
      return res.status(400).json({
        success: false,
        message: 'Title and code are required'
      });
    }

    // Mock response
    const newCourse = {
      _id: Date.now().toString(),
      title,
      code,
      description,
      credits,
      duration,
      nsqfLevel,
      status: 'active',
      studentsEnrolled: 0,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Course added successfully',
      course: newCourse
    });

  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding course'
    });
  }
};

// Update Course (Mock implementation)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: { _id: id, ...updateData }
    });

  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
};

// Delete Course (Mock implementation)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
};

// Get Analytics - Shows only students who have received credentials from this institution
const getAnalytics = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('institute');
      if (!user || !user.institute) {
        return res.status(400).json({ success: false, message: 'Institute information not found' });
      }
      const instituteName = user.institute.name;
      if (!instituteName) {
        return res.status(400).json({ success: false, message: 'Institute name is required' });
      }

      // Include all credentials issued by this institution in analytics
      const credentialsIssued = await Credential.countDocuments({ issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } });
      const studentsWithCredentials = await Credential.distinct('user', { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } });
      const totalStudents = studentsWithCredentials.length;
      const activeStudentIds = await Credential.distinct('user', { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
      const activeStudents = activeStudentIds.length;
      const graduatedStudents = totalStudents;

      // Get students who received credentials this month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const studentsThisMonth = await Credential.distinct('user', { 
        issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') },
        createdAt: { $gte: currentMonth }
      });
      const newThisMonth = studentsThisMonth.length;

      // Monthly growth for last 6 months
      const monthlyGrowth = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);
        const credentialsInMonth = await Credential.countDocuments({ issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }, createdAt: { $gte: startDate, $lte: endDate } });
        const uniqueStudentsInMonth = await Credential.distinct('user', { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }, createdAt: { $gte: startDate, $lte: endDate } });
        monthlyGrowth.push({ month: monthNames[month], students: uniqueStudentsInMonth.length, credentials: credentialsInMonth });
      }

      // Skills distribution
      const skillsAggregation = await Credential.aggregate([
        { $match: { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } } },
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { skill: '$_id', count: 1, _id: 0 } }
      ]);

      // NSQF levels distribution
      const nsqfLevelsAggregation = await Credential.aggregate([
        { $match: { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }, nsqfLevel: { $exists: true, $ne: null } } },
        { $group: { _id: '$nsqfLevel', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { level: { $concat: ['Level ', { $toString: '$_id' }] }, count: 1, _id: 0 } }
      ]);

      const analytics = {
        overview: {
          totalStudents,
          activeStudents,
          graduatedStudents,
          credentialsIssued,
          newThisMonth
        },
        monthlyGrowth,
        skillsDistribution: skillsAggregation,
        nsqfLevels: nsqfLevelsAggregation
      };

      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
  };
// ...existing code...

// Get Compliance Report
const getComplianceReport = async (req, res) => {
  try {
    // Mock compliance data
    const compliance = {
      overallScore: 98.5,
      lastUpdated: new Date(),
      categories: [
        {
          name: 'NSQF Alignment',
          score: 99.2,
          status: 'excellent',
          description: 'All courses properly mapped to NSQF levels'
        },
        {
          name: 'Digital Verification',
          score: 98.8,
          status: 'excellent',
          description: 'All credentials digitally verified and blockchain anchored'
        },
        {
          name: 'Student Progress Tracking',
          score: 97.1,
          status: 'good',
          description: 'Comprehensive tracking of student skill development'
        },
        {
          name: 'Regulatory Reporting',
          score: 99.0,
          status: 'excellent',
          description: 'Automated reports submitted to NCVET and other bodies'
        }
      ],
      recentAudits: [
        {
          date: new Date('2024-11-15'),
          type: 'NCVET Compliance',
          status: 'passed',
          score: 98.5
        },
        {
          date: new Date('2024-10-20'),
          type: 'Quality Assessment',
          status: 'passed',
          score: 97.8
        }
      ]
    };

    res.json({
      success: true,
      compliance
    });

  } catch (error) {
    console.error('Error fetching compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance report'
    });
  }
};

// Get Recent Activities
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    // Get recent credentials issued
    const Credential = require('../models/credentialModel');
    const recentCredentials = await Credential.find({
      issuer: { $regex: new RegExp(`^${user.institute.name}$`, 'i') }
    })
    .populate('user', 'fullName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Format activities (filter out credentials with null users)
    const activities = recentCredentials
      .filter(cred => cred.user) // Remove credentials with null users
      .map(cred => {
        const userName = cred.user.fullName 
          ? `${cred.user.fullName.firstName} ${cred.user.fullName.lastName}`
          : cred.user.email || 'Unknown User';
        
        return {
          action: `${cred.type} "${cred.title}" issued to ${userName}`,
          time: formatTimeAgo(cred.createdAt),
          type: 'issuance'
        };
      });

    // Add mock activities
    const mockActivities = [
      {
        action: "New course 'AI Fundamentals' approved",
        time: "3 hours ago",
        type: "course"
      },
      {
        action: "NSQF compliance report submitted",
        time: "1 day ago",
        type: "compliance"
      }
    ];

    const allActivities = [...activities, ...mockActivities].slice(0, 10);

    res.json({
      success: true,
      activities: allActivities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities'
    });
  }
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 60) {
    return `${diffInMins} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
};

// Get Students with Credentials - Shows only students who have received credentials from this institution
const getStudentsWithCredentials = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteName = user.institute.name;
    console.log('Fetching students for institution:', instituteName);
    
    if (!instituteName) {
      return res.status(400).json({
        success: false,
        message: 'Institute name is required'
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get all credentials issued by this institution with user details
    const credentialsWithUsers = await Credential.aggregate([
      { $match: { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $group: {
          _id: '$user',
          userName: { $first: '$userData.username' },
          userEmail: { $first: '$userData.email' },
          userFullName: { $first: '$userData.fullName' },
          userProfilePic: { $first: '$userData.profilePic' },
          userVerified: { $first: '$userData.isVerified' },
          userCreatedAt: { $first: '$userData.createdAt' },
          credentials: {
            $push: {
              id: '$_id',
              title: '$title',
              issuer: '$issuer',
              nsqfLevel: '$nsqfLevel',
              skills: '$skills',
              status: '$status',
              issuedDate: '$createdAt',
              expiryDate: '$expiryDate',
              verificationStatus: '$verificationStatus'
            }
          },
          credentialsFromThisInstitute: { $sum: 1 }
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalCount = await Credential.aggregate([
      { $match: { issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') } } },
      { $group: { _id: '$user' } },
      { $count: 'totalStudents' }
    ]);

    const total = totalCount.length > 0 ? totalCount[0].totalStudents : 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      students: credentialsWithUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching students with credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students with credentials'
    });
  }
};

// Get Credential Details (for institute users)
const getCredentialDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteName = user.institute.name;

    // Find the credential ensuring it was issued by this institution and populate user details
    const credential = await Credential.findOne({ 
      _id: id, 
      issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }
    }).populate('user', 'fullName email profilePic');

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found or not issued by your institution'
      });
    }

    res.json({
      success: true,
      credential
    });

  } catch (error) {
    console.error('Error fetching credential details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credential details'
    });
  }
};

// Verify Credential (for institute users)
const verifyCredential = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteName = user.institute.name;

    // Find the credential ensuring it was issued by this institution
    const credential = await Credential.findOne({ 
      _id: id, 
      issuer: { $regex: new RegExp(`^${instituteName}$`, 'i') }
    }).populate('user', 'fullName email');

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found or not issued by your institution'
      });
    }

    // Check if already verified
    if (credential.issuerVerification.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Credential is already verified'
      });
    }

    // Update ONLY issuer verification status (keep main status unchanged)
    credential.issuerVerification = {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: userId
    };

    await credential.save();

    // Log activity for manual credential verification
    try {
      const studentName = credential.user && credential.user.fullName 
        ? `${credential.user.fullName.firstName} ${credential.user.fullName.lastName}`
        : (credential.user && credential.user.email ? credential.user.email : 'Unknown Student');
        
      await ActivityTracker.logActivity({
        userId: userId,
        userRole: 'institute',
        activityType: 'credential_verified',
        description: `Manually verified credential "${credential.title}" for ${studentName}`,
        metadata: {
          credentialId: credential._id,
          credentialTitle: credential.title,
          studentId: credential.user ? credential.user._id : null,
          studentEmail: credential.user ? credential.user.email : null,
          studentName: studentName,
          issuer: credential.issuer,
          verificationType: 'manual_issuer_verification',
          verificationMethod: 'dashboard_button',
          credentialType: credential.type || 'credential',
          nsqfLevel: credential.nsqfLevel || null,
          skills: credential.skills || []
        },
        relatedEntityType: 'credential',
        relatedEntityId: credential._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      console.error('Activity logging failed for credential verification:', activityError.message);
      // Continue - activity logging failure shouldn't block the response
    }

    res.json({
      success: true,
      message: 'Credential verified by issuer successfully',
      credential: {
        _id: credential._id,
        title: credential.title,
        status: credential.status, // Keep original status unchanged
        issuerVerification: credential.issuerVerification
      }
    });

  } catch (error) {
    console.error('Error verifying credential:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying credential'
    });
  }
};

module.exports = {
  searchColleges,
  updateUserInstitute,
  getUserInstitute,
  addManualInstitute,
  getDashboardStats,
  getStudents,
  getStudentsWithCredentials,
  getCredentials,
  issueCredential,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getAnalytics,
  getComplianceReport,
  getRecentActivities,
  getCredentialDetails,
  verifyCredential
};