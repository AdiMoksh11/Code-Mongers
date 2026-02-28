"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  Award,
  BookOpen,
  PieChart,
  Activity,
  Target
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from "recharts";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    graduatedStudents: number;
    credentialsIssued: number;
  };
  monthlyGrowth: Array<{
    month: string;
    students: number;
    credentials: number;
  }>;
  skillsDistribution: Array<{
    skill: string;
    count: number;
  }>;
  nsqfLevels: Array<{
    level: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      totalStudents: 0,
      activeStudents: 0,
      graduatedStudents: 0,
      credentialsIssued: 0
    },
    monthlyGrowth: [],
    skillsDistribution: [],
    nsqfLevels: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        console.log('Skills distribution:', data.analytics.skillsDistribution);
        setAnalytics(data.analytics);
      } else {
        toast.error("Failed to fetch analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5A5A'];

  return (
    <RoleGuard allowedRole="institute">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Analytics
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </div>
          </div>
        </div>

        <div className="md:flex">
          <InstituteSidebar />
          
          <div className="flex-1 overflow-y-auto w-full">
            {/* Desktop Top Bar */}
            <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics Dashboard
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  Comprehensive insights into your institute's performance
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>

          <div className="p-4 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Students
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {analytics.overview.totalStudents.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +12% this month
                        </p>
                      </div>
                      <Users className="h-12 w-12 text-blue-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Active Students
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {analytics.overview.activeStudents.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +8% this month
                        </p>
                      </div>
                      <Activity className="h-12 w-12 text-green-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Credentials Issued
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {analytics.overview.credentialsIssued.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +15% this month
                        </p>
                      </div>
                      <Award className="h-12 w-12 text-purple-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Graduation Rate
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {((analytics.overview.graduatedStudents / analytics.overview.totalStudents) * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +3% this year
                        </p>
                      </div>
                      <Target className="h-12 w-12 text-orange-500" />
                    </div>
                  </motion.div>
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                  {/* Monthly Growth Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      Monthly Growth Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.monthlyGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="students" fill="#3B82F6" name="New Students" />
                        <Bar dataKey="credentials" fill="#8B5CF6" name="Credentials Issued" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Skills Distribution Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      Skills Distribution
                    </h3>
                    {analytics.skillsDistribution && analytics.skillsDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={analytics.skillsDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({skill, percent}: any) => `${skill} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analytics.skillsDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📊</div>
                          <p>No skills data available</p>
                          <p className="text-sm">Add some credentials to see skills distribution</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* NSQF Levels and Skills Tables */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* NSQF Levels Distribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      NSQF Level Distribution
                    </h3>
                    {analytics.nsqfLevels && analytics.nsqfLevels.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.nsqfLevels.map((level, index) => (
                          <div key={level.level} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{level.level}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                <div
                                  className="h-2 rounded-full"
                                  style={{ 
                                    width: `${(level.count / Math.max(...analytics.nsqfLevels.map(l => l.count))) * 100}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{level.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📋</div>
                          <p>No NSQF level data available</p>
                          <p className="text-sm">Add credentials with NSQF levels to see distribution</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Top Skills by Count */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                      Most Popular Skills
                    </h3>
                    {analytics.skillsDistribution && analytics.skillsDistribution.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.skillsDistribution.map((skill, index) => (
                          <div key={skill.skill} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                                <span className="text-purple-600 dark:text-purple-300 text-sm font-bold">#{index + 1}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.skill}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                <div
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${(skill.count / Math.max(...analytics.skillsDistribution.map(s => s.count))) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{skill.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🎯</div>
                          <p>No skills data available</p>
                          <p className="text-sm">Add credentials with skills to see popular skills</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </RoleGuard>
  );
}