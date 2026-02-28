"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const hasRole = params.get("hasRole");

        if (token) {
          localStorage.setItem("authToken", token);
          
          if (hasRole === "true") {
            // User has role, redirect to dashboard
            setStatus("Authentication successful! Redirecting to dashboard...");
            router.replace("/dashboard");
          } else if (hasRole === "false") {
            // User needs to select role
            setStatus("Authentication successful! Please select your role...");
            router.replace("/select-role");
          } else {
            // Fallback: Check user profile to determine role status
            setStatus("Checking your profile...");
            
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const userData = await response.json();
                // Handle different response structures (userData.user or direct userData)
                const user = userData.user || userData;
                if (user && user.role) {
                  setStatus("Redirecting to your dashboard...");
                  router.replace("/dashboard");
                } else {
                  setStatus("Please select your role to continue...");
                  router.replace("/select-role");
                }
              } else {
                setStatus("Redirecting to role selection...");
                router.replace("/select-role");
              }
            } catch (error) {
              console.error("Error checking user profile:", error);
              setStatus("Redirecting to role selection...");
              router.replace("/select-role");
            }
          }
        } else {
          setStatus("Authentication failed. Redirecting to login...");
          router.replace("/login?error=Authentication+failed");
        }
      } catch (error) {
        console.error("Auth success error:", error);
        setStatus("Authentication error. Redirecting to login...");
        router.replace("/login?error=Authentication+error");
      }
    };

    handleAuthSuccess();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
          {status}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Please wait while we complete your sign-in...
        </p>
      </div>
    </div>
  );
}
