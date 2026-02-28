"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Settings,
  Activity,
  FileText,
  Shield,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import ApiKeyModal from "@/components/dashboard/institute/ApiKeyModal";
import ApiDocumentationModal from "@/components/dashboard/institute/ApiDocumentationModal";
import toast from "react-hot-toast";

interface ApiKey {
  id: string;
  keyName: string;
  maskedKey: string;
  environment: 'sandbox' | 'production';
  permissions: {
    canCreateCredentials: boolean;
    canViewCredentials: boolean;
    canRevokeCredentials: boolean;
  };
  isActive: boolean;
  lastUsed: string | null;
  usageCount: number;
  recentUsage: number;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface ApiAnalytics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  errorRate: string;
  uniqueEndpoints: number;
}

export default function ApiIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'analytics' | 'documentation'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);



  useEffect(() => {
    fetchApiKeys();
    fetchAnalytics();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manage/keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data.apiKeys);
      }
      // Silently handle non-OK responses - user will see empty state
    } catch (error) {
      console.error("Error fetching API keys:", error);
      // Silently handle errors - user will see empty state
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manage/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data.overview);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleCreateKey = async (keyData: any) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manage/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(keyData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("API key created successfully!");
        setShowKey(data.data.apiKey); // Show the full key once
        fetchApiKeys();
        setIsKeyModalOpen(false);
        return data.data;
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manage/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("API key revoked successfully");
        fetchApiKeys();
      } else {
        toast.error("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getEnvironmentBadge = (env: string) => {
    return env === 'production' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Production
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Sandbox
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean, revokedAt: string | null) => {
    if (revokedAt) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Revoked
        </span>
      );
    }
    return isActive ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        Inactive
      </span>
    );
  };

  return (
    <RoleGuard allowedRole="institute">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                API Integration
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
            {/* Desktop Header */}
            <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  API Integration
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  Manage API keys and integrate credential submission into your systems
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>
            
            <div className="p-4 md:p-8">

          {/* Stats Cards */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.totalRequests.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.successfulRequests.toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analytics.errorRate}%
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">API Keys</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {apiKeys.filter(key => key.isActive).length}
                    </p>
                  </div>
                  <Key className="h-8 w-8 text-purple-500" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('keys')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'keys'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Key className="h-4 w-4 inline mr-2" />
                  API Keys
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-2" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('documentation')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'documentation'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Documentation
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'keys' && (
                <div>
                  {/* Header with Create Button */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        API Keys
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your API keys for credential submission
                      </p>
                    </div>
                    <button
                      onClick={() => setIsKeyModalOpen(true)}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create API Key
                    </button>
                  </div>

                  {/* Show newly created key */}
                  {showKey && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            🔑 Your new API key is ready!
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                            Please copy and save this key securely. It will not be shown again.
                          </p>
                          <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 font-mono text-sm break-all">
                            {showKey}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => copyToClipboard(showKey)}
                            className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowKey(null)}
                            className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                            title="Dismiss"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* API Keys List */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-12">
                      <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No API Keys
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first API key to start integrating with our platform
                      </p>
                      <button
                        onClick={() => setIsKeyModalOpen(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Create API Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <motion.div
                          key={key.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                  {key.keyName}
                                </h4>
                                {getEnvironmentBadge(key.environment)}
                                {getStatusBadge(key.isActive, key.revokedAt)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-mono">{key.maskedKey}</span>
                                <span>•</span>
                                <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                {key.lastUsed && (
                                  <>
                                    <span>•</span>
                                    <span>Last used {new Date(key.lastUsed).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <Activity className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {key.usageCount.toLocaleString()} total • {key.recentUsage} last 24h
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(key.maskedKey)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Copy masked key"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelectedKey(key)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {key.isActive && !key.revokedAt && (
                                <button
                                  onClick={() => handleRevokeKey(key.id)}
                                  className="p-2 text-red-400 hover:text-red-600"
                                  title="Revoke key"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    API Usage Analytics
                  </h3>
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Detailed analytics coming soon...
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'documentation' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        API Documentation
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Learn how to integrate with our credential submission API
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      View Full Documentation
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-6 w-6 text-green-500" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Authentication
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Use your API key in the Authorization header:
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono text-sm">
                        Authorization: Bearer YOUR_API_KEY
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Globe className="h-6 w-6 text-blue-500" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          Base URL
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        All API requests should be made to:
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono text-sm">
                        https://credexa.onrender.com/api/external
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Quick Start Example
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-gray-800 dark:text-gray-200">{`curl -X POST "https://credexa.onrender.com/api/external/credentials" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "studentEmail": "student@example.com",
    "credentialTitle": "Advanced JavaScript Course",
    "completionDate": "2024-03-15T10:30:00Z",
    "certificateUrl": "https://yourcdn.com/certificate.pdf",
    "nsqfLevel": 5,
    "skills": ["JavaScript", "React", "Node.js"]
  }'`}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Modals */}
        <ApiKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          onSubmit={handleCreateKey}
        />

        <ApiDocumentationModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
        />
        </div>
      </div>
    </RoleGuard>
  );
}