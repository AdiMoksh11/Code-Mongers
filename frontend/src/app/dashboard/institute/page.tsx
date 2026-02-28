"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { 
  Users, 
  Award, 
  BookOpen, 
  BarChart3, 
  TrendingUp,
  GraduationCap,
  FileText,
  Shield,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Star,
  ArrowUpRight,
  Crown,
  Lightbulb
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import toast from "react-hot-toast";

export default function CredentialIssuerDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsChange: "Loading...",
    credentialsIssued: 0,
    credentialsChange: "Loading...",
    activeCourses: 0,
    coursesChange: "Loading...",
    nsqfCompliance: "Loading...",
    complianceChange: "Loading..."
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Fetch dashboard stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/dashboard/activities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.activities);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Students",
      value: loading ? "Loading..." : stats.totalStudents.toString(),
      change: stats.studentsChange,
      icon: <Users className="h-6 w-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Credentials Issued",
      value: loading ? "Loading..." : stats.credentialsIssued.toString(),
      change: stats.credentialsChange,
      icon: <Award className="h-6 w-6" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Courses",
      value: loading ? "Loading..." : stats.activeCourses.toString(),
      change: stats.coursesChange,
      icon: <BookOpen className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "NSQF Compliance",
      value: loading ? "Loading..." : stats.nsqfCompliance,
      change: stats.complianceChange,
      icon: <Shield className="h-6 w-6" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = activities.length > 0 ? activities : [
    {
      action: "Loading recent activities...",
      time: "",
      type: "loading",
    },
  ];

  const quickActions = [
    {
      title: "Issue Credentials",
      description: "Create and issue digital certificates",
      icon: <Award className="h-6 w-6" />,
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/dashboard/institute/credentials/issue",
    },
    {
      title: "Manage Students",
      description: "View and manage student records",
      icon: <Users className="h-6 w-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "/dashboard/institute/students",
    },
    {
      title: "Course Management",
      description: "Add and manage course offerings",
      icon: <BookOpen className="h-6 w-6" />,
      color: "bg-green-500 hover:bg-green-600",
      href: "/dashboard/institute/courses",
    },
    {
      title: "Analytics",
      description: "View institutional performance metrics",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "bg-orange-500 hover:bg-orange-600",
      href: "/dashboard/institute/analytics",
    },
  ];

  return (
    <RoleGuard allowedRole="institute">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10">

        {/* Mobile header - only visible on mobile */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end p-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </div>
          </div>
        </div>

        <div className="md:flex">
          <InstituteSidebar />
          
          <div className="flex-1 overflow-y-auto w-full">
            {/* Desktop Top Bar with Theme Toggle */}
            <div className="hidden md:flex items-center justify-end p-4 md:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 md:gap-4">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>

        <div className="p-4 md:p-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 relative"
          >
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 relative">
                Credential Issuer Dashboard
                <div className="absolute -top-2 -right-4 md:-right-8">
                  <Crown className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                </div>
              </h1>
              {/* Display issuer type and name */}
              {userProfile?.institute && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    userProfile.institute.issuerType === 'university' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : userProfile.institute.issuerType === 'edtech'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {userProfile.institute.issuerType === 'university' ? '🏛️ Traditional Institution' :
                     userProfile.institute.issuerType === 'edtech' ? '💻 EdTech Platform' :
                     '📚 Training Provider'}
                  </div>
                  <span className="hidden sm:inline text-gray-600 dark:text-gray-400">•</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                    {userProfile.institute.name}
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-lg flex items-center gap-2 mt-4">
              <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-purple-500 flex-shrink-0" />
              Welcome back! Manage your learners, courses, and credential issuance. 🎓
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {statsData.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
              </div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className="group cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg text-white ${action.color} transition-colors`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {action.description}
                          </p>
                          <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                            Get Started <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {activity.action}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium">
                  View All Activity
                </button>
              </div>
            </motion.div>
          </div>

          {/* NSQF Compliance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🏆 NSQF Compliance & Recognition
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your institution maintains high standards in skill qualification alignment:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Digital Credentials
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Issue blockchain-verified certificates aligned with NSQF levels
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Progress Tracking
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor student progress across skill development pathways
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Regulatory Reporting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automated compliance reports for NCVET and other bodies
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
        </div>
      </div>
    </RoleGuard>
  );
}
