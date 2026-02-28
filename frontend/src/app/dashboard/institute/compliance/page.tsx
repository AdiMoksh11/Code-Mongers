"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Award,
  Download,
  Eye
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import toast from "react-hot-toast";

interface ComplianceCategory {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

interface RecentAudit {
  date: Date;
  type: string;
  status: 'passed' | 'failed' | 'pending';
  score: number;
}

interface ComplianceData {
  overallScore: number;
  lastUpdated: Date;
  categories: ComplianceCategory[];
  recentAudits: RecentAudit[];
}

export default function CompliancePage() {
  const [compliance, setCompliance] = useState<ComplianceData>({
    overallScore: 0,
    lastUpdated: new Date(),
    categories: [],
    recentAudits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/compliance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompliance(data.compliance);
      } else {
        toast.error("Failed to fetch compliance data");
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error);
      toast.error("Failed to fetch compliance data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'passed':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <RoleGuard allowedRole="institute">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10 flex relative">
        <InstituteSidebar />
        
        <div className="flex-1 overflow-y-auto relative w-full md:w-auto">
          {/* Top Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 md:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Compliance Dashboard
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                Monitor NSQF compliance and regulatory requirements
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
              <button className="px-3 md:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm md:text-base">
                <Download className="h-4 w-4" />
                Download Report
              </button>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                {/* Overall Compliance Score */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-8 mb-8 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">
                        Overall Compliance Score
                      </h2>
                      <p className="text-purple-100 mb-4">
                        Last updated: {new Date(compliance.lastUpdated).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-6xl font-bold">
                          {compliance.overallScore.toFixed(1)}%
                        </div>
                        <div className="flex items-center text-green-200">
                          <TrendingUp className="h-6 w-6 mr-2" />
                          <span className="text-lg">+2.3% this quarter</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Shield className="h-24 w-24 text-white/20 mb-4" />
                      <div className="text-purple-100">
                        <div className="text-sm">NSQF Compliant</div>
                        <div className="text-xs">Certified Institute</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Compliance Categories */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-8"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Compliance Categories
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {compliance.categories.map((category, index) => (
                      <div
                        key={category.name}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {category.name}
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(category.status)}`}>
                            {category.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center mb-3">
                          <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                            {category.score.toFixed(1)}%
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  category.score >= 95 ? 'bg-green-500' :
                                  category.score >= 85 ? 'bg-blue-500' :
                                  category.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${category.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Audits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Audits & Assessments
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    {compliance.recentAudits.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No recent audits found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {compliance.recentAudits.map((audit, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-4">
                                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {audit.type}
                                </h4>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(audit.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`text-sm font-semibold ${getScoreColor(audit.score)}`}>
                                  {audit.score.toFixed(1)}%
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                                  {audit.status}
                                </span>
                              </div>
                              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Compliance Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-8 grid md:grid-cols-3 gap-6"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        Next Steps
                      </h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li>• Review NSQF Level 6 alignment</li>
                      <li>• Update course documentation</li>
                      <li>• Submit quarterly report</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center mb-4">
                      <Award className="h-8 w-8 text-green-600 mr-3" />
                      <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Certifications
                      </h4>
                    </div>
                    <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                      <li>• NSQF Recognized Institute</li>
                      <li>• ISO 21001:2018 Compliant</li>
                      <li>• NCVET Approved</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center mb-4">
                      <Shield className="h-8 w-8 text-purple-600 mr-3" />
                      <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        Data Security
                      </h4>
                    </div>
                    <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                      <li>• GDPR Compliant</li>
                      <li>• Blockchain Anchored</li>
                      <li>• Regular Security Audits</li>
                    </ul>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}