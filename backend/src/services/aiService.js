const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function generateDetails(base64ImageFile) {
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64ImageFile,
      },
    },
    { text: "Analyze this educational certificate and extract NSQF information." },
  ];
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: contents,
    config: { 
      systemInstruction: ` 
      You are an expert in analyzing educational certificates and extracting credential information for NSQF (National Skills Qualifications Framework) tracking.
      
      IMPORTANT: You ONLY work with educational certificates from platforms like NPTEL, Coursera, edX, Udemy, Google, Microsoft, AWS, IBM, and other legitimate educational institutions.
      
      If the image is NOT an educational certificate (like a regular photo, document, or non-educational content), respond with EXACTLY:
      "Sorry, this is not my expertise. I only analyze educational certificates."
      
      If the image IS an educational certificate, extract the following information and return ONLY valid JSON in this EXACT format (no additional text, no markdown, no explanations):
      {
        "title": "Course/Certificate title",
        "issuer": "Organization/Platform name",
        "nsqfLevel": "Number from 1-10 based on course complexity",
        "skillDomain": "Primary skill domain (e.g., Python Programming, Web Development, Data Science, etc.)",
        "creditPoints": "Points this certificate should contribute (15-50 based on complexity)",
        "issueDate": "Date in YYYY-MM-DD format if available, otherwise null",
        "description": "Brief description of what was learned or achieved",
        "credentialId": "Certificate ID or verification number - MANDATORY field, use ID_NOT_FOUND only if absolutely no ID exists",
        "skills": ["Array of specific skills learned"],
        "estimatedDuration": "Course duration if mentioned (in hours/weeks), otherwise null"
      }
      
      STRICT NSQF Level Guidelines (BE VERY PRECISE):
      - Level 1: Basic awareness, introductory concepts only (15-18 credit points)
      - Level 2: Foundational skills with basic application (18-22 credit points)
      - Level 3: Intermediate skills with practical knowledge (22-26 credit points)
      - Level 4: Applied intermediate skills with problem-solving (26-30 credit points)
      - Level 5: Advanced skills requiring significant expertise (30-34 credit points)
      - Level 6: Specialized advanced knowledge with complex applications (34-38 credit points)
      - Level 7: Professional-level expertise with strategic thinking (38-42 credit points)
      - Level 8: Senior professional skills with leadership capabilities (42-46 credit points)
      - Level 9: Expert level with research and innovation skills (46-48 credit points)
      - Level 10: Master expert level with cutting-edge research capabilities (48-50 credit points)
      
      Skill Domain Examples:
      - "Python Programming", "JavaScript Development", "Web Development"
      - "Data Science", "Machine Learning", "Artificial Intelligence"
      - "Cloud Computing", "AWS Services", "DevOps"
      - "Digital Marketing", "Project Management", "Cybersecurity"
      
      MANDATORY CREDENTIAL ID EXTRACTION:
      You MUST extract the credential ID from the certificate. Look for ANY of these patterns:
      - "Certificate ID", "Credential ID", "Cert ID", "Certificate Number", "Verification ID"
      - "Serial Number", "Reference Number", "Course ID", "Completion ID", "Badge ID"
      - "License Number", "Authentication Code", "Verification Code", "Document ID"
      - Alphanumeric codes like: "CERT123456", "NPT21-ABC123", "COUR-2023-XYZ", "ID: ABC123"
      - QR code associated numbers, barcode numbers
      - Platform-specific IDs (e.g., Coursera: course certificates have verification URLs with IDs)
      - Look in corners, headers, footers, and near signatures
      - Check small text, watermarks, or embedded codes
      
      If you cannot find ANY credential identifier after thorough analysis:
      - Look again more carefully in ALL areas of the certificate
      - Check for partial numbers, codes, or references
      - If absolutely no ID exists, return "ID_NOT_FOUND" for credentialId field
      
      IMPORTANT: Credit points are automatically calculated based on NSQF level - do not override this logic.
      
      CRITICAL: Return ONLY the JSON object or the exact error message. No markdown formatting, no code blocks, no additional text.
      Extract only what is clearly visible in the certificate. Use "ID_NOT_FOUND" for credentialId if truly no identifier exists.
      Be extremely thorough in credential ID extraction - it's MANDATORY.
      `
    }
  });

  return response.text;
}

// Function to determine skill domain from certificate title/description
function determineSkillDomain(title, description = '', skills = []) {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const allText = `${titleLower} ${descLower} ${skills.join(' ').toLowerCase()}`;
  
  // Programming Languages
  if (allText.match(/\b(python|django|flask|fastapi)\b/)) return "Python Programming";
  if (allText.match(/\b(javascript|js|node|react|vue|angular)\b/)) return "JavaScript Development";
  if (allText.match(/\b(java|spring|hibernate)\b/)) return "Java Programming";
  if (allText.match(/\b(c\+\+|cpp|c programming)\b/)) return "C++ Programming";
  if (allText.match(/\b(c#|csharp|dotnet|\.net)\b/)) return "C# Programming";
  
  // Web Development
  if (allText.match(/\b(web development|frontend|backend|fullstack|html|css)\b/)) return "Web Development";
  if (allText.match(/\b(react|nextjs|next\.js)\b/)) return "React Development";
  if (allText.match(/\b(vue|vuejs|vue\.js)\b/)) return "Vue.js Development";
  if (allText.match(/\b(angular|angularjs)\b/)) return "Angular Development";
  
  // Data & AI
  if (allText.match(/\b(data science|data analysis|analytics)\b/)) return "Data Science";
  if (allText.match(/\b(machine learning|ml|ai|artificial intelligence)\b/)) return "Machine Learning";
  if (allText.match(/\b(deep learning|neural network|tensorflow|pytorch)\b/)) return "Deep Learning";
  if (allText.match(/\b(data visualization|tableau|power bi)\b/)) return "Data Visualization";
  
  // Cloud & DevOps
  if (allText.match(/\b(aws|amazon web services)\b/)) return "AWS Cloud Services";
  if (allText.match(/\b(azure|microsoft azure)\b/)) return "Microsoft Azure";
  if (allText.match(/\b(google cloud|gcp)\b/)) return "Google Cloud Platform";
  if (allText.match(/\b(devops|ci\/cd|docker|kubernetes)\b/)) return "DevOps";
  if (allText.match(/\b(cloud computing|cloud architecture)\b/)) return "Cloud Computing";
  
  // Business & Management
  if (allText.match(/\b(project management|pmp|agile|scrum)\b/)) return "Project Management";
  if (allText.match(/\b(digital marketing|seo|social media)\b/)) return "Digital Marketing";
  if (allText.match(/\b(data analysis|business analysis)\b/)) return "Business Analysis";
  
  // Security
  if (allText.match(/\b(cybersecurity|ethical hacking|penetration testing)\b/)) return "Cybersecurity";
  
  // Design
  if (allText.match(/\b(ui\/ux|user interface|user experience|design)\b/)) return "UI/UX Design";
  if (allText.match(/\b(graphic design|adobe|photoshop)\b/)) return "Graphic Design";
  
  // Mobile
  if (allText.match(/\b(mobile development|android|ios|react native|flutter)\b/)) return "Mobile Development";
  
  // Database
  if (allText.match(/\b(database|sql|mysql|postgresql|mongodb)\b/)) return "Database Management";
  
  // Default categorization
  if (allText.match(/\b(programming|coding|software development)\b/)) return "Software Development";
  if (allText.match(/\b(technology|tech|computer)\b/)) return "Information Technology";
  
  // Fallback to general category
  return "General Skills";
}

// Function to calculate credit points based on STRICT NSQF level and course characteristics
function calculateCreditPoints(nsqfLevel, title, description = '', estimatedDuration = null) {
  let basePoints = 0;
  
  // Strict base points by individual NSQF level
  switch(nsqfLevel) {
    case 1:
      basePoints = 15;
      break;
    case 2:
      basePoints = 18;
      break;
    case 3:
      basePoints = 22;
      break;
    case 4:
      basePoints = 26;
      break;
    case 5:
      basePoints = 30;
      break;
    case 6:
      basePoints = 34;
      break;
    case 7:
      basePoints = 38;
      break;
    case 8:
      basePoints = 42;
      break;
    case 9:
      basePoints = 46;
      break;
    case 10:
      basePoints = 48;
      break;
    default:
      basePoints = 22; // Default to level 3
  }
  
  // Conservative adjustments for strict NSQF system
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Small bonus for advanced/professional courses (max +2)
  if (titleLower.match(/\b(advanced|professional|expert|master|specialization)\b/)) {
    basePoints += 2;
  }
  
  // Small bonus for certification programs (max +2)
  if (titleLower.match(/\b(certification|certified|certificate program)\b/)) {
    basePoints += 2;
  }
  
  // Small bonus for comprehensive courses (max +2)
  if (titleLower.match(/\b(complete|comprehensive|full|bootcamp)\b/)) {
    basePoints += 2;
  }
  
  // Conservative duration-based adjustment
  if (estimatedDuration) {
    const durationLower = estimatedDuration.toLowerCase();
    if (durationLower.match(/\b(\d+)\s*(week|month)/)) {
      const weeks = durationLower.match(/(\d+)\s*week/) ? parseInt(durationLower.match(/(\d+)\s*week/)[1]) : 0;
      const months = durationLower.match(/(\d+)\s*month/) ? parseInt(durationLower.match(/(\d+)\s*month/)[1]) * 4 : 0;
      const totalWeeks = weeks + months;
      
      if (totalWeeks >= 16) basePoints += 3; // Only for very long courses
      else if (totalWeeks >= 12) basePoints += 2;
      else if (totalWeeks >= 8) basePoints += 1;
    }
  }
  
  // Strict bounds - ensure points stay within NSQF level ranges
  const maxPointsForLevel = nsqfLevel === 1 ? 18 : 
                           nsqfLevel === 2 ? 22 :
                           nsqfLevel === 3 ? 26 :
                           nsqfLevel === 4 ? 30 :
                           nsqfLevel === 5 ? 34 :
                           nsqfLevel === 6 ? 38 :
                           nsqfLevel === 7 ? 42 :
                           nsqfLevel === 8 ? 46 :
                           nsqfLevel === 9 ? 48 : 50;
  
  const minPointsForLevel = nsqfLevel === 1 ? 15 :
                           nsqfLevel === 2 ? 18 :
                           nsqfLevel === 3 ? 22 :
                           nsqfLevel === 4 ? 26 :
                           nsqfLevel === 5 ? 30 :
                           nsqfLevel === 6 ? 34 :
                           nsqfLevel === 7 ? 38 :
                           nsqfLevel === 8 ? 42 :
                           nsqfLevel === 9 ? 46 : 48;
  
  return Math.min(Math.max(basePoints, minPointsForLevel), maxPointsForLevel);
}

module.exports = {
  generateDetails,
  determineSkillDomain,
  calculateCreditPoints
};
