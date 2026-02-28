"use client";

import {
  GraduationCap,
  Users,
  LogOut,
  Award,
  BarChart3,
  Settings,
  Home,
  ChevronsRight,
  ChevronsLeft,
  BookOpen,
  FileText,
  Shield,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "../../ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function InstituteSidebar() {
  const [open, setOpen] = useState(false); // Default to closed on mobile
  const [isLocked, setIsLocked] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setOpen(false); // Close sidebar on mobile by default
      } else {
        setOpen(true); // Open sidebar on desktop by default
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const toggleLock = () => {
    // On mobile, just toggle open/close
    if (isMobile) {
      setOpen(!open);
    } else {
      // On desktop, use lock/unlock behavior
      if (isLocked) {
        setIsLocked(false);
        setOpen(false);
      } else {
        setIsLocked(true);
        setOpen(true);
      }
    }
  };

  const getSelectedKey = () => {
    if (!pathname) return "home";
    if (pathname === "/") return "home";
    if (pathname.startsWith("/dashboard/institute/students")) return "students";
    if (pathname.startsWith("/dashboard/institute/credentials")) return "credentials";
    if (pathname.startsWith("/dashboard/institute/courses")) return "courses";
    if (pathname.startsWith("/dashboard/institute/analytics")) return "analytics";
    if (pathname.startsWith("/dashboard/institute/api-integration")) return "api-integration";
    if (pathname.startsWith("/dashboard/institute/compliance")) return "compliance";
    if (pathname.startsWith("/dashboard/institute/settings")) return "settings";
    if (pathname === "/dashboard/institute" || pathname === "/dashboard") return "dashboard";
    return "dashboard";
  };

  const links = [
    {
      label: "Home",
      href: "/",
      icon: (
        <Home className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Dashboard",
      href: "/dashboard/institute",
      icon: (
        <GraduationCap className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Students",
      href: "/dashboard/institute/students",
      icon: (
        <Users className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Credentials",
      href: "/dashboard/institute/credentials",
      icon: (
        <Award className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Courses",
      href: "/dashboard/institute/courses",
      icon: (
        <BookOpen className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Analytics",
      href: "/dashboard/institute/analytics",
      icon: (
        <BarChart3 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "API Integration",
      href: "/dashboard/institute/api-integration",
      icon: (
        <Zap className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Compliance",
      href: "/dashboard/institute/compliance",
      icon: (
        <Shield className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/institute/settings",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <>
      {/* Desktop Toggle button - only show on desktop */}
      {!isMobile && (
        <button
          onClick={toggleLock}
          className={cn(
            "fixed top-6 z-30 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm border border-gray-300 dark:border-gray-600",
            open 
              ? "left-[260px]" // Position when sidebar is open
              : "left-4" // Position when sidebar is closed
          )}
          title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
        >
          {isLocked ? (
            <ChevronsLeft 
              className="h-6 w-6 text-purple-500" 
            />
          ) : (
            <ChevronsRight 
              className="h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
            />
          )}
        </button>
      )}

      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex flex-1 flex-col">
            {/* Logo area */}
            <div className="px-2 py-6 mt-8 md:mt-8">
              {open ? <Logo /> : <LogoIcon />}
            </div>
            
            {/* Menu area */}
            <div 
              className="mt-4 flex flex-col gap-1 flex-1"
              onMouseEnter={() => {
                if (!isLocked) {
                  setOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (!isLocked) {
                  setOpen(false);
                }
              }}
            >
              {links.map((link, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative",
                    getSelectedKey() === link.label.toLowerCase().replace(/\s+/g, "-") 
                      ? open 
                        ? "bg-purple-500 text-white mx-2" 
                        : "bg-purple-500 text-white border-l-4 border-purple-500"
                      : "mx-2",
                    open ? "p-2" : "p-2 flex justify-center"
                  )}
                >
                  <SidebarLink link={link} className={cn(!open && "justify-center")} />
                </div>
              ))}
              
              {/* Logout */}
              <div className="mt-auto pb-4 px-2">
                <div
                  onClick={handleLogout}
                  className={cn(
                    "cursor-pointer rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors",
                    open ? "p-2" : "p-2 flex justify-center"
                  )}
                >
                  <SidebarLink
                    link={{
                      label: "Logout",
                      href: "#",
                      icon: (
                        <LogOut className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                      ),
                    }}
                    className={cn(!open && "justify-center")}
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
    </>
  );
}

export const Logo = () => {
  return (
    <div
      className="relative z-20 flex items-center space-x-3 py-2 text-sm font-normal text-black cursor-pointer notranslate"
      translate="no"
      onClick={() => window.location.href = "/dashboard/institute"}
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
        <span className="text-white font-bold text-lg notranslate" translate="no">CX</span>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-semibold whitespace-pre text-black dark:text-white text-xl notranslate"
        translate="no"
      >
        Credexa
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div
      className="relative z-20 flex items-center justify-center py-2 text-sm font-normal text-black cursor-pointer w-full notranslate"
      translate="no"
      onClick={() => window.location.href = "/dashboard/institute"}
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
        <span className="text-white font-bold text-lg notranslate" translate="no">CX</span>
      </div>
    </div>
  );
};
