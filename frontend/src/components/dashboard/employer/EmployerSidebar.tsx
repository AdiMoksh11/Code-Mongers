"use client";

import {
  Building2,
  LogOut,
  Search,
  FileCheck,
  BarChart3,
  Settings,
  Home,
  ChevronsRight,
  ChevronsLeft,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "../../ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function EmployerSidebar() {
  const [open, setOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const toggleLock = () => {
    if (isLocked) {
      setIsLocked(false);
      setOpen(false);
    } else {
      setIsLocked(true);
      setOpen(true);
    }
  };

  const getSelectedKey = () => {
    if (!pathname) return "home";
    if (pathname === "/") return "home";
    if (pathname.startsWith("/dashboard/employer/jobs/new")) return "post-job";
    if (pathname.startsWith("/dashboard/employer/talent-search")) return "talent-search";
    if (pathname.startsWith("/dashboard/employer/verify-credentials")) return "verify-credentials";
    if (pathname.startsWith("/dashboard/employer/analytics")) return "analytics";
    if (pathname.startsWith("/dashboard/employer/settings")) return "settings";
    if (pathname === "/dashboard/employer" || pathname === "/dashboard") return "dashboard";
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
      href: "/dashboard/employer",
      icon: (
        <LayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Post Job",
      href: "/dashboard/employer/jobs/new",
      icon: (
        <PlusCircle className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Talent Search",
      href: "/dashboard/employer/talent-search",
      icon: (
        <Search className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Verify Credentials",
      href: "/dashboard/employer/verify-credentials",
      icon: (
        <FileCheck className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Analytics",
      href: "/dashboard/employer/analytics",
      icon: (
        <BarChart3 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/employer/settings",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div className="sticky top-0 h-screen">
      {/* Toggle button */}
      <button
        onClick={toggleLock}
        className={cn(
          "absolute top-6 z-20 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm border border-gray-300 dark:border-gray-600",
          open 
            ? "right-4"
            : "left-1/2 transform -translate-x-1/2"
        )}
        title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
      >
        {isLocked ? (
          <ChevronsLeft 
            className="h-6 w-6 text-green-500" 
          />
        ) : (
          <ChevronsRight 
            className="h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
          />
        )}
      </button>

      <Sidebar open={open} setOpen={() => {}} animate={true}>
        <SidebarBody className="justify-between gap-10 h-screen bg-gray-100 dark:bg-black border-r border-gray-200 dark:border-gray-800">
          <div className="flex flex-1 flex-col">
            {/* Logo area */}
            <div className="px-2 py-6 mt-8">
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
                        ? "bg-green-500 text-white mx-2" 
                        : "bg-green-500 text-white border-l-4 border-green-500"
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
    </div>
  );
}

export const Logo = () => {
  return (
    <div
      className="relative z-20 flex items-center space-x-3 py-2 text-sm font-normal text-black cursor-pointer notranslate"
      translate="no"
      onClick={() => window.location.href = "/dashboard/employer"}
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
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
      onClick={() => window.location.href = "/dashboard/employer"}
    >
      <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
        <span className="text-white font-bold text-lg notranslate" translate="no">CX</span>
      </div>
    </div>
  );
};
