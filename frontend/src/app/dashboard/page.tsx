"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, User, Building2, GraduationCap, Sparkles, Zap, Crown } from "lucide-react";
import toast from "react-hot-toast";

interface UserData {
  role?: "learner" | "employer" | "institute";
  fullName?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem("authToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        // Fetch user profile to get role
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("authToken");
            router.replace("/login");
            return;
          }
          throw new Error("Failed to fetch user profile");
        }

        const responseData = await response.json();
        const user = responseData.user;
        setUserData(user);

        if (!user.role || user.role === "" || user.role === null) {
          // User hasn't selected a role yet, redirect to role selection
          console.log("User without role detected, redirecting to role selection");
          setRedirecting(true);
          setTimeout(() => {
            router.replace("/select-role");
          }, 1500);
          return;
        }

        // User has a role, redirect to appropriate dashboard
        setRedirecting(true);
        setTimeout(() => {
          switch (user.role) {
            case "learner":
              router.replace("/dashboard/learner");
              break;
            case "employer":
              router.replace("/dashboard/employer");
              break;
            case "institute":
              router.replace("/dashboard/institute");
              break;
            default:
              router.replace("/select-role");
              break;
          }
        }, 1000);
      } catch (error: any) {
        console.error("Dashboard redirect error:", error);
        toast.error("Failed to load dashboard. Please try again.");
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRoleAndRedirect();
  }, [router]);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "learner":
        return <GraduationCap className="h-8 w-8 text-cyan-500" />;
      case "employer":
        return <Building2 className="h-8 w-8 text-green-500" />;
      case "institute":
        return <Crown className="h-8 w-8 text-purple-500" />;
      default:
        return <User className="h-8 w-8 text-gray-500" />;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "learner":
        return "from-cyan-500 to-blue-600";
      case "employer":
        return "from-green-500 to-emerald-600";
      case "institute":
        return "from-purple-500 to-violet-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (!isLoading && !redirecting) {
    return null; // Don't render anything if not loading and not redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-xl"
        />
      </div>

      <div className="text-center relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="mb-8"
        >
          <motion.div 
            className="h-20 w-20 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <span className="text-white font-bold text-2xl">CX</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Credexa
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-cyan-500" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Checking your account...
              </p>
            </motion.div>
          ) : redirecting ? (
            <motion.div
              key="redirecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6"
            >
              {userData?.role ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-3"
                  >
                    {getRoleIcon(userData.role)}
                    <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {userData.role}
                    </span>
                  </motion.div>
                  
                  <motion.div
                    className={`px-8 py-3 rounded-full bg-gradient-to-r ${getRoleColor(userData.role)} text-white font-semibold shadow-lg`}
                    animate={{ 
                      boxShadow: [
                        "0 4px 15px rgba(0,0,0,0.1)",
                        "0 8px 30px rgba(0,0,0,0.2)",
                        "0 4px 15px rgba(0,0,0,0.1)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Welcome back, {userData.fullName?.firstName || "User"}!
                  </motion.div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Sparkles className="h-4 w-4" />
                    <span>Redirecting to your {userData.role} dashboard...</span>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="h-12 w-12 text-purple-500" />
                  </motion.div>
                  
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    Let&apos;s set up your profile!
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Sparkles className="h-4 w-4" />
                    <span>Taking you to role selection...</span>
                  </div>
                </>
              )}
              
              {/* Progress bar */}
              <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getRoleColor(userData?.role)} rounded-full`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: userData?.role ? 1 : 1.5 }}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}