# 🚀 Credexa – AI-Powered Micro-Credential Aggregator Platform

**"Your Lifelong Skill Passport"**

Credexa is a revolutionary platform that consolidates, validates, and organizes micro-credentials from diverse sources into a unified, verified, and portable learner profile aligned with the National Skills Qualification Framework (NSQF).

---

## 🌐 Live Demo

<!-- **🔗 Plaatform:** [Click Here](https://credexa.vercel.app/) -->

---

## 📌 Background

The education and skilling ecosystem is rapidly evolving towards modular, stackable learning opportunities. Today's learners earn micro-credentials from:

- **MOOCs**: Coursera, edX, Udemy
- **Global Providers**: AWS, Google, Microsoft
- **Government Initiatives**: Skill India Digital
- **Universities & Training Institutions**

### The Problem
These achievements are:
- 🔸 **Scattered** across multiple platforms
- 🔸 **Hard to verify** (fake certificates exist)
- 🔸 **Not stackable** into larger qualifications
- 🔸 **Not aligned** with NSQF standards
- 🔸 **Difficult for employers** to trust and recognize

### The Solution
**Credexa** provides a trusted, AI-powered, centralized aggregator that consolidates, validates, and organizes all micro-credentials into a unified learner profile — **verified, portable, and NSQF-aligned**.

---

## 🎯 Vision

**Credexa = Skill Passport for Life** → enabling lifelong learning, verified employability, and trust between learners, institutions, employers, and regulators.

---

## ✨ Core Features

### 🎓 For Learners

#### 📱 Unified Learner Dashboard
- All micro-credentials in one interface
- Timeline view of learning journey
- Progress indicators per skill domain
- **Accessibility**: Multilingual support (Indian languages), WCAG 2.1 AA compliant

#### 🤖 AI-Powered Certificate Parser
- Upload PDF/image certificates via OCR + NLP
- Auto-extract: Course name, Issuer, Skills, Dates
- Auto-classification into NSQF skill categories
- Human-in-the-loop correction for accuracy

#### 🗺️ Skill Graph & Stackability Map
- Maps credentials to NSQF levels & pathways
- Shows how micro-courses "stack up" into qualifications
- **Example**: *AWS Cloud Practitioner + Azure Fundamentals → NSQF Level 5 (Cloud Basics)*

#### 🎯 AI Career Path Recommender
- Personalized learning pathways based on goals
- Suggests "next credential" to complete NSQF progression
- **Example**: *"You are 70% towards NSQF Level 6 Data Analyst – complete SQL Advanced to finish"*

#### 🔒 Selective Sharing & Privacy Control
- Choose what to share with employers
- Attribute-based sharing capabilities
- **Future**: Zero-Knowledge Proofs (ZKP)

### 🏢 For Employers

#### 👥 Employer Portal
- Search candidates by skills, NSQF levels, verified badges
- Bulk credential verification for recruitment
- Export skill portfolios for hiring pipelines

#### 🔍 Skill Match Engine (AI)
- Post required skills → Get matching learner recommendations
- **Example**: *"Need Data Engineers (NSQF 7)" → Shows qualified candidates*

#### ✅ Consent-Driven Access
- Access learner profiles only with approval
- Short-term access tokens & full audit logs

### 🏛️ For Regulators & Institutions

#### 📊 Analytics Dashboard
- Regional skill adoption trends
- Sectoral skill gap heatmaps
- NSQF-aligned credential adoption tracking

#### 📋 Compliance & Accreditation
- Support for NCVET/AICTE/NSDC alignment tracking
- Credential data for audits (NIRF, NAAC)

#### 📈 Policy Insights (AI-driven)
- Identify demand-supply gaps in skills
- **Example**: *"High AI Level 6 demand, low certified supply in Eastern India"*

---

## 🔐 Verification & Trust Layer

### 🔗 Blockchain Anchoring (Tamper-Proof)
- Credential hashes stored on Polygon/Ethereum
- QR code verification → matches on-chain hash
- Only cryptographic proofs stored (no PII)

### 🏛️ Government Integration
- **DigiLocker** integration for official credentials
- **Aadhaar eKYC** compliance
- India's digital infrastructure alignment

### �️ ML-Powered Fraud Detection
- **Advanced Forensics**: PyTorch-based certificate tampering detection
- **Authenticity Scoring**: Real-time fraud percentage analysis (91.08% authentic detected)
- **Visual Analysis**: Identifies manipulated regions and artifacts
- **Role-Based Access**: Available to institute users and credential owners
- **Production Ready**: 517MB ML model deployed via Git LFS

### �🔌 Issuer API Integration
- APIs for universities, MOOCs, Skill India Digital
- Developer Portal + Sandbox environment
- **Standards**: Open Badges & W3C Verifiable Credentials

### 🛡️ Fraud Detection Engine
- ML-powered fake certificate detection
- Font/layout mismatch analysis
- Metadata anomaly detection
- Suspicious upload flagging

---

## 🧠 AI & ML Modules

### 📄 Certificate Parsing Engine
- **OCR**: Tesseract / Google Vision
- **NLP**: HuggingFace Transformers for entity extraction
- **Mapping**: Automatic NSQF taxonomy alignment

### 🕸️ Skill Graph Generator
- **Graph DB**: Neo4j for skill relationships
- **ML**: Stackable learning path recommendations
- **Visualization**: Interactive skill progression maps

### 🎯 Career Recommender
- Collaborative filtering + graph embeddings
- Optimal credential pathway suggestions
- Personalized skill gap analysis

### 🔍 Fraud Detection Model
- Trained on authentic vs tampered certificates
- Logo, metadata, and signature verification
- Real-time anomaly detection

---

## 🛠️ Tech Stack

### 🎨 Frontend
- **Framework**: Next.js 15.5.0 with TypeScript
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Radix UI, Ant Design
- **Animations**: Framer Motion 12.23.12, Lottie React
- **3D Graphics**: Three.js, React Three Fiber
- **Maps**: React Leaflet
- **Charts**: Recharts
- **Icons**: Lucide, Tabler, React Icons

### ⚙️ Backend
- **Runtime**: Node.js with Express 5.1.0
- **Database**: MongoDB with Mongoose 8.18.0
- **Authentication**: JWT, Passport.js (Multi-provider OAuth)
  - Google, GitHub, Discord, Facebook, LinkedIn
- **Security**: bcrypt 6.0.0, speakeasy (2FA)
- **File Upload**: Multer 2.0.2, ImageKit 6.0.0
- **Email**: SendGrid 8.1.3
- **QR Codes**: QRCode 1.5.4

### 🐍 AI/ML Services
- **Framework**: Flask 2.3+ (Python microservices)
- **OCR**: Tesseract (pytesseract)
- **Image Processing**: Pillow
- **NLP**: HuggingFace Transformers
- **Data Processing**: Pandas, NumPy
- **Web Scraping**: BeautifulSoup4, Selenium
- **Career Analysis**: Custom ML algorithms

### ⛓️ Blockchain
- **Network**: Polygon (Amoy Testnet)
- **Framework**: Foundry
- **Smart Contracts**: Solidity 0.8.20
- **Standards**: OpenZeppelin
- **Integration**: Ethers.js 6.15.0

### 🗄️ Databases
- **Primary**: MongoDB (User/Credential data)
- **Graph**: Neo4j (Skill relationships) - *Planned*
- **Cache**: Redis - *Planned*

### 🔒 Security & Compliance
- **Authentication**: OAuth2 / OpenID Connect
- **Authorization**: RBAC (Role-Based Access Control)
- **Encryption**: AES-256, TLS 1.3
- **Compliance**: DPDP (India) + GDPR ready
- **Identity**: Aadhaar/eKYC integration

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Aditya-KumarJha/Credexa.git
cd Credexa
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# File Upload
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sender_email

# Blockchain
POLYGON_RPC_URL=your_polygon_rpc_url
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
ETHERSCAN_API_KEY=your_etherscan_api_key

# External APIs
DIGILOCKER_API_KEY=your_digilocker_api_key
SKILL_INDIA_API_KEY=your_skill_india_api_key
```

Start the backend server:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_POLYGON_RPC_URL=your_polygon_rpc_url
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

Start the frontend development server:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. AI/ML Services Setup

```bash
cd ../extraction-service
pip install -r requirements.txt

# Start the certificate extraction service
python cert_extractor_api.py
```

```bash
cd ../ML/career_assistant
pip install -r requirements.txt

# Start the career recommendation service
python app.py
```

### 5. Smart Contract Deployment

```bash
cd ../contracts

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile contracts
forge build

# Deploy to Polygon Amoy Testnet
forge script script/DeployCredexa.s.sol --rpc-url $POLYGON_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

---

## 📁 Project Structure

```
Credexa/
│
├── 🎨 frontend/                     # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   ├── components/              # Reusable UI components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility libraries & configurations
│   │   ├── services/                # API integration services
│   │   └── types/                   # TypeScript type definitions
│   ├── public/                      # Static assets & images
│   └── package.json                 # Frontend dependencies
│
├── ⚙️ backend/                      # Node.js Express Backend
│   ├── src/
│   │   ├── config/                  # Database & API configurations
│   │   ├── controllers/             # Route handlers & business logic
│   │   ├── middlewares/             # Authentication & validation
│   │   ├── models/                  # MongoDB schemas
│   │   ├── routes/                  # API route definitions
│   │   ├── services/                # External service integrations
│   │   └── utils/                   # Helper functions
│   ├── scripts/                     # Utility scripts
│   └── server.js                    # Server entry point
│
├── 🤖 extraction-service/           # AI Certificate Parser (Python/Flask)
│   ├── cert_extractor_api.py        # OCR & NLP extraction API
│   ├── extract_all_texts.py         # Text extraction logic
│   ├── extraction_rules.json        # Parsing rules configuration
│   └── requirements.txt             # Python dependencies
│
├── 🧠 ML/                          # Machine Learning Services
│   ├── career_assistant/            # Career recommendation engine
│   │   ├── app.py                   # Flask API server
│   │   ├── career_assistant.py      # ML recommendation logic
│   │   ├── src/                     # Core ML algorithms
│   │   └── data/                    # Training & reference data
│   ├── Fraud/                       # Fraud detection models
│   └── data/                        # ML datasets & reports
│
├── ⛓️ contracts/                    # Blockchain Smart Contracts
│   ├── src/
│   │   └── Credexa.sol              # Main credential anchoring contract
│   ├── script/
│   │   └── DeployCredexa.s.sol      # Deployment script
│   ├── test/                        # Contract test suites
│   └── foundry.toml                 # Foundry configuration
│
└── 📄 README.md                     # Project documentation
```

---

## 🔌 API Endpoints

### 🔐 Authentication
```http
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/profile           # Get user profile
PUT    /api/auth/profile           # Update user profile
POST   /api/auth/forgot-password   # Password reset request
POST   /api/auth/reset-password    # Password reset confirmation
```

### 🎓 Credentials
```http
GET    /api/credentials            # Get user credentials
POST   /api/credentials            # Upload new credential
PUT    /api/credentials/:id        # Update credential
DELETE /api/credentials/:id        # Delete credential
POST   /api/credentials/verify     # Verify credential authenticity
GET    /api/credentials/export     # Export credentials (PDF/JSON)
```

### 🧠 AI Services
```http
POST   /api/ai/parse-certificate   # OCR + NLP certificate parsing
POST   /api/ai/recommend-path      # Career path recommendations
GET    /api/ai/skill-graph         # Get skill relationship graph
POST   /api/ai/detect-fraud        # Fraud detection analysis
```

### 🏢 Employer
```http
GET    /api/employer/search        # Search candidates by skills
POST   /api/employer/verify-bulk   # Bulk credential verification
GET    /api/employer/analytics     # Hiring analytics dashboard
```

### ⛓️ Blockchain
```http
POST   /api/blockchain/anchor      # Anchor credential hash
GET    /api/blockchain/verify      # Verify on-chain credential
GET    /api/blockchain/status      # Get blockchain transaction status
```

---

## 🎯 Learning Goals & Impact

### 🔹 Technical Learning
- **Full-Stack Development**: MERN + Next.js ecosystem
- **Blockchain Integration**: Smart contract deployment & interaction
- **AI/ML Implementation**: OCR, NLP, and recommendation systems
- **Microservices Architecture**: Python + Node.js service integration
- **Security Implementation**: Multi-factor auth, encryption, compliance

### 🔹 Expected Impact

#### For Learners
- ✅ One unified, verified skill passport
- ✅ Enhanced job market visibility
- ✅ AI-guided career progression
- ✅ Stackable credential pathways

#### For Employers
- ✅ Instant, trusted skill verification
- ✅ Reduced credential fraud by 90%+
- ✅ Smarter, skill-based hiring
- ✅ Compliance with industry standards

#### For Regulators & Institutions
- ✅ Unified credential landscape view
- ✅ NSQF alignment enforcement
- ✅ Data-driven policy insights
- ✅ Fraud reduction & trust building

---

## 🚧 Roadmap

### Phase 1: MVP (Current)
- [x] Basic credential upload & storage
- [x] User authentication & profiles
- [x] Smart contract deployment
- [x] OCR-based certificate parsing
- [ ] NSQF skill mapping
- [ ] Basic employer portal

### Phase 2: AI Enhancement
- [ ] Advanced ML recommendation engine
- [ ] Fraud detection system
- [ ] Skill graph visualization
- [ ] Career pathway optimization

### Phase 3: Integration & Scale
- [ ] DigiLocker integration
- [ ] Major MOOC platform APIs
- [ ] Mobile application (React Native)
- [ ] Multi-language support

### Phase 4: Advanced Features
- [ ] Zero-Knowledge Proof implementation
- [ ] Advanced analytics dashboard
- [ ] Regulatory compliance tools
- [ ] Enterprise SSO integration

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test` (backend) / `npm run test` (frontend)
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure security best practices

### Areas for Contribution
- 🎨 **Frontend**: UI/UX improvements, accessibility features
- ⚙️ **Backend**: API optimization, new integrations
- 🤖 **AI/ML**: Algorithm improvements, new models
- ⛓️ **Blockchain**: Smart contract enhancements
- 📚 **Documentation**: Tutorials, API docs, translations

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgements

### Core Technologies
- **Next.js** – React framework for production
- **MongoDB** – Document database for credential storage
- **OpenZeppelin** – Secure smart contract libraries
- **Foundry** – Ethereum development framework
- **Tesseract** – OCR engine for certificate parsing

### Service Providers
- **Polygon** – Blockchain network for credential anchoring
- **ImageKit** – Media storage and delivery
- **SendGrid** – Email service integration
- **DigiLocker** – Government credential verification
- **Render** – Cloud deployment platform

### AI & ML Libraries
- **HuggingFace** – Transformers for NLP
- **Tesseract** – Optical Character Recognition
- **scikit-learn** – Machine learning algorithms
- **Pandas** – Data processing and analysis
- **Flask** – Python web framework for ML services

### Design & UI
- **Tailwind CSS** – Utility-first CSS framework
- **Framer Motion** – Animation library
- **Radix UI** – Accessible component primitives
- **Ant Design** – Enterprise UI components
- **Lottie** – Animation rendering

---

## 📧 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Aditya-KumarJha/Credexa/issues)
- **Email**: [Contact the team](credexaowns@gmail.com)

---

**🚀 Built with ❤️ for the future of lifelong learning and verified skills**

*"Transforming how we learn, verify, and grow — one credential at a time."*