"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  Users,
  Star,
  ArrowRight,
  Search,
  Lock,
  MessageCircle,
  Building,
  SquareDashedKanban,
  UserCheck,
  PlayCircle,
  LucideIcon,
  BarChart2,
  Moon,
} from "lucide-react";
import ThemeToggleButton from "../../components/ui/theme-toggle-button";
import JobSearchModal from "../../components/jobs/JobSearchModal";
import api from "../../utils/axios";

interface Skill { name: string; icon: LucideIcon; }
const popularSkills: Skill[] = [
  { name: "AI & ML", icon: Brain },
  { name: "Computing", icon: Layers },
  { name: "Cybersecurity", icon: Lock },
  { name: "Data Science", icon: BarChart2 },
  { name: "Blockchain", icon: SquareDashedKanban },
  { name: "UI/UX Design", icon: MessageCircle },
];

interface Credential { name: string; issuer: string; nsqfLevel: number; badgeUrl: string; }
const trendingCredentials: Credential[] = [
  { name: "AWS Cloud Practiciner", issuer: "Amazon Web Services", nsqfLevel: 4, badgeUrl: "https://placehold.co/100x100/5A6B7E/FFFFFF?text=AWS" },
  { name: "Machine Learning Specialization", issuer: "Coursera (Stanford)", nsqfLevel: 6, badgeUrl: "https://placehold.co/100x100/A1C0FF/FFFFFF?text=ML" },
  { name: "Certified Ethical Hacker", issuer: "EC-Council", nsqfLevel: 5, badgeUrl: "https://placehold.co/100x100/D4A0FF/FFFFFF?text=CEH" },
];

interface Learner { name: string; role: string; isVerified: boolean; avatarUrl: string; }
const topLearners: Learner[] = [
  { name: "Rana Dambids", role: "Database (NSQF Level 6)", isVerified: true, avatarUrl: "https://placehold.co/50x50/B8F0BA/FFFFFF?text=R" },
  { name: "Reepot enaka soito", role: "Front-end (NSQF Level 7)", isVerified: false, avatarUrl: "https://placehold.co/50x50/F0E9B8/FFFFFF?text=R" },
  { name: "Fiac double", role: "UI/UX (NSQF Level 7)", isVerified: true, avatarUrl: "https://placehold.co/50x50/B8D9F0/FFFFFF?text=F" },
  { name: "Data Engineering", role: "Data Engineering (NSQF Lvl 7)", isVerified: true, avatarUrl: "https://placehold.co/50x50/F0B8B8/FFFFFF?text=D" },
];

const recommendedCreds: Learner[] = [
  { name: "Recommended credits", role: "CredsBadges", isVerified: true, avatarUrl: "https://placehold.co/50x50/F0B8B8/FFFFFF?text=R" },
  { name: "Startostle", role: "UI/UX (NSQF Level 7)", isVerified: false, avatarUrl: "https://placehold.co/50x50/B8D9F0/FFFFFF?text=S" },
];

interface Badge { icon: string; color: string; bgColor: string; }
const unlockBadges: Badge[] = [
  { icon: 'C', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { icon: 'P', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { icon: 'S', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { icon: 'R', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { icon: 'T', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { icon: 'B', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface SectionHeaderProps { title: string; icon: LucideIcon; }
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon: Icon }) => (
  <h2 className="flex items-center text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
    <Icon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" />
    {title}
  </h2>
);

interface UserProfileCardProps extends Learner {}
const UserProfileCard: React.FC<UserProfileCardProps> = ({ name, role, isVerified, avatarUrl }) => (
  <motion.div
    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-500 transition-colors cursor-pointer"
    variants={itemVariants}
  >
    <div className="flex items-center">
      <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full mr-3 object-cover" />
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
      </div>
    </div>
    <div className="flex-shrink-0">
      <button className={`px-3 py-1 text-xs font-medium rounded-full ${
        isVerified ? "bg-blue-600 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
      }`}>
        {isVerified ? "Verified" : "Unverified"}
      </button>
    </div>
  </motion.div>
);

interface CredentialCardProps extends Credential {}
const CredentialCard: React.FC<CredentialCardProps> = ({ name, issuer, nsqfLevel, badgeUrl }) => (
  <motion.div
    className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-500 transition-colors cursor-pointer"
    variants={itemVariants}
  >
    <div className="flex justify-between items-center mb-2">
      <img src={badgeUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
      <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-400">
        NSQF <span className="font-bold">{nsqfLevel}</span>
      </div>
    </div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400">{issuer}</p>
  </motion.div>
);

const App: React.FC = () => {
  const [isJobSearchOpen, setIsJobSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await api.get("/api/users/me");
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.log("Not logged in or token expired");
      }
    };
    
    fetchCurrentUser();
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans antialiased">
      <motion.header
        className="bg-white dark:bg-zinc-800 p-4 flex justify-between items-center shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-zinc-700"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          <ArrowRight
            className="h-6 w-6 text-blue-500 dark:text-blue-400 mr-3 rotate-180 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          />
          <span className="text-2xl font-bold text-blue-500 dark:text-blue-400">C</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">redexa</span>
        </div>

        <nav className="hidden md:flex space-x-12 text-lg font-bold">
          <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</a>
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Verify</a>
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Analytics</a>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
          </div>

          <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS2x1t/giphy.gif" />

          {currentUser ? (
            <div className="flex items-center space-x-3">
              <img 
                src={currentUser.profilePic || "https://placehold.co/40x40/5A6B7E/FFFFFF?text=" + (currentUser.fullName?.firstName?.charAt(0) || "U")} 
                alt="User Avatar" 
                className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all object-cover border-2 border-gray-200 dark:border-gray-600" 
              />
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {currentUser.fullName?.firstName && currentUser.fullName?.lastName 
                    ? `${currentUser.fullName.firstName} ${currentUser.fullName.lastName}`
                    : currentUser.email?.split('@')[0] || 'User'
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentUser.email}
                </p>
              </div>
            </div>
          ) : (
            <img src="https://placehold.co/40x40/5A6B7E/FFFFFF?text=U" alt="User Avatar" className="rounded-full cursor-pointer" />
          )}
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-8xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <motion.section
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Popular Skill Categories</h2>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {popularSkills.map((skill, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-800 rounded-xl shadow border border-gray-200 dark:border-zinc-700 hover:border-blue-500 transition-colors min-w-[120px] cursor-pointer">
                  <skill.icon className="h-8 w-8 text-blue-500 dark:text-blue-400 mb-2" />
                  <span className="text-xs font-medium text-center text-gray-900 dark:text-gray-100">{skill.name}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <motion.section className="relative p-8 bg-white dark:bg-zinc-800 rounded-3xl shadow-lg overflow-hidden lg:col-span-3"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl -z-10 blur-3xl" />
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 text-blue-500 dark:text-blue-400">AI Career Path Recommender</h3>
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">You are 76% towards NSQF Level 6 Data Analyst. Complete `SQL Advanced` to finish the pathway.</p>
                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors">
                    View My Path <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center relative w-32 h-32 md:w-40 md:h-40">
                  <div className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-600/30 flex items-center justify-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                      <PlayCircle className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-gray-900 dark:text-gray-100">
                    <Star className="h-3 w-3 mr-1 text-yellow-400" />15
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section className="relative p-8 bg-white dark:bg-zinc-800 rounded-3xl shadow-lg overflow-hidden lg:col-span-2"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-3xl -z-10 blur-3xl" />
              <h3 className="text-xl font-bold mb-4 text-purple-500 dark:text-purple-400">Unlock Badges</h3>
              <div className="flex flex-wrap gap-4">
                {unlockBadges.map((badge, idx) => (
                  <div key={idx} className="relative group">
                    <div className={`w-16 h-16 rounded-full border-2 border-dashed ${badge.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <span className={`text-3xl font-bold ${badge.color}`}>{badge.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <motion.section className="mb-8" variants={containerVariants} initial="hidden" animate="visible">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Trending Micro-Credentials</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingCredentials.map((cred, idx) => (
                <CredentialCard key={idx} {...cred} />
              ))}
            </div>
          </motion.section>
        </div>

        <div className="md:col-span-1 space-y-8">
          <motion.section className="bg-white dark:bg-zinc-800 p-6 rounded-3xl shadow-lg border border-gray-200 dark:border-zinc-700" variants={containerVariants} initial="hidden" animate="visible">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              <Building className="h-5 w-5 text-blue-500 dark:text-blue-400" /> For Employers
            </h2>
            <div className="relative mb-4">
              <input type="text" placeholder="Find candidates by skills level" className="w-full bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            </div>
            <div className="space-y-2">
              <button className="flex items-center w-full p-2 bg-gray-100 dark:bg-zinc-700 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
                <Briefcase className="h-5 w-5 mr-3" /> Post a job
              </button>
              <button className="flex items-center w-full p-2 bg-gray-100 dark:bg-zinc-700 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
                <BookOpen className="h-5 w-5 mr-3" /> Post a project
              </button>
              <button className="flex items-center w-full p-2 bg-gray-100 dark:bg-zinc-700 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors">
                <Users className="h-5 w-5 mr-3" /> Request a dedicated team
              </button>
            </div>
          </motion.section>
          <motion.section className="bg-white dark:bg-zinc-800 p-6 rounded-3xl shadow-lg border border-gray-200 dark:border-zinc-700" variants={containerVariants} initial="hidden" animate="visible">
            <SectionHeader title="Top Learners in Your Region" icon={Star} />
            <div className="space-y-4">
              {topLearners.map((learner, idx) => <UserProfileCard key={idx} {...learner} />)}
            </div>
          </motion.section>

          <motion.section className="bg-white dark:bg-zinc-800 p-6 rounded-3xl shadow-lg border border-gray-200 dark:border-zinc-700" variants={containerVariants} initial="hidden" animate="visible">
            <SectionHeader title="Recommended creds" icon={UserCheck} />
            <div className="space-y-4">
              {recommendedCreds.map((cred, idx) => <UserProfileCard key={idx} {...cred} />)}
            </div>
          </motion.section>
        </div>
      </div>

      {/* Floating Job Search Button */}
      <motion.button
        onClick={() => setIsJobSearchOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-40 flex items-center justify-center group"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
        whileHover={{ rotate: 360 }}
        whileTap={{ scale: 0.9 }}
      >
        <Briefcase className="h-6 w-6" />
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          AI
        </div>
        {/* Tooltip */}
        <div className="absolute right-full mr-4 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Search Jobs with AI
          <div className="absolute top-1/2 left-full w-0 h-0 border-l-4 border-l-gray-900 dark:border-l-white border-y-4 border-y-transparent -translate-y-1/2"></div>
        </div>
      </motion.button>

      {/* Job Search Modal */}
      <JobSearchModal
        isOpen={isJobSearchOpen}
        onClose={() => setIsJobSearchOpen(false)}
      />
    </div>
  );
};

export default App;
