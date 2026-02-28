"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  X,
  ShieldCheck,
  Search,
  BarChart2,
  UsersIcon,
  Phone,
  Activity,
  User,
  LogOut,
} from "lucide-react";
import ThemeToggleButton from "./ui/theme-toggle-button";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setUserDropdownOpen(false);
    window.location.href = "/login";
  };

  const handleMyActivity = () => {
    if (isAuthenticated) {
      window.location.href = "/my-activity";
    } else {
      window.location.href = "/login";
    }
  };

  const handleDashboard = () => {
    window.location.href = "/dashboard/learner";
  };

  const navItems = [
  { href: "/verify", label: "Verify", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/community", label: "Community", icon: UsersIcon },
  { href: "/#contact", label: "Contact Us", icon: Phone },
  { href: "#", label: "My Activity", icon: Activity, isSpecial: true },
  ];

  const menuPanelVariants = {
    hidden: { x: "100%", transition: { when: "afterChildren", staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { x: 0, transition: { when: "beforeChildren", staggerChildren: 0.1 } },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  
  const linkClass = (itemHref: string) =>
    `relative flex items-center gap-2 text-md font-medium transition-colors duration-300 px-4 py-2 rounded-full ${
      pathname === itemHref
        ? "text-white"
        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    }`;
    
  const mobileLinkClass = (itemHref: string) =>
    `flex items-center gap-4 text-lg font-medium p-4 rounded-lg transition-colors ${
      pathname === itemHref
        ? "font-bold text-white bg-blue-600"
        : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700"
    }`;


  return (
    <>
  <nav className="w-full top-0 left-0 z-[1000] backdrop-blur-lg shadow-sm relative">
  <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 py-4 overflow-visible">
          <a href="/" className="flex items-center gap-2 text-3xl font-extrabold tracking-wide text-gray-900 dark:text-gray-100 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 notranslate" translate="no">
            {/* LOGO ADDED HERE */}
            <img src="/logo.png" alt="Credexa Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            Credexa
          </a>

          <div className="hidden lg:flex gap-4 bg-gray-200/50 dark:bg-gray-800/50 p-2 rounded-full relative z-[1001]">
            {navItems.map((item) => {
              if (item.isSpecial) {
                return (
                  <button
                    key={item.label}
                    onClick={handleMyActivity}
                    onMouseOver={() => setHoveredPath(item.href)}
                    onMouseLeave={() => setHoveredPath(pathname)}
                    className={linkClass(item.href)}
                  >
                    {item.href === hoveredPath && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white dark:bg-gray-600 rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon size={18} />
                      {item.label}
                    </span>
                  </button>
                );
              }
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onMouseOver={() => setHoveredPath(item.href)}
                  onMouseLeave={() => setHoveredPath(pathname)}
                  onClick={(e) => {
                    // Keep Contact Us as-is (anchor to page section)
                    if (item.href === '/#contact') return;
                    e.preventDefault();
                    // If not authenticated, send to login (idempotent behavior like My Activity)
                    if (!isAuthenticated) {
                      window.location.href = '/login';
                      return;
                    }
                    // Otherwise navigate normally
                    window.location.href = item.href;
                  }}
                  className={linkClass(item.href)}
                >
                  {item.href === hoveredPath && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white dark:bg-gray-600 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon size={18} />
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-5">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>

          <div className="lg:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            
            {/* Mobile Account Button */}
            {isAuthenticated && (
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300"
              >
                <User size={18} />
              </button>
            )}
            
            <button
              onClick={() => setMobileOpen(true)}
              className="focus:outline-none z-50"
              aria-label="Toggle menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              variants={menuPanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm z-50 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setMobileOpen(false)} className="focus:outline-none" aria-label="Close menu">
                  <X className="w-7 h-7" />
                </button>
              </div>
              <div className="flex flex-col gap-2 px-6 py-4">
                {navItems.map((item) => (
                  <motion.div key={item.href} variants={menuItemVariants}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileOpen(false);
                        // Allow Contact Us anchor without auth
                        if (item.href === '/#contact') {
                          window.location.href = item.href;
                          return;
                        }
                        if (!isAuthenticated) {
                          window.location.href = '/login';
                          return;
                        }
                        window.location.href = item.href;
                      }}
                      className={mobileLinkClass(item.href)}
                    >
                      <item.icon size={22} />
                      {item.label}
                    </a>
                  </motion.div>
                ))}
                
                {/* Mobile User Actions */}
                {isAuthenticated && (
                  <>
                    <motion.div variants={menuItemVariants}>
                      <button 
                        onClick={() => { handleDashboard(); setMobileOpen(false); }}
                        className="w-full flex items-center gap-4 text-lg font-medium p-4 rounded-lg transition-colors bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      >
                        <BarChart2 size={22} />
                        Dashboard
                      </button>
                    </motion.div>
                    <motion.div variants={menuItemVariants}>
                      <button 
                        onClick={() => { handleMyActivity(); setMobileOpen(false); }}
                        className="w-full flex items-center gap-4 text-lg font-medium p-4 rounded-lg transition-colors bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        <Activity size={22} />
                        My Activity
                      </button>
                    </motion.div>
                    <motion.div variants={menuItemVariants}>
                      <button 
                        onClick={() => { handleLogout(); setMobileOpen(false); }}
                        className="w-full flex items-center gap-4 text-lg font-medium p-4 rounded-lg transition-colors bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <LogOut size={22} />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
                
                <div className="pt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
