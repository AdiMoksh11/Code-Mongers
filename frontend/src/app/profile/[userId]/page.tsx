"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Award, 
  CheckCircle, 
  Shield,
  Star,
  TrendingUp,
  Users,
  BookOpen,
  Globe,
  Building2,
  Trophy,
  Target,
  Zap,
  Crown,
  ExternalLink,
  Share2,
  MessageCircle,
  Eye,
  Download,
  ChevronRight,
  Sparkles,
  Activity,
  BadgeCheck,
  GraduationCap,
  Code,
  Briefcase,
  Mail,
  User
} from 'lucide-react';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';

interface UserProfile {
  id: string;
  fullName: {
    firstName: string;
    lastName: string;
  };
  username?: string;
  email: string;
  profilePic?: string;
  bio?: string;
  location?: string;
  institute?: {
    name: string;
    state?: string;
    district?: string;
  };
  role: string;
  createdAt: string;
  stats: {
    totalCredentials: number;
    verifiedCredentials: number;
    totalPoints: number;
    skillsCount: number;
    rank?: number;
  };
  performanceScores?: {
    performance: number;
    efficiency: number;
    social: number;
  };
  credentials: Array<{
    _id: string;
    title: string;
    issuer: string;
    type: string;
    status: string;
    issueDate: string;
    skills?: string[];
  }>;
  topSkills: Array<{
    name: string;
    level: number;
    credentialsCount: number;
  }>;
  achievements: Array<{
    type: string;
    title: string;
    description: string;
    earnedAt: string;
  }>;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: `${profile.fullName.firstName} ${profile.fullName.lastName} - Credexa Profile`,
          text: `Check out ${profile.fullName.firstName}'s professional profile on Credexa`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  // Handle message functionality
  const handleMessage = () => {
    if (profile?.email) {
      window.location.href = `mailto:${profile.email}?subject=Hello from Credexa&body=Hi ${profile.fullName.firstName}, I found your profile on Credexa and would like to connect.`;
    } else {
      alert('Email not available for this user');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('🔍 Fetching profile for userId:', params?.userId);
        
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/${params?.userId}/public-profile`;
        console.log('📡 Full API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`Profile not found (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response data:', data);
        
        if (data.success && data.candidate) {
          // Transform the API response to match our interface
          const candidate = data.candidate;
          
          const profileData: UserProfile = {
            id: candidate.id,
            fullName: {
              firstName: candidate.name.split(' ')[0] || candidate.name,
              lastName: candidate.name.split(' ').slice(1).join(' ') || ''
            },
            username: candidate.username,
            email: candidate.email || '',
            profilePic: candidate.avatarUrl,
            bio: '',
            location: '',
            institute: undefined,
            role: candidate.role || 'learner',
            createdAt: new Date().toISOString(),
            stats: {
              totalCredentials: candidate.verifiedCredentials?.length || 0,
              verifiedCredentials: candidate.verifiedCredentials?.length || 0,
              totalPoints: (candidate.scores?.performance || 0) + (candidate.scores?.efficiency || 0) + (candidate.scores?.social || 0),
              skillsCount: candidate.skills?.length || 0,
              rank: undefined
            },
            // Store the actual scores for performance metrics
            performanceScores: {
              performance: Math.min(candidate.scores?.performance || 0, 100),
              efficiency: Math.min(candidate.scores?.efficiency || 0, 100), 
              social: Math.min(candidate.scores?.social || 0, 100)
            },
            credentials: candidate.verifiedCredentials?.map((cred: any) => ({
              _id: cred.id,
              title: cred.name,
              issuer: cred.issuer,
              type: 'certificate',
              status: 'verified',
              issueDate: cred.date,
              skills: []
            })) || [],
            topSkills: candidate.topSkills?.map((skill: string, index: number) => ({
              name: skill,
              level: candidate.skills?.find((s: any) => s.subject === skill)?.A || 0,
              credentialsCount: 1
            })) || [],
            achievements: []
          };
          
          console.log('📋 Transformed profile data:', profileData);
          setProfile(profileData);
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (err) {
        console.error('🚨 Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (params?.userId) {
      console.log('🚀 Starting profile fetch...');
      fetchProfile();
    } else {
      console.log('❌ No userId found in params');
      setError('No user ID provided');
      setLoading(false);
    }
  }, [params?.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-pulse border-t-purple-400"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'institute': return <Building2 size={20} className="text-blue-600" />;
      case 'employer': return <Briefcase size={20} className="text-green-600" />;
      default: return <GraduationCap size={20} className="text-purple-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'institute': return 'from-blue-500 to-cyan-500';
      case 'employer': return 'from-green-500 to-emerald-500';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/5 dark:to-purple-500/5"></div>
        <div className="absolute inset-0" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            
            <div className="flex items-center gap-3">
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              <button 
                onClick={handleShare}
                className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:bg-white dark:hover:bg-gray-800"
                title="Share profile"
              >
                <Share2 size={20} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
              </button>
              <button 
                onClick={handleMessage}
                className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:bg-white dark:hover:bg-gray-800"
                title="Send message"
              >
                <MessageCircle size={20} className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
              </button>
            </div>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r ${getRoleColor(profile.role)} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
                <div className="relative">
                  <img
                    src={profile.profilePic || '/placeholder-user.jpg'}
                    alt={`${profile.fullName.firstName} ${profile.fullName.lastName}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-3 shadow-lg">
                    <BadgeCheck size={20} className="text-white" />
                  </div>
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-2 shadow-lg">
                    <Crown size={16} className="text-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {profile.fullName.firstName} {profile.fullName.lastName}
                  </h1>
                  <Sparkles size={24} className="text-yellow-500" />
                </div>
                
                {profile.username && (
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-3">@{profile.username}</p>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  {getRoleIcon(profile.role)}
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {profile.role.includes('Professional') ? profile.role : `${profile.role} Professional`}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full border border-blue-200 dark:border-blue-700">
                    <Shield size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      {profile.stats.verifiedCredentials} Verified Credentials
                    </span>
                  </div>
                  
                  <div className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-full border border-green-200 dark:border-green-700">
                    <CheckCircle size={16} className="mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300 font-medium">Blockchain Verified</span>
                  </div>
                  
                  {profile.institute && (
                    <div className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full border border-purple-200 dark:border-purple-700">
                      <Building2 size={16} className="mr-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-purple-700 dark:text-purple-300 font-medium">{profile.institute.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-500/10 to-slate-500/10 dark:from-gray-500/20 dark:to-slate-500/20 rounded-full border border-gray-200 dark:border-gray-700">
                    <Calendar size={16} className="mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Target size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                {profile.stats.totalPoints.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Total Points</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Award size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                {profile.stats.totalCredentials}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Credentials</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Code size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                {profile.stats.skillsCount}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Skills Mastered</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Trophy size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                #{profile.stats.rank || 'N/A'}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Global Rank</div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['overview', 'credentials', 'skills', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Performance & Skills */}
            <div className="lg:col-span-1 space-y-6">
              {/* Performance Metrics */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <Activity size={18} className="text-white" />
                  </div>
                  Performance Metrics
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Performance</span>
                      <span className="text-2xl font-bold text-green-600">{profile.performanceScores?.performance || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: `${profile.performanceScores?.performance || 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Efficiency</span>
                      <span className="text-2xl font-bold text-blue-600">{profile.performanceScores?.efficiency || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{ width: `${profile.performanceScores?.efficiency || 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Social Impact</span>
                      <span className="text-2xl font-bold text-purple-600">{profile.performanceScores?.social || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{ width: `${profile.performanceScores?.social || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Top Skills */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <Star size={18} className="text-white" />
                  </div>
                  Top Skills
                </h3>
                <div className="space-y-4">
                  {profile.topSkills.slice(0, 5).map((skill, index) => (
                    <div key={skill.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : index === 2 ? 'bg-purple-500' : index === 3 ? 'bg-yellow-500' : 'bg-pink-500'
                        }`}></div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{skill.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{skill.level}%</span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Credentials */}
            <div className="lg:col-span-2 space-y-6">
              {/* Verified Credentials */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                      <Award size={18} className="text-white" />
                    </div>
                    Verified Credentials ({profile.stats.verifiedCredentials})
                  </h3>
                  <button 
                    onClick={() => setActiveTab('credentials')}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                  >
                    View All
                    <ExternalLink size={16} className="ml-1" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.credentials.map((credential, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight pr-2">
                          {credential.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye size={14} className="text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium">{credential.issuer}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(credential.issueDate).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 rounded-md text-xs font-medium border border-green-200 dark:border-green-700">
                            Verified
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                            <Download size={12} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Verification badge */}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center opacity-90">
                        <Zap size={12} className="text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => router.push(`/dashboard/credentials?user=${profile.id}`)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    View All Credentials
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
