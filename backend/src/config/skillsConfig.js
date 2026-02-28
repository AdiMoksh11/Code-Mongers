// Comprehensive list of technical and non-technical skills for dropdown selection
const SKILL_CATEGORIES = {
  programming: {
    label: "Programming Languages",
    skills: [
      "JavaScript", "Python", "Java", "C++", "C#", "TypeScript", "Go", "Rust", 
      "PHP", "Ruby", "Swift", "Kotlin", "Dart", "R", "Scala", "Perl", "C"
    ]
  },
  webDevelopment: {
    label: "Web Development",
    skills: [
      "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", "Svelte",
      "HTML", "CSS", "SASS", "Tailwind CSS", "Bootstrap", "jQuery", "Webpack",
      "Vite", "Redux", "GraphQL", "REST APIs", "WebSockets", "Progressive Web Apps"
    ]
  },
  mobile: {
    label: "Mobile Development",
    skills: [
      "React Native", "Flutter", "iOS Development", "Android Development",
      "Xamarin", "Ionic", "Cordova", "Unity Mobile", "Swift UI", "Kotlin Compose"
    ]
  },
  dataScience: {
    label: "Data Science & Analytics",
    skills: [
      "Machine Learning", "Deep Learning", "Data Analysis", "Data Visualization",
      "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
      "Power BI", "Tableau", "Excel", "SQL", "NoSQL", "Statistics", "R Programming",
      "Big Data", "Apache Spark", "Hadoop", "Data Mining", "Computer Vision",
      "Natural Language Processing", "Time Series Analysis"
    ]
  },
  cloudComputing: {
    label: "Cloud Computing",
    skills: [
      "AWS", "Microsoft Azure", "Google Cloud Platform", "Docker", "Kubernetes",
      "DevOps", "CI/CD", "Terraform", "Ansible", "Jenkins", "Git", "GitLab",
      "Serverless", "Microservices", "Cloud Architecture", "Cloud Security"
    ]
  },
  cybersecurity: {
    label: "Cybersecurity",
    skills: [
      "Ethical Hacking", "Penetration Testing", "Network Security", "Web Security",
      "Cryptography", "Security Auditing", "Incident Response", "Risk Assessment",
      "Compliance", "Malware Analysis", "Digital Forensics", "Security Operations"
    ]
  },
  databases: {
    label: "Databases",
    skills: [
      "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle",
      "Microsoft SQL Server", "Cassandra", "DynamoDB", "Firebase",
      "Database Design", "Query Optimization", "Data Modeling"
    ]
  },
  blockchain: {
    label: "Blockchain",
    skills: [
      "Ethereum", "Solidity", "Web3", "Smart Contracts", "DeFi", "NFTs",
      "Bitcoin", "Cryptocurrency", "Blockchain Development", "Hyperledger"
    ]
  },
  aiml: {
    label: "AI/ML",
    skills: [
      "Artificial Intelligence", "Machine Learning", "Deep Learning", "Neural Networks",
      "Computer Vision", "Natural Language Processing", "Reinforcement Learning",
      "MLOps", "Model Training", "Model Deployment", "Feature Engineering",
      "AI Ethics", "Generative AI", "Large Language Models"
    ]
  },
  design: {
    label: "Design",
    skills: [
      "UI Design", "UX Design", "Graphic Design", "Figma", "Adobe Creative Suite",
      "Sketch", "Prototyping", "Wireframing", "User Research", "Design Systems",
      "Branding", "Typography", "Color Theory", "Interaction Design"
    ]
  },
  business: {
    label: "Business & Management",
    skills: [
      "Project Management", "Product Management", "Agile", "Scrum", "Leadership",
      "Strategic Planning", "Business Analysis", "Market Research", "Digital Marketing",
      "Content Marketing", "SEO", "Social Media Marketing", "Sales", "Customer Service",
      "Negotiation", "Team Management", "Communication", "Problem Solving"
    ]
  },
  softSkills: {
    label: "Soft Skills",
    skills: [
      "Communication", "Leadership", "Teamwork", "Problem Solving", "Critical Thinking",
      "Time Management", "Adaptability", "Creativity", "Emotional Intelligence",
      "Public Speaking", "Presentation Skills", "Conflict Resolution", "Mentoring",
      "Cross-cultural Communication", "Active Listening", "Decision Making"
    ]
  },
  finance: {
    label: "Finance & Accounting",
    skills: [
      "Financial Analysis", "Accounting", "Investment Banking", "Risk Management",
      "Financial Modeling", "Corporate Finance", "Taxation", "Auditing",
      "Budgeting", "Cash Flow Management", "Financial Planning", "Trading"
    ]
  },
  healthcare: {
    label: "Healthcare & Life Sciences",
    skills: [
      "Medical Knowledge", "Healthcare Management", "Biotechnology", "Pharmacology",
      "Medical Research", "Clinical Trials", "Health Informatics", "Telemedicine",
      "Public Health", "Healthcare Compliance", "Medical Devices"
    ]
  },
  education: {
    label: "Education & Training",
    skills: [
      "Teaching", "Curriculum Development", "Educational Technology", "E-Learning",
      "Instructional Design", "Training Delivery", "Assessment Design",
      "Learning Management Systems", "Educational Psychology", "Academic Research"
    ]
  },
  gaming: {
    label: "Gaming & Entertainment",
    skills: [
      "Game Development", "Unity", "Unreal Engine", "3D Modeling", "Animation",
      "Game Design", "Level Design", "AR/VR Development", "Visual Effects",
      "Audio Design", "Story Writing", "Character Design"
    ]
  },
  other: {
    label: "Other Technical Skills",
    skills: [
      "Internet of Things", "Embedded Systems", "Robotics", "Hardware Design",
      "Network Administration", "System Administration", "Quality Assurance",
      "Testing", "Technical Writing", "Research", "Mathematical Modeling",
      "Simulation", "GIS", "CAD Design", "3D Printing"
    ]
  }
};

// Flatten all skills for easy searching
const ALL_SKILLS = Object.values(SKILL_CATEGORIES).reduce((acc, category) => {
  return [...acc, ...category.skills];
}, []);

// Credential types for filtering in leaderboard
const CREDENTIAL_TYPE_CATEGORIES = [
  { value: "all", label: "All Types" },
  { value: "certificate", label: "Certificate" },
  { value: "degree", label: "Degree" },
  { value: "license", label: "License" },
  { value: "badge", label: "Badge" }
];

// Skill categories for filtering in leaderboard (kept for backwards compatibility)
const SKILL_FILTER_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "programming", label: "Programming" },
  { value: "web", label: "Web Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "data", label: "Data Science & AI" },
  { value: "cloud", label: "Cloud & DevOps" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "blockchain", label: "Blockchain" },
  { value: "design", label: "Design" },
  { value: "business", label: "Business" },
  { value: "soft", label: "Soft Skills" },
  { value: "other", label: "Other" }
];

// Map filter categories to actual skill categories
const CATEGORY_SKILL_MAPPING = {
  programming: ["programming"],
  web: ["webDevelopment"],
  mobile: ["mobile"],
  data: ["dataScience", "aiml"],
  cloud: ["cloudComputing"],
  cybersecurity: ["cybersecurity"],
  blockchain: ["blockchain"],
  design: ["design"],
  business: ["business", "finance"],
  soft: ["softSkills"],
  other: ["databases", "healthcare", "education", "gaming", "other"]
};

module.exports = {
  SKILL_CATEGORIES,
  ALL_SKILLS,
  SKILL_FILTER_CATEGORIES,
  CREDENTIAL_TYPE_CATEGORIES,
  CATEGORY_SKILL_MAPPING
};