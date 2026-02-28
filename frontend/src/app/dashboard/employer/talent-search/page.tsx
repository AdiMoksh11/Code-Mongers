"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Changed from "motion/react" to "framer-motion" (standard Next.js practice)
import { Select, Button, Tabs, Tag, Avatar, ConfigProvider, theme, notification } from "antd";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import InfiniteScroll from "react-infinite-scroll-component";

import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import { useTheme } from "next-themes";
import { searchLearners as apiSearchLearners, fetchPublicProfile, fetchPublicProfileSecure } from "@/lib/api/talent";

// Types
interface CandidateSkill {
  subject: string;
  A: number;
  fullMark: number;
}

interface VerifiedCredential {
  id: string;
  issuer: string;
  name: string;
  date: string;
}

interface UserProject {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Candidate {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  role: string;
  scores: {
    efficiency: number;
    social: number;
    performance: number;
  };
  skills: CandidateSkill[];
  topSkills: string[];
  email: string | null;
  phone: string | null;
  resume: {
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    uploadedAt?: string;
    fileSize?: number;
  } | null;
  verifiedCredentials: VerifiedCredential[];
  projects?: UserProject[];
}

interface AnimatedSearchBarProps {
  isSearching: boolean;
  setIsSearching: (value: boolean) => void;
  onSubmit: (query: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
}

interface CandidateProfileProps {
  candidate: Candidate | null;
  onBack: () => void;
}

// FIX: Notification Context Setup
const NotificationContext = React.createContext<{ 
    api: ReturnType<typeof notification.useNotification>[0]; 
} | null>(null);

const useAppNotification = () => {
    const context = React.useContext(NotificationContext);
    if (!context) {
        // Fallback for components rendered outside the provider, though in this structured app it should always be available.
        console.error("useAppNotification must be used within a NotificationWrapper");
        return { api: notification };
    }
    return context;
};

const NotificationWrapper: React.FC<{ children: React.ReactNode; antTheme: any }> = ({ children, antTheme }) => {
  const [api, contextHolder] = notification.useNotification();
  
  const contextValue = useMemo(() => ({ api }), [api]);

  return (
    <ConfigProvider theme={antTheme}>
      {contextHolder} {/* This injects the notification service into the DOM */}
      <NotificationContext.Provider value={contextValue}>
        {children}
      </NotificationContext.Provider>
    </ConfigProvider>
  );
};
// END FIX: Notification Context Setup

// --- SVG ICONS (self-contained) ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- SUB-COMPONENTS ---
// Reusable SearchBar with real-time search and clear functionality
const SearchBar: React.FC<{ 
  onFocus: () => void; 
  onSubmit: (q: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClear?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ onFocus, onSubmit, searchQuery, onSearchChange, onClear, activeTab, onTabChange }) => {
  const getPlaceholder = () => {
    if (activeTab === "user") {
      return "Search by name: 'Johan', 'Sara Khan', 'Aman Kumar'...";
    } else {
      return "Search by role: 'Frontend Developer', 'Python Developer'...";
    }
  };

  return (
  <motion.div
    layoutId="talent-searchbar"
    layout
    transition={{ layout: { duration: 0.45, ease: "easeInOut" } }}
    className="w-full max-w-4xl bg-white dark:bg-gray-900/60 p-2 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center gap-2">
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        className="custom-tabs flex-shrink-0"
        items={[
          {
            key: "user",
            label: (
              <span className="flex items-center gap-2 px-2">
                <UserIcon className="h-4 w-4" /> Users
              </span>
            ),
          },
          {
            key: "role",
            label: (
              <span className="flex items-center gap-2 px-2">
                <BriefcaseIcon className="h-4 w-4" /> Roles
              </span>
            ),
          },
        ]}
      />
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          placeholder={getPlaceholder()}
          className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-lg px-4 py-2 pr-10"
          onFocus={onFocus}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(searchQuery);
          }}
        />
        {/* Clear button - only visible when there's text */}
        {searchQuery.trim() && onClear && (
          <button
            onClick={onClear}
            className="absolute right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        className="bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors"
        onClick={() => onSubmit(searchQuery)}
      >
        <SearchIcon className="h-6 w-6" />
      </button>
    </div>
  </motion.div>
);
};

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({ 
  isSearching, 
  setIsSearching, 
  onSubmit, 
  searchQuery, 
  onSearchChange,
  onClear,
  activeTab,
  onTabChange
}) => {
  return (
    <>
      <AnimatePresence initial={false}>
        {!isSearching && (
          <motion.div
            key="hero"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full z-20 flex flex-col items-center justify-center h-[70vh]"
            onClick={() => setIsSearching(true)}
          >
            <motion.div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100">Find The Talent You Need.</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 max-w-2xl">
                Search by name or role with smart matching. Find "Frontend" developers by searching "Front" or "React".
              </p>
            </motion.div>
            <SearchBar 
              onFocus={() => setIsSearching(true)} 
              onSubmit={onSubmit}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onClear={onClear}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isSearching && (
        <motion.div
          key="sticky"
          layout
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="sticky top-0 z-30 bg-gradient-to-b from-white/80 dark:from-gray-950/80 to-transparent px-4 md:px-8 pt-4 pb-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
        >
          <div className="flex justify-center">
            <SearchBar 
              onFocus={() => {}} 
              onSubmit={onSubmit}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onClear={onClear}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </motion.div>
      )}
    </>
  );
};

// Horizontal filter bar shown below the search bar
const FilterBar: React.FC<{
  roles: string[];
  onRolesChange: (r: string[]) => void;
  skills: string[];
  onSkillsChange: (s: string[]) => void;
  experience?: string | null;
  onExperienceChange: (e: string | null) => void;
  onReset: () => void;
}> = ({ roles, onRolesChange, skills, onSkillsChange, experience, onExperienceChange, onReset }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-7xl mx-auto px-4 md:px-8"
    >
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Role */}
        <div className="w-full md:w-1/3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</div>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="e.g., React Developer, Backend Engineer"
            value={roles}
            onChange={(vals) => onRolesChange(vals as string[])}
            options={[
              { label: "Frontend Developer", value: "Frontend Developer" },
              { label: "Backend Developer", value: "Backend Developer" },
              { label: "Full Stack Developer", value: "Full Stack Developer" },
              { label: "React Developer", value: "React Developer" },
              { label: "Node.js Developer", value: "Node.js Developer" },
              { label: "Python Developer", value: "Python Developer" },
              { label: "Java Developer", value: "Java Developer" },
              { label: "Mobile Developer", value: "Mobile Developer" },
              { label: "DevOps Engineer", value: "DevOps Engineer" },
              { label: "Data Scientist", value: "Data Scientist" },
              { label: "Machine Learning Engineer", value: "Machine Learning Engineer" },
              { label: "UI/UX Designer", value: "UI/UX Designer" },
              { label: "Product Manager", value: "Product Manager" },
              { label: "Software Engineer", value: "Software Engineer" },
              { label: "System Administrator", value: "System Administrator" },
              { label: "Database Administrator", value: "Database Administrator" },
              { label: "Security Engineer", value: "Security Engineer" },
              { label: "Quality Assurance Engineer", value: "Quality Assurance Engineer" },
            ]}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            showSearch
          />
        </div>
        {/* Skill */}
        <div className="w-full md:w-1/3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill</div>
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="e.g., React, Node.js"
            value={skills}
            onChange={(vals) => onSkillsChange(vals as string[])}
            options={[
              // Frontend Technologies
              { label: "React", value: "React" },
              { label: "Vue.js", value: "Vue.js" },
              { label: "Angular", value: "Angular" },
              { label: "Next.js", value: "Next.js" },
              { label: "Svelte", value: "Svelte" },
              { label: "TypeScript", value: "TypeScript" },
              { label: "JavaScript", value: "JavaScript" },
              { label: "HTML/CSS", value: "HTML/CSS" },
              { label: "Tailwind CSS", value: "Tailwind CSS" },
              { label: "Bootstrap", value: "Bootstrap" },
              
              // Backend Technologies
              { label: "Node.js", value: "Node.js" },
              { label: "Express.js", value: "Express.js" },
              { label: "Python", value: "Python" },
              { label: "Django", value: "Django" },
              { label: "Flask", value: "Flask" },
              { label: "FastAPI", value: "FastAPI" },
              { label: "Java", value: "Java" },
              { label: "Spring Boot", value: "Spring Boot" },
              { label: "C#", value: "C#" },
              { label: ".NET", value: ".NET" },
              { label: "PHP", value: "PHP" },
              { label: "Laravel", value: "Laravel" },
              { label: "Ruby", value: "Ruby" },
              { label: "Ruby on Rails", value: "Ruby on Rails" },
              { label: "Go", value: "Go" },
              { label: "Rust", value: "Rust" },
              
              // Databases
              { label: "MongoDB", value: "MongoDB" },
              { label: "PostgreSQL", value: "PostgreSQL" },
              { label: "MySQL", value: "MySQL" },
              { label: "Redis", value: "Redis" },
              { label: "Elasticsearch", value: "Elasticsearch" },
              { label: "Firebase", value: "Firebase" },
              { label: "SQLite", value: "SQLite" },
              
              // Cloud & DevOps
              { label: "AWS", value: "AWS" },
              { label: "Azure", value: "Azure" },
              { label: "Google Cloud", value: "Google Cloud" },
              { label: "Docker", value: "Docker" },
              { label: "Kubernetes", value: "Kubernetes" },
              { label: "Jenkins", value: "Jenkins" },
              { label: "GitLab CI", value: "GitLab CI" },
              { label: "Terraform", value: "Terraform" },
              
              // Mobile Development
              { label: "React Native", value: "React Native" },
              { label: "Flutter", value: "Flutter" },
              { label: "Swift", value: "Swift" },
              { label: "Kotlin", value: "Kotlin" },
              { label: "Xamarin", value: "Xamarin" },
              
              // Data Science & ML
              { label: "Machine Learning", value: "Machine Learning" },
              { label: "Deep Learning", value: "Deep Learning" },
              { label: "TensorFlow", value: "TensorFlow" },
              { label: "PyTorch", value: "PyTorch" },
              { label: "Pandas", value: "Pandas" },
              { label: "NumPy", value: "NumPy" },
              { label: "Scikit-learn", value: "Scikit-learn" },
              { label: "Data Analysis", value: "Data Analysis" },
              
              // Design & Tools
              { label: "Figma", value: "Figma" },
              { label: "Adobe XD", value: "Adobe XD" },
              { label: "Sketch", value: "Sketch" },
              { label: "Photoshop", value: "Photoshop" },
              { label: "Git", value: "Git" },
              { label: "GitHub", value: "GitHub" },
              { label: "Jira", value: "Jira" },
              { label: "Slack", value: "Slack" },
            ]}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            showSearch
          />
        </div>
        {/* Experience */}
        <div className="w-full md:w-1/4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience</div>
          <Select
            allowClear
            placeholder="Select"
            style={{ width: "100%" }}
            value={experience ?? undefined}
            onChange={(val) => onExperienceChange((val as string) || null)}
            options={[
              { label: "Intern", value: "intern" },
              { label: "Junior", value: "junior" },
              { label: "Mid-Level", value: "mid" },
              { label: "Senior", value: "senior" },
            ]}
          />
        </div>
        {/* Actions */}
        <div className="w-full md:w-auto flex flex-col gap-2 md:ml-auto">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 md:opacity-0">Actions</div>
          <Button onClick={onReset} type="default">Reset Filters</Button>
        </div>
      </div>
    </motion.div>
  );
};

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onSelect }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onSelect(candidate)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <Avatar src={candidate.avatarUrl} size={64} />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{candidate.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">@{candidate.username}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-6">
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.scores.efficiency}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Efficiency</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.scores.social}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Social Score</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{candidate.scores.performance}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Performance</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {candidate.topSkills.map((skill) => (
          <Tag key={skill}>{skill}</Tag>
        ))}
      </div>
    </motion.div>
  );
};

const CandidateProfile: React.FC<CandidateProfileProps> = ({ candidate, onBack }) => {
  if (!candidate) return null;

  const { token } = theme.useToken();
  // FIX: Use the notification API from the custom context hook
  const { api: notificationApi } = useAppNotification();
  const [contact, setContact] = useState<{ email: string | null; phone: string | null }>({ email: candidate.email, phone: candidate.phone });

  const handleDownloadResume = () => {
    // Check if resume URL exists (based on user model structure)
    const resumeUrl = candidate.resume?.fileUrl;
    
    // Handle all possible empty states
    if (!candidate.resume || !resumeUrl || resumeUrl.trim() === '') {
      notificationApi.warning({ // FIX: Using notificationApi
        message: "Resume Not Available",
        description: "User hasn't provided any resume yet.",
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    // Open resume in new tab
    try {
      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
      notificationApi.success({ // FIX: Using notificationApi
        message: "Resume Opened",
        description: "Resume opened successfully!",
        placement: 'topRight',
        duration: 2,
      });
    } catch (error) {
      console.error('Error opening resume:', error);
      notificationApi.error({ // FIX: Using notificationApi
        message: "Resume Error",
        description: "Failed to open resume. Please try again.",
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  // Static fetch to ensure latest contact details
  useEffect(() => {
    let mounted = true;
    // Try secure endpoint first (requires auth), then fallback to public
    fetchPublicProfileSecure(candidate.id)
      .then((res) => {
        if (!mounted) return;
        const nextEmail = res?.candidate?.email ?? null;
        const nextPhone = res?.candidate?.phone ?? null;
        setContact({ email: nextEmail, phone: nextPhone });
      })
      .catch(() => {
        fetchPublicProfile(candidate.id)
          .then((res2) => {
            if (!mounted) return;
            const nextEmail = res2?.candidate?.email ?? null;
            const nextPhone = res2?.candidate?.phone ?? null;
            setContact({ email: nextEmail, phone: nextPhone });
          })
          .catch(() => {
            // keep existing values on error
          });
      });
    return () => {
      mounted = false;
    };
  }, [candidate.id]);
  const tabItems = [
    {
      key: "1",
      label: "Projects",
      children: (
        <div className="space-y-6">
          {candidate.projects && candidate.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidate.projects.map((project, index) => (
                <div key={project._id || index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 group hover:bg-white dark:hover:bg-gray-750">
                  {/* Project Header with Icon */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.title}
                      </h4>
                      {project.description && project.description.trim() && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9l-3 6 3 6 1-2-2-4 2-4-1-2zm8 0l3 6-3 6-1-2 2-4-2-4 1-2z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tech Stack</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-600"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {(project.projectUrl || project.githubUrl) && (
                    <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      {project.projectUrl && project.projectUrl.trim() && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-black dark:text-white">View Website</span>
                        </a>
                      )}
                      
                      {project.githubUrl && project.githubUrl.trim() && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-700 text-white dark:text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <span className="text-black dark:text-white">Check Code</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">No Projects Available</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">This talented individual hasn't showcased their projects yet. Check back later or contact them directly!</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "2",
      label: "Verified Credentials",
      children: (
        <div className="space-y-4">
          {candidate.verifiedCredentials && candidate.verifiedCredentials.length > 0 ? (
            candidate.verifiedCredentials.map((cred) => (
              <div key={cred.id} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-gray-100">{cred.name}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Issued by: {cred.issuer}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date: {cred.date}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No verified credentials available.</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-foreground/80 hover:text-foreground">
        <ArrowLeftIcon className="h-5 w-5" /> Back to Search
      </button>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="w-full lg:w-2/3 space-y-8">
          <div className="bg-white dark:bg-gray-900/60 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 border border-gray-200 dark:border-gray-700">
            <Avatar src={candidate.avatarUrl} size={128} />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{candidate.name}</h1>
              <p className="text-xl text-blue-600 dark:text-blue-400">@{candidate.username}</p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">{candidate.role}</p>
              <div className="flex gap-2 mt-4">
                <Button type="primary">Contact</Button>
                {/* FIX: Change button text */}
                <Button onClick={handleDownloadResume}>View Resume</Button>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Tabs defaultActiveKey="1" items={tabItems} />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 space-y-8">
          <div className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-foreground mb-4">Skills Radar</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={candidate.skills}>
                  <PolarGrid stroke={token.colorSplit} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: token.colorText }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={candidate.name} dataKey="A" stroke={token.colorPrimary} fill={token.colorPrimary} fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Data</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Email:</strong> {contact.email ?? "—"}
              </p>
              <p>
                <strong>Phone:</strong> {contact.phone ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- SVG BACKGROUND (LIGHT + DARK) ---
// (PlexusBackground component is unchanged)
const PlexusBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  if (isDark) {
    return (
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1600 900"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          style={{ backgroundColor: "#0c0a09" }}
        >
          <defs>
            <radialGradient id="backgroundGradientDark" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <radialGradient id="greenGlowDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="blueGlowDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#backgroundGradientDark)" />

          <g stroke="#34d399" strokeWidth="1" strokeOpacity="0.3">
            <line x1="220" y1="150" x2="480" y2="240" />
            <line x1="480" y1="240" x2="350" y2="400" />
            <line x1="350" y1="400" x2="150" y2="350" />
            <line x1="150" y1="350" x2="220" y2="150" />

            <line x1="1300" y1="120" x2="1150" y2="280" />
            <line x1="1150" y1="280" x2="1450" y2="320" />
            <line x1="1450" y1="320" x2="1300" y2="120" />
            <line x1="1150" y1="280" x2="950" y2="180" />

            <line x1="180" y1="800" x2="400" y2="650" />
            <line x1="400" y1="650" x2="600" y2="820" />
            <line x1="600" y1="820" x2="350" y2="880" />
            <line x1="350" y1="880" x2="180" y2="800" />

            <line x1="1100" y1="750" x2="1350" y2="600" />
            <line x1="1350" y1="600" x2="1500" y2="780" />
            <line x1="1500" y1="780" x2="1250" y2="850" />
            <line x1="1250" y1="850" x2="1100" y2="750" />
            <line x1="1350" y1="600" x2="1150" y2="550" />
          </g>

          <g>
            <circle cx="220" cy="150" r="10" fill="url(#greenGlowDark)" />
            <circle cx="480" cy="240" r="12" fill="url(#blueGlowDark)" />
            <circle cx="350" cy="400" r="8" fill="url(#blueGlowDark)" />
            <circle cx="150" cy="350" r="9" fill="url(#blueGlowDark)" />

            <circle cx="1300" cy="120" r="11" fill="url(#blueGlowDark)" />
            <circle cx="1150" cy="280" r="9" fill="url(#blueGlowDark)" />
            <circle cx="1450" cy="320" r="13" fill="url(#greenGlowDark)" />
            <circle cx="950" cy="180" r="8" fill="url(#greenGlowDark)" />

            <circle cx="180" cy="800" r="12" fill="url(#blueGlowDark)" />
            <circle cx="400" cy="650" r="9" fill="url(#greenGlowDark)" />
            <circle cx="600" cy="820" r="11" fill="url(#blueGlowDark)" />
            <circle cx="350" cy="880" r="8" fill="url(#greenGlowDark)" />

            <circle cx="1100" cy="750" r="10" fill="url(#blueGlowDark)" />
            <circle cx="1350" cy="600" r="12" fill="url(#greenGlowDark)" />
            <circle cx="1500" cy="780" r="9" fill="url(#blueGlowDark)" />
            <circle cx="1250" cy="850" r="11" fill="url(#greenGlowDark)" />
            <circle cx="1150" cy="550" r="8" fill="url(#blueGlowDark)" />

            <circle cx="750" cy="450" r="7" fill="url(#greenGlowDark)" />
            <circle cx="900" cy="600" r="9" fill="url(#blueGlowDark)" />
            <circle cx="550" cy="100" r="8" fill="url(#blueGlowDark)" />
          </g>
        </svg>
      </div>
    );
  }

  // Light theme SVG
  return (
    <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1600 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="backgroundGradientLight" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e6f7ff" />
          </radialGradient>

          <radialGradient id="greenGlowLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="blueGlowLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#backgroundGradientLight)" />

        <g stroke="#22c55e" strokeWidth="1" strokeOpacity="0.25">
          <line x1="220" y1="150" x2="480" y2="240" />
          <line x1="480" y1="240" x2="350" y2="400" />
          <line x1="350" y1="400" x2="150" y2="350" />
          <line x1="150" y1="350" x2="220" y2="150" />

          <line x1="1300" y1="120" x2="1150" y2="280" />
          <line x1="1150" y1="280" x2="1450" y2="320" />
          <line x1="1450" y1="320" x2="1300" y2="120" />
          <line x1="1150" y1="280" x2="950" y2="180" />

          <line x1="180" y1="800" x2="400" y2="650" />
          <line x1="400" y1="650" x2="600" y2="820" />
          <line x1="600" y1="820" x2="350" y2="880" />
          <line x1="350" y1="880" x2="180" y2="800" />

          <line x1="1100" y1="750" x2="1350" y2="600" />
          <line x1="1350" y1="600" x2="1500" y2="780" />
          <line x1="1500" y1="780" x2="1250" y2="850" />
          <line x1="1250" y1="850" x2="1100" y2="750" />
          <line x1="1350" y1="600" x2="1150" y2="550" />
        </g>

        <g>
          <circle cx="220" cy="150" r="10" fill="url(#greenGlowLight)" />
          <circle cx="480" cy="240" r="12" fill="url(#blueGlowLight)" />
          <circle cx="350" cy="400" r="8" fill="url(#blueGlowLight)" />
          <circle cx="150" cy="350" r="9" fill="url(#blueGlowLight)" />

          <circle cx="1300" cy="120" r="11" fill="url(#blueGlowLight)" />
          <circle cx="1150" cy="280" r="9" fill="url(#blueGlowLight)" />
          <circle cx="1450" cy="320" r="13" fill="url(#greenGlowLight)" />
          <circle cx="950" cy="180" r="8" fill="url(#greenGlowLight)" />

          <circle cx="180" cy="800" r="12" fill="url(#blueGlowLight)" />
          <circle cx="400" cy="650" r="9" fill="url(#greenGlowLight)" />
          <circle cx="600" cy="820" r="11" fill="url(#blueGlowLight)" />
          <circle cx="350" cy="880" r="8" fill="url(#greenGlowLight)" />

          <circle cx="1100" cy="750" r="10" fill="url(#blueGlowLight)" />
          <circle cx="1350" cy="600" r="12" fill="url(#greenGlowLight)" />
          <circle cx="1500" cy="780" r="9" fill="url(#blueGlowLight)" />
          <circle cx="1250" cy="850" r="11" fill="url(#greenGlowLight)" />
          <circle cx="1150" cy="550" r="8" fill="url(#blueGlowLight)" />

          <circle cx="750" cy="450" r="7" fill="url(#greenGlowLight)" />
          <circle cx="900" cy="600" r="9" fill="url(#blueGlowLight)" />
          <circle cx="550" cy="100" r="8" fill="url(#blueGlowLight)" />
        </g>
      </svg>
    </div>
  );
};

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Smart role query enhancement for fuzzy matching
const enhanceRoleQuery = (query: string): string => {
  if (!query.trim()) return query;
  
  const lowerQuery = query.toLowerCase();
  const roleExpansions: { [key: string]: string[] } = {
    // Frontend variations
    'frontend': ['frontend', 'front-end', 'front end', 'ui', 'react', 'vue', 'angular'],
    'front': ['frontend', 'front-end', 'front end', 'ui developer'],
    'react': ['react', 'frontend', 'javascript', 'js developer'],
    'vue': ['vue', 'vuejs', 'frontend', 'javascript'],
    'angular': ['angular', 'frontend', 'typescript', 'javascript'],
    
    // Backend variations  
    'backend': ['backend', 'back-end', 'back end', 'server', 'api'],
    'back': ['backend', 'back-end', 'back end', 'server developer'],
    'python': ['python', 'backend', 'django', 'flask', 'fastapi'],
    'node': ['node', 'nodejs', 'javascript', 'backend', 'express'],
    'java': ['java', 'spring', 'backend', 'enterprise'],
    
    // Full stack
    'full': ['full stack', 'fullstack', 'full-stack', 'frontend backend'],
    'fullstack': ['full stack', 'fullstack', 'full-stack'],
    
    // Mobile
    'mobile': ['mobile', 'android', 'ios', 'react native', 'flutter'],
    'android': ['android', 'mobile', 'kotlin', 'java'],
    'ios': ['ios', 'mobile', 'swift', 'objective-c'],
    
    // Data & ML
    'data': ['data scientist', 'data analyst', 'machine learning', 'python'],
    'ml': ['machine learning', 'data science', 'ai', 'python'],
    'ai': ['artificial intelligence', 'machine learning', 'data science'],
    
    // DevOps
    'devops': ['devops', 'infrastructure', 'aws', 'docker', 'kubernetes'],
    'cloud': ['cloud', 'aws', 'azure', 'gcp', 'devops'],
    
    // Design
    'ui': ['ui designer', 'frontend', 'react', 'vue', 'figma'],
    'ux': ['ux designer', 'ui/ux', 'product designer', 'figma'],
    'design': ['designer', 'ui', 'ux', 'figma', 'sketch'],
  };

  // Find matching expansions
  let expandedTerms: string[] = [query];
  
  for (const [key, expansions] of Object.entries(roleExpansions)) {
    if (lowerQuery.includes(key)) {
      expandedTerms.push(...expansions);
    }
  }

  // Remove duplicates and join with spaces for broader matching
  const uniqueTerms = [...new Set(expandedTerms)];
  return uniqueTerms.join(' ');
};

// --- EXPLORE PAGE CONTENT ---
const ExploreContent: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [experience, setExperience] = useState<string | null>(null);
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Search query state for real-time search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce
  
  // Search tab state (Users as default)
  const [activeSearchTab, setActiveSearchTab] = useState("user");
  
  // Handle tab change - clear search query to avoid confusion
  const handleTabChange = (newTab: string) => {
    setActiveSearchTab(newTab);
    setSearchQuery(""); // Clear search when switching tabs
  };
  
  // Infinite scroll pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isFiltered, setIsFiltered] = useState(false);
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Load all students initially (no filters, just all learners)
  const loadAllStudents = async (resetResults = true) => {
    setInitialLoading(true);
    setLoading(true);
    
    try {
      // Search for all students (learners) without any query or skills filter
      const res = await apiSearchLearners({ 
        q: "", 
        skills: [], 
        page: 1, 
        limit: 24 
      });
      
      if (res?.success) {
        const candidateList = res.candidates || [];
        // Convert CandidateListItem[] to Candidate[] by adding placeholder fields
        const candidates: Candidate[] = candidateList.map((c) => ({
          id: c.id,
          name: c.name,
          username: c.username,
          avatarUrl: c.avatarUrl,
          role: c.role,
          scores: c.scores,
          topSkills: c.topSkills || [],
          // Placeholder fields - will be populated when profile is clicked
          skills: [],
          email: null,
          phone: null,
          resume: null,
          verifiedCredentials: [],
          projects: [],
        }));
        
        setResults(resetResults ? candidates : [...results, ...candidates]);
        setTotalStudents(res.total || 0);
        setCurrentPage(1);
        setHasMore(candidates.length >= 24 && candidates.length < res.total);
        setIsFiltered(false);
        
        // Set isSearching to true to show results instead of hero
        setIsSearching(true);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Load more students for infinite scroll
  const loadMoreStudents = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    const nextPage = currentPage + 1;
    
    try {
      const searchQuery = isFiltered 
        ? [...roles].filter(Boolean).join(" ").trim()
        : "";
        
      const res = await apiSearchLearners({ 
        q: searchQuery, 
        skills: isFiltered ? skills : [], 
        page: nextPage, 
        limit: 24 
      });
      
      if (res?.success) {
        const candidateList = res.candidates || [];
        // Convert CandidateListItem[] to Candidate[] by adding placeholder fields
        const newCandidates: Candidate[] = candidateList.map((c) => ({
          id: c.id,
          name: c.name,
          username: c.username,
          avatarUrl: c.avatarUrl,
          role: c.role,
          scores: c.scores,
          topSkills: c.topSkills || [],
          // Placeholder fields - will be populated when profile is clicked
          skills: [],
          email: null,
          phone: null,
          resume: null,
          verifiedCredentials: [],
          projects: [],
        }));
        
        setResults(prev => [...prev, ...newCandidates]);
        setCurrentPage(nextPage);
        setHasMore(newCandidates.length >= 24 && results.length + newCandidates.length < res.total);
      }
    } catch (error) {
      console.error('Error loading more students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    // Fetch full profile from backend
    fetchPublicProfile(candidate.id)
      .then((res) => {
        if (res?.success && res.candidate) {
          setSelectedCandidate(res.candidate as any);
        } else {
          setSelectedCandidate(candidate);
        }
      })
      .catch(() => setSelectedCandidate(candidate));
  };

  const handleBackToSearch = () => {
    setSelectedCandidate(null);
  };

  // Load all students when component mounts
  useEffect(() => {
    loadAllStudents();
  }, []); // Empty dependency array to run only on mount

  // Real-time search effect - triggers when search query, roles, or skills change
  useEffect(() => {
    if (!isSearching) return; // Don't search if not in search mode

    const hasFilters = debouncedSearchQuery.trim() || roles.length > 0 || skills.length > 0 || experience;
    
    if (hasFilters) {
      performRealTimeSearch();
    } else {
      // If no filters, show all students
      loadAllStudents();
    }
  }, [debouncedSearchQuery, roles, skills, experience]);

  const performRealTimeSearch = useCallback(async () => {
    setLoading(true);
    setIsFiltered(true);
    setCurrentPage(1);
    
    try {
      let searchQuery = "";
      
      if (activeSearchTab === "user") {
        // For user search, use the query directly for name-based search
        searchQuery = debouncedSearchQuery.trim();
      } else {
        // For role search, combine with role filters and apply smart matching
        const roleQuery = debouncedSearchQuery.trim();
        const smartRoleQuery = enhanceRoleQuery(roleQuery);
        searchQuery = [smartRoleQuery, ...roles].filter(Boolean).join(" ").trim();
      }
      
      const res = await apiSearchLearners({ q: searchQuery, skills, page: 1, limit: 24 });
      const list = (res?.candidates || []) as any[];
      const items: Candidate[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        username: c.username,
        avatarUrl: c.avatarUrl,
        role: c.role,
        scores: c.scores,
        topSkills: c.topSkills || [],
        skills: [],
        email: null,
        phone: null,
        resume: null,
        verifiedCredentials: [],
        projects: [],
      }));
      setResults(items);
      setTotalStudents(res?.total || 0);
      setHasMore(items.length >= 24 && items.length < (res?.total || 0));
    } catch (error) {
      console.error('Error performing real-time search:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, roles, skills, activeSearchTab]);

  const performSearch = async (q: string) => {
    setIsSearching(true);
    setLoading(true);
    setIsFiltered(true); // Mark as filtered search
    setCurrentPage(1);
    
    try {
      let searchQuery = "";
      
      if (activeSearchTab === "user") {
        // For user search, use the query directly for name-based search
        searchQuery = q.trim();
      } else {
        // For role search, combine with role filters and apply smart matching
        const smartRoleQuery = enhanceRoleQuery(q);
        searchQuery = [smartRoleQuery, ...roles].filter(Boolean).join(" ").trim();
      }
      
      const res = await apiSearchLearners({ q: searchQuery, skills, page: 1, limit: 24 });
      const list = (res?.candidates || []) as any[];
      // Convert to Candidate shape for list view (without radar/creds)
      const items: Candidate[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        username: c.username,
        avatarUrl: c.avatarUrl,
        role: c.role,
        scores: c.scores,
        topSkills: c.topSkills || [],
        // placeholders; full details fetched on click
        skills: [],
        email: null,
        phone: null,
        resume: null,
        verifiedCredentials: [],
        projects: [],
      }));
      setResults(items);
      setTotalStudents(res?.total || 0);
      setHasMore(items.length >= 24 && items.length < (res?.total || 0));
    } finally {
      setLoading(false);
    }
  };

  // Clear search and reset to initial state
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setRoles([]);
    setSkills([]);
    setExperience(null);
    setIsFiltered(false);
    setCurrentPage(1);
    loadAllStudents(true); // Reset and load all students
  }, []);

  // Apply current filters (roles, skills, experience)
  const applyFilters = async () => {
    if (roles.length === 0 && skills.length === 0 && !experience) {
      // No filters applied, show all students
      loadAllStudents();
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setIsFiltered(true);
    setCurrentPage(1);
    
    try {
      const combinedQ = roles.filter(Boolean).join(" ").trim();
      const res = await apiSearchLearners({ q: combinedQ, skills, page: 1, limit: 24 });
      const list = (res?.candidates || []) as any[];
      const items: Candidate[] = list.map((c) => ({
        id: c.id,
        name: c.name,
        username: c.username,
        avatarUrl: c.avatarUrl,
        role: c.role,
        scores: c.scores,
        topSkills: c.topSkills || [],
        skills: [],
        email: null,
        phone: null,
        resume: null,
        verifiedCredentials: [],
        projects: [],
      }));
      setResults(items);
      setTotalStudents(res?.total || 0);
      setHasMore(items.length >= 24 && items.length < (res?.total || 0));
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters and show all students
  const resetFilters = () => {
    setRoles([]);
    setSkills([]);
    setExperience(null);
    loadAllStudents();
  };

  return (
    // Removed ConfigProvider here
    <>
      <style jsx global>{`
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
          border-bottom: none !important;
        }
        .custom-tabs .ant-tabs-tab {
          border: none !important;
          background: transparent !important;
        }
        .custom-tabs .ant-tabs-nav::before {
          border-bottom: none !important;
        }
      `}</style>
      <main className="relative min-h-screen w-full transition-colors duration-500 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 overflow-hidden">
        {/* Decorative background */}
        <PlexusBackground isDark={isDark} />
        <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {selectedCandidate ? (
            <CandidateProfile key="profile" candidate={selectedCandidate} onBack={handleBackToSearch} />
          ) : (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <div className={`relative ${isSearching ? "pt-8 px-4 md:px-8" : "h-screen"}`}>
                <AnimatedSearchBar 
                  isSearching={isSearching} 
                  setIsSearching={setIsSearching} 
                  onSubmit={performSearch}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onClear={clearSearch}
                  activeTab={activeSearchTab}
                  onTabChange={handleTabChange}
                />
              </div>

              {isSearching && (
                <div className="w-full flex flex-col gap-4 pb-8">
                  {/* Horizontal Filter Bar */}
                  <FilterBar
                    roles={roles}
                    onRolesChange={setRoles}
                    skills={skills}
                    onSkillsChange={setSkills}
                    experience={experience}
                    onExperienceChange={setExperience}
                    onReset={resetFilters}
                  />
                  {/* Results Grid with Infinite Scroll */}
                  <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                    {initialLoading ? (
                      // Show loading skeleton for initial load
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16"></div>
                              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {results.length > 0 ? (
                          <InfiniteScroll
                            dataLength={results.length}
                            next={loadMoreStudents}
                            hasMore={hasMore}
                            loader={
                              <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading more students...</span>
                              </div>
                            }
                            endMessage={
                              <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-300 font-medium">
                                  🎉 You've seen all students!
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                  Try adjusting your search filters to find more talent.
                                </p>
                              </div>
                            }
                            style={{ overflow: 'visible' }}
                          >
                            <motion.div
                              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                              initial="hidden"
                              animate="visible"
                              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                            >
                              {results.map((candidate) => (
                                <CandidateCard key={candidate.id} candidate={candidate} onSelect={handleSelectCandidate} />
                              ))}
                            </motion.div>
                          </InfiniteScroll>
                        ) : (
                          <div className="col-span-full text-center text-gray-600 dark:text-gray-300 py-16">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold mb-2">No students found</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                              Try adjusting your search filters or check back later.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </>
  );
};

// --- PAGE WRAPPER WITH EMPLOYER LAYOUT ---
export default function EmployerTalentSearchPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // FIX: Moved antTheme definition here, outside of ExploreContent
  const antTheme = useMemo(() => {
    return {
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: "#3b82f6",
        colorBgBase: isDark ? "#0b0f1a" : "#ffffff",
        colorBgContainer: isDark ? "#0f172a" : "#ffffff",
        colorText: isDark ? "rgba(255,255,255,0.92)" : "#111827",
        colorBorder: isDark ? "#334155" : "#e5e7eb",
        borderRadius: 12,
      },
      components: {
        Tabs: {
          cardBg: "transparent",
          itemColor: isDark ? "rgba(255,255,255,0.65)" : "#374151",
          itemSelectedColor: "#3b82f6",
          inkBarColor: "#3b82f6",
        },
      },
    } as const;
  }, [isDark]);

  return (
    <RoleGuard allowedRole="employer">
      {/* FIX: Wrap the application with NotificationWrapper, which contains ConfigProvider */}
      <NotificationWrapper antTheme={antTheme}>
        <div className="h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/10 flex relative overflow-hidden">
          <EmployerSidebar />
          <div className="flex-1 overflow-y-auto relative">
            {/* Top Bar */}
            <div className="flex items-center justify-end p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>

            {/* Content */}
            <ExploreContent />
          </div>
        </div>
      </NotificationWrapper>
    </RoleGuard>
  );
}
