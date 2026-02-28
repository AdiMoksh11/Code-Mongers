const mongoose = require('mongoose');
const Job = require('../src/models/jobModel');
const User = require('../src/models/userModel');
const JobApplication = require('../src/models/jobApplicationModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/credexa', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestJobApplications() {
  try {
    console.log('🚀 Creating test job applications...');

    // Find a test job (or create one)
    let testJob = await Job.findOne({ jobTitle: { $regex: /mern|stack|developer/i } });
    
    if (!testJob) {
      console.log('No suitable job found, creating a test job...');
      // Create a test employer user first
      const testEmployer = await User.findOne({ role: 'employer' }) || await User.create({
        fullName: { firstName: 'Test', lastName: 'Employer' },
        email: 'employer@test.com',
        password: 'hashedpassword',
        role: 'employer',
        isVerified: true
      });

        testJob = await Job.create({
        employer: testEmployer._id,
        jobTitle: 'MERN Stack Developer',
        package: '450$',
        location: 'Kolkata, India',
        qualification: 'Btech CSE',
        experience: '2-5 Years',
        description: 'Looking for a skilled MERN stack developer...',
        skills: ['React', 'Node.js', 'MongoDB', 'Express'],
        contactEmail: 'employer@test.com',
        contactPhone: '+91-1234567890',
        status: 'active'
      });
      console.log('✅ Created test job:', testJob._id);
    }

    // Find existing users or create test users
    const existingUsers = await User.find({ 
      role: 'learner',
      email: { $in: ['test@test.com', 'john@example.com', 'sarah@example.com'] }
    });

    let testUsers = [...existingUsers];

    // Create additional test users if needed
    const usersToCreate = [
      {
        fullName: { firstName: 'Aditya', lastName: 'Jha' },
        email: 'test@test.com',
        password: '$2b$10$mSjwE5uG7FmyW5O/0jlhSuw9yfkPlnGhNxXVZC3U5pKAiSRvW4vEa',
        role: 'learner',
        isVerified: true,
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Full-stack e-commerce application built with MERN stack',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            projectUrl: 'https://example.com/project1',
            githubUrl: 'https://github.com/example/project1'
          },
          {
            title: 'Task Management App',
            description: 'Real-time collaborative task management application',
            technologies: ['React', 'Socket.io', 'Node.js', 'PostgreSQL'],
            projectUrl: 'https://example.com/project2',
            githubUrl: 'https://github.com/example/project2'
          }
        ]
      },
      {
        fullName: { firstName: 'John', lastName: 'Doe' },
        email: 'john@example.com',
        password: '$2b$10$hashedpassword',
        role: 'learner',
        isVerified: true,
        projects: [
          {
            title: 'Weather Dashboard',
            description: 'Weather forecast application with beautiful UI',
            technologies: ['React', 'TypeScript', 'Tailwind CSS'],
            projectUrl: 'https://example.com/weather',
            githubUrl: 'https://github.com/example/weather'
          }
        ]
      }
    ];

    for (const userData of usersToCreate) {
      const existingUser = testUsers.find(u => u.email === userData.email);
      if (!existingUser) {
        const newUser = await User.create(userData);
        testUsers.push(newUser);
        console.log('✅ Created test user:', userData.email);
      }
    }

    // Create job applications
    console.log('📝 Creating job applications...');
    
    for (const user of testUsers.slice(0, 2)) { // Apply first 2 users to the job
      const existingApplication = await JobApplication.findOne({
        job: testJob._id,
        applicant: user._id
      });

      if (!existingApplication) {
        const application = await JobApplication.create({
          job: testJob._id,
          applicant: user._id,
          message: 'I am interested in this position',
          status: 'pending',
          appliedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
        });
        console.log(`✅ Created application: ${user.fullName.firstName} ${user.fullName.lastName} -> ${testJob.jobTitle}`);
      } else {
        console.log(`⏭️  Application already exists: ${user.fullName.firstName} ${user.fullName.lastName} -> ${testJob.jobTitle}`);
      }
    }

    console.log('🎉 Test job applications created successfully!');
    console.log('📊 Summary:');
    console.log(`   Job: ${testJob.jobTitle} (ID: ${testJob._id})`);
    console.log(`   Applications: ${testUsers.length >= 2 ? 2 : testUsers.length}`);

  } catch (error) {
    console.error('❌ Error creating test job applications:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createTestJobApplications();