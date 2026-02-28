"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Building2, GraduationCap, Users, ChevronRight, Sparkles, Moon, Sun, Globe, Zap, Star } from "lucide-react";
import toast from "react-hot-toast";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import InstituteSelector from "@/components/InstituteSelector";

interface RoleOption {
  id: "learner" | "employer" | "institute";
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  bgGradient: string;
}

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"role" | "institute">("role");
  const [selectedInstitute, setSelectedInstitute] = useState<any>(null);
  const router = useRouter();

  const roleOptions: RoleOption[] = [
    {
      id: "learner",
      title: "Learner",
      description: "Build your skill portfolio and advance your career",
      icon: <GraduationCap className="h-8 w-8" />,
      features: [
        "Aggregate certificates from multiple platforms",
        "AI-powered career recommendations",
        "NSQF-aligned skill mapping",
        "Shareable digital portfolio"
      ],
      color: "text-blue-600",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      id: "employer",
      title: "Employer",
      description: "Find and verify talent with validated skills",
      icon: <Building2 className="h-8 w-8" />,
      features: [
        "Search candidates by verified skills",
        "Bulk credential verification",
        "Skill-based talent matching",
        "Recruitment pipeline integration"
      ],
      color: "text-green-600",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      id: "institute",
      title: "Credential Issuer",
      description: "Issue and manage credentials for your learners",
      icon: <Users className="h-8 w-8" />,
      features: [
        "Digital credential issuance",
        "Learner progress analytics",
        "NSQF compliance reporting",
        "Multi-platform integration"
      ],
      color: "text-purple-600",
      bgGradient: "from-purple-50 to-violet-50"
    }
  ];

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue");
      return;
    }

    // If credential issuer role is selected, go to issuer selection step
    if (selectedRole === "institute") {
      setCurrentStep("institute");
      return;
    }

    // For other roles, proceed directly to role selection
    await submitRoleSelection();
  };

  const submitRoleSelection = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/select-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          role: selectedRole,
          institute: selectedRole === "institute" ? selectedInstitute : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update role");
      }

      toast.success(`Role selected as ${selectedRole}!`);
      
      // Redirect to appropriate dashboard
      router.push(`/dashboard/${selectedRole}`);
    } catch (error: any) {
      console.error("Role selection error:", error);
      toast.error(error.message || "Failed to select role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstituteUpdate = (institute: any) => {
    setSelectedInstitute(institute);
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep("role");
    setSelectedInstitute(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative overflow-hidden">
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
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-500/10 rounded-full blur-lg"
        />
      </div>

      {/* Top Navigation Bar */}
      <div className="relative z-10 w-full">
        <nav className="flex items-center justify-between p-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"
            >
              <span className="text-white font-bold text-lg">CX</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Credexa</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </motion.div>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {currentStep === "role" ? (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100 }}
                className="mb-6"
              >
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 relative">
                  Choose Your Role
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur-lg"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed"
              >
                Select how you want to use Credexa. This will customize your experience and dashboard to match your needs.
                <span className="block mt-2 text-sm text-cyan-600 dark:text-cyan-400 font-medium">
                  ✨ Choose wisely - this determines your personalized journey!
                </span>
              </motion.p>
            </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {roleOptions.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                type: "spring",
                stiffness: 100,
                damping: 12
              }}
              whileHover={{ 
                y: -10, 
                scale: 1.03,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-3xl border-2 transition-all duration-500 transform-gpu ${
                selectedRole === role.id
                  ? "border-cyan-500 shadow-2xl shadow-cyan-500/25 scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl"
              }`}
              onClick={() => setSelectedRole(role.id)}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <div className={`p-8 rounded-3xl bg-gradient-to-br ${role.bgGradient} dark:from-gray-800 dark:to-gray-700 h-full relative overflow-hidden backdrop-blur-sm`}>
                {/* Floating particles animation */}
                <AnimatePresence>
                  {selectedRole === role.id && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: [0, Math.random() * 100 - 50],
                            y: [0, Math.random() * 100 - 50],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                          style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* Selected indicator with pulse */}
                {selectedRole === role.id && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Star className="h-4 w-4 text-white fill-white" />
                    </motion.div>
                  </motion.div>
                )}

                {/* Icon with hover animation */}
                <motion.div 
                  className={`${role.color} mb-6`}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {role.icon}
                </motion.div>

                {/* Title and Description */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{role.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed">{role.description}</p>

                {/* Features with staggered animation */}
                <ul className="space-y-4">
                  {role.features.map((feature, idx) => (
                    <motion.li 
                      key={idx} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 + idx * 0.1 }}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <motion.div
                        whileHover={{ scale: 1.3, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Zap className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      </motion.div>
                      <span className="font-medium">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Enhanced background decorations */}
                <motion.div 
                  className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full blur-2xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute -top-4 -left-4 w-20 h-20 bg-white/20 dark:bg-white/10 rounded-full blur-xl"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />
                
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-3xl pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center"
            >
              <motion.button
                onClick={handleRoleSelect}
                disabled={!selectedRole || isLoading}
                whileHover={selectedRole && !isLoading ? { 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(6, 182, 212, 0.4)"
                } : {}}
                whileTap={selectedRole && !isLoading ? { scale: 0.95 } : {}}
                className={`relative px-12 py-5 rounded-2xl font-bold text-lg transition-all duration-500 overflow-hidden ${
                  selectedRole && !isLoading
                    ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white shadow-2xl"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                {/* Animated background */}
                {selectedRole && !isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    }}
                  />
                )}
                
                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                      />
                      Setting up your dashboard...
                    </>
                  ) : (
                    <>
                      {selectedRole === "institute" ? "Continue to Credential Issuer Selection" : "Continue to Dashboard"}
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </motion.div>
                    </>
                  )}
                </span>
              </motion.button>
              
              <AnimatePresence>
                {selectedRole && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-base text-gray-600 dark:text-gray-300 mt-6 font-medium"
                  >
                    You&apos;ve selected: 
                    <motion.span 
                      className="font-bold text-cyan-600 dark:text-cyan-400 capitalize ml-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {selectedRole} ✨
                    </motion.span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="text-center mt-12 space-y-4"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="inline-block p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  💡 <strong>Pro Tip:</strong> Don&apos;t worry about your choice!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You can always change your role later in your account settings.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-gray-500"
              >
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Multi-language support
                </div>
                <div className="flex items-center gap-1">
                  <Moon className="h-3 w-3" />
                  Dark mode ready
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  AI-powered insights
                </div>
              </motion.div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Credential Issuer Selection Step */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <motion.button
                  onClick={handleBackToRoleSelection}
                  className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mb-6"
                  whileHover={{ x: -5 }}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to Role Selection
                </motion.button>
                
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Select Your Credential Issuer
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  As a credential issuer representative, please select your institution or platform from our verified database. 
                  This will link your account to your organization&apos;s credentials and learners.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-xl">
                <InstituteSelector onInstituteUpdate={handleInstituteUpdate} />
                
                {selectedInstitute && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex justify-center"
                  >
                    <motion.button
                      onClick={submitRoleSelection}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden px-12 py-4 rounded-2xl text-lg font-bold transition-all duration-500 shadow-xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white hover:shadow-2xl hover:shadow-purple-500/25"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {isLoading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                            />
                            Setting up Institute Dashboard...
                          </>
                        ) : (
                          <>
                            Continue to Institute Dashboard
                            <ChevronRight className="h-5 w-5" />
                          </>
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
