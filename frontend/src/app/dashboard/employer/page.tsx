"use client";

import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  FileCheck, 
  Search, 
  BarChart3, 
  TrendingUp, 
  UserCheck,
  Building2,
  Target,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Star,
  ArrowUpRight,
  Globe,
  Shield,
  PlusCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";

export default function EmployerDashboard() {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const stats = [
    {
      title: "Active Job Postings",
      value: "12",
      change: "+3 this month",
      icon: <Building2 className="h-6 w-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Candidates Reviewed",
      value: "157",
      change: "+28 this week",
      icon: <UserCheck className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Credentials Verified",
      value: "89",
      change: "+15 today",
      icon: <FileCheck className="h-6 w-6" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Successful Hires",
      value: "23",
      change: "+5 this month",
      icon: <Target className="h-6 w-6" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivities = [
    {
      action: "Credential verified for John Smith",
      time: "2 hours ago",
      type: "verification",
    },
    {
      action: "New candidate matched for Senior Developer role",
      time: "4 hours ago",
      type: "match",
    },
    {
      action: "Job posting for Data Analyst published",
      time: "1 day ago",
      type: "posting",
    },
    {
      action: "Bulk verification completed for 15 candidates",
      time: "2 days ago",
      type: "bulk",
    },
  ];

  const quickActions = [
    {
      title: "Post New Job",
      description: "Create a new job posting and find talent",
      icon: <PlusCircle className="h-6 w-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "/dashboard/employer/jobs/new",
    },
    {
      title: "Search Talent",
      description: "Find candidates with specific skills",
      icon: <Search className="h-6 w-6" />,
      color: "bg-green-500 hover:bg-green-600",
      href: "/dashboard/employer/talent-search",
    },
    {
      title: "Verify Credentials",
      description: "Bulk verify candidate credentials",
      icon: <FileCheck className="h-6 w-6" />,
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/dashboard/employer/verify-credentials",
    },
    {
      title: "View Analytics",
      description: "Check hiring analytics and insights",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "bg-orange-500 hover:bg-orange-600",
      href: "/dashboard/employer/analytics",
    },
  ];

  return (
    <RoleGuard allowedRole="employer">
      <div className="h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/10 flex relative overflow-hidden">

        <EmployerSidebar />
        
        <div className="flex-1 overflow-y-auto relative">
        {/* Top Bar with Theme Toggle */}
        <div className="flex items-center justify-end p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>
        </div>

        <div className="p-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 relative"
          >
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Employer Dashboard
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Welcome back! Here&apos;s what&apos;s happening with your hiring. 🚀
            </p>
          </motion.div>

          {/* Enhanced Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.5 + index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
              >                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-xl ${stat.bgColor} shadow-lg`}>
                      <div className={stat.color}>{stat.icon}</div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    {stat.title}
                  </h3>
                  
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </p>
                  
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
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
                <div className="grid md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      onClick={() => handleNavigate(action.href)}
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
                          <div className="flex items-center text-sm text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
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
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
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
                <button className="w-full mt-4 text-sm text-green-600 dark:text-green-400 hover:text-green-700 font-medium">
                  View All Activity
                </button>
              </div>
            </motion.div>
          </div>

          {/* Coming Soon Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🚀 Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Exciting new features are being developed to enhance your hiring experience:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    AI Skill Matching
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced AI to match candidates with job requirements
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Blockchain Verification
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tamper-proof credential verification system
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    API Integration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect with your existing HR management systems
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </div>
    </RoleGuard>
  );
}
