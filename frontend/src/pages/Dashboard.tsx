"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import ProfileCard from "@/components/dashboard/ProfileCard";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { BarChart3, KeyRound, CreditCard } from "lucide-react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

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

interface DashboardUser {
  _id: string;
  fullName: { firstName: string; lastName: string; };
  username?: string;
  email: string | null;
  phone?: string;
  profilePic: string;
  provider: string;
  projects?: UserProject[];
  walletAddress?: string;
  resume?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
    fileSize: number;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    instagram?: string;
    facebook?: string;
  };
}

interface Credential {
  _id: string;
  title: string;
  issuer: string;
  type: string;
  status: string;
  nsqfLevel?: number;
  creditPoints?: number;
  skills: string[];
  createdAt: string;
}

interface UserStats {
  credentialsCount: number;
  uniqueSkills: number;
  totalPoints: number;
  averageNSQFLevel: number;
  verifiedCredentials: number;
  userRank?: number;
  totalUsers?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    credentialsCount: 0,
    uniqueSkills: 0,
    totalPoints: 0,
    averageNSQFLevel: 0,
    verifiedCredentials: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data and statistics
  const fetchUserData = async (token: string) => {
    try {
      setError(null);
      
      // Fetch user profile
      const userResponse = await api.get("/api/users/me", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log("User data fetched:", userResponse.data.user);
      setUser(userResponse.data.user);

      // Fetch user credentials
      const credentialsResponse = await api.get("/api/credentials", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log("Credentials fetched:", credentialsResponse.data);
      setCredentials(credentialsResponse.data);

      // Fetch user rank (optional - don't fail if this doesn't work)
      let userRankData = null;
      try {
        const rankResponse = await api.get("/api/user-rank", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        userRankData = rankResponse.data;
        console.log("User rank fetched:", userRankData);
      } catch (error) {
        console.log("User rank not available (this is optional):", error);
      }

      // Calculate statistics from credentials
      const stats = calculateUserStats(credentialsResponse.data, userRankData);
      setUserStats(stats);

    } catch (error: any) {
      console.error("Failed to fetch user data:", error);
      
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("authToken");
        router.replace("/login?error=session_expired");
      } else {
        // Other errors - show error message but don't redirect
        setError("Failed to load dashboard data. Please try refreshing the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry function for error recovery
  const retryFetch = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setLoading(true);
      fetchUserData(token);
    }
  };

  // Calculate user statistics from credentials
  const calculateUserStats = (credentials: Credential[], rankData: any = null): UserStats => {
    const credentialsCount = credentials.length;
    const verifiedCredentials = credentials.filter(c => c.status === 'verified').length;
    
    // Get unique skills from all credentials
    const allSkills = credentials.flatMap(c => c.skills || []);
    const uniqueSkills = new Set(allSkills).size;
    
    // Calculate total credit points
    const totalPoints = credentials.reduce((sum, c) => sum + (c.creditPoints || 0), 0);
    
    // Calculate average NSQF level (only from credentials that have NSQF levels)
    const credentialsWithNSQF = credentials.filter(c => c.nsqfLevel && c.nsqfLevel > 0);
    const averageNSQFLevel = credentialsWithNSQF.length > 0 
      ? credentialsWithNSQF.reduce((sum, c) => sum + (c.nsqfLevel || 0), 0) / credentialsWithNSQF.length
      : 0;

    return {
      credentialsCount,
      uniqueSkills,
      totalPoints,
      averageNSQFLevel: Math.round(averageNSQFLevel * 10) / 10, // Round to 1 decimal
      verifiedCredentials,
      userRank: rankData?.rank,
      totalUsers: rankData?.totalUsers
    };
  };

  // Calculate next level progress (simplified NSQF progression)
  const calculateProgressToNextLevel = (currentLevel: number, totalPoints: number): number => {
    // NSQF level requirements (simplified)
    const levelRequirements = {
      1: { min: 0, max: 20 },
      2: { min: 21, max: 50 },
      3: { min: 51, max: 100 },
      4: { min: 101, max: 200 },
      5: { min: 201, max: 350 },
      6: { min: 351, max: 550 },
      7: { min: 551, max: 800 },
      8: { min: 801, max: 1100 },
      9: { min: 1101, max: 1500 },
      10: { min: 1501, max: 2000 }
    };

    const nextLevel = Math.min(Math.floor(currentLevel) + 1, 10);
    const nextLevelReq = levelRequirements[nextLevel as keyof typeof levelRequirements];
    
    if (!nextLevelReq || currentLevel >= 10) return 100; // Max level reached
    
    const pointsNeeded = nextLevelReq.min - totalPoints;
    if (pointsNeeded <= 0) return 100; // Already at or above next level
    
    const currentLevelReq = levelRequirements[Math.floor(currentLevel) as keyof typeof levelRequirements];
    const levelRange = nextLevelReq.min - (currentLevelReq?.min || 0);
    const pointsInCurrentLevel = totalPoints - (currentLevelReq?.min || 0);
    
    return Math.round((pointsInCurrentLevel / levelRange) * 100);
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchUserData(token);

    // Setup MetaMask event listeners
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log('Please connect to MetaMask.');
      }
    };

    const handleChainChanged = () => {
      // Handle chain changes by reloading the page
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check initial connection state
      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch((err: any) => {
          console.error(err);
        });

      // Cleanup listeners
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [router]);

  const checkMetaMaskStatus = async () => {
    if (!window.ethereum?.isMetaMask) {
      throw new Error("MetaMask is not installed");
    }

    // Check if MetaMask is locked
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts' // This doesn't prompt, just checks current state
      });
      if (!accounts || accounts.length === 0) {
        throw new Error("MetaMask is locked or not connected");
      }
    } catch (error) {
      throw new Error("Failed to check MetaMask status");
    }
  };

  const handleConnectWallet = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      return router.replace("/login");
    }

    if (!window.ethereum) {
      toast.error("Please install MetaMask to connect your wallet.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    const toastId = toast.loading("Checking wallet status...");

    try {
      // Check MetaMask status first
      try {
        await checkMetaMaskStatus();
      } catch (error: any) {
        if (error.message.includes("not installed")) {
          toast.error("Please install MetaMask to continue", { id: toastId });
          window.open("https://metamask.io/download/", "_blank");
          return;
        } else if (error.message.includes("locked")) {
          toast.error("Please unlock your MetaMask wallet", { id: toastId });
          return;
        }
      }

      toast.loading("Connecting wallet...", { id: toastId });

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        toast.error("Please unlock MetaMask and connect to this site.", { id: toastId });
        return;
      }

      const address = accounts[0];
      toast.loading("Requesting challenge...", { id: toastId });

      // Get challenge message
      const challengeResponse = await api.post(
        "/api/users/me/generate-link-challenge",
        { address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { message } = challengeResponse.data;

      toast.loading("Please sign the message in your wallet...", { id: toastId });

      // Request signature using eth_sign
      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        });

        toast.loading("Verifying and linking wallet...", { id: toastId });

        const linkResponse = await api.post(
          "/api/users/me/link-wallet",
          { address, signature },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUser(linkResponse.data);
        toast.success("Wallet linked successfully!", { id: toastId });
      } catch (signError: any) {
        if (signError.code === 4001) {
          toast.error("You rejected the signature request. Please try again.", { id: toastId });
        } else {
          toast.error("Failed to sign message: " + (signError.message || "Unknown error"), { id: toastId });
        }
      }
    } catch (error: any) {
      console.error("Wallet linking failed:", error);
      const errorMessage = 
        error.response?.data?.message || error.message || "An unknown error occurred.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Oops! Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={retryFetch}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <Header user={user} onConnectWallet={handleConnectWallet} />

        <ProfileCard user={user} />

        {/* User Details Section removed as requested */}

        {/* Projects Section */}
        {user?.projects && user.projects.length > 0 && (
          <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 rounded-xl shadow border border-emerald-200 dark:border-emerald-800 mb-8">
            <h2 className="text-xl font-semibold mb-4">My Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.projects.map((project) => (
                <div key={project._id || project.title} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow">
                  <h3 className="font-bold text-lg mb-2">{project.title}</h3>
                  {project.description && <p className="mb-2 text-gray-700 dark:text-gray-300">{project.description}</p>}
                  {project.imageUrl && (
                    <img src={project.imageUrl} alt={project.title} className="mb-2 rounded w-full h-40 object-cover" />
                  )}
                  <div className="flex flex-col gap-1">
                    {project.projectUrl && (
                      <Link href={project.projectUrl} target="_blank" className="text-emerald-600 underline">Project Link</Link>
                    )}
                    {project.githubUrl && (
                      <Link href={project.githubUrl} target="_blank" className="text-teal-600 underline">GitHub</Link>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">Tech: {project.technologies.join(", ")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          <StatCard
            icon={<BarChart3 className="h-8 w-8 text-emerald-500 mb-4" />}
            title="My Credentials"
            description={`You have ${userStats.credentialsCount} credentials (${userStats.verifiedCredentials} verified).`}
            linkText="View Credentials"
            linkHref="/dashboard/learner/credentials"
          />
          <StatCard
            icon={<KeyRound className="h-8 w-8 text-teal-500 mb-4" />}
            title="Skill Tracker"
            description={`Tracking ${userStats.uniqueSkills} skills with ${userStats.totalPoints} total points.`}
            linkText="View Skills"
            linkHref="/dashboard/learner/nsqf"
          />
          <StatCard
            icon={<CreditCard className="h-8 w-8 text-cyan-500 mb-4" />}
            title="Learning Progress"
            description={
              userStats.averageNSQFLevel > 0 
                ? (() => {
                    const progress = calculateProgressToNextLevel(userStats.averageNSQFLevel, userStats.totalPoints);
                    const nextLevel = Math.min(Math.floor(userStats.averageNSQFLevel) + 1, 10);
                    const rankInfo = userStats.userRank ? ` • Rank #${userStats.userRank}/${userStats.totalUsers}` : '';
                    return `Level ${userStats.averageNSQFLevel} • ${progress}% to Level ${nextLevel}${rankInfo}`;
                  })()
                : "Start adding credentials to track your NSQF progress!"
            }
            linkText="View Progress"
            linkHref="/dashboard/learner/leaderboard"
          />
        </div>
      </main>
    </div>
  );
}
