"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRole: "learner" | "employer" | "institute";
  children: React.ReactNode;
}

interface UserData {
  role?: "learner" | "employer" | "institute";
  fullName?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyRoleAccess = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem("authToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        // Fetch user profile to verify role
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
        const user = responseData.user || responseData;
        setUserData(user);

        // Check if user has no role
        if (!user.role || user.role === "" || user.role === null) {
          console.log("User without role detected, redirecting to role selection");
          router.replace("/select-role");
          return;
        }

        // Check if user's role matches the required role
        if (user.role !== allowedRole) {
          console.log(`Access denied: User role '${user.role}' doesn't match required role '${allowedRole}'`);
          setError(`Access Denied: This dashboard is only accessible to ${allowedRole}s.`);
          setIsAuthorized(false);
          
          // Redirect to correct dashboard after showing error
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
                router.replace("/dashboard");
                break;
            }
          }, 3000);
          return;
        }

        // User is authorized
        setIsAuthorized(true);
      } catch (error: any) {
        console.error("Role verification error:", error);
        setError("Failed to verify access permissions");
        setTimeout(() => {
          router.replace("/dashboard");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    verifyRoleAccess();
  }, [allowedRole, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verifying Access
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Checking your permissions...
          </p>
        </motion.div>
      </div>
    );
  }

  // Error/Unauthorized state
  if (!isAuthorized || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="mb-6"
          >
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 font-medium">
              {error || `This dashboard is only accessible to ${allowedRole}s.`}
            </p>
          </div>

          {userData && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <Shield className="h-4 w-4 inline mr-2" />
                Your role: <span className="font-semibold capitalize">{userData.role}</span>
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                Redirecting you to your authorized dashboard...
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-4 w-4" />
            </motion.div>
            <span className="text-sm">Redirecting in 3 seconds...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
